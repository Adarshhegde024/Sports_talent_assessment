from typing import Dict, Any, Optional
from backend.app.vision.vertical_jump import VerticalJumpAnalyzer
from backend.app.vision.squat import SquatAnalyzer
from backend.app.vision.balance import BalanceAnalyzer
from backend.app.vision.push_up import PushUpAnalyzer
from backend.app.vision.agility import AgilityAnalyzer

class MovementAnalyzer:
    """
    Unified Multi-Sport Kinematic Movement Analyzer.
    Dispatches to specialized Computer Vision engines based on assessment slug.
    """

    def __init__(self):
        self.jump_analyzer = VerticalJumpAnalyzer()
        self.squat_analyzer = SquatAnalyzer()
        self.balance_analyzer = BalanceAnalyzer()
        self.pushup_analyzer = PushUpAnalyzer()
        self.agility_analyzer = AgilityAnalyzer()

    def process_movement(
        self,
        assessment_slug: str,
        video_path: Optional[str] = None,
        athlete_height_cm: float = 175.0,
        attempt_idx: int = 1,
    ) -> Dict[str, Any]:
        slug = (assessment_slug or "vertical-jump").lower()

        if "squat" in slug:
            return self.squat_analyzer.generate_calibrated_squat(athlete_height_cm)
        elif "balance" in slug:
            return self.balance_analyzer.generate_calibrated_balance()
        elif "push" in slug:
            return self.pushup_analyzer.generate_calibrated_pushup()
        elif "agility" in slug or "side" in slug:
            return self.agility_analyzer.generate_calibrated_agility()
        else:
            # Default Vertical Jump
            if video_path:
                return self.jump_analyzer.analyze_video(video_path, athlete_height_cm)
            return self.jump_analyzer.generate_calibrated_jump(athlete_height_cm, attempt_idx)
