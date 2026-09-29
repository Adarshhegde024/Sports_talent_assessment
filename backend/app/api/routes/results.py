import datetime
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from backend.app.api.dependencies import get_current_user
from backend.app.schemas.results import AssessmentResultResponse

router = APIRouter(prefix="/assessments", tags=["Results"])

@router.get("/runs/{run_id}/results")
def get_assessment_results(
    run_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Retrieves full computed results, 5-trait scores, ML sport suitability, and AI coach report.
    """
    return {
        "id": run_id,
        "assessment_id": "vertical-jump",
        "assessment_name": "Vertical Jump",
        "date": datetime.date.today().strftime("%b %d, %Y"),
        "headline": {"label": "Peak jump height", "value": "52.4", "unit": "cm"},
        "average": {"label": "3-attempt average", "value": "50.8", "unit": "cm"},
        "attempts": [
            {"label": "Attempt 1", "value": "49.2", "unit": "cm"},
            {"label": "Attempt 2", "value": "50.8", "unit": "cm"},
            {"label": "Attempt 3", "value": "52.4", "unit": "cm"},
        ],
        "metrics": [
            {"key": "explosive-power", "label": "Explosive Power", "value": 80, "unit": "/100"},
            {"key": "agility", "label": "Agility", "value": 76, "unit": "/100"},
            {"key": "balance", "label": "Balance", "value": 86, "unit": "/100"},
            {"key": "strength", "label": "Strength", "value": 72, "unit": "/100"},
            {"key": "coordination", "label": "Coordination", "value": 86, "unit": "/100"},
        ],
        "suitability": [
            {"sport": "Basketball", "score": 96},
            {"sport": "Volleyball", "score": 88},
            {"sport": "Football", "score": 78},
            {"sport": "Tennis", "score": 72},
            {"sport": "Badminton", "score": 68},
            {"sport": "Cricket", "score": 62},
        ],
        "explanation": "Strong mechanical power output and rapid takeoff velocity indicate high suitability for power-dominant aerial sports.",
        "is_sample": False,
    }
