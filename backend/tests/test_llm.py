import pytest
from backend.app.llm.inference import AthleticIntelligenceEngine
from backend.app.llm.prompts import build_movement_prompt, SYSTEM_PROMPT
from backend.app.llm.response_formatter import ResponseFormatter, CoachingReportSchema

def test_prompt_builder():
    prompt = build_movement_prompt(
        assessment_slug="squat",
        athlete_name="Adarsh",
        kinematics={"min_knee_angle_deg": 86.5, "depth_score": 92},
        top_sport="Football",
        sport_scores=[{"sport": "Football", "score": 94}, {"sport": "Basketball", "score": 82}],
        performance_metrics=[{"key": "strength", "label": "Strength", "value": 88, "unit": "/100"}],
    )
    assert "SQUAT" in prompt
    assert "Adarsh" in prompt
    assert "Football" in prompt
    assert "prescribed_drills" in prompt

def test_response_formatter_validation():
    sample_json = """
    {
        "tier": "Elite Athletic Tier",
        "summary": "Outstanding athletic performance with explosive force development.",
        "takeoff_mechanics": "Rapid hip and ankle extension produced maximum upward velocity.",
        "landing_mechanics": "Smooth eccentric force absorption through knees and ankles.",
        "sport_match_rationale": "High power and vertical reach directly support basketball.",
        "prescribed_drills": [
            {"name": "Depth Jumps", "sets": "3 sets × 5 reps", "focus": "Minimal contact time"},
            {"name": "Box Jumps", "sets": "4 sets × 4 reps", "focus": "Maximum elevation"},
            {"name": "Single-Leg Balance", "sets": "3 sets × 30s", "focus": "Ankle stability"}
        ]
    }
    """
    parsed = ResponseFormatter.parse_and_validate_json(sample_json)
    assert parsed is not None
    assert parsed["tier"] == "Elite Athletic Tier"
    assert len(parsed["prescribed_drills"]) == 3

def test_llm_inference_engine_synthesis():
    engine = AthleticIntelligenceEngine()
    report = engine.generate_assessment_report(
        assessment_slug="vertical-jump",
        athlete_name="Adarsh",
        kinematics={"jump_height_cm": 54.2, "flight_time_sec": 0.66, "explosive_power": 84, "takeoff_velocity_mps": 3.24, "symmetry_score": 92},
        top_sport="Basketball",
        sport_scores=[{"sport": "Basketball", "score": 96}],
        performance_metrics=[{"key": "explosive-power", "label": "Explosive Power", "value": 84, "unit": "/100"}],
    )

    assert "tier" in report
    assert "summary" in report
    assert "takeoff_mechanics" in report
    assert "landing_mechanics" in report
    assert "sport_match_rationale" in report
    assert "prescribed_drills" in report
    assert len(report["prescribed_drills"]) == 3
    assert "Adarsh" in report["summary"]
    assert "Basketball" in report["sport_match_rationale"]
