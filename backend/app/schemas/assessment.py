from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AssessmentBase(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    is_active: bool = True

class AssessmentRunCreate(BaseModel):
    assessment_id: str

class AssessmentRunResponse(BaseModel):
    id: str
    user_id: str
    assessment_id: str
    status: str
    created_at: str
    completed_at: Optional[str] = None

class AssessmentStatusResponse(BaseModel):
    run_id: str
    status: str
    progress: int = Field(100, ge=0, le=100)
    message: str
