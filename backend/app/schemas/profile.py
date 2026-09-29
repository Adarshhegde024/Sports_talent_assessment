from typing import Optional, List
from pydantic import BaseModel, Field

class ProfileBase(BaseModel):
    full_name: str = Field(..., description="Athlete full name")
    age: Optional[int] = Field(None, ge=5, le=120, description="Age in years")
    height: Optional[int] = Field(None, ge=50, le=260, description="Height in cm")
    fitness_level: Optional[str] = Field("recreational", description="beginner, recreational, trained, competitive")
    disclaimer_accepted: Optional[bool] = False
    preferred_sports: Optional[List[str]] = Field(default_factory=list)

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    height: Optional[int] = None
    fitness_level: Optional[str] = None
    disclaimer_accepted: Optional[bool] = None
    preferred_sports: Optional[List[str]] = None

class ProfileResponse(ProfileBase):
    id: str
