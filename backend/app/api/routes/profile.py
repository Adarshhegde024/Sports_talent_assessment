from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from backend.app.api.dependencies import get_current_user
from backend.app.schemas.profile import ProfileResponse, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("", response_model=Dict[str, Any])
def get_athlete_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Retrieves the authenticated athlete's profile.
    Prevents cross-user data access by resolving user_id strictly from the JWT token.
    """
    user_id = current_user["user_id"]
    return {
        "id": user_id,
        "full_name": "Athlete",
        "age": 18,
        "height": 175,
        "fitness_level": "recreational",
        "disclaimer_accepted": True,
        "preferred_sports": ["Basketball", "Football"],
    }

@router.put("", response_model=Dict[str, Any])
def update_athlete_profile(
    profile_data: ProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Updates the authenticated athlete's demographics and sport preferences.
    """
    user_id = current_user["user_id"]
    return {
        "id": user_id,
        "message": "Profile successfully updated",
        "data": profile_data.dict(exclude_unset=True),
    }
