import json
from typing import Dict, Any, List, Optional
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from backend.app.llm.inference import AthleticIntelligenceEngine

router = APIRouter(prefix="/coach", tags=["Coach Intelligence & LLM"])
engine = AthleticIntelligenceEngine()

class CoachInsightRequest(BaseModel):
    assessment_slug: Optional[str] = "vertical-jump"
    athlete_name: Optional[str] = "Athlete"
    kinematics: Optional[Dict[str, Any]] = None
    top_sport: Optional[str] = "Basketball"
    sport_scores: Optional[List[Dict[str, Any]]] = None
    performance_metrics: Optional[List[Dict[str, Any]]] = None

@router.get("/status")
def get_coach_status():
    """
    Checks the availability of the local Ollama LLM instance (qwen2.5:3b / qwen:4b)
    and verifies the active mode (ollama_live or deterministic_fallback).
    """
    return engine.get_engine_status()

@router.post("/generate")
def generate_coach_report(request: CoachInsightRequest):
    """
    Generates a structured athletic coaching assessment report.
    Uses local Qwen LLM if Ollama is running; otherwise seamlessly falls back
    to the calibrated Olympic Biomechanics Engine.
    """
    return engine.generate_assessment_report(
        assessment_slug=request.assessment_slug or "vertical-jump",
        athlete_name=request.athlete_name or "Athlete",
        kinematics=request.kinematics or {},
        top_sport=request.top_sport or "Basketball",
        sport_scores=request.sport_scores or [],
        performance_metrics=request.performance_metrics or [],
    )

@router.post("/stream")
async def stream_coach_feedback(request: CoachInsightRequest):
    """
    Real-time Server-Sent Events (SSE) streaming endpoint for live coaching insights.
    Streams token-by-token from local Qwen LLM when Ollama is running,
    or streams progressive deterministic biomechanical observations on fallback.
    """
    async def sse_event_generator():
        async for event in engine.stream_coaching_report_async(
            assessment_slug=request.assessment_slug or "vertical-jump",
            athlete_name=request.athlete_name or "Athlete",
            kinematics=request.kinematics or {},
            top_sport=request.top_sport or "Basketball",
            sport_scores=request.sport_scores or [],
            performance_metrics=request.performance_metrics or [],
        ):
            yield f"data: {json.dumps(event)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

class ChatMessage(BaseModel):
    role: str
    content: str

class CoachChatRequest(BaseModel):
    athlete_name: Optional[str] = "Athlete"
    athlete_profile: Optional[Dict[str, Any]] = None
    current_assessment: Optional[Dict[str, Any]] = None
    history_summary: Optional[List[Dict[str, Any]]] = None
    messages: List[ChatMessage]

@router.post("/chat")
async def chat_with_coach(request: CoachChatRequest):
    """
    Real-time streaming conversational chat endpoint for Coach Qwen.
    Streams tokens via Server-Sent Events (SSE) with full athlete context.
    """
    messages_payload = [{"role": m.role, "content": m.content} for m in request.messages]

    async def sse_chat_generator():
        async for event in engine.stream_chat_response_async(
            messages=messages_payload,
            athlete_name=request.athlete_name or "Athlete",
            athlete_profile=request.athlete_profile,
            current_assessment=request.current_assessment,
            history_summary=request.history_summary,
        ):
            yield f"data: {json.dumps(event)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        sse_chat_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

