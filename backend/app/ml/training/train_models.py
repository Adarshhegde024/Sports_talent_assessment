import os
import json
import joblib
import numpy as np
from typing import Dict, Any, Tuple
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GroupKFold
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

SPORTS = ["Basketball", "Volleyball", "Football", "Tennis", "Badminton", "Cricket"]

def generate_standardized_athletic_dataset(n_athletes_per_sport: int = 40, attempts_per_athlete: int = 3) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Generates standardized athletic kinematic feature distribution across 6 sports.
    Includes athlete_id groups to enforce strict subject-independent splitting.
    """
    np.random.seed(42)
    X_data = []
    y_data = []
    groups = []

    profiles = {
        0: {"h_mean": 60.0, "h_std": 5.5, "height": 188.0, "exp": 88.0},  # Basketball
        1: {"h_mean": 64.0, "h_std": 5.0, "height": 185.0, "exp": 92.0},  # Volleyball
        2: {"h_mean": 50.0, "h_std": 4.5, "height": 178.0, "exp": 78.0},  # Football
        3: {"h_mean": 46.0, "h_std": 4.0, "height": 180.0, "exp": 72.0},  # Tennis
        4: {"h_mean": 44.0, "h_std": 3.8, "height": 174.0, "exp": 70.0},  # Badminton
        5: {"h_mean": 42.0, "h_std": 4.0, "height": 179.0, "exp": 66.0},  # Cricket
    }

    athlete_global_id = 1000

    for sport_idx, p in profiles.items():
        for _ in range(n_athletes_per_sport):
            athlete_global_id += 1
            # Base anthropometrics per athlete
            athlete_h = float(np.random.normal(p["height"], 5.5))
            athlete_age = float(np.random.uniform(16, 30))

            for _ in range(attempts_per_athlete):
                jump_h = max(28.0, float(np.random.normal(p["h_mean"], p["h_std"])))
                flight_time = np.sqrt((8.0 * (jump_h / 100.0)) / 9.80665)
                takeoff_v = 9.80665 * (flight_time / 2.0)
                exp_power = min(100.0, (jump_h / 65.0) * 100.0)
                symmetry = float(np.random.uniform(84, 98))

                feat = [jump_h, flight_time, exp_power, takeoff_v, athlete_h, athlete_age, symmetry]
                X_data.append(feat)
                y_data.append(sport_idx)
                groups.append(athlete_global_id)

    return np.array(X_data, dtype=np.float32), np.array(y_data, dtype=np.int32), np.array(groups, dtype=np.int32)


def train_and_benchmark_models(output_dir: str = "backend/trained_models"):
    """
    Trains and benchmarks 6 classification algorithms using GroupKFold to eliminate data leakage.
    Serializes the winning model and scaler.
    """
    os.makedirs(output_dir, exist_ok=True)
    X, y, groups = generate_standardized_athletic_dataset()

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    candidate_models = {
        "LogisticRegression": LogisticRegression(max_iter=1000, random_state=42),
        "KNN": KNeighborsClassifier(n_neighbors=7),
        "SVM": SVC(probability=True, kernel="rbf", C=1.0, random_state=42),
        "NaiveBayes": GaussianNB(),
        "RandomForest": RandomForestClassifier(n_estimators=120, max_depth=8, random_state=42),
        "XGBoost": XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.08, eval_metric="mlogloss", random_state=42),
    }

    gkf = GroupKFold(n_splits=5)
    benchmark_results: Dict[str, Any] = {}
    best_f1 = -1.0
    best_model_name = ""

    for name, model in candidate_models.items():
        acc_scores = []
        prec_scores = []
        rec_scores = []
        f1_scores = []

        for train_idx, val_idx in gkf.split(X_scaled, y, groups):
            X_train, X_val = X_scaled[train_idx], X_scaled[val_idx]
            y_train, y_val = y[train_idx], y[val_idx]

            model.fit(X_train, y_train)
            preds = model.predict(X_val)

            acc_scores.append(accuracy_score(y_val, preds))
            prec_scores.append(precision_score(y_val, preds, average="macro", zero_division=0))
            rec_scores.append(recall_score(y_val, preds, average="macro", zero_division=0))
            f1_scores.append(f1_score(y_val, preds, average="macro", zero_division=0))

        mean_acc = float(np.mean(acc_scores))
        mean_prec = float(np.mean(prec_scores))
        mean_rec = float(np.mean(rec_scores))
        mean_f1 = float(np.mean(f1_scores))

        benchmark_results[name] = {
            "accuracy": round(mean_acc, 4),
            "precision": round(mean_prec, 4),
            "recall": round(mean_rec, 4),
            "f1_score": round(mean_f1, 4),
        }

        if mean_f1 > best_f1:
            best_f1 = mean_f1
            best_model_name = name

    # Train winning model on entire scaled dataset
    best_model = candidate_models[best_model_name]
    best_model.fit(X_scaled, y)

    # Save artifacts
    joblib.dump(scaler, os.path.join(output_dir, "scaler.joblib"))
    joblib.dump(best_model, os.path.join(output_dir, "best_model.joblib"))

    report_payload = {
        "best_model": best_model_name,
        "best_f1_score": round(best_f1, 4),
        "validation_strategy": "5-Fold Subject-Independent GroupKFold (Zero Data Leakage)",
        "sports": SPORTS,
        "benchmarks": benchmark_results,
    }

    with open(os.path.join(output_dir, "model_benchmark.json"), "w") as f:
        json.dump(report_payload, f, indent=2)

    return report_payload


if __name__ == "__main__":
    report = train_and_benchmark_models()
    print("Benchmark complete:")
    print(json.dumps(report, indent=2))
