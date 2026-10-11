import datetime
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_live_squat_retake_updates_previous_results():
    user_id = "athlete-retake-verification-1"
    
    # 1. First Run: Baseline Squat Assessment
    initial_res = client.post(
        "/api/assessments/analyze-movement",
        data={
            "assessment_slug": "squat",
            "athlete_name": "Rohan Patel",
            "athlete_height_cm": 176.0,
            "age": 19.0,
            "attempt_number": 1,
        },
    )
    assert initial_res.status_code == 200
    initial_data = initial_res.json()
    assert initial_data["assessment_slug"] == "squat"
    initial_metrics = initial_data["performance_metrics"]

    # Initial Talent Report Generation & Persistence
    report_res_1 = client.post(
        "/api/assessments/comprehensive-talent-report",
        json={
            "user_id": user_id,
            "athlete_name": "Rohan Patel",
            "athlete_height_cm": 176.0,
            "age": 19.0,
            "fitness_level": "recreational",
            "performance_metrics": initial_metrics,
        },
    )
    assert report_res_1.status_code == 200
    rep_1 = report_res_1.json()
    assert rep_1["stored_in_db"] is True
    assert rep_1["user_id"] == user_id
    
    # Retrieve from user database store
    db_res_1 = client.get(f"/api/assessments/talent-report/{user_id}")
    assert db_res_1.status_code == 200
    db_data_1 = db_res_1.json()
    timestamp_1 = db_data_1["updated_at"]

    # 2. Retake Run: Athlete re-takes Squat with new video / deeper attempt
    # Deeper knee flexion produces higher strength score (e.g., 94 vs initial)
    updated_metrics = [
        {"key": "explosive-power", "label": "Explosive Power", "value": 78, "unit": "/100"},
        {"key": "strength", "label": "Strength", "value": 94, "unit": "/100"},
        {"key": "balance", "label": "Balance", "value": 85, "unit": "/100"},
        {"key": "agility", "label": "Agility", "value": 80, "unit": "/100"},
        {"key": "coordination", "label": "Coordination", "value": 86, "unit": "/100"},
    ]

    report_res_2 = client.post(
        "/api/assessments/comprehensive-talent-report",
        json={
            "user_id": user_id,
            "athlete_name": "Rohan Patel",
            "athlete_height_cm": 176.0,
            "age": 19.0,
            "fitness_level": "competitive",
            "performance_metrics": updated_metrics,
        },
    )
    assert report_res_2.status_code == 200
    rep_2 = report_res_2.json()
    assert rep_2["stored_in_db"] is True

    # 3. Verify Database Store Updated
    db_res_2 = client.get(f"/api/assessments/talent-report/{user_id}")
    assert db_res_2.status_code == 200
    db_data_2 = db_res_2.json()
    timestamp_2 = db_data_2["updated_at"]

    # The timestamp must be updated and new strength result must be 94
    assert timestamp_2 >= timestamp_1
    report_metrics = db_data_2["report"]["performance_metrics"]
    strength_metric = next(m for m in report_metrics if m["key"] == "strength")
    assert strength_metric["value"] == 94, "Previous strength result was not updated with new retake result!"


def test_live_all_5_assessments_retake_updates_talent_report():
    user_id = "athlete-battery-retake-2"
    
    # Dataset A (Initial Battery Results - e.g. lower power profile)
    dataset_A_metrics = [
        {"key": "explosive-power", "label": "Explosive Power", "value": 70, "unit": "/100"},
        {"key": "strength", "label": "Strength", "value": 72, "unit": "/100"},
        {"key": "balance", "label": "Balance", "value": 74, "unit": "/100"},
        {"key": "agility", "label": "Agility", "value": 70, "unit": "/100"},
        {"key": "coordination", "label": "Coordination", "value": 72, "unit": "/100"},
    ]

    res_A = client.post(
        "/api/assessments/comprehensive-talent-report",
        json={
            "user_id": user_id,
            "athlete_name": "Tara Singh",
            "athlete_height_cm": 180.0,
            "age": 18.0,
            "performance_metrics": dataset_A_metrics,
        },
    )
    assert res_A.status_code == 200
    data_A = res_A.json()
    score_A = data_A["top_score"]

    # Dataset B (Retaking all 5 assessments with new videos - e.g. peak trained power profile)
    dataset_B_metrics = [
        {"key": "explosive-power", "label": "Explosive Power", "value": 96, "unit": "/100"},
        {"key": "strength", "label": "Strength", "value": 91, "unit": "/100"},
        {"key": "balance", "label": "Balance", "value": 89, "unit": "/100"},
        {"key": "agility", "label": "Agility", "value": 94, "unit": "/100"},
        {"key": "coordination", "label": "Coordination", "value": 93, "unit": "/100"},
    ]

    res_B = client.post(
        "/api/assessments/comprehensive-talent-report",
        json={
            "user_id": user_id,
            "athlete_name": "Tara Singh",
            "athlete_height_cm": 180.0,
            "age": 18.0,
            "performance_metrics": dataset_B_metrics,
        },
    )
    assert res_B.status_code == 200
    data_B = res_B.json()
    score_B = data_B["top_score"]

    # Verify score updated significantly due to new retake dataset
    assert score_B > score_A, "Retake results did not update final talent recommendation score!"

    # Verify retrieved report from database matches Dataset B
    db_res = client.get(f"/api/assessments/talent-report/{user_id}")
    assert db_res.status_code == 200
    stored_report = db_res.json()["report"]
    stored_exp = next(m for m in stored_report["performance_metrics"] if m["key"] == "explosive-power")
    assert stored_exp["value"] == 96, "Stored database report was not updated with new retake values!"
