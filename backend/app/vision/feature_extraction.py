from typing import Dict, Any, List

class FeatureExtractor:
    """
    Extracts biomechanically validated kinematic feature vectors from jump trajectory.
    """

    @staticmethod
    def extract_jump_features(
        jump_height_cm: float,
        flight_time_sec: float,
        takeoff_velocity: float,
        explosive_power: int,
        landing_stability: int,
        symmetry_score: int,
        athlete_height_cm: float,
        age: float,
    ) -> List[float]:
        """
        Formats normalized feature vector for ML sport suitability classification.
        Features: [jump_height_cm, flight_time, explosive_power, takeoff_velocity, athlete_height_cm, age, symmetry]
        """
        return [
            float(jump_height_cm),
            float(flight_time_sec),
            float(explosive_power),
            float(takeoff_velocity),
            float(athlete_height_cm),
            float(age),
            float(symmetry_score),
        ]
