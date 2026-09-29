import pytest
from backend.app.vision.vertical_jump import VerticalJumpAnalyzer

def test_vertical_jump_physics_calculation():
    analyzer = VerticalJumpAnalyzer()
    # Test kinematic physics generator
    kinematics = analyzer.generate_calibrated_jump(athlete_height_cm=178.0, attempt_idx=2)
    
    assert "jump_height_cm" in kinematics
    assert 30.0 <= kinematics["jump_height_cm"] <= 85.0
    assert 0.35 <= kinematics["flight_time_sec"] <= 0.85
    assert kinematics["takeoff_velocity_mps"] > 0
    assert 40 <= kinematics["explosive_power"] <= 100
    assert 70 <= kinematics["symmetry_score"] <= 100
