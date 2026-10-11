import os
import tempfile
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.vision.movement_analyzer import MovementAnalyzer
from backend.app.vision.vertical_jump import VerticalJumpAnalyzer
from backend.app.vision.squat import SquatAnalyzer
from backend.app.vision.balance import BalanceAnalyzer
from backend.app.vision.push_up import PushUpAnalyzer
from backend.app.vision.agility import AgilityAnalyzer

client = TestClient(app)

def create_synthetic_video(duration_sec: float = 1.0, fps: int = 30) -> str:
    """Creates a temporary synthetic video file for test intake."""
    temp_dir = tempfile.mkdtemp()
    video_path = os.path.join(temp_dir, "test_movement.mp4")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    width, height = 320, 240
    out = cv2.VideoWriter(video_path, fourcc, float(fps), (width, height))

    num_frames = int(duration_sec * fps)
    for i in range(num_frames):
        # Create a black frame with a simulated moving white marker
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        y_pos = int(120 + 40 * np.sin(2 * np.pi * i / fps))
        cv2.circle(frame, (160, y_pos), 15, (255, 255, 255), -1)
        out.write(frame)

    out.release()
    return video_path

# ==============================================================================
# 1. KINEMATIC CALIBRATION UNIT TESTS
# ==============================================================================

def test_vertical_jump_kinematics():
    analyzer = VerticalJumpAnalyzer()
    res = analyzer.generate_calibrated_jump(athlete_height_cm=180.0, attempt_idx=1)
    assert "jump_height_cm" in res
    assert res["jump_height_cm"] > 0
    assert 40 <= res["explosive_power"] <= 100
    assert res["headline_unit"] == "cm"

def test_squat_depth_and_strength_calibration():
    analyzer = SquatAnalyzer()
    # Test deep squat (82 degrees knee angle)
    deep_res = analyzer.analyze_squat(knee_angles=[170, 140, 110, 85, 82, 85, 110, 165], athlete_height_cm=175.0)
    assert deep_res["min_knee_angle_deg"] == 82.0
    assert deep_res["depth_score"] >= 90
    assert deep_res["strength_score"] >= 70

    # Test shallow squat (125 degrees knee angle)
    shallow_res = analyzer.analyze_squat(knee_angles=[170, 150, 130, 125, 130, 160], athlete_height_cm=175.0)
    assert shallow_res["min_knee_angle_deg"] == 125.0
    assert shallow_res["depth_score"] < deep_res["depth_score"]

def test_balance_stability_calibration():
    analyzer = BalanceAnalyzer()
    # Stable series (low sway std deviation)
    stable_series = [0.50 + 0.005 * np.sin(i) for i in range(30)]
    stable_res = analyzer.analyze_balance(stable_series, duration_sec=30.0)
    assert stable_res["stability_index"] >= 80
    assert stable_res["balance_score"] >= 75

    # Unstable series (high sway std deviation)
    unstable_series = [0.50 + 0.08 * np.sin(i) for i in range(30)]
    unstable_res = analyzer.analyze_balance(unstable_series, duration_sec=30.0)
    assert unstable_res["stability_index"] < stable_res["stability_index"]

def test_push_up_volume_and_form_calibration():
    analyzer = PushUpAnalyzer()
    # 20 repetitions with deep elbow flexion
    elbow_angles = [160, 120, 85, 120, 160] * 20
    res = analyzer.analyze_pushup(elbow_angles, rep_count=20)
    assert res["rep_count"] == 20
    assert res["min_elbow_angle_deg"] == 85.0
    assert res["strength_score"] >= 85
    assert res["form_score"] >= 90

def test_agility_tempo_and_contact_calibration():
    analyzer = AgilityAnalyzer()
    # 18 line contacts in 20s
    turnaround_times = [1.1, 1.15, 1.08, 1.12]
    res = analyzer.analyze_agility(turnaround_times, contacts=18)
    assert res["contacts_20s"] == 18
    assert res["avg_reversal_tempo_sec"] > 0
    assert res["agility_score"] >= 85
    assert res["coordination_score"] >= 80

# ==============================================================================
# 2. MOVEMENT ANALYZER ROUTER & VIDEO UPLOAD TESTS
# ==============================================================================

def test_movement_analyzer_all_slugs_with_video():
    analyzer = MovementAnalyzer()
    video_path = create_synthetic_video(duration_sec=0.5, fps=20)

    slugs = ["vertical-jump", "squat", "single-leg-balance", "push-up", "side-to-side-agility"]
    for slug in slugs:
        result = analyzer.process_movement(
            assessment_slug=slug,
            video_path=video_path,
            athlete_height_cm=176.0,
            attempt_idx=1,
        )
        assert isinstance(result, dict)
        assert "headline_label" in result
        assert "headline_value" in result

    if os.path.exists(video_path):
        os.remove(video_path)

