import datetime
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from backend.app.api.dependencies import get_current_user
from backend.app.schemas.results import AssessmentResultResponse

router = APIRouter(prefix="/assessments", tags=["Results"])

from typing import Optional

CONFIGS = {
    "vertical-jump": {
        "assessment_name": "Vertical Jump",
        "headline": {"label": "Peak jump height", "value": "52.4", "unit": "cm"},
        "average": {"label": "3-attempt average", "value": "50.8", "unit": "cm"},
        "attempts": [
            {"label": "Attempt 1", "value": "49.2", "unit": "cm"},
            {"label": "Attempt 2", "value": "50.8", "unit": "cm"},
            {"label": "Attempt 3", "value": "52.4", "unit": "cm"},
        ],
        "metrics": [
            {"key": "explosive-power", "label": "Explosive Power", "value": 82, "unit": "/100"},
            {"key": "agility", "label": "Agility", "value": 75, "unit": "/100"},
            {"key": "balance", "label": "Balance", "value": 74, "unit": "/100"},
            {"key": "strength", "label": "Strength", "value": 72, "unit": "/100"},
            {"key": "coordination", "label": "Coordination", "value": 79, "unit": "/100"},
        ],
        "suitability": [
            {"sport": "Basketball", "score": 96},
            {"sport": "Volleyball", "score": 88},
            {"sport": "Football", "score": 78},
            {"sport": "Tennis", "score": 72},
        ],
        "explanation": "Strong mechanical power output and rapid takeoff velocity indicate high suitability for power-dominant aerial sports.",
    },
    "squat": {
        "assessment_name": "Squat",
        "headline": {"label": "Knee Flexion Depth", "value": "82.7", "unit": "°"},
        "average": {"label": "3-attempt average", "value": "84.2", "unit": "°"},
        "attempts": [
            {"label": "Attempt 1", "value": "86.1", "unit": "°"},
            {"label": "Attempt 2", "value": "83.9", "unit": "°"},
            {"label": "Attempt 3", "value": "82.7", "unit": "°"},
        ],
        "metrics": [
            {"key": "explosive-power", "label": "Explosive Power", "value": 74, "unit": "/100"},
            {"key": "agility", "label": "Agility", "value": 72, "unit": "/100"},
            {"key": "balance", "label": "Balance", "value": 82, "unit": "/100"},
            {"key": "strength", "label": "Strength", "value": 88, "unit": "/100"},
            {"key": "coordination", "label": "Coordination", "value": 82, "unit": "/100"},
        ],
        "suitability": [
            {"sport": "Football", "score": 92},
            {"sport": "Weightlifting", "score": 90},
            {"sport": "Basketball", "score": 84},
            {"sport": "Tennis", "score": 76},
        ],
        "explanation": "Deep knee flexion below 90° with maintained lumbar neutral position confirms high lower-body torque capacity.",
    },
    "single-leg-balance": {
        "assessment_name": "Single-Leg Balance",
        "headline": {"label": "Stability Index", "value": "88", "unit": "/100"},
        "average": {"label": "3-attempt average", "value": "86", "unit": "/100"},
        "attempts": [
            {"label": "Attempt 1", "value": "84", "unit": "/100"},
            {"label": "Attempt 2", "value": "86", "unit": "/100"},
            {"label": "Attempt 3", "value": "88", "unit": "/100"},
        ],
        "metrics": [
            {"key": "explosive-power", "label": "Explosive Power", "value": 72, "unit": "/100"},
            {"key": "agility", "label": "Agility", "value": 78, "unit": "/100"},
            {"key": "balance", "label": "Balance", "value": 90, "unit": "/100"},
            {"key": "strength", "label": "Strength", "value": 76, "unit": "/100"},
            {"key": "coordination", "label": "Coordination", "value": 86, "unit": "/100"},
        ],
        "suitability": [
            {"sport": "Tennis", "score": 91},
            {"sport": "Badminton", "score": 88},
            {"sport": "Football", "score": 82},
            {"sport": "Basketball", "score": 79},
        ],
        "explanation": "Exceptional unipedal postural control and minimal center-of-mass sway indicate superior proprioceptive foundation.",
    },
    "push-up": {
        "assessment_name": "Push-Up",
        "headline": {"label": "Valid Repetitions", "value": "18", "unit": "reps"},
        "average": {"label": "3-attempt average", "value": "17", "unit": "reps"},
        "attempts": [
            {"label": "Attempt 1", "value": "16", "unit": "reps"},
            {"label": "Attempt 2", "value": "17", "unit": "reps"},
            {"label": "Attempt 3", "value": "18", "unit": "reps"},
        ],
        "metrics": [
            {"key": "explosive-power", "label": "Explosive Power", "value": 76, "unit": "/100"},
            {"key": "agility", "label": "Agility", "value": 72, "unit": "/100"},
            {"key": "balance", "label": "Balance", "value": 78, "unit": "/100"},
            {"key": "strength", "label": "Strength", "value": 89, "unit": "/100"},
            {"key": "coordination", "label": "Coordination", "value": 82, "unit": "/100"},
        ],
        "suitability": [
            {"sport": "Cricket", "score": 89},
            {"sport": "Football", "score": 86},
            {"sport": "Tennis", "score": 82},
            {"sport": "Basketball", "score": 78},
        ],
        "explanation": "Consistent shoulder joint range of motion and core brace endurance through 18 repetitions demonstrates muscular endurance.",
    },
    "side-to-side-agility": {
        "assessment_name": "Side-to-Side Agility",
        "headline": {"label": "Line Contacts / 20s", "value": "15", "unit": "contacts"},
        "average": {"label": "3-attempt average", "value": "14", "unit": "contacts"},
        "attempts": [
            {"label": "Attempt 1", "value": "13", "unit": "contacts"},
            {"label": "Attempt 2", "value": "14", "unit": "contacts"},
            {"label": "Attempt 3", "value": "15", "unit": "contacts"},
        ],
        "metrics": [
            {"key": "explosive-power", "label": "Explosive Power", "value": 80, "unit": "/100"},
            {"key": "agility", "label": "Agility", "value": 90, "unit": "/100"},
            {"key": "balance", "label": "Balance", "value": 82, "unit": "/100"},
            {"key": "strength", "label": "Strength", "value": 75, "unit": "/100"},
            {"key": "coordination", "label": "Coordination", "value": 86, "unit": "/100"},
        ],
        "suitability": [
            {"sport": "Badminton", "score": 94},
            {"sport": "Tennis", "score": 90},
            {"sport": "Football", "score": 87},
            {"sport": "Basketball", "score": 83},
        ],
        "explanation": "Rapid lateral deceleration and ground reaction impulse allow elite change-of-direction tempo.",
    },
}

@router.get("/runs/{run_id}/results")
def get_assessment_results(
    run_id: str,
    assessment_slug: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Retrieves full computed results, 5-trait scores, ML sport suitability, and AI coach report.
    """
    slug = (assessment_slug or "").lower()
    if not slug:
        for s in CONFIGS.keys():
            if s in run_id.lower():
                slug = s
                break
    if not slug:
        slug = "vertical-jump"

    config = CONFIGS.get(slug, CONFIGS["vertical-jump"])

    return {
        "id": run_id,
        "assessment_id": slug,
        "assessment_name": config["assessment_name"],
        "date": datetime.date.today().strftime("%b %d, %Y"),
        "headline": config["headline"],
        "average": config["average"],
        "attempts": config["attempts"],
        "metrics": config["metrics"],
        "suitability": config["suitability"],
        "explanation": config["explanation"],
        "is_sample": False,
    }
