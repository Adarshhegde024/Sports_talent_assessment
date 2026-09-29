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

def build_comprehensive_talent_prompt(
    athlete_name: str,
    athlete_height_cm: float,
    age: float,
    fitness_level: str,
    primary_sport: str,
    match_score: int,
    sport_scores: List[Dict[str, Any]],
    performance_metrics: List[Dict[str, Any]],
) -> str:
    metrics_str = ", ".join([f"{m.get('label')}: {m.get('value')}{m.get('unit', '')}" for m in performance_metrics])
    ranked_sports_str = ", ".join([f"{s.get('sport')} ({s.get('score')}%)" for s in sport_scores])

    return f"""
Comprehensive 5-Assessment Talent Discovery Synthesis:
Athlete Name: {athlete_name}
Height: {athlete_height_cm} cm | Age: {age} | Fitness Level: {fitness_level}
5 Core Trait Profile: {metrics_str}
ML Multi-Sport Suitability Ranking: {ranked_sports_str}
Definitive Primary Sport Recommendation: {primary_sport} ({match_score}% Match)

Synthesize a comprehensive athletic talent discovery report explaining why this athlete should focus on and practice {primary_sport} to achieve excellence, and outline a structured 4-week practice roadmap.
Output your analysis strictly in JSON format with keys:
- tier (string: e.g. 'Olympic Developmental Tier', 'National Collegiate Prospect', or 'High-Performance Athlete')
- primary_sport_recommendation (string: name of the top sport)
- match_score (integer: overall fit percentage)
- summary (string: 3-4 sentences synthesizing how their combination of explosive power, strength, agility, balance, and coordination makes them best suited for this sport)
- biomechanical_advantages (array of 3-4 strings detailing physical strengths)
- practice_roadmap (array of 4 objects with keys: week, focus, weekly_drills)
- developmental_drills (array of 3 objects with keys: name, sets, focus)
"""
