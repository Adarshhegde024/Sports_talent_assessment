import numpy as np
from typing import List, Dict, Any

class LandmarkProcessor:
    """
    Applies spatial smoothing, missing landmark imputation, and coordinate normalization.
    """

    @staticmethod
    def moving_average_smooth(series: List[float], window_size: int = 5) -> List[float]:
        """
        Smooths temporal landmark trajectory to eliminate camera shudder and frame noise.
        """
        if len(series) < window_size:
            return series

        arr = np.array(series, dtype=np.float32)
        window = np.ones(window_size) / window_size
        smoothed = np.convolve(arr, window, mode="same")
        return smoothed.tolist()

    @staticmethod
    def calculate_angle(p1: Dict[str, float], p2: Dict[str, float], p3: Dict[str, float]) -> float:
        """
        Calculates 2D joint angle between three landmarks in degrees.
        """
        a = np.array([p1["x"], p1["y"]])
        b = np.array([p2["x"], p2["y"]])
        c = np.array([p3["x"], p3["y"]])

        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)
        if angle > 180.0:
            angle = 360.0 - angle
        return float(angle)
