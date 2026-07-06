"""
Collections Recovery Prediction - Model Training Script
==========================================================
Predicts whether a strategy_execution on a case will end in successful
payment recovery (target=1) or not (target=0).

Pipeline:
  1. Pull joined data from Postgres
  2. Engineer features
  3. Train/test split + preprocessing
  4. Train XGBoost classifier
  5. Evaluate (accuracy, precision, recall, F1, ROC-AUC)
  6. SHAP feature importance
  7. Save model + preprocessing pipeline for serving (FastAPI step next)
"""

import os
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # headless - just save PNG files, no display window
import matplotlib.pyplot as plt
from sqlalchemy import create_engine
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report, confusion_matrix,
    ConfusionMatrixDisplay, RocCurveDisplay, PrecisionRecallDisplay
)
from xgboost import XGBClassifier
import shap

CHARTS_DIR = "model_artifacts/charts"

# ---------------------------------------------------------------------------
# 1. CONFIG - set these via environment variables in production
# ---------------------------------------------------------------------------
DB_CONFIG = {
    "host": os.getenv("PG_HOST", "localhost"),
    "port": os.getenv("PG_PORT", "5432"),
    "dbname": os.getenv("PG_DB", "digital_collection_platform"),
    "user": os.getenv("PG_USER", "postgres"),
    "password": os.getenv("PG_PASSWORD", "postgres"),
}
MODEL_OUTPUT_PATH = "model_artifacts/recovery_model.pkl"
PIPELINE_OUTPUT_PATH = "model_artifacts/preprocessing_pipeline.pkl"

# ---------------------------------------------------------------------------
# 2. LOAD DATA FROM POSTGRES
# ---------------------------------------------------------------------------
def load_data() -> pd.DataFrame:
    conn_str = (
        f"postgresql+psycopg2://{DB_CONFIG['user']}:{DB_CONFIG['password']}"
        f"@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}"
    )
    engine = create_engine(conn_str)

    # NOTE: adjust join keys (branch_name <-> branches.code/name) to match
    # your actual production schema before running.
    query = """
        SELECT
            sel.execution_id,
            sel.case_type,
            sel.strategy_id,
            sel.status,
            sel.assigned_at,
            sel.completed_at,
            d.dpd,
            d.bucket,
            d.outstanding_principal,
            d.loan_amount,
            d.emi_amount,
            d.last_payment_amount,
            d.last_payment_date,
            d.branch_name,
            b.zone_code,
            b.region_code,
            b.branch_type,
            b.branch_office_type,
            s.journey_type,
            s.priority,
            s.customer_segment,
            a.role AS agent_role,
            a.current_load,
            a.max_capacity,
            c.channel AS last_comm_channel,
            c.status AS last_comm_status,
            c.response_status,
            c.retry_count,
            p.payment_status
        FROM strategy_execution_log sel
        JOIN dpd_cases d          ON d.strategy_id = sel.strategy_id
        LEFT JOIN branches b      ON b.code = d.branch_name
        JOIN strategies s         ON s.strategy_id = sel.strategy_id
        LEFT JOIN allocations al  ON al.strategy_id = sel.strategy_id
                                     AND al.allocation_status = 'ACTIVE'
        LEFT JOIN agents a        ON a.agent_id = al.allocated_to
        LEFT JOIN communications c ON c.strategy_id = sel.strategy_id
        LEFT JOIN payments p      ON p.strategy_id = sel.strategy_id
        WHERE sel.status IN ('COMPLETED', 'FAILED')
    """
    df = pd.read_sql(query, engine)
    return df


