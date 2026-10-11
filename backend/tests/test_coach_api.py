import json
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.llm.inference import AthleticIntelligenceEngine

client = TestClient(app)

def test_coach_status_endpoint():
    response = client.get("/api/coach/status")
    assert response.status_code == 200
    data = response.json()
    assert "ollama_online" in data
    assert "mode" in data
    assert data["mode"] in ["ollama_live", "deterministic_fallback"]
    assert "endpoint" in data

def test_coach_generate_endpoint():
    payload = {
        "assessment_slug": "squat",
        "athlete_name": "Adarsh",
        "kinematics": {"min_knee_angle_deg": 84.0, "strength_score": 88},
        "top_sport": "Football",
        "sport_scores": [{"sport": "Football", "score": 92}],
        "performance_metrics": [{"key": "strength", "label": "Strength", "value": 88, "unit": "/100"}],
    }
    response = client.post("/api/coach/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "tier" in data
    assert "summary" in data
    assert "Adarsh" in data["summary"]
    assert "takeoff_mechanics" in data
    assert "landing_mechanics" in data
    assert "sport_match_rationale" in data
    assert "prescribed_drills" in data
    assert len(data["prescribed_drills"]) >= 3

def test_coach_stream_sse_endpoint():
    payload = {
        "assessment_slug": "vertical-jump",
        "athlete_name": "Adarsh",
        "kinematics": {"jump_height_cm": 55.0, "explosive_power": 88},
        "top_sport": "Basketball",
        "sport_scores": [{"sport": "Basketball", "score": 96}],
        "performance_metrics": [{"key": "explosive-power", "label": "Explosive Power", "value": 88, "unit": "/100"}],
    }
    response = client.post("/api/coach/stream", json=payload)
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    
    # Read SSE lines
    lines = [line.strip() for line in response.text.split("\n") if line.strip()]
    assert any("[DONE]" in line for line in lines)
    
    # Check that events contain status, tokens, and complete
    events = []
    for line in lines:
        if line.startswith("data: ") and not line.startswith("data: [DONE]"):
            raw_json = line[6:]
            try:
                events.append(json.loads(raw_json))
            except json.JSONDecodeError:
                pass

    assert len(events) > 0
    event_types = [e.get("type") for e in events]
    assert "status" in event_types
    assert "token" in event_types
    assert "complete" in event_types

    # Ensure complete event has full report
    complete_event = next(e for e in events if e.get("type") == "complete")
    assert "report" in complete_event
    assert "tier" in complete_event["report"]
    assert "prescribed_drills" in complete_event["report"]

def test_coach_chat_endpoint():
    payload = {
        "athlete_name": "Adhi",
        "current_assessment": {
            "slug": "vertical-jump",
            "name": "Vertical Jump",
            "headlineValue": 52.4,
            "headlineUnit": "cm",
            "topSport": "Volleyball",
        },
        "messages": [
            {"role": "user", "content": "How do I add 5 cm to my jump?"}
        ],
    }
    response = client.post("/api/coach/chat", json=payload)
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    assert len(response.text) > 0
    assert "[DONE]" in response.text
    assert "Vertical Jump" in response.text or "Jump" in response.text

def test_coach_chat_how_is_my_form_vertical_jump():
    """Verify that asking 'how is my form' on vertical jump gives actual form analysis instead of greeting."""
    payload = {
        "athlete_name": "Adarsh Hegde",
        "current_assessment": {
            "slug": "vertical-jump",
            "name": "Vertical Jump",
            "headlineValue": 52.4,
            "headlineUnit": "cm",
        },
        "messages": [
            {"role": "user", "content": "how is my form"}
        ],
    }
    response = client.post("/api/coach/chat", json=payload)
    assert response.status_code == 200
    text = response.text
    assert "[DONE]" in text
    # Must NOT be the repetitive menu
    assert "What would you like to focus on today?" not in text
    events = [json.loads(line[6:]) for line in text.split("\n") if line.startswith("data: ") and not line.startswith("data: [DONE]")]
    full_message = "".join(e.get("content", "") for e in events if e.get("type") == "token")
    assert "Form Analysis" in full_message or "Triple Extension" in full_message
    assert "52.4" in full_message


def test_coach_chat_how_is_my_form_squat():
    """Verify that asking 'how is my form' on squat gives squat-specific form analysis."""
    payload = {
        "athlete_name": "Adarsh Hegde",
        "current_assessment": {
            "slug": "squat",
            "name": "Squat",
            "headlineValue": 85.0,
            "headlineUnit": "°",
        },
        "messages": [
            {"role": "user", "content": "how is my form"}
        ],
    }
    response = client.post("/api/coach/chat", json=payload)
    assert response.status_code == 200
    text = response.text
    assert "[DONE]" in text
    assert "What would you like to focus on today?" not in text
    assert "Squat" in text
    assert "Valgus" in text or "Depth" in text

def test_coach_chat_how_is_my_form_from_history():
    """Verify that asking 'how is my form' with history_summary gives personalized form critique."""
    payload = {
        "athlete_name": "Adarsh Hegde",
        "history_summary": [
            {
                "assessmentId": "squat",
                "assessmentName": "Squat",
                "val": 82.5,
                "unit": "°",
                "date": "Today",
            }
        ],
        "messages": [
            {"role": "user", "content": "how is my form"}
        ],
    }
    response = client.post("/api/coach/chat", json=payload)
    assert response.status_code == 200
    text = response.text
    assert "[DONE]" in text
    assert "What would you like to focus on today?" not in text
    assert "Squat" in text or "Form" in text

def test_coach_chat_weakness_and_workout_questions():
    """Verify answers to 'what are my weaknesses' and 'give me a workout routine'."""
    # Weakness
    resp1 = client.post("/api/coach/chat", json={
        "athlete_name": "Adarsh Hegde",
        "messages": [{"role": "user", "content": "what are my weaknesses?"}]
    })
    assert resp1.status_code == 200
    assert "Bottleneck" in resp1.text or "Weak" in resp1.text

    # Workout plan
    resp2 = client.post("/api/coach/chat", json={
        "athlete_name": "Adarsh Hegde",
        "messages": [{"role": "user", "content": "give me a 7-day workout plan"}]
    })
    assert resp2.status_code == 200
    assert "Monday" in resp2.text and "Friday" in resp2.text