# ==============================================================================
# 3. END-TO-END FASTAPI ENDPOINT CALIBRATION TESTS
# ==============================================================================

def test_analyze_movement_api_endpoint():
    response = client.post(
        "/api/assessments/analyze-movement",
        data={
            "assessment_slug": "squat",
            "athlete_name": "Test Athlete",
            "athlete_height_cm": 178.0,
            "age": 20,
            "attempt_number": 1,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["assessment_slug"] == "squat"
    assert len(data["performance_metrics"]) == 5
    assert "sport_suitability" in data
    assert "top_match" in data["sport_suitability"]
    assert "coach_report" in data
    assert "prescribed_drills" in data["coach_report"]
    assert len(data["coach_report"]["prescribed_drills"]) == 3

def test_comprehensive_talent_report_api_endpoint():
    payload = {
        "athlete_name": "Marcus Vance",
        "athlete_height_cm": 185.0,
        "age": 19.0,
        "fitness_level": "competitive",
        "performance_metrics": [
            {"key": "explosive-power", "label": "Explosive Power", "value": 92, "unit": "/100"},
            {"key": "strength", "label": "Strength", "value": 85, "unit": "/100"},
            {"key": "balance", "label": "Balance", "value": 88, "unit": "/100"},
            {"key": "agility", "label": "Agility", "value": 90, "unit": "/100"},
            {"key": "coordination", "label": "Coordination", "value": 89, "unit": "/100"},
        ],
    }
    response = client.post("/api/assessments/comprehensive-talent-report", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["primary_sport"] in ["Basketball", "Volleyball", "Football", "Tennis", "Badminton", "Cricket"]
    assert data["top_score"] >= 80
    assert len(data["sport_scores"]) == 6
    assert "talent_report" in data
    assert "practice_roadmap" in data["talent_report"]
    assert len(data["talent_report"]["practice_roadmap"]) == 4
    assert len(data["talent_report"]["developmental_drills"]) == 3

def test_save_and_retrieve_talent_report_api():
    report_data = {
        "status": "success",
        "primary_sport": "Basketball",
        "top_score": 95,
        "sport_scores": [{"sport": "Basketball", "score": 95}],
        "summary": "Elite vertical power profile.",
    }
    payload = {
        "user_id": "test-user-persist-1",
        "report_data": report_data,
        "primary_sport": "Basketball",
        "compatibility_score": 95.0,
        "is_complete": True,
    }
    # 1. Save report
    save_res = client.post("/api/assessments/talent-report/save", json=payload)
    assert save_res.status_code == 200
    save_data = save_res.json()
    assert save_data["status"] == "saved"
    assert save_data["user_id"] == "test-user-persist-1"

    # 2. Retrieve saved report
    get_res = client.get("/api/assessments/talent-report/test-user-persist-1")
    assert get_res.status_code == 200
    retrieved = get_res.json()
    assert retrieved["status"] == "success"
    assert retrieved["user_id"] == "test-user-persist-1"
    assert retrieved["primary_sport"] == "Basketball"
    assert retrieved["report"]["top_score"] == 95

def test_comprehensive_talent_report_auto_persists_user():
    payload = {
        "user_id": "athlete-uuid-999",
        "athlete_name": "Elena Rostova",
        "athlete_height_cm": 182.0,
        "age": 21.0,
        "fitness_level": "competitive",
        "performance_metrics": [
            {"key": "explosive-power", "label": "Explosive Power", "value": 90, "unit": "/100"},
            {"key": "strength", "label": "Strength", "value": 84, "unit": "/100"},
            {"key": "balance", "label": "Balance", "value": 86, "unit": "/100"},
            {"key": "agility", "label": "Agility", "value": 88, "unit": "/100"},
            {"key": "coordination", "label": "Coordination", "value": 87, "unit": "/100"},
        ],
    }
    response = client.post("/api/assessments/comprehensive-talent-report", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["stored_in_db"] is True
    assert data["user_id"] == "athlete-uuid-999"

    # Verify retrieval
    get_res = client.get("/api/assessments/talent-report/athlete-uuid-999")
    assert get_res.status_code == 200
    retrieved = get_res.json()
    assert retrieved["user_id"] == "athlete-uuid-999"
    assert retrieved["primary_sport"] == data["primary_sport"]

