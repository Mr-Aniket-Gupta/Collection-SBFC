# Collections Recovery Prediction Model — Simple Explanation

## 1. Sabse Important Cheez: Ye Model Kis Sawaal Ka Jawaab Deta Hai?

Simple words me:

> **"Agar hum is loan case par ye particular recovery strategy (call, SMS, field visit, legal notice, etc.) use karein, to kya customer payment karega ya nahi?"**

Har row is dataset me ek **"strategy_execution"** hai — matlab, ek case par ek strategy try ki gayi thi (jaise "call agent ko assign kiya" ya "SMS reminder bheja"). Model predict karta hai:

- **target = 1** → Strategy chalayi, aur customer ne payment kar diya (SUCCESS)
- **target = 0** → Strategy chalayi, but payment nahi hui (FAILED ya no success)

Isse business ko ye pata chalta hai: **konsi strategy, konse case type par, sabse zyada kaam karti hai** — taaki collections team apna time aur agents smartly allocate kar sake, sirf un cases par jahan recovery ka chance zyada hai.

Ye ek **binary classification problem** hai (Yes/No), aur model use ho raha hai **XGBoost Classifier**.

---

## 2. Ye Model Aapke Data Se Kaise Connect Hai (Joins Explained)

Model Postgres database se data khींचta hai, 7 tables ko join karke ek bada table banata hai. Yahan har join simple language me:

```sql
FROM strategy_execution_log sel
JOIN dpd_cases d          ON d.strategy_id = sel.strategy_id
LEFT JOIN branches b      ON b.code = d.branch_name
JOIN strategies s         ON s.strategy_id = sel.strategy_id
LEFT JOIN allocations al  ON al.strategy_id = sel.strategy_id AND al.allocation_status = 'ACTIVE'
LEFT JOIN agents a        ON a.agent_id = al.allocated_to
LEFT JOIN communications c ON c.strategy_id = sel.strategy_id
LEFT JOIN payments p      ON p.strategy_id = sel.strategy_id
WHERE sel.status IN ('COMPLETED', 'FAILED')
```

| Table | Ye Kya Deta Hai | Kyun Chahiye |
|---|---|---|
| `strategy_execution_log` | Base table — konsi strategy kab assign/complete hui | Ye hamara "event" hai jispar prediction karna hai |
| `dpd_cases` | Loan ki detail — kitne din late hai (DPD), outstanding amount, bucket, EMI, last payment | Customer kitna "risky" hai, ye batata hai |
| `branches` | Branch ka zone, region, type | Location-based pattern pakadne ke liye (e.g. kuch zones me recovery zyada hoti hai) |
| `strategies` | Journey type, priority, customer segment | Strategy design ka context |
| `allocations` + `agents` | Konsa agent assign hua, uska load/capacity | Kya overloaded agent ki performance kam hoti hai? |
| `communications` | Call/SMS ka channel, status, customer response, retry count | Customer engage hua ya nahi, ye judge karta hai |
| `payments` | Payment success hua ya nahi | **Yehi hamara target/label banata hai** |

**Important note (already flagged in code):** `branch_name <-> branches.code` join key thoda assume kiya gaya hai. Production me chalane se pehle apne actual schema se ye match zaroor kar lena — agar mismatch hua, to `branches` ka data silently missing (NULL) aa jayega kyunki ye `LEFT JOIN` hai.

---

## 3. Feature Engineering — Raw Data Se "Signals" Banana

Code raw columns ko kuch smart features me convert karta hai:

- **`execution_duration_hrs`** — Strategy assign hone se complete hone tak kitna time laga
- **`days_since_last_payment`** — Last payment kitne din pehle hua tha (agar kabhi nahi hua, to 9999 — matlab "bahut purana/never")
- **`agent_load_ratio`** — Agent ka current workload uski max capacity ke against (0 to 1)
- **`outstanding_ratio`** — Bacha hua principal, total loan amount ke against
- **`did_respond`** — Customer ne last communication ka response diya ya nahi (1/0)

Ye sab isliye banaye gaye hain kyunki raw dates/amounts se model directly seekh nahi pata — ratios aur durations model ke liye zyada meaningful patterns hote hain.

---

## 4. Model Kaise Train Hota Hai

1. **Split:** 80% data training ke liye, 20% testing ke liye (stratified, taaki dono me success/failure ka ratio same rahe)
2. **Preprocessing:**
   - Numeric columns → missing values ko median se fill
   - Categorical columns (branch type, zone, segment, etc.) → missing ko "UNKNOWN" se fill, phir One-Hot Encoding
