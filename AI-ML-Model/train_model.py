"""
Collections Recovery Prediction - Model Training Script (v2)
==============================================================
UPGRADES FROM v1:
  1. Multi-class target (5 classes) instead of binary yes/no
  2. Rolling / Time-Series validation instead of plain random split
  3. Optuna-based hyperparameter tuning (Bayesian optimization)
  4. Continuous learning support (incremental retrain on new data)

pip install optuna   # if not already installed
"""

import os
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sqlalchemy import create_engine
from sklearn.model_selection import TimeSeriesSplit
from sklearn.preprocessing import OneHotEncoder, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix, ConfusionMatrixDisplay,
    log_loss,
)
from xgboost import XGBClassifier
import shap
import optuna

CHARTS_DIR = "model_artifacts/charts"

# ---------------------------------------------------------------------------
# 1. CONFIG
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
LABEL_ENCODER_PATH = "model_artifacts/label_encoder.pkl"

# 5 target classes, in a meaningful order (used later for plots/reports)
CLASS_LABELS = [
    "Write Off",
    "High Risk",
    "Likely Recoverable",
    "Partially Recovered",
    "Fully Recovered",
]


# ---------------------------------------------------------------------------
# 2. LOAD DATA FROM POSTGRES
# ---------------------------------------------------------------------------
def load_data() -> pd.DataFrame:
    conn_str = (
        f"postgresql+psycopg2://{DB_CONFIG['user']}:{DB_CONFIG['password']}"
        f"@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}"
    )
    engine = create_engine(conn_str)

    # NOTE: added p.amount (recovered amount) - needed to build the
    # 5-class target below. Adjust column name to match your real schema.
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
            p.payment_status,
            p.amount
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
# 3. FEATURE ENGINEERING + MULTI-CLASS TARGET
# ---------------------------------------------------------------------------
def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df["assigned_at"] = pd.to_datetime(df["assigned_at"])
    df["completed_at"] = pd.to_datetime(df["completed_at"])
    df["last_payment_date"] = pd.to_datetime(df["last_payment_date"], errors="coerce")

    df["execution_duration_hrs"] = (
        (df["completed_at"] - df["assigned_at"]).dt.total_seconds() / 3600
    )
    df["days_since_last_payment"] = (
        (df["assigned_at"] - df["last_payment_date"]).dt.days
    )
    df["days_since_last_payment"] = df["days_since_last_payment"].fillna(9999)

    df["agent_load_ratio"] = df["current_load"] / df["max_capacity"].replace(0, np.nan)
    df["agent_load_ratio"] = df["agent_load_ratio"].fillna(0)

    df["outstanding_ratio"] = df["outstanding_principal"] / df["loan_amount"].replace(0, np.nan)
    df["outstanding_ratio"] = df["outstanding_ratio"].fillna(0)

    df["did_respond"] = (df["response_status"] == "RESPONDED").astype(int)

    # ------------------------------------------------------------------
    # MULTI-CLASS TARGET (5 classes)
    # recovered_ratio = how much of the outstanding amount was paid back
    # ------------------------------------------------------------------
    df["amount"] = df["amount"].fillna(0)
    df["recovered_ratio"] = (
        df["amount"] / df["outstanding_principal"].replace(0, np.nan)
    ).fillna(0).clip(0, 1)

    def classify(row):
        # Money actually recovered on this execution
        if row["payment_status"] == "SUCCESS" and row["recovered_ratio"] >= 0.95:
            return "Fully Recovered"
        if row["payment_status"] == "SUCCESS" and row["recovered_ratio"] > 0:
            return "Partially Recovered"

        # No recovery yet -> bucket by risk signals
        if row["dpd"] >= 180 and row["did_respond"] == 0:
            return "Write Off"          # very old + unresponsive = practically dead
        if row["dpd"] >= 90 or (row["did_respond"] == 0 and row["retry_count"] >= 3):
            return "High Risk"          # old / tried a lot, no response
        return "Likely Recoverable"     # early-stage, still has a decent chance

    df["target_class"] = df.apply(classify, axis=1)

    return df


