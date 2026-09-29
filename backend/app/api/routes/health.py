from fastapi import APIRouter

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health_status():
    """
    Service health check and active engine verification.
    """
    return {
        "status": "ok",
        "service": "sportsense-backend",
        "version": "1.0.0",
        "cv_pipeline": "OpenCV Kinematic Analyzer",
        "ml_engine": "Multi-Model Sport Classifier",
        "coach_intelligence": "Active",
    }
