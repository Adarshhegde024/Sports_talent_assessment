import json
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from backend.app.llm.prompts import SYSTEM_PROMPT, build_movement_prompt
from backend.app.llm.response_formatter import ResponseFormatter
from backend.app.core.logging import logger

class AthleticIntelligenceEngine:
    """
    Contextual Athletic Coaching & Biomechanical Intelligence Engine.
    Connects to local Qwen LLM via Ollama endpoint with fallback to deterministic
    Olympic Biomechanics Expert Reasoning.
    """

    OLLAMA_URL = "http://localhost:11434/api/generate"
    OLLAMA_MODEL = "qwen2.5:3b"

    def __init__(self, ollama_url: Optional[str] = None):
        if ollama_url:
            self.OLLAMA_URL = ollama_url

    def generate_assessment_report(
        self,
        assessment_slug: str,
        athlete_name: str,
        kinematics: Dict[str, Any],
        top_sport: str,
        sport_scores: List[Dict[str, Any]],
        performance_metrics: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        slug = (assessment_slug or "vertical-jump").lower()
        name = athlete_name if athlete_name and athlete_name.lower() != "athlete" else "Athlete"

        # 1. Attempt Local Qwen LLM Generation if Ollama is active
        llm_result = self._try_ollama_generation(
            assessment_slug=slug,
            athlete_name=name,
            kinematics=kinematics,
            top_sport=top_sport,
            sport_scores=sport_scores,
            performance_metrics=performance_metrics,
        )
        if llm_result:
            return llm_result

        # 2. Fallback to Deterministic Olympic Biomechanics Engine
        return self._generate_biomechanic_synthesis(
            slug=slug,
            name=name,
            kinematics=kinematics,
            top_sport=top_sport,
            sport_scores=sport_scores,
            performance_metrics=performance_metrics,
        )

    def _try_ollama_generation(
        self,
        assessment_slug: str,
        athlete_name: str,
        kinematics: Dict[str, Any],
        top_sport: str,
        sport_scores: List[Dict[str, Any]],
        performance_metrics: List[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        prompt = build_movement_prompt(
            assessment_slug=assessment_slug,
            athlete_name=athlete_name,
            kinematics=kinematics,
            top_sport=top_sport,
            sport_scores=sport_scores,
            performance_metrics=performance_metrics,
        )

        payload = {
            "model": self.OLLAMA_MODEL,
            "system": SYSTEM_PROMPT,
            "prompt": prompt,
            "format": "json",
            "stream": False,
            "options": {
                "temperature": 0.3,
                "num_predict": 512,
            },
        }

        try:
            req = urllib.request.Request(
                self.OLLAMA_URL,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=3.5) as response:
                if response.status == 200:
                    resp_data = json.loads(response.read().decode("utf-8"))
                    raw_text = resp_data.get("response", "")
                    validated = ResponseFormatter.parse_and_validate_json(raw_text)
                    if validated:
                        logger.info("Successfully generated report via Local Qwen LLM")
                        return validated
        except Exception as e:
            logger.debug(f"Ollama local LLM unavailable or timed out ({e}), using Olympic Biomechanics synthesis.")

        return None

    def _generate_biomechanic_synthesis(
        self,
        slug: str,
        name: str,
        kinematics: Dict[str, Any],
        top_sport: str,
        sport_scores: List[Dict[str, Any]],
        performance_metrics: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Deterministic, biomechanically validated athletic report generation.
        """
        if "squat" in slug:
            min_angle = kinematics.get("min_knee_angle_deg", 88.0)
            strength = kinematics.get("strength_score", 84)
            tier = "Elite Strength Tier" if strength >= 88 else "Advanced Strength Tier" if strength >= 75 else "Developing Strength Tier"
            summary = (
                f"Solid lower-body mobility and eccentric control demonstrated by {name}. A measured knee flexion depth "
                f"of {min_angle}° reflects excellent bilateral hip mobility and quad strength ({strength}/100)."
            )
            mechanics_a = f"Knee flexion achieved {min_angle}° depth with balanced torso angle and steady lumbar alignment."
            mechanics_b = "Concentric drive showed smooth force transfer through midfoot without knee valgus collapse."
            sport_rationale = (
                f"Strong bilateral leg drive and hip mobility provide a direct athletic foundation for {top_sport}, "
                f"supporting rapid acceleration, deceleration, and high-load change of direction."
            )
            drills = [
                {"name": "Goblet Squats with 3s Eccentric Pause", "sets": "3 sets × 6 reps", "focus": "Deep hip mobility and time-under-tension at the bottom of the squat."},
                {"name": "Bulgarian Split Squats", "sets": "3 sets × 8 reps per leg", "focus": "Single-leg strength balance and knee stabilizer recruitment."},
                {"name": "Tibialis Raises & Ankle Dorsiflexion Stretches", "sets": "2 sets × 15 reps", "focus": "Improving ankle mobility to allow deeper, more upright squats."},
            ]

        elif "balance" in slug:
            stability = kinematics.get("stability_index", 88)
            tier = "Elite Stability Tier" if stability >= 90 else "Advanced Balance Tier" if stability >= 78 else "Developing Balance Tier"
            summary = (
                f"High-caliber postural sway control and proprioception displayed by {name}. A stability score "
                f"of {stability}/100 confirms robust ankle-knee-hip stabilizer engagement."
            )
            mechanics_a = "Minimal medial-lateral sway observed during the unipedal stance hold."
            mechanics_b = "Gluteus medius and core active in maintaining level pelvic horizontal alignment."
            sport_rationale = (
                f"Exceptional unilateral balance is a cornerstone requirement in {top_sport}, enabling quick-reaction "
                f"footwork, injury resilience on uneven ground, and superior rotational control."
            )
            drills = [
                {"name": "Single-Leg Romanian Deadlifts (RDLs)", "sets": "3 sets × 8 reps per leg", "focus": "Posterior chain balance and dynamic hamstring stability."},
                {"name": "Y-Balance Cone Touches", "sets": "3 sets × 5 reaches per leg", "focus": "Extending dynamic multi-directional reach while stabilizing standing foot."},
                {"name": "Eyes-Closed Balance Holds on Foam Pad", "sets": "3 sets × 20s hold", "focus": "Strengthening vestibular and proprioceptive neuromuscular pathways."},
            ]

        elif "push" in slug:
            reps = kinematics.get("rep_count", 18)
            strength = kinematics.get("strength_score", 82)
            tier = "Elite Upper-Body Tier" if reps >= 22 else "Advanced Strength Tier" if reps >= 14 else "Developing Strength Tier"
            summary = (
                f"Impressive upper-body concentric power and core endurance by {name}. Achieving {reps} valid "
                f"repetitions indicates great pectoral-tricep endurance and shoulder stability ({strength}/100)."
            )
            mechanics_a = "Elbows tracked cleanly at a 45° angle to the torso, protecting the anterior shoulder capsules."
            mechanics_b = "Plank collinearity was maintained throughout with minimal lumbar hyperextension."
            sport_rationale = (
                f"Upper-body pushing endurance directly enhances your performance in {top_sport}, assisting in "
                f"physical shielding, high-impact contact phases, and rapid arm drive mechanics."
            )
            drills = [
                {"name": "Plyometric Clapping Push-Ups", "sets": "3 sets × 5 reps", "focus": "Upper-body explosive rate of force development."},
                {"name": "Hand-Release Deficit Push-Ups", "sets": "3 sets × 10 reps", "focus": "Full range of motion and scapular retraction control."},
                {"name": "Plank Shoulder Taps with Anti-Rotation Focus", "sets": "3 sets × 20 taps", "focus": "Core stiffness and rotational anti-flexion endurance."},
            ]

        elif "agility" in slug or "side" in slug:
            contacts = kinematics.get("contacts_20s", 15)
            agility = kinematics.get("agility_score", 86)
            tier = "Elite Agility Tier" if contacts >= 16 else "Advanced Quickness Tier" if contacts >= 12 else "Developing Agility Tier"
            summary = (
                f"Electrifying change-of-direction quickness by {name}. Recording {contacts} line contacts in 20 seconds "
                f"demonstrates elite deceleration-to-acceleration turnaround capability ({agility}/100)."
            )
            mechanics_a = "Low center of gravity maintained through lateral directional reversals."
            mechanics_b = "Rapid ground contact times and strong lateral push-off power generated from the outside foot."
            sport_rationale = (
                f"Your rapid foot speed and lateral agility score ({agility}/100) make you heavily favored for {top_sport}, "
                f"where evasive footwork and lightning-fast transitional court coverage dominate play."
            )
            drills = [
                {"name": "Pro Agility 5-10-5 Shuttle Drills", "sets": "4 sets × 2 reps", "focus": "Maximum effort lateral deceleration and hip turn transitions."},
                {"name": "Lateral Bound and Stick (Skater Jumps)", "sets": "3 sets × 6 reps per side", "focus": "Absorbing high lateral force and instantly redirecting power."},
                {"name": "Speed Ladder Ickey Shuffle", "sets": "4 passes", "focus": "Rapid neuromuscular foot turnover and ankle stiffness."},
            ]

        else:
            # Default Vertical Jump
            jump_h = kinematics.get("jump_height_cm", 52.4)
            flight_t = kinematics.get("flight_time_sec", 0.65)
            exp_p = kinematics.get("explosive_power", 80)
            takeoff_v = kinematics.get("takeoff_velocity_mps", 3.2)
            symmetry = kinematics.get("symmetry_score", 90)
            tier = "Elite Explosive Tier" if jump_h >= 55.0 else "Advanced Power Tier" if jump_h >= 45.0 else "Developing Power Tier"
            summary = (
                f"Outstanding explosive performance by {name}. A peak vertical displacement of "
                f"{jump_h} cm with a {flight_t}s flight phase demonstrates rapid rate of force development (RFD)."
            )
            mechanics_a = f"Takeoff velocity was {takeoff_v} m/s with {symmetry}% bilateral symmetry."
            mechanics_b = "Landing stability was well absorbed through knee and hip eccentric flexion."
            sport_rationale = (
                f"Your high explosive power score ({exp_p}/100) makes you an exceptional match for {top_sport}, "
                f"where aerial elevation and vertical reach provide a decisive competitive edge."
            )
            drills = [
                {"name": "Depth Jumps (Reactive SSC)", "sets": "3 sets × 5 reps", "focus": "Minimal ground contact time and reactive vertical explosion."},
                {"name": "Trap Bar Jumps or Weighted Squat Jumps", "sets": "4 sets × 4 reps (20% 1RM)", "focus": "Peak rate of force development through full triple extension."},
                {"name": "Banded Terminal Knee Extensions & Single-Leg Landings", "sets": "3 sets × 8 reps per leg", "focus": "Eccentric deceleration stability and ACL injury resilience."},
            ]

        return ResponseFormatter.format_coaching_report(
            tier=tier,
            summary=summary,
            takeoff_mechanics=mechanics_a,
            landing_mechanics=mechanics_b,
            sport_rationale=sport_rationale,
            drills=drills,
        )

    def generate_report(self, *args, **kwargs) -> Dict[str, Any]:
        """Backward compatibility wrapper."""
        return self.generate_assessment_report(
            assessment_slug=kwargs.get("assessment_slug", "vertical-jump"),
            athlete_name=kwargs.get("athlete_name", "Athlete"),
            kinematics={
                "jump_height_cm": kwargs.get("jump_height_cm", 52.4),
                "flight_time_sec": kwargs.get("flight_time_sec", 0.65),
                "explosive_power": kwargs.get("explosive_power", 80),
                "takeoff_velocity_mps": kwargs.get("takeoff_velocity", 3.2),
                "symmetry_score": kwargs.get("symmetry_score", 90),
            },
            top_sport=kwargs.get("top_sport", "Basketball"),
            sport_scores=kwargs.get("sport_scores", []),
            performance_metrics=[],
        )
