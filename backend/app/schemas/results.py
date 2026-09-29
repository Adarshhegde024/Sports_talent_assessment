from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class MetricItem(BaseModel):
    key: str
    label: str
    value: int
    unit: str

class SportScore(BaseModel):
    sport: str
    score: int

class HeadlineMetric(BaseModel):
    label: str
    value: str
    unit: str

class AttemptSummary(BaseModel):
    label: str
    value: str
    unit: str

class AssessmentResultResponse(BaseModel):
    id: str
    assessment_id: str
    assessment_name: str
    date: str
    headline: HeadlineMetric
    average: HeadlineMetric
    attempts: List[AttemptSummary]
    metrics: List[MetricItem]
    suitability: List[SportScore]
    explanation: str
    is_sample: bool = False