# ---------------------------------------------------------------------------
# 4. FEATURES
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


# ---------------------------------------------------------------------------
# 5. ROLLING / TIME-SERIES VALIDATION
# ---------------------------------------------------------------------------
def time_based_split(df: pd.DataFrame, n_splits: int = 5):
    """
    Instead of a random train/test split, we sort by time and always
    train on the PAST and validate on the NEXT chunk (rolling window).
    This mimics real production: model only ever sees history, never future.
    """
    df_sorted = df.sort_values("assigned_at").reset_index(drop=True)
    tscv = TimeSeriesSplit(n_splits=n_splits)
    return df_sorted, tscv


# ---------------------------------------------------------------------------
# 6. OPTUNA HYPERPARAMETER TUNING (Bayesian Optimization)
# ---------------------------------------------------------------------------
def tune_hyperparameters(X, y, tscv, n_trials: int = 30) -> dict:
    """
    Optuna searches the hyperparameter space intelligently (Bayesian /
    TPE sampler) instead of trying every combination (Grid Search) or
    random guesses (Random Search) - gets to a good answer in fewer tries.

    NOTE: Grid Search / Random Search alternatives (commented below) can
    be swapped in if you specifically need them for comparison:
        from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
    """

    def objective(trial):
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 100, 500, step=50),
            "max_depth": trial.suggest_int("max_depth", 3, 10),
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
            "subsample": trial.suggest_float("subsample", 0.6, 1.0),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
            "min_child_weight": trial.suggest_int("min_child_weight", 1, 10),
            "objective": "multi:softprob",
            "num_class": len(CLASS_LABELS),
            "eval_metric": "mlogloss",
            "random_state": 42,
        }

        fold_scores = []
        for train_idx, val_idx in tscv.split(X):
            X_tr, X_val = X[train_idx], X[val_idx]
            y_tr, y_val = y[train_idx], y[val_idx]

            model = XGBClassifier(**params)
            model.fit(X_tr, y_tr)
            proba = model.predict_proba(X_val)
            fold_scores.append(log_loss(y_val, proba, labels=list(range(len(CLASS_LABELS)))))

        return np.mean(fold_scores)  # lower log-loss = better

    study = optuna.create_study(direction="minimize")
    study.optimize(objective, n_trials=n_trials, show_progress_bar=True)

    print(f"\nBest trial log-loss: {study.best_value:.4f}")
    print(f"Best params: {study.best_params}")
    return study.best_params