# ---------------------------------------------------------------------------
# 3. FEATURE ENGINEERING
# ---------------------------------------------------------------------------
def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # convert Date into proper format
    df["assigned_at"] = pd.to_datetime(df["assigned_at"])
    df["completed_at"] = pd.to_datetime(df["completed_at"])
    df["last_payment_date"] = pd.to_datetime(df["last_payment_date"], errors="coerce")

    # Duration of strategy execution (hours)
    df["execution_duration_hrs"] = (
        (df["completed_at"] - df["assigned_at"]).dt.total_seconds() / 3600
    )

    # Recency of last payment (days), missing -> large number (never paid)
    df["days_since_last_payment"] = (
        (df["assigned_at"] - df["last_payment_date"]).dt.days
    )
    df["days_since_last_payment"] = df["days_since_last_payment"].fillna(9999)

    # Agent load ratio
    df["agent_load_ratio"] = df["current_load"] / df["max_capacity"].replace(0, np.nan)
    df["agent_load_ratio"] = df["agent_load_ratio"].fillna(0)

    # Outstanding to loan amount ratio
    df["outstanding_ratio"] = df["outstanding_principal"] / df["loan_amount"].replace(0, np.nan)
    df["outstanding_ratio"] = df["outstanding_ratio"].fillna(0)

    # Communication engagement flag
    df["did_respond"] = (df["response_status"] == "RESPONDED").astype(int)

    # ---- TARGET ----
    # 1 = strategy execution led to a successful payment
    df["target"] = (
        (df["status"] == "COMPLETED") & (df["payment_status"] == "SUCCESS")
    ).astype(int)

    return df


# ---------------------------------------------------------------------------
# 4. TRAIN MODEL
# ---------------------------------------------------------------------------
NUMERIC_FEATURES = [
    "dpd", "outstanding_principal", "loan_amount", "emi_amount",
    "last_payment_amount", "execution_duration_hrs", "days_since_last_payment",
    "agent_load_ratio", "outstanding_ratio", "retry_count", "did_respond",
    "priority",
]
CATEGORICAL_FEATURES = [
    "case_type", "bucket", "zone_code", "region_code", "branch_type",
    "branch_office_type", "journey_type", "customer_segment",
    "agent_role", "last_comm_channel", "last_comm_status",
]


def build_pipeline() -> ColumnTransformer:
    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
    ])
    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="constant", fill_value="UNKNOWN")),
        ("onehot", OneHotEncoder(handle_unknown="ignore")),
    ])
    return ColumnTransformer(transformers=[
        ("num", numeric_transformer, NUMERIC_FEATURES),
        ("cat", categorical_transformer, CATEGORICAL_FEATURES),
    ])


