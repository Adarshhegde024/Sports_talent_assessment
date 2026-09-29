import pytest
from backend.app.ml.model_registry import ModelRegistry

def test_model_registry_prediction():
    registry = ModelRegistry()
    results = registry.predict_suitability(
        jump_height_cm=56.0,
        flight_time_sec=0.675,
        explosive_power=86,
        takeoff_velocity=3.31,
        athlete_height_cm=185.0,
        age=20.0,
        symmetry_score=92.0,
    )
    
    assert "top_match" in results
    assert "sport_scores" in results
    assert len(results["sport_scores"]) == 6
    assert results["top_score"] >= 45
    # Verify basketball/volleyball correlation for tall high jumping athlete
    assert results["top_match"] in ["Basketball", "Volleyball", "Football"]