# ---------------------------------------------------------------------------
# 7. TRAIN + EVALUATE (with rolling validation)
# ---------------------------------------------------------------------------
def train_and_evaluate(df: pd.DataFrame):
    df_sorted, tscv = time_based_split(df, n_splits=5)

    X_raw = df_sorted[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    label_encoder = LabelEncoder()
    label_encoder.fit(CLASS_LABELS)
    y = label_encoder.transform(df_sorted["target_class"])

    preprocessor = build_pipeline()
    X_proc = preprocessor.fit_transform(X_raw)

    # --- Hyperparameter tuning using rolling folds ---
    print("Tuning hyperparameters with Optuna (rolling validation)...")
    best_params = tune_hyperparameters(X_proc, y, tscv, n_trials=3)

    # --- Final rolling validation report using best params ---
    fold_metrics = []
    last_train_idx, last_val_idx = None, None
    for fold, (train_idx, val_idx) in enumerate(tscv.split(X_proc), start=1):
        model = XGBClassifier(
            **best_params,
            objective="multi:softprob",
            num_class=len(CLASS_LABELS),
            eval_metric="mlogloss",
            random_state=42,
        )
        model.fit(X_proc[train_idx], y[train_idx])
        preds = model.predict(X_proc[val_idx])

        acc = accuracy_score(y[val_idx], preds)
        f1 = f1_score(y[val_idx], preds, average="macro")
        fold_metrics.append({"fold": fold, "accuracy": acc, "f1_macro": f1})
        print(f"Fold {fold}: accuracy={acc:.4f}, macro-F1={f1:.4f}")
        last_train_idx, last_val_idx = train_idx, val_idx

    # --- Train the FINAL model on all data up to the last fold ---
    final_model = XGBClassifier(
        **best_params,
        objective="multi:softprob",
        num_class=len(CLASS_LABELS),
        eval_metric="mlogloss",
        random_state=42,
    )
    final_model.fit(X_proc[last_train_idx], y[last_train_idx])

    y_pred = final_model.predict(X_proc[last_val_idx])
    print("\n--- Final holdout (last time fold) performance ---")
    print(classification_report(
        y[last_val_idx], y_pred, target_names=label_encoder.classes_
    ))

    return (final_model, preprocessor, label_encoder,
            X_proc[last_val_idx], y[last_val_idx], fold_metrics)


# ---------------------------------------------------------------------------
# 8. CHARTS
# ---------------------------------------------------------------------------
def plot_confusion_matrix(y_true, y_pred, label_encoder):
    os.makedirs(CHARTS_DIR, exist_ok=True)
    fig, ax = plt.subplots(figsize=(7, 7))
    ConfusionMatrixDisplay.from_predictions(
        y_true, y_pred, display_labels=label_encoder.classes_,
        cmap="Blues", ax=ax, xticks_rotation=45,
    )
    ax.set_title("Confusion matrix (5 classes)")
    fig.tight_layout()
    fig.savefig(f"{CHARTS_DIR}/confusion_matrix_multiclass.png", dpi=150)
    plt.close(fig)
    print(f"Saved {CHARTS_DIR}/confusion_matrix_multiclass.png")


def plot_rolling_fold_scores(fold_metrics):
    os.makedirs(CHARTS_DIR, exist_ok=True)
    folds = [m["fold"] for m in fold_metrics]
    acc = [m["accuracy"] for m in fold_metrics]
    f1 = [m["f1_macro"] for m in fold_metrics]

    fig, ax = plt.subplots(figsize=(7, 4))
    ax.plot(folds, acc, marker="o", label="Accuracy")
    ax.plot(folds, f1, marker="s", label="Macro F1")
    ax.set_xlabel("Rolling fold (time order)")
    ax.set_ylim(0, 1)
    ax.set_title("Model stability across time (rolling validation)")
    ax.legend()
    fig.tight_layout()
    fig.savefig(f"{CHARTS_DIR}/rolling_validation_scores.png", dpi=150)
    plt.close(fig)
    print(f"Saved {CHARTS_DIR}/rolling_validation_scores.png")


def explain_model(model, preprocessor, X_val, label_encoder):
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_val)

    feature_names = (
        NUMERIC_FEATURES
        + list(preprocessor.named_transformers_["cat"]
               .named_steps["onehot"].get_feature_names_out(CATEGORICAL_FEATURES))
    )
    n_features = len(feature_names)
    n_classes = len(CLASS_LABELS)

    # SHAP's return shape for multi-class varies by version:
    #   - old versions: a LIST of n_classes arrays, each (n_samples, n_features)
    #   - newer versions: a single 3D array, either
    #       (n_classes, n_samples, n_features)  OR
    #       (n_samples, n_features, n_classes)
    # Handle all three so this doesn't break again on a version upgrade.
    if isinstance(shap_values, list):
        mean_abs_shap = np.mean([np.abs(sv).mean(axis=0) for sv in shap_values], axis=0)
    else:
        arr = np.array(shap_values)
        if arr.ndim == 3 and arr.shape[0] == n_classes and arr.shape[2] == n_features:
            mean_abs_shap = np.abs(arr).mean(axis=(0, 1))       # (classes, samples, features)
        elif arr.ndim == 3 and arr.shape[-1] == n_classes and arr.shape[1] == n_features:
            mean_abs_shap = np.abs(arr).mean(axis=(0, 2))       # (samples, features, classes)
        elif arr.ndim == 2 and arr.shape[1] == n_features:
            mean_abs_shap = np.abs(arr).mean(axis=0)            # single-output shape
        else:
            raise ValueError(
                f"Unexpected SHAP output shape {arr.shape} - expected one axis "
                f"of size {n_features} (features) and one of size {n_classes} (classes)."
            )

    importance = pd.DataFrame({
        "feature": feature_names,
        "mean_abs_shap": mean_abs_shap,
    }).sort_values("mean_abs_shap", ascending=False)

    print("\n--- Top 15 features (avg across all 5 classes) ---")
    print(importance.head(15).to_string(index=False))
    return importance


