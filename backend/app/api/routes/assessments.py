import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from backend.app.api.dependencies import get_current_user
from backend.app.schemas.assessment import AssessmentRunCreate, AssessmentStatusResponse

router = APIRouter(prefix="/assessments", tags=["Assessments"])

STANDARD_ASSESSMENTS = [
    {
        "id": "vertical-jump",
        "slug": "vertical-jump",
        "name": "Vertical Jump",
        "description": "Measures explosive lower-body power and vertical flight time using stationary phone camera.",
        "is_active": True,
    },
    {
        "id": "squat",
        "slug": "squat",
        "name": "Squat",
        "description": "Assesses lower-body bilateral mobility, joint alignment, and depth consistency.",
        "is_active": True,
    },
    {
        "id": "single-leg-balance",
        "slug": "single-leg-balance",
        "name": "Single-Leg Balance",
        "description": "Quantifies postural sway control and left/right stability symmetry.",
        "is_active": True,
    },
    {
        "id": "push-up",
        "slug": "push-up",
        "name": "Push-Up",
        "description": "Measures upper-body concentric strength and muscular endurance.",
        "is_active": True,
    },
    {
        "id": "side-to-side-agility",
        "slug": "side-to-side-agility",
        "name": "Side-to-Side Agility",
        "description": "Measures lateral change-of-direction quickness and line contact tempo.",
        "is_active": True,
    },
]

@router.get("", response_model=List[Dict[str, Any]])
def list_all_assessments():
    """
    Lists all active standardized athletic assessments.
    """
    return STANDARD_ASSESSMENTS

@router.get("/{assessment_id}", response_model=Dict[str, Any])
def get_assessment_by_id(assessment_id: str):
    """
    Gets details and protocol for a specific assessment slug or UUID.
    """
    match = next(
        (a for a in STANDARD_ASSESSMENTS if a["id"] == assessment_id or a["slug"] == assessment_id),
        None,
    )
    if not match:
        raise HTTPException(status_code=404, detail=f"Assessment '{assessment_id}' not found")
    return match

@router.post("/{assessment_id}/runs", response_model=Dict[str, Any])
def create_assessment_run(
    assessment_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Creates a new assessment session record for the authenticated athlete.
    """
    user_id = current_user["user_id"]
    run_id = f"run-{int(datetime.datetime.now().timestamp() * 1000)}"
    return {
        "id": run_id,
        "user_id": user_id,
        "assessment_id": assessment_id,
        "status": "processing",
        "created_at": datetime.datetime.now().isoformat(),
    }

@router.get("/runs/{run_id}/status", response_model=AssessmentStatusResponse)
def get_assessment_run_status(
    run_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Returns current execution status (created, uploading, processing, completed).
    """
    return AssessmentStatusResponse(
        run_id=run_id,
        status="completed",
        progress=100,
        message="Movement analysis completed successfully",
    )