def train_and_evaluate(df: pd.DataFrame):
    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df["target"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    preprocessor = build_pipeline()
    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)

    model = XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="logloss",
        random_state=42,
    )

    # 5-fold cross validation on training data first
    cv_scores = cross_val_score(model, X_train_proc, y_train, cv=5, scoring="roc_auc")
    print(f"CV ROC-AUC (5-fold): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    model.fit(X_train_proc, y_train)

    y_pred = model.predict(X_test_proc)
    y_proba = model.predict_proba(X_test_proc)[:, 1]

    print("\n--- Test set performance ---")
    print(f"Accuracy : {accuracy_score(y_test, y_pred):.4f}")
    print(f"Precision: {precision_score(y_test, y_pred):.4f}")
    print(f"Recall   : {recall_score(y_test, y_pred):.4f}")
    print(f"F1 score : {f1_score(y_test, y_pred):.4f}")
    print(f"ROC-AUC  : {roc_auc_score(y_test, y_proba):.4f}")
    print("\nClassification report:\n", classification_report(y_test, y_pred))
    print("Confusion matrix:\n", confusion_matrix(y_test, y_pred))

    return model, preprocessor, X_test_proc, y_test


# ---------------------------------------------------------------------------
# 4b. MATPLOTLIB VISUALIZATIONS
# ---------------------------------------------------------------------------
def plot_evaluation_charts(model, X_test_proc, y_test):
    os.makedirs(CHARTS_DIR, exist_ok=True)
    y_pred = model.predict(X_test_proc)
    y_proba = model.predict_proba(X_test_proc)[:, 1]

    # 1. Confusion matrix
    fig, ax = plt.subplots(figsize=(5, 5))
    ConfusionMatrixDisplay.from_predictions(
        y_test, y_pred, display_labels=["Not recovered", "Recovered"],
        cmap="Blues", ax=ax
    )
    ax.set_title("Confusion matrix")
    fig.tight_layout()
    fig.savefig(f"{CHARTS_DIR}/confusion_matrix.png", dpi=150)
    plt.close(fig)

    # 2. ROC curve
    fig, ax = plt.subplots(figsize=(5, 5))
    RocCurveDisplay.from_predictions(y_test, y_proba, ax=ax)
    ax.plot([0, 1], [0, 1], linestyle="--", color="gray")
    ax.set_title("ROC curve")
    fig.tight_layout()
    fig.savefig(f"{CHARTS_DIR}/roc_curve.png", dpi=150)
    plt.close(fig)

    # 3. Precision-Recall curve (useful when classes are imbalanced)
    fig, ax = plt.subplots(figsize=(5, 5))
    PrecisionRecallDisplay.from_predictions(y_test, y_proba, ax=ax)
    ax.set_title("Precision-recall curve")
    fig.tight_layout()
    fig.savefig(f"{CHARTS_DIR}/precision_recall_curve.png", dpi=150)
    plt.close(fig)

    # 4. Metrics summary bar chart
    metrics = {
        "Accuracy": accuracy_score(y_test, y_pred),
        "Precision": precision_score(y_test, y_pred),
        "Recall": recall_score(y_test, y_pred),
        "F1 score": f1_score(y_test, y_pred),
        "ROC-AUC": roc_auc_score(y_test, y_proba),
    }
    fig, ax = plt.subplots(figsize=(7, 4))
    bars = ax.bar(metrics.keys(), metrics.values(), color="#1D9E75")
    ax.set_ylim(0, 1)
    ax.set_title("Model performance summary")
    for bar, val in zip(bars, metrics.values()):
        ax.text(bar.get_x() + bar.get_width() / 2, val + 0.02, f"{val:.2f}",
                ha="center", fontsize=10)
    fig.tight_layout()
    fig.savefig(f"{CHARTS_DIR}/metrics_summary.png", dpi=150)
    plt.close(fig)

    print(f"\nSaved 4 charts to {CHARTS_DIR}/")
    return metrics


def plot_feature_importance(importance_df, top_n=15):
    os.makedirs(CHARTS_DIR, exist_ok=True)
    top = importance_df.head(top_n).iloc[::-1]  # reverse for horizontal bar

    fig, ax = plt.subplots(figsize=(8, 6))
    ax.barh(top["feature"], top["mean_abs_shap"], color="#534AB7")
    ax.set_xlabel("Mean |SHAP value| (impact on prediction)")
    ax.set_title(f"Top {top_n} features driving recovery prediction")
    fig.tight_layout()
    fig.savefig(f"{CHARTS_DIR}/feature_importance.png", dpi=150)
    plt.close(fig)
    print(f"Saved feature importance chart to {CHARTS_DIR}/feature_importance.png")


# ---------------------------------------------------------------------------
# 5. SHAP FEATURE IMPORTANCE (explainability)
# ---------------------------------------------------------------------------
def explain_model(model, preprocessor, X_test_proc):
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test_proc)

    feature_names = (
        NUMERIC_FEATURES
        + list(preprocessor.named_transformers_["cat"]
               .named_steps["onehot"].get_feature_names_out(CATEGORICAL_FEATURES))
    )
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    importance = pd.DataFrame({
        "feature": feature_names,
        "mean_abs_shap": mean_abs_shap,
    }).sort_values("mean_abs_shap", ascending=False)

    print("\n--- Top 15 features by SHAP importance ---")
    print(importance.head(15).to_string(index=False))
    return importance


# ---------------------------------------------------------------------------
# 6. MAIN
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    os.makedirs("model_artifacts", exist_ok=True)

    print("Loading data from Postgres...")
    raw_df = load_data()
    print(f"Loaded {len(raw_df):,} rows")

    print("Engineering features...")
    df = engineer_features(raw_df)
    print(f"Target distribution:\n{df['target'].value_counts(normalize=True)}")

    print("Training model...")
    model, preprocessor, X_test_proc, y_test = train_and_evaluate(df)

    print("\nDrawing evaluation charts...")
    metrics = plot_evaluation_charts(model, X_test_proc, y_test)

    importance = explain_model(model, preprocessor, X_test_proc)
    plot_feature_importance(importance)

    print("\n========== FINAL ACCURACY SUMMARY ==========")
    for name, val in metrics.items():
        print(f"{name:10s}: {val:.2%}")
    print("=============================================")

    joblib.dump(model, MODEL_OUTPUT_PATH)
    joblib.dump(preprocessor, PIPELINE_OUTPUT_PATH)
    print(f"\nSaved model to {MODEL_OUTPUT_PATH}")
    print(f"Saved preprocessing pipeline to {PIPELINE_OUTPUT_PATH}")