3. **Model:** `XGBClassifier` — 300 trees, depth 5, learning rate 0.05
4. **Validation:** 5-fold cross-validation ROC-AUC pe (train data ke andar hi, overfitting check karne ke liye)
5. **Evaluation (test data pe):** Accuracy, Precision, Recall, F1, ROC-AUC + Confusion Matrix
6. **Explainability:** SHAP se pata chalta hai kaunse features sabse zyada prediction ko affect kar rahe hain
7. **Charts:** Confusion matrix, ROC curve, Precision-Recall curve, metrics summary bar chart, feature importance chart — sab PNG me `model_artifacts/charts/` folder me save hote hain
8. **Save:** Trained model aur preprocessing pipeline `.pkl` files me save hote hain, taaki baad me FastAPI se serve kiya ja sake

---

## 5. Pros (Achi Baatein) ✅

1. **Business-relevant target** — Ye sirf "payment hua ya nahi" nahi predict karta, balki "is strategy ke through payment hua ya nahi" — jo directly strategy-optimization ke kaam aata hai.
2. **Rich, multi-source features** — Loan risk (DPD, outstanding), agent workload, communication response, branch/region — sab ek jagah combine kiye gaye hain. Isse model ko real-world context milta hai.
3. **XGBoost is a strong, industry-standard choice** — Tabular/structured data (jaisa yeh hai) ke liye XGBoost generally best-performing algorithms me se ek hai, aur missing values ko bhi handle kar leta hai.
4. **Proper evaluation, not just accuracy** — Precision, Recall, F1, ROC-AUC sab check kiye gaye hain. Ye important hai kyunki collections data usually **imbalanced** hota hai (zyada FAILED, kam SUCCESS cases) — sirf accuracy dekhna misleading ho sakta hai.
5. **Explainability built-in (SHAP)** — Business ko sirf prediction nahi, ye bhi pata chalta hai **"kyun"** model ne ye predict kiya — jo compliance aur trust ke liye zaroori hai (collections ek regulated area hai).
6. **Production-ready structure** — Model + preprocessing pipeline dono save hote hain, taaki serving (FastAPI) me exact same transformation use ho — training-serving mismatch ka risk kam hota hai.
7. **Cross-validation included** — Sirf ek train/test split pe bharosa nahi kiya gaya; 5-fold CV se overfitting ka better sense milta hai.

---

## 6. Cons / Risks (Dhyaan Rakhne Wali Baatein) ⚠️

1. **Data leakage ka risk** — `payment_status` (jisse target banta hai) `payments` table se aata hai, jo `strategy_id` se join ho raha hai. Agar ek strategy_id ke against **multiple payment records** hain (jaise partial payments), to `JOIN` duplicate rows bana sakta hai — jisse same execution multiple baar count ho jaye. Isko check karna zaroori hai.
2. **`branch_name <-> branches.code` join uncertain hai** — Code me hi comment hai ki ye join key production schema se match karke verify karna hoga. Agar galat hua, to branch-related features garbage/missing ho sakte hain.
3. **Class imbalance handle nahi kiya gaya** — Collections data me generally successful recoveries kam hoti hain. Code me `scale_pos_weight` ya SMOTE jaisi koi imbalance-handling technique nahi use hui — isse model majority class (failure) ki taraf bias ho sakta hai.
4. **Time-based leakage possible** — `days_since_last_payment` jaisa feature `assigned_at` se calculate hota hai — ye sahi hai. Lekin agar `communications` ya `agents` table ka data strategy complete hone ke **baad** ka bhi include ho gaya (future info), to model "cheat" kar sakta hai — real-world me ye info uss waqt available nahi hogi.
5. **`retry_count` aur agent/communication features multiple rows generate kar sakte hain** — `communications` table LEFT JOIN hai bina kisi date filter/aggregation ke. Agar ek strategy ke multiple communication attempts hain, to duplicate rows ban sakti hain jo model ko galat weight de sakti hain.
6. **Hardcoded DB credentials fallback** — `DB_PASSWORD` ka default "postgres" hai. Production me environment variables set na hone par ye security risk ban sakta hai.
7. **Hyperparameters fixed hain, tuned nahi** — `n_estimators=300`, `max_depth=5` etc. manually choose kiye gaye hain, koi grid search/optuna tuning nahi ki gayi — performance aur behtar ho sakti hai.
8. **Model drift ka risk** — Collections strategies, policies, aur customer behavior time ke saath badalte hain. Script me koi retraining schedule ya drift-monitoring nahi hai — model purana ho sakta hai agar regularly refresh na kiya jaye.

---

## 7. Quick Summary (One-Liner Version)

> Ye ek **XGBoost-based binary classifier** hai jo predict karta hai ki loan collection strategy successful recovery karegi ya nahi — 7 tables (case, branch, strategy, agent, communication, payment) ko join karke rich features banata hai, achhi evaluation aur SHAP explainability deta hai, but data leakage, join-key accuracy, aur class imbalance jaise points ko production me daalne se pehle double-check karna zaroori hai.