# ---------------------------------------------------------------------------
# 9. CONTINUOUS LEARNING (incremental retrain on new data)
# ---------------------------------------------------------------------------
def continuous_retrain(new_df: pd.DataFrame):
    """
    Call this periodically (e.g. weekly cron job) with ONLY the new
    executions collected since the last training run. Instead of
    retraining from scratch on the full history, XGBoost can 'warm start'
    from the existing model - much faster and keeps past learning.
    """
    if not os.path.exists(MODEL_OUTPUT_PATH):
        raise FileNotFoundError("No existing model found - run full training first.")

    old_model = joblib.load(MODEL_OUTPUT_PATH)
    preprocessor = joblib.load(PIPELINE_OUTPUT_PATH)
    label_encoder = joblib.load(LABEL_ENCODER_PATH)

    new_df = engineer_features(new_df)
    X_new = preprocessor.transform(new_df[NUMERIC_FEATURES + CATEGORICAL_FEATURES])
    y_new = label_encoder.transform(new_df["target_class"])

    updated_model = XGBClassifier(
        **old_model.get_params()
    )
    # xgb_model=old_model.get_booster() continues training from the
    # existing trees instead of starting from zero
    updated_model.fit(X_new, y_new, xgb_model=old_model.get_booster())

    joblib.dump(updated_model, MODEL_OUTPUT_PATH)
    print(f"Model updated incrementally with {len(new_df)} new rows and re-saved.")
    return updated_model


# ---------------------------------------------------------------------------
# 10. MAIN
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    os.makedirs("model_artifacts", exist_ok=True)

    print("Loading data from Postgres...")
    raw_df = load_data()
    print(f"Loaded {len(raw_df):,} rows")

    print("Engineering features + building 5-class target...")
    df = engineer_features(raw_df)
    print(f"Class distribution:\n{df['target_class'].value_counts(normalize=True)}")

    print("Training model (rolling validation + Optuna tuning)...")
    (model, preprocessor, label_encoder,
     X_val, y_val, fold_metrics) = train_and_evaluate(df)

    y_pred_val = model.predict(X_val)
    plot_confusion_matrix(y_val, y_pred_val, label_encoder)
    plot_rolling_fold_scores(fold_metrics)

    importance = explain_model(model, preprocessor, X_val, label_encoder)

    joblib.dump(model, MODEL_OUTPUT_PATH)
    joblib.dump(preprocessor, PIPELINE_OUTPUT_PATH)
    joblib.dump(label_encoder, LABEL_ENCODER_PATH)
    print(f"\nSaved model to {MODEL_OUTPUT_PATH}")
    print(f"Saved preprocessing pipeline to {PIPELINE_OUTPUT_PATH}")
    print(f"Saved label encoder to {LABEL_ENCODER_PATH}")

    # Example of continuous learning usage later:
    # new_data = load_data()   # filtered to only new executions
    # continuous_retrain(new_data)