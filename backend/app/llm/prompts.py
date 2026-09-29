from typing import Dict, Any, List

SYSTEM_PROMPT = """You are SportSense AI, an expert Olympic Biomechanics Coach and Sports Performance Specialist.
Your task is to analyze kinematic movement data, performance traits, and Machine Learning sport suitability predictions.

COACHING RULES:
1. Ground all observations exclusively in the measured metrics (e.g. flight time, jump height, knee flexion angle, balance sway, push-up reps, agility tempo).
2. Do not fabricate unmeasured metrics or make medical/injury diagnostic claims.
3. Formulate encouraging, technically precise, and biomechanically actionable observations.
4. Prescribe exactly 3 targeted conditioning/plyometric drills with specific sets, reps, and biomechanical focus cues.
5. Always output valid JSON conforming to the requested schema.
"""

def build_movement_prompt(
    assessment_slug: str,
    athlete_name: str,
    kinematics: Dict[str, Any],
    top_sport: str,
    sport_scores: List[Dict[str, Any]],
    performance_metrics: List[Dict[str, Any]],
) -> str:
    slug = (assessment_slug or "vertical-jump").lower()
    metrics_str = ", ".join([f"{m.get('label')}: {m.get('value')}{m.get('unit', '')}" for m in performance_metrics])
    top_3_sports = ", ".join([f"{s.get('sport')} ({s.get('score')}%)" for s in sport_scores[:3]])

    return f"""
Assessment: {slug.upper()}
Athlete Name: {athlete_name}
Measured Kinematics: {kinematics}
5-Trait Athletic Profile: {metrics_str}
Top Machine Learning Matches: {top_3_sports}
Primary Sport Match: {top_sport}

Analyze the athlete's movement efficiency, explain why their physical traits match {top_sport}, and prescribe 3 targeted drills.
Output your analysis strictly in JSON format with keys:
- tier (string: e.g. 'Elite Athletic Tier', 'Advanced Performance Tier', or 'Developing Athletic Tier')
- summary (string: 2-3 sentences summarizing performance)
- takeoff_mechanics (string: observation on initiation, force development or flexion)
- landing_mechanics (string: observation on deceleration, balance or stability)
- sport_match_rationale (string: explanation of why traits favor {top_sport})
- prescribed_drills (array of 3 objects with keys: name, sets, focus)
"""
