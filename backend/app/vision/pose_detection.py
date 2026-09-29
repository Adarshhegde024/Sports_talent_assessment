import cv2
import numpy as np
from typing import Optional, List, Dict, Any

class PoseDetector:
    """
    MediaPipe Pose Landmark Tracking Engine for Stationary Camera Movement Capture.
    Extracts 33 standard anatomical keypoints per video frame.
    """

    def __init__(self, static_mode: bool = False, min_detection_conf: float = 0.5, min_tracking_conf: float = 0.5):
        self.mp_pose = None
        try:
            import mediapipe as mp
            self.mp_drawing = mp.solutions.drawing_utils
            self.mp_pose_solution = mp.solutions.pose
            self.mp_pose = self.mp_pose_solution.Pose(
                static_image_mode=static_mode,
                model_complexity=1,
                smooth_landmarks=True,
                enable_segmentation=False,
                min_detection_confidence=min_detection_conf,
                min_tracking_confidence=min_tracking_conf,
            )
        except Exception as e:
            self.mp_pose = None

    def process_frame(self, frame_bgr: np.ndarray) -> Optional[Dict[str, Any]]:
        """
        Processes a BGR image frame and extracts normalized 3D landmarks.
        """
        if self.mp_pose is None or frame_bgr is None:
            return None

        h, w = frame_bgr.shape[:2]
        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        rgb.flags.writeable = False
        results = self.mp_pose.process(rgb)
        rgb.flags.writeable = True

        if not results.pose_landmarks:
            return None

        landmarks = []
        for lm in results.pose_landmarks.landmark:
            landmarks.append({
                "x": float(lm.x),
                "y": float(lm.y),
                "z": float(lm.z),
                "visibility": float(lm.visibility),
                "pixel_x": int(lm.x * w),
                "pixel_y": int(lm.y * h),
            })

        return {
            "landmarks": landmarks,
            # Key anatomical indices
            "nose": landmarks[0],
            "left_shoulder": landmarks[11],
            "right_shoulder": landmarks[12],
            "left_hip": landmarks[23],
            "right_hip": landmarks[24],
            "left_knee": landmarks[25],
            "right_knee": landmarks[26],
            "left_ankle": landmarks[27],
            "right_ankle": landmarks[28],
            "left_heel": landmarks[29],
            "right_heel": landmarks[30],
            "left_foot_index": landmarks[31],
            "right_foot_index": landmarks[32],
        }

    def close(self):
        if self.mp_pose is not None:
            self.mp_pose.close()
