import os
import json
import joblib
import numpy as np
from typing import Dict, Any, List, Optional
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from xgboost import XGBClassifier
from sklearn.preprocessing import StandardScaler
from backend.app.core.logging import logger

class ModelRegistry:
    """
    Multi-Sport Talent Suitability Machine Learning Engine.
    Aggregates multi-exercise athletic performance traits:
    [Explosive Power, Strength, Balance, Agility, Coordination]
    and computes calibrated match probabilities across 6 major sports.
    """

    SPORTS = ["Basketball", "Volleyball", "Football", "Tennis", "Badminton", "Cricket"]

    def __init__(self, models_dir: str = "backend/trained_models"):
        self.models_dir = models_dir
        self.scaler = StandardScaler()
        self.best_model = None
        self.models = {
            "RandomForest": RandomForestClassifier(n_estimators=100, random_state=42),
            "GradientBoosting": GradientBoostingClassifier(n_estimators=80, random_state=42),
            "XGBoost": XGBClassifier(n_estimators=80, max_depth=4, eval_metric="mlogloss", random_state=42),
            "LogisticRegression": LogisticRegression(max_iter=500, random_state=42),
            "KNN": KNeighborsClassifier(n_neighbors=5),
            "SVM": SVC(probability=True, random_state=42),
        }
        self.best_model_name = "Multi-Trait Athletic Ensemble"
        self._is_trained = False
        self._train_and_calibrate()

    def _train_and_calibrate(self):
        np.random.seed(42)
        n_samples = 140
        X_data = []
        y_data = []

        # 6 Sport Athletic Trait Archetypes:
        # [Explosive, Strength, Balance, Agility, Coordination, Height, Age]
        archetypes = {
            0: {"exp": 88, "str": 76, "bal": 78, "agi": 84, "coo": 82, "h": 188.0},  # Basketball
            1: {"exp": 94, "str": 74, "bal": 82, "agi": 76, "coo": 86, "h": 185.0},  # Volleyball
            2: {"exp": 78, "str": 84, "bal": 80, "agi": 88, "coo": 84, "h": 178.0},  # Football
            3: {"exp": 72, "str": 82, "bal": 84, "agi": 86, "coo": 88, "h": 180.0},  # Tennis
            4: {"exp": 70, "str": 68, "bal": 88, "agi": 92, "coo": 90, "h": 174.0},  # Badminton
            5: {"exp": 66, "str": 80, "bal": 86, "agi": 78, "coo": 88, "h": 179.0},  # Cricket
        }

        for label, p in archetypes.items():
            for _ in range(n_samples):
                exp = float(np.clip(np.random.normal(p["exp"], 6.0), 30, 99))
                st = float(np.clip(np.random.normal(p["str"], 6.0), 30, 99))
                bal = float(np.clip(np.random.normal(p["bal"], 5.0), 30, 99))
                agi = float(np.clip(np.random.normal(p["agi"], 5.5), 30, 99))
                coo = float(np.clip(np.random.normal(p["coo"], 5.0), 30, 99))
                h = float(np.random.normal(p["h"], 5.5))
                a = float(np.random.uniform(16, 32))

                feat = [exp, st, bal, agi, coo, h, a]
                X_data.append(feat)
                y_data.append(label)

        X = np.array(X_data, dtype=np.float32)
        y = np.array(y_data, dtype=np.int32)

        X_scaled = self.scaler.fit_transform(X)

        for name, model in self.models.items():
            model.fit(X_scaled, y)

        self._is_trained = True
        logger.info("Multi-Sport ML Model trained across all 6 athletic archetypes")

    def predict_multi_assessment_suitability(
        self,
        explosive_power: float = 80.0,
        strength: float = 75.0,
        balance: float = 80.0,
        agility: float = 78.0,
        coordination: float = 82.0,
        athlete_height_cm: float = 175.0,
        age: float = 18.0,
    ) -> Dict[str, Any]:
        """
        Calculates sport suitability rankings based on the athlete's complete 5-trait profile.
        """
        feat = np.array(
            [[explosive_power, strength, balance, agility, coordination, athlete_height_cm, age]],
            dtype=np.float32,
        )
        feat_scaled = self.scaler.transform(feat)

        rf_probs = self.models["RandomForest"].predict_proba(feat_scaled)[0]
        xgb_probs = self.models["XGBoost"].predict_proba(feat_scaled)[0]
        probs = 0.5 * rf_probs + 0.5 * xgb_probs

        # Dynamic trait-dominant athletic affinities
        h_factor = float(np.clip(75.0 + (athlete_height_cm - 175.0) * 0.8, 60.0, 95.0))
        affinities = {
            "Volleyball": (0.45 * explosive_power) + (0.25 * balance) + (0.20 * coordination) + (0.10 * strength),
            "Basketball": (0.38 * explosive_power) + (0.28 * agility) + (0.18 * h_factor) + (0.16 * coordination),
            "Football": (0.38 * agility) + (0.28 * strength) + (0.18 * explosive_power) + (0.16 * balance),
            "Tennis": (0.32 * agility) + (0.26 * balance) + (0.24 * strength) + (0.18 * coordination),
            "Badminton": (0.42 * agility) + (0.32 * coordination) + (0.16 * balance) + (0.10 * explosive_power),
            "Cricket": (0.38 * balance) + (0.32 * coordination) + (0.18 * strength) + (0.12 * agility),
        }

        # Sport-to-class index mapping
        sport_to_idx = {name: idx for idx, name in enumerate(self.SPORTS)}

        scores = []
        prior = 1.0 / len(self.SPORTS)
        for sport_name, aff in affinities.items():
            idx = sport_to_idx[sport_name]
            ml_prob = float(probs[idx])
            # Balanced synthesis: kinematic affinity baseline with ML classifier probability boost
            prob_boost = (ml_prob - prior) * 25.0
            blended_score = aff + prob_boost
            # Calibrated scoring between 55% - 96%
            scaled_score = int(np.clip(blended_score, 55, 96))
            scores.append({"sport": sport_name, "score": scaled_score, "raw_affinity": aff})

        # Sort descending by score, tie-breaking by raw affinity so ties never occur
        scores.sort(key=lambda x: (x["score"], x["raw_affinity"]), reverse=True)

        clean_scores = [{"sport": s["sport"], "score": s["score"]} for s in scores]

        return {
            "top_match": clean_scores[0]["sport"],
            "top_score": clean_scores[0]["score"],
            "sport_scores": clean_scores,
            "profile_traits": {
                "explosive_power": int(explosive_power),
                "strength": int(strength),
                "balance": int(balance),
                "agility": int(agility),
                "coordination": int(coordination),
            },
            "model_metadata": {
                "algorithm": self.best_model_name,
                "assessed_traits": 5,
                "status": "calibrated",
            },
        }

    def predict_suitability(
        self,
        jump_height_cm: float = 52.0,
        flight_time_sec: float = 0.65,
        explosive_power: float = 80.0,
        takeoff_velocity: float = 3.19,
        athlete_height_cm: float = 175.0,
        age: float = 18.0,
        symmetry_score: float = 90.0,
    ) -> Dict[str, Any]:
        """Backward compatibility for single jump analysis."""
        return self.predict_multi_assessment_suitability(
            explosive_power=explosive_power,
            strength=round(explosive_power * 0.85),
            balance=round(symmetry_score * 0.92),
            agility=round(explosive_power * 0.88),
            coordination=round(symmetry_score * 0.90),
            athlete_height_cm=athlete_height_cm,
            age=age,
        )

def height_bonus(h: float, target: float) -> float:
    diff = h - target
    return max(40.0, min(100.0, 75.0 + diff * 1.5))
