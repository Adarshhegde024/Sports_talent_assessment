import json
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class PrescribedDrill(BaseModel):
    name: str
    sets: str
    focus: str

class CoachingReportSchema(BaseModel):
    tier: str = Field(default="Advanced Athletic Tier")
    summary: str
    takeoff_mechanics: str
    landing_mechanics: str
    sport_match_rationale: str
    prescribed_drills: List[PrescribedDrill]

class ResponseFormatter:
    """
    Validates and formats structured output from the athletic reasoning engine.
    """

    @staticmethod
    def format_coaching_report(
        tier: str,
        summary: str,
        takeoff_mechanics: str,
        landing_mechanics: str,
        sport_rationale: str,
        drills: List[Dict[str, str]],
    ) -> Dict[str, Any]:
        return {
            "tier": tier,
            "summary": summary,
            "takeoff_mechanics": takeoff_mechanics,
            "landing_mechanics": landing_mechanics,
            "sport_match_rationale": sport_rationale,
            "prescribed_drills": drills,
        }

    @staticmethod
    def parse_and_validate_json(raw_text: str) -> Optional[Dict[str, Any]]:
        """
        Extracts and validates JSON from raw LLM output text.
        """
        try:
            clean = raw_text.strip()
            if "```json" in clean:
                clean = clean.split("```json")[1].split("```")[0].strip()
            elif "```" in clean:
                clean = clean.split("```")[1].split("```")[0].strip()

            parsed = json.loads(clean)
            validated = CoachingReportSchema(**parsed)
            return validated.model_dump()
        except Exception:
            return None
