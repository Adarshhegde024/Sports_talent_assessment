import os
import shutil
import tempfile
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from backend.app.api.dependencies import get_current_user
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.vision.movement_analyzer import MovementAnalyzer
from backend.app.ml.model_registry import ModelRegistry
from backend.app.llm.inference import AthleticIntelligenceEngine

router = APIRouter(prefix="/assessments", tags=["Movement & Video Capture"])

movement_analyzer = MovementAnalyzer()
model_registry = ModelRegistry()
llm_engine = AthleticIntelligenceEngine()

@router.post("/analyze-movement")
async def analyze_movement_endpoint(
    video: Optional[UploadFile] = File(None),
    assessment_slug: Optional[str] = Form("vertical-jump"),
    athlete_name: Optional[str] = Form("Athlete"),
    athlete_height_cm: Optional[float] = Form(175.0),
    age: Optional[float] = Form(18.0),
    attempt_number: Optional[int] = Form(1),
):
    """
    Public analysis endpoint for client upload with full multi-sport movement kinematics.
    """
    height = float(athlete_height_cm or 175.0)
    slug = (assessment_slug or "vertical-jump").lower()

    temp_path = None
    if video and video.filename:
        temp_dir = tempfile.mkdtemp()
        temp_path = os.path.join(temp_dir, video.filename)
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)

    try:
        kinematics = movement_analyzer.process_movement(
            assessment_slug=slug,
            video_path=temp_path,
            athlete_height_cm=height,
            attempt_idx=attempt_number or 1,
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

    # Compute 5 performance traits based on movement pattern
    exp_p = kinematics.get("explosive_power", 80 if "jump" in slug else 72)
    strength = kinematics.get("strength_score", 82 if ("squat" in slug or "push" in slug) else 75)
    balance = kinematics.get("balance_score", 88 if "balance" in slug else 80)
    agility = kinematics.get("agility_score", 86 if "agility" in slug else 78)
    coordination = kinematics.get("coordination_score", 84)

    performance_metrics = [
        {"key": "explosive-power", "label": "Explosive Power", "value": exp_p, "unit": "/100"},
        {"key": "strength", "label": "Strength", "value": strength, "unit": "/100"},
        {"key": "balance", "label": "Balance", "value": balance, "unit": "/100"},
        {"key": "agility", "label": "Agility", "value": agility, "unit": "/100"},
        {"key": "coordination", "label": "Coordination", "value": coordination, "unit": "/100"},
    ]

    ml_results = model_registry.predict_multi_assessment_suitability(
        explosive_power=float(exp_p),
        strength=float(strength),
        balance=float(balance),
        agility=float(agility),
        coordination=float(coordination),
        athlete_height_cm=height,
        age=float(age or 18.0),
    )

    coach_report = llm_engine.generate_assessment_report(
        assessment_slug=slug,
        athlete_name=athlete_name or "Athlete",
        kinematics=kinematics,
        top_sport=ml_results["top_match"],
        sport_scores=ml_results["sport_scores"],
        performance_metrics=performance_metrics,
    )

    return {
        "assessment_slug": slug,
        "kinematics": kinematics,
        "performance_metrics": performance_metrics,
        "sport_suitability": ml_results,
        "coach_report": coach_report,
    }

@router.post("/analyze-jump")
async def analyze_jump_legacy_endpoint(
    video: Optional[UploadFile] = File(None),
    athlete_name: Optional[str] = Form("Athlete"),
    athlete_height_cm: Optional[float] = Form(175.0),
    age: Optional[float] = Form(18.0),
    attempt_number: Optional[int] = Form(1),
):
    return await analyze_movement_endpoint(
        video=video,
        assessment_slug="vertical-jump",
        athlete_name=athlete_name,
        athlete_height_cm=athlete_height_cm,
        age=age,
        attempt_number=attempt_number,
    )

from pydantic import BaseModel

class ComprehensiveReportRequest(BaseModel):
    athlete_name: Optional[str] = "Athlete"
    athlete_height_cm: Optional[float] = 175.0
    age: Optional[float] = 18.0
    fitness_level: Optional[str] = "recreational"
    performance_metrics: Optional[List[Dict[str, Any]]] = None

@router.post("/comprehensive-talent-report")
async def comprehensive_talent_report_endpoint(request: ComprehensiveReportRequest):
    """
    Synthesizes all 5 completed assessments into the definitive Primary Sport Recommendation,
    Olympic Biomechanical rationale, and tailored 4-week practice regimen.
    """
    metrics = request.performance_metrics or [
        {"key": "explosive-power", "label": "Explosive Power", "value": 84, "unit": "/100"},
        {"key": "strength", "label": "Strength", "value": 82, "unit": "/100"},
        {"key": "balance", "label": "Balance", "value": 86, "unit": "/100"},
        {"key": "agility", "label": "Agility", "value": 85, "unit": "/100"},
        {"key": "coordination", "label": "Coordination", "value": 84, "unit": "/100"},
    ]

    metric_map = {m.get("key", ""): float(m.get("value", 75)) for m in metrics}
    exp = metric_map.get("explosive-power", 80.0)
    st = metric_map.get("strength", 80.0)
    bal = metric_map.get("balance", 80.0)
    agi = metric_map.get("agility", 80.0)
    coo = metric_map.get("coordination", 80.0)

    height = float(request.athlete_height_cm or 175.0)
    age = float(request.age or 18.0)

    ml_results = model_registry.predict_multi_assessment_suitability(
        explosive_power=exp,
        strength=st,
        balance=bal,
        agility=agi,
        coordination=coo,
        athlete_height_cm=height,
        age=age,
    )

    primary_sport = ml_results["top_match"]
    top_score = ml_results["top_score"]
    sport_scores = ml_results["sport_scores"]

    talent_report = llm_engine.generate_comprehensive_talent_report(
        athlete_name=request.athlete_name or "Athlete",
        athlete_height_cm=height,
        age=age,
        fitness_level=request.fitness_level or "recreational",
        primary_sport=primary_sport,
        match_score=top_score,
        sport_scores=sport_scores,
        performance_metrics=metrics,
    )

    return {
        "status": "success",
        "primary_sport": primary_sport,
        "top_score": top_score,
        "sport_scores": sport_scores,
        "performance_metrics": metrics,
        "talent_report": talent_report,
    }

