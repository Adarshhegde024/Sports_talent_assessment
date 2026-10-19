import os
import asyncio
import json
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional, AsyncGenerator
import httpx
from backend.app.core.config import settings
from backend.app.llm.prompts import SYSTEM_PROMPT, build_movement_prompt
from backend.app.llm.response_formatter import ResponseFormatter
from backend.app.core.logging import logger

def _get_ssl_verify():
    """Render/Linux has valid system CAs; on Windows, use False if local issuer certs missing."""
    return os.name != "nt"

class AthleticIntelligenceEngine:
    """
    Contextual Athletic Coaching & Biomechanical Intelligence Engine.
    Connects to local Qwen LLM via Ollama endpoint with fallback to deterministic
    Olympic Biomechanics Expert Reasoning.
    """

    OLLAMA_BASE_URL = "http://localhost:11434"
    OLLAMA_GENERATE_URL = "http://localhost:11434/api/generate"
    OLLAMA_TAGS_URL = "http://localhost:11434/api/tags"
    OLLAMA_MODEL = "qwen2.5:3b"

    def __init__(self, ollama_url: Optional[str] = None):
        if ollama_url:
            self.OLLAMA_BASE_URL = ollama_url.rstrip("/")
            self.OLLAMA_GENERATE_URL = f"{self.OLLAMA_BASE_URL}/api/generate"
            self.OLLAMA_TAGS_URL = f"{self.OLLAMA_BASE_URL}/api/tags"

    def get_engine_status(self) -> Dict[str, Any]:
        """
        Polls 24/7 Groq Cloud LLM and local Ollama service for running state and available models.
        """
        groq_key = os.getenv("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", "")
        groq_model = os.getenv("GROQ_MODEL") or getattr(settings, "GROQ_MODEL", "qwen/qwen3.8-27b")
        openai_key = os.getenv("OPENAI_API_KEY")

        ollama_online = False
        ollama_model = self.OLLAMA_MODEL
        qwen_detected = False
        available_models = []

        try:
            req = urllib.request.Request(self.OLLAMA_TAGS_URL, headers={"User-Agent": "SportSense-AI"})
            with urllib.request.urlopen(req, timeout=0.6) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    raw_models = data.get("models", [])
                    available_models = [m.get("name", "") for m in raw_models if isinstance(m, dict) and m.get("name")]
                    qwen_models = [m for m in available_models if "qwen" in m.lower()]
                    if qwen_models:
                        qwen_detected = True
                        ollama_model = self.OLLAMA_MODEL if any(self.OLLAMA_MODEL in qm for qm in qwen_models) else qwen_models[0]
                        self.OLLAMA_MODEL = ollama_model
                    ollama_online = True
        except Exception:
            pass

        # 24/7 Cloud LLM via Groq (Primary for cloud deployments and 24/7 availability)
        if groq_key or openai_key:
            cloud_name = f"{groq_model} (Groq Cloud)" if groq_key else "gpt-4o-mini (Cloud)"
            return {
                "ollama_online": ollama_online,
                "cloud_online": True,
                "active_model": cloud_name,
                "available_models": [groq_model] + available_models,
                "qwen_detected": True,
                "mode": "cloud_llm",
                "message": f"24/7 Live Cloud Qwen Intelligence Online via Groq ({groq_model})",
                "endpoint": "https://api.groq.com/openai/v1/chat/completions",
            }

        if ollama_online and qwen_detected:
            return {
                "ollama_online": True,
                "cloud_online": False,
                "active_model": ollama_model,
                "available_models": available_models,
                "qwen_detected": True,
                "mode": "ollama_live",
                "message": f"Local Ollama online. Active model: {ollama_model}",
                "endpoint": self.OLLAMA_GENERATE_URL,
            }

        return {
            "ollama_online": False,
            "cloud_online": False,
            "active_model": None,
            "available_models": [],
            "qwen_detected": False,
            "mode": "deterministic_fallback",
            "message": "Local Ollama server offline. Using calibrated Olympic Biomechanics Engine.",
            "setup_command": "ollama run qwen2.5:3b",
            "endpoint": self.OLLAMA_GENERATE_URL,
        }

    async def stream_coaching_report_async(
        self,
        assessment_slug: str,
        athlete_name: str,
        kinematics: Dict[str, Any],
        top_sport: str,
        sport_scores: List[Dict[str, Any]],
        performance_metrics: List[Dict[str, Any]],
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Streams coaching insights in real-time. If local Ollama is active,
        yields live tokens from Qwen LLM. Otherwise, smoothly streams deterministic
        Olympic Biomechanical expert observations with zero latency.
        """
        slug = (assessment_slug or "vertical-jump").lower()
        name = athlete_name if athlete_name and athlete_name.lower() != "athlete" else "Athlete"

        status_info = self.get_engine_status()
        is_cloud = status_info.get("mode") == "cloud_llm"
        is_ollama = status_info.get("ollama_online", False) and status_info.get("qwen_detected", False)

        # 1. Yield initial engine connection status
        yield {
            "type": "status",
            "mode": status_info.get("mode", "deterministic_fallback"),
            "active_model": status_info.get("active_model"),
            "ollama_online": status_info.get("ollama_online", False),
            "cloud_online": status_info.get("cloud_online", False),
            "assessment_slug": slug,
            "athlete_name": name,
        }

        # 2. Try streaming live from 24/7 Groq Cloud LLM if available
        groq_key = os.getenv("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", "")
        if is_cloud and groq_key:
            try:
                prompt = build_movement_prompt(
                    assessment_slug=slug,
                    athlete_name=name,
                    kinematics=kinematics,
                    top_sport=top_sport,
                    sport_scores=sport_scores,
                    performance_metrics=performance_metrics,
                )
                headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
                payload = {
                    "model": getattr(settings, "GROQ_MODEL", "qwen/qwen3.8-27b"),
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.3,
                    "max_tokens": 1024,
                }
                async with httpx.AsyncClient(timeout=15.0, verify=_get_ssl_verify()) as client:
                    resp = await client.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers)
                    if resp.status_code == 200:
                        raw_json_str = resp.json()["choices"][0]["message"]["content"]
                        validated = ResponseFormatter.parse_and_validate_json(raw_json_str)
                        if validated:
                            coaching_text = (
                                f"**{validated['tier']}**\n\n"
                                f"{validated['summary']}\n\n"
                                f"**Takeoff & Propulsion Dynamics:**\n{validated['takeoff_mechanics']}\n\n"
                                f"**Landing Deceleration & Alignment:**\n{validated['landing_mechanics']}\n\n"
                                f"**Sport Biomechanical Transfer ({top_sport}):**\n{validated['sport_match_rationale']}"
                            )
                            words = coaching_text.split(" ")
                            for i in range(0, len(words), 3):
                                chunk = " ".join(words[i : i + 3]) + " "
                                yield {"type": "token", "content": chunk}
                                await asyncio.sleep(0.01)
                            yield {"type": "complete", "report": validated}
                            return
            except Exception as exc:
                logger.warning(f"Groq coaching report error ({exc}). Falling back.")

        # 3. Try streaming live from Local Ollama if online
        if is_ollama:
            try:
                prompt = build_movement_prompt(
                    assessment_slug=slug,
                    athlete_name=name,
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
                    "stream": True,
                    "options": {
                        "temperature": 0.3,
                        "num_predict": 512,
                    },
                }

                accumulated_text = ""
                async with httpx.AsyncClient(timeout=15.0) as client:
                    async with client.stream("POST", self.OLLAMA_GENERATE_URL, json=payload) as response:
                        if response.status_code == 200:
                            async for raw_line in response.aiter_lines():
                                line = raw_line.strip()
                                if not line:
                                    continue
                                try:
                                    chunk = json.loads(line)
                                    token = chunk.get("response", "")
                                    if token:
                                        accumulated_text += token
                                        yield {"type": "token", "content": token}
                                    if chunk.get("done", False):
                                        break
                                except json.JSONDecodeError:
                                    continue

                validated = ResponseFormatter.parse_and_validate_json(accumulated_text)
                if validated:
                    yield {"type": "complete", "report": validated}
                    return
            except Exception as exc:
                logger.warning(f"Ollama streaming interrupted ({exc}). Falling back to biomechanics engine.")
                yield {
                    "type": "status",
                    "mode": "deterministic_fallback",
                    "message": "Local LLM stream completed or paused. Presenting calibrated biomechanics report.",
                }

        # 4. Deterministic Olympic Biomechanics Engine Streaming Fallback
        deterministic_report = self._generate_biomechanic_synthesis(
            slug=slug,
            name=name,
            kinematics=kinematics,
            top_sport=top_sport,
            sport_scores=sport_scores,
            performance_metrics=performance_metrics,
        )

        coaching_text = (
            f"**{deterministic_report['tier']}**\n\n"
            f"{deterministic_report['summary']}\n\n"
            f"**Takeoff & Propulsion Dynamics:**\n{deterministic_report['takeoff_mechanics']}\n\n"
            f"**Landing Deceleration & Alignment:**\n{deterministic_report['landing_mechanics']}\n\n"
            f"**Sport Biomechanical Transfer ({top_sport}):**\n{deterministic_report['sport_match_rationale']}"
        )

        words = coaching_text.split(" ")
        for i in range(0, len(words), 3):
            chunk = " ".join(words[i : i + 3]) + " "
            yield {"type": "token", "content": chunk}
            await asyncio.sleep(0.015)

        yield {"type": "complete", "report": deterministic_report}

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

        # 1. Attempt Cloud / Local Qwen LLM Generation
        llm_result = self._try_cloud_or_ollama_generation(
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

    def _try_cloud_or_ollama_generation(
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

        # Try Groq Cloud first
        groq_key = os.getenv("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", "")
        if groq_key:
            try:
                headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
                payload = {
                    "model": getattr(settings, "GROQ_MODEL", "qwen/qwen3.8-27b"),
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.3,
                    "max_tokens": 1024,
                }
                with httpx.Client(timeout=8.0, verify=_get_ssl_verify()) as client:
                    resp = client.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers)
                    if resp.status_code == 200:
                        raw_text = resp.json()["choices"][0]["message"]["content"]
                        validated = ResponseFormatter.parse_and_validate_json(raw_text)
                        if validated:
                            logger.info("Successfully generated report via 24/7 Groq Cloud Qwen LLM")
                            return validated
            except Exception as e:
                logger.debug(f"Groq cloud generation failed ({e})")

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
                self.OLLAMA_GENERATE_URL,
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

    def generate_comprehensive_talent_report(
        self,
        athlete_name: str,
        athlete_height_cm: float,
        age: float,
        fitness_level: str,
        primary_sport: str,
        match_score: int,
        sport_scores: List[Dict[str, Any]],
        performance_metrics: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        name = athlete_name if athlete_name and athlete_name.lower() != "athlete" else "Athlete"
        sport = primary_sport or "Basketball"

        metric_map = {m.get("key", ""): m.get("value", 75) for m in performance_metrics}
        exp = metric_map.get("explosive-power", 80)
        str_val = metric_map.get("strength", 82)
        bal = metric_map.get("balance", 85)
        agi = metric_map.get("agility", 84)
        coo = metric_map.get("coordination", 83)

        # Sport-specific roadmaps and advantages
        sport_configs = {
            "Basketball": {
                "why_fits": f"{name}'s combination of high explosive vertical power ({exp}/100) and rapid lateral agility ({agi}/100) paired with good kinetic chain coordination ({coo}/100) establishes an elite baseline for basketball court dominance, rim elevation, and defensive perimeter mobility.",
                "advantages": [
                    f"Explosive Aerial Elevation: {exp}/100 rating enables high-efficiency vertical rebounding and jump shooting over defenders.",
                    f"Perimeter Change of Direction: {agi}/100 agility allows rapid baseline drives and defensive lateral slide coverage.",
                    f"Core & Lower-Body Force Transmission: {str_val}/100 strength provides contact stability during drives into the paint.",
                    f"Dynamic Landing Balance: {bal}/100 single-leg balance protects against knee torque during contested landings.",
                ],
                "drills": [
                    {"name": "Box Depth Jumps to Rim Reach", "sets": "4 sets × 5 reps", "focus": "Instant ground contact reaction and maximal vertical extension."},
                    {"name": "Lane Agility 4-Corner Shuttles", "sets": "5 sets × 30s", "focus": "Defensive slide, backpedal, sprint, and change-of-direction tempo."},
                    {"name": "Single-Leg Deceleration & Euro-Step Bounds", "sets": "3 sets × 6 reps per side", "focus": "Unilateral eccentric braking and explosive lateral redirection."},
                ],
                "roadmap": [
                    {"week": "Week 1", "focus": "Kinetic Foundation & Landing Mechanics", "drills": "Squat depth reinforcement, ankle stiffness hops, basic defensive slides."},
                    {"week": "Week 2", "focus": "Explosive Rate of Force Development", "drills": "Trap bar jumps, contrast plyometrics, full-court transition sprints."},
                    {"week": "Week 3", "focus": "Reactive Court Agility & Game Speed", "drills": "Closeout recovery drills, 5-10-5 pro agility, contested layups off single leg."},
                    {"week": "Week 4", "focus": "Peak Performance & Scrimmage Benchmark", "drills": "High-intensity full-court scrimmages, vertical reach re-test, active recovery."},
                ],
            },
            "Volleyball": {
                "why_fits": f"{name}'s peak explosive power ({exp}/100) and upper-body pushing endurance ({str_val}/100) paired with superior postural stability ({bal}/100) creates the archetypal biomechanical engine for volleyball spiking velocity, block coverage, and aerial hang-time.",
                "advantages": [
                    f"Maximal Vertical Takeoff: {exp}/100 explosive power maximizes spike reach and net clearance.",
                    f"Unilateral Airborne Stability: {bal}/100 balance ensures symmetrical core control during mid-air rotational attacks.",
                    f"Upper-Body Shoulder & Kinetic Power: {str_val}/100 strength allows high-velocity arm swing without energy leak.",
                    f"Quick Lateral Block Reaction: {agi}/100 agility enables rapid net-to-net lateral shuffle transitions.",
                ],
                "drills": [
                    {"name": "Countermovement Approach Spike Jumps", "sets": "5 sets × 4 reps", "focus": "3-step penultimate foot plant and maximal arm swing drive."},
                    {"name": "Lateral Net Shuffle to Block Jumps", "sets": "4 sets × 6 reps", "focus": "Explosive lateral transition and double-arm reach over net."},
                    {"name": "Rotational Medicine Ball Wall Slams", "sets": "3 sets × 10 reps per side", "focus": "Thoracic rotation power for overhead spike velocity."},
                ],
                "roadmap": [
                    {"week": "Week 1", "focus": "Triple Extension & Jump Landing Integrity", "drills": "Depth drops, broad jumps, rotator cuff pre-hab."},
                    {"week": "Week 2", "focus": "Arm Swing Kinetic Chain & Core Power", "drills": "Overhead med-ball throws, dumbbell push presses, approach mechanics."},
                    {"week": "Week 3", "focus": "Lateral Net Movement & Reaction Speed", "drills": "Reactive block shadow drills, dive-and-recover floor drills."},
                    {"week": "Week 4", "focus": "Game-Scenario Power & Spiking Precision", "drills": "High-velocity spike attempts, match play, vertical jump re-test."},
                ],
            },
            "Football": {
                "why_fits": f"{name}'s outstanding multi-directional agility ({agi}/100) and lower-body strength ({str_val}/100) combined with dynamic balance ({bal}/100) provides the ideal physical profile for football speed, cutting power, tackle resistance, and endurance.",
                "advantages": [
                    f"Multi-Directional Change of Direction: {agi}/100 rating delivers lightning sharp cuts and evasive dribbling.",
                    f"Lower-Body Ground Force Production: {str_val}/100 strength powers high-velocity sprint bursts and physical shielding.",
                    f"Unipedal Ball-Striking Balance: {bal}/100 stability ensures pinpoint accuracy when striking off one planted foot.",
                    f"Reactive Sprint Acceleration: {exp}/100 explosive power provides the first 5-meter burst past defenders.",
                ],
                "drills": [
                    {"name": "T-Drill & Slalom Cone Sprints with Ball", "sets": "6 sets", "focus": "Sharpening 90-degree lateral cuts at maximum sprint velocity."},
                    {"name": "Single-Leg Bulgarian Split Squats to Broad Jump", "sets": "3 sets × 6 reps", "focus": "Unilateral leg drive and physical duel strength."},
                    {"name": "Box-to-Box Interval Sprints (15s on / 15s off)", "sets": "8 rounds", "focus": "High-intensity anaerobic recovery and match stamina."},
                ],
                "roadmap": [
                    {"week": "Week 1", "focus": "Deceleration Control & Ankle Mobility", "drills": "Linear deceleration drills, single-leg stability holds, cone footwork."},
                    {"week": "Week 2", "focus": "Maximal Sprint Acceleration & First-Step Burst", "drills": "10m resisted sprints, lateral plyometric bounds, power squats."},
                    {"week": "Week 3", "focus": "Sport-Specific Dribbling & Rapid Transitions", "drills": "1v1 pressure drills, curved sprint runs, technical ball striking."},
                    {"week": "Week 4", "focus": "90-Minute Match Endurance & Tapering", "drills": "Full-pitch tactical game, agility benchmark re-test, active recovery."},
                ],
            },
            "Tennis": {
                "why_fits": f"{name}'s lateral court quickness ({agi}/100), unilateral balance ({bal}/100), and kinetic chain strength ({str_val}/100) provide the exact physiological tools required for explosive baseline coverage, rotational stroke power, and overhead smash execution.",
                "advantages": [
                    f"Side-to-Side Baseline Recovery: {agi}/100 agility allows seamless split-step transitions and wide-court defense.",
                    f"Planted Rotational Power: {bal}/100 balance creates a rock-solid base to transfer ground force into groundstrokes.",
                    f"Upper-Body Core Torque: {str_val}/100 strength maximizes serve speed and heavy topspin rotation.",
                    f"Neuromuscular Hand-Eye Coordination: {coo}/100 ensures consistent center-racket ball striking under pressure.",
                ],
                "drills": [
                    {"name": "Spider Agility Court Run Drill", "sets": "5 sets", "focus": "Explosive split-step and sprint recovery to all 5 court corners."},
                    {"name": "Rotational Cable Woodchops & Med-Ball Throws", "sets": "4 sets × 8 reps per side", "focus": "Torso angular velocity for forehand and backhand power."},
                    {"name": "Single-Leg Balance Racket Volleys", "sets": "3 sets × 12 reps", "focus": "Unilateral stability during dynamic net approaches."},
                ],
                "roadmap": [
                    {"week": "Week 1", "focus": "Split-Step Timing & Footwork Fundamentals", "drills": "Ladder drills, lateral shuffle-and-freeze, shoulder mobility."},
                    {"week": "Week 2", "focus": "Rotational Torque & Kinetic Energy Transfer", "drills": "Medicine ball side throws, core anti-rotation, baseline rallies."},
                    {"week": "Week 3", "focus": "High-Tempo Match Rallies & Court Coverage", "drills": "Deep baseline to drop-shot sprint intervals, serve power calibration."},
                    {"week": "Week 4", "focus": "Tournament Simulation & Tactical Scrimmages", "drills": "Competitive set play, lateral agility re-test, dynamic stretching."},
                ],
            },
            "Badminton": {
                "why_fits": f"{name}'s exceptional agility ({agi}/100) and coordination ({coo}/100) combined with dynamic postural stability ({bal}/100) establishes a world-class profile for short-court burst acceleration, lightning-quick shuttle recovery, and deceptive smash angles.",
                "advantages": [
                    f"Short-Court Burst Agility: {agi}/100 agility provides instant 2-step court coverage in all 6 directions.",
                    f"Superb Dynamic Balance: {bal}/100 stability allows deep lunges at the net with immediate recovery.",
                    f"Fine Neuromuscular Timing: {coo}/100 coordination enables precise racket head acceleration and deceptive slice shots.",
                    f"Explosive Scissor-Kick Smash: {exp}/100 power powers aerial jumping rear-court smashes.",
                ],
                "drills": [
                    {"name": "6-Corner Shadow Footwork Intervals", "sets": "6 sets × 45s", "focus": "Maximum-velocity lunge, recovery, and scissor-kick footwork."},
                    {"name": "Explosive Split-Lunge Jumps", "sets": "3 sets × 8 reps", "focus": "Lower-body reactive push-off power from deep lunges."},
                    {"name": "Wrist Snap & Forearm Resistance Band Curls", "sets": "3 sets × 15 reps", "focus": "Accelerating racket head velocity on overhead smashes."},
                ],
                "roadmap": [
                    {"week": "Week 1", "focus": "Shadow Footwork & Ankle Reactive Elasticity", "drills": "6-corner shadow drills, jump rope double-unders, lunge stability."},
                    {"week": "Week 2", "focus": "Explosive Scissor Kicks & Overhead Power", "drills": "Rear-court jumping smashes, resistance band smashes, core planks."},
                    {"week": "Week 3", "focus": "Rapid Net Tumble & Fast-Paced Multi-Shuttle", "drills": "20-shuttle rapid feed drills, net kill transitions, reaction training."},
                    {"week": "Week 4", "focus": "Match Play Simulation & Reaction Re-Test", "drills": "Competitive singles/doubles games, agility shuttle re-test."},
                ],
            },
            "Cricket": {
                "why_fits": f"{name}'s balanced physiological foundation featuring high core strength ({str_val}/100), unilateral stability ({bal}/100), and athletic coordination ({coo}/100) makes them naturally adapted for bowling speed, batting power generation, and athletic boundary fielding.",
                "advantages": [
                    f"Ground Force Core Bracing: {str_val}/100 strength supports heavy bowling front-foot impact and explosive batting drives.",
                    f"Front-Foot Delivery Balance: {bal}/100 balance stabilizes the delivery stride and balance point during stroke play.",
                    f"Kinetic Linkage Coordination: {coo}/100 coordination coordinates hips, torso, and arm whip for maximum ball velocity.",
                    f"Sprint Burst Acceleration: {exp}/100 power accelerates 22-yard between-the-wickets running.",
                ],
                "drills": [
                    {"name": "Front-Foot Delivery Plant & Brace Holds", "sets": "4 sets × 6 reps per side", "focus": "Bracing straight front knee against ground reaction force."},
                    {"name": "Rotational Medicine Ball Batting Drive Slams", "sets": "4 sets × 8 reps per side", "focus": "Translating hip drive into high bat-speed and power."},
                    {"name": "Sprint 22-Yard Run-a-Ball Intervals with Bat", "sets": "6 sets × 3 runs", "focus": "Turning speed, slide grounding, and sprint deceleration."},
                ],
                "roadmap": [
                    {"week": "Week 1", "focus": "Shoulder Mobility & Core Anti-Extension", "drills": "Rotator cuff band work, pallof presses, bowling run-up calibration."},
                    {"week": "Week 2", "focus": "Rotational Power & Front-Foot Strength", "drills": "Medicine ball rotational throws, heavy trap bar deadlifts, power hitting."},
                    {"week": "Week 3", "focus": "Fielding Agility & Reactive Ground Pickups", "drills": "Direct hit throwing drills, high catching, boundary slide drills."},
                    {"week": "Week 4", "focus": "Match Simulation & Athletic Trait Re-Test", "drills": "Net sessions, full match simulation, athletic profile re-test."},
                ],
            },
        }

        cfg = sport_configs.get(sport, sport_configs["Basketball"])

        return {
            "tier": "Olympic Developmental Tier" if match_score >= 90 else "Advanced Performance Tier",
            "primary_sport_recommendation": sport,
            "match_score": match_score,
            "summary": cfg["why_fits"],
            "biomechanical_advantages": cfg["advantages"],
            "developmental_drills": cfg["drills"],
            "practice_roadmap": cfg["roadmap"],
        }

    def _build_chat_system_prompt(
        self,
        athlete_name: str,
        athlete_profile: Optional[Dict[str, Any]] = None,
        current_assessment: Optional[Dict[str, Any]] = None,
        history_summary: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        name = athlete_name if athlete_name and athlete_name.lower() != "athlete" else "Athlete"
        profile_str = ""
        if athlete_profile:
            p_age = athlete_profile.get("age", "N/A")
            p_height = athlete_profile.get("heightCm") or athlete_profile.get("height_cm", "N/A")
            p_weight = athlete_profile.get("weightKg") or athlete_profile.get("weight_kg", "N/A")
            p_fitness = athlete_profile.get("fitnessLevel") or athlete_profile.get("fitness_level", "Recreational")
            profile_str = f"Athlete Profile: Age: {p_age}, Height: {p_height} cm, Weight: {p_weight} kg, Fitness Tier: {p_fitness}."

        curr_str = ""
        if current_assessment:
            c_name = current_assessment.get("name") or current_assessment.get("assessmentName") or "Movement Assessment"
            c_val = current_assessment.get("headlineValue") or current_assessment.get("val") or current_assessment.get("headline", {}).get("value")
            c_unit = current_assessment.get("headlineUnit") or current_assessment.get("unit") or current_assessment.get("headline", {}).get("unit", "")
            c_kin = current_assessment.get("kinematics") or {}
            c_sport = current_assessment.get("topSport") or current_assessment.get("primarySport", {}).get("sport") or "Athletics"
            c_score = current_assessment.get("topScore") or current_assessment.get("primarySport", {}).get("score") or 85
            curr_str = (
                f"Current / Selected Assessment: {c_name} with measured result {c_val} {c_unit}.\n"
                f"Kinematic details: {json.dumps(c_kin) if c_kin else 'Calibrated kinetic chain active'}.\n"
                f"Top Talent Match: {c_sport} (Suitability score {c_score}/100)."
            )

        hist_str = ""
        if history_summary and len(history_summary) > 0:
            hist_items = [
                f"- {h.get('assessmentName', 'Test')}: {h.get('result', 'Completed')} on {h.get('date', 'Recent')}"
                for h in history_summary[:5]
            ]
            hist_str = "Recent Test History:\n" + "\n".join(hist_items)

        return (
            f"You are Coach Qwen, the elite Olympic Biomechanics Coach and Sports Science Intelligence Assistant for SportSense AI.\n"
            f"You are conversing directly with athlete {name}.\n"
            f"{profile_str}\n"
            f"{curr_str}\n"
            f"{hist_str}\n\n"
            f"Guidelines for your coaching responses:\n"
            f"1. Be encouraging, concise, and scientifically grounded in human biomechanics, kinematics, and sports training principles.\n"
            f"2. When the athlete asks how to improve, give specific, actionable training drills with sets, repetitions, and kinetic focus (e.g., rate of force development, eccentric deceleration, triple extension, or joint alignment).\n"
            f"3. Explain joint angles and injury resilience (e.g., landing shock absorption, knee valgus prevention, core stability).\n"
            f"4. Format your advice with clean markdown, bullet points, and bold headers so it is easy to read on mobile and web screens.\n"
            f"5. Answer in a conversational, friendly, professional tone as their personal Olympic mentor.\n"
            f"6. WORKOUT ROUTINE GENERATION: When the athlete asks for a workout plan or routine (e.g., 7-day or 14-day training schedule):\n"
            f"   - Structure each day clearly with markdown headers (e.g., '### Day 1: [Focus Title]', '### Day 2: ...').\n"
            f"   - For every training day, provide: Movement Primer, Main Kinetic Drills (with exact Sets × Reps), and Biomechanical Cues.\n"
            f"   - Schedule strategic active recovery / mobility days (e.g., Day 4 and Day 7).\n"
            f"   - Conclude with a brief 'Progression Note' on how to measure improvement on their next assessment re-test.\n"
            f"7. BIOMECHANICAL BENCHMARKS: When asked about standards or how they compare to elite athletes, compare their metrics against Beginner, Trained, State/College, and Olympic/Elite standards. Quantify the exact gap and provide the specific mechanical cues to bridge it."
        )

    def _generate_deterministic_chat_reply(
        self,
        last_message: str,
        athlete_name: str,
        current_assessment: Optional[Dict[str, Any]] = None,
        history_summary: Optional[List[Dict[str, Any]]] = None,
        athlete_profile: Optional[Dict[str, Any]] = None,
    ) -> str:
        name = athlete_name if athlete_name and athlete_name.lower() != "athlete" else ((athlete_profile or {}).get("name") or "Athlete")
        q = (last_message or "").lower().strip()

        # 1. Resolve history and recorded assessments
        history = history_summary or []
        records_by_slug: Dict[str, Dict[str, Any]] = {}
        for h in history:
            s = (h.get("assessmentId") or h.get("slug") or "").lower()
            if s and s not in records_by_slug:
                records_by_slug[s] = h

        # Fallback to history for current_assessment if missing
        if (not current_assessment or not (current_assessment.get("headlineValue") or current_assessment.get("val") or current_assessment.get("name"))) and history:
            current_assessment = history[0]

        curr_name = (current_assessment or {}).get("name") or (current_assessment or {}).get("assessmentName") or "Movement Assessment"
        curr_val = (current_assessment or {}).get("headlineValue") or (current_assessment or {}).get("val") or (current_assessment or {}).get("headline", {}).get("value")
        curr_unit = (current_assessment or {}).get("headlineUnit") or (current_assessment or {}).get("unit") or (current_assessment or {}).get("headline", {}).get("unit", "")
        curr_slug = ((current_assessment or {}).get("slug") or (current_assessment or {}).get("assessmentId") or "").lower()

        # Identify which movement the athlete is referring to
        is_squat = any(w in q for w in ["squat", "knee", "depth", "flexion", "thigh", "parallel", "legs", "quad"])
        is_jump = any(w in q for w in ["jump", "vertical", "elevation", "height", "airborne", "flight", "takeoff", "leap"])
        is_pushup = any(w in q for w in ["push", "pushup", "push-up", "chest", "arm", "reps", "plank", "upper body"])
        is_balance = any(w in q for w in ["balance", "sway", "stability", "unipedal", "single-leg", "foot", "stork", "wobble", "equilibrium"])
        is_agility = any(w in q for w in ["agility", "lateral", "shuttle", "change of direction", "t-test", "quickness", "speed", "contact", "shuffle"])

        # If none explicitly typed, check active assessment
        if not (is_squat or is_jump or is_pushup or is_balance or is_agility):
            if "squat" in curr_slug:
                is_squat = True
            elif "jump" in curr_slug:
                is_jump = True
            elif "push" in curr_slug:
                is_pushup = True
            elif "balance" in curr_slug:
                is_balance = True
            elif "agility" in curr_slug:
                is_agility = True

        # ====================================================================
        # INTENT 1: FORM, TECHNIQUE, POSTURE, ALIGNMENT, CRITIQUE
        # e.g. "how is my form", "how was my technique", "is my form good"
        # ====================================================================
        is_form_query = any(w in q for w in [
            "form", "technique", "posture", "alignment", "mechanics", "how did i do",
            "how was my", "am i doing", "is my form", "critique", "execution", "cues",
            "stance", "feedback", "postural", "kinetic chain", "doing it right"
        ])

        if is_form_query:
            if is_squat:
                squat_rec = records_by_slug.get("squat") or current_assessment or {}
                val = squat_rec.get("val") or squat_rec.get("headlineValue") or curr_val or "82.7"
                return (
                    f"### 🦵 Biomechanical Form Analysis: Squat Mechanics\n\n"
                    f"Great question, **{name}**! Based on your smartphone pose kinematics, here is an in-depth breakdown of your squat form (recorded depth: **{val}°**):\n\n"
                    f"1. **Depth & Knee Flexion (Angle: {val}°)**:\n"
                    f"   - Optimal parallel depth occurs at **90°**, with Olympic deep squats reaching **75°–85°**.\n"
                    f"   - Your measured flexion demonstrates **solid femur travel** below horizontal, engaging the gluteus maximus and vastus medialis effectively.\n\n"
                    f"2. **Knee Tracking & Valgus Prevention**:\n"
                    f"   - Ensure your patellae track strictly in line with your 2nd and 3rd toes throughout the descent and ascent.\n"
                    f"   - *Correction*: Never allow the knees to collapse inward (knee valgus) as you reverse out of the hole—this protects the ACL and meniscus.\n\n"
                    f"3. **Torso & Lumbar Neutrality**:\n"
                    f"   - Maintain a tall chest with a neutral spinal curve. Avoid excess forward trunk lean (the 'good morning' squat fault), which shifts load unnecessarily to the lumbar spine.\n\n"
                    f"4. **Weight Distribution & Ground Contact**:\n"
                    f"   - Keep even tripod pressure through your heel, 1st metatarsal (big toe), and 5th metatarsal (pinky toe). Do not allow heels to elevate off the floor.\n\n"
                    f"💡 **Top 3 Actionable Cues for Your Next Rep**:\n"
                    f"- *'Spread the floor with your feet'* to fire the glute medius.\n"
                    f"- *'Break simultaneously at the hips and knees'* for balanced joint loading.\n"
                    f"- *'Exhale and drive the floor away'* as you ascend."
                )
            elif is_jump:
                jump_rec = records_by_slug.get("vertical-jump") or current_assessment or {}
                val = jump_rec.get("val") or jump_rec.get("headlineValue") or curr_val or "52.4"
                return (
                    f"### 🚀 Biomechanical Form Analysis: Vertical Jump Kinematics\n\n"
                    f"Here is your detailed movement form critique for the Vertical Jump, **{name}** (recorded height: **{val} cm**):\n\n"
                    f"1. **Triple Extension at Takeoff**:\n"
                    f"   - Your countermovement demonstrates strong sequential firing: explosive simultaneous extension of the hips, knees, and ankles (plantarflexion).\n"
                    f"   - *Form Cue*: Ensure hips achieve 180° full extension before your toes leave the floor to maximize vertical impulse.\n\n"
                    f"2. **Arm Swing Synchronization**:\n"
                    f"   - The arms should swing aggressively downward into the hip hinge, then punch rapidly overhead at takeoff.\n"
                    f"   - *Biomechanical impact*: A synchronized bilateral arm swing increases vertical takeoff velocity by 10%–14% through vertical momentum transfer.\n\n"
                    f"3. **Countermovement Depth & Transition**:\n"
                    f"   - Don't squat too deep before jumping (ideal countermovement knee flexion is 90°–100°). The amortization phase (pause between dip and jump) must be under 0.20 seconds to harness elastic tendon recoil (stretch-shortening cycle).\n\n"
                    f"4. **Landing Deceleration & Joint Safety**:\n"
                    f"   - Land softly on the forefoot, immediately rolling to the heels while bending hips and knees to absorb ground impact.\n"
                    f"   - Avoid stiff-legged landings or inward knee cave (knee valgus) to protect the ACL.\n\n"
                    f"💡 **Key Technical Focus**: *Accelerate your arm drive upward at the exact moment your hips begin pushing forward.*"
                )
            elif is_pushup:
                push_rec = records_by_slug.get("push-up") or current_assessment or {}
                val = push_rec.get("val") or push_rec.get("headlineValue") or curr_val or "18"
                return (
                    f"### 💪 Biomechanical Form Analysis: Push-Up Mechanics\n\n"
                    f"Here is your kinetic alignment and form analysis for the Push-Up assessment, **{name}** (recorded: **{val} reps**):\n\n"
                    f"1. **Humeral-Thoracic Angle (Elbow Position)**:\n"
                    f"   - Maintain your elbows tucked at roughly a **45° angle** to your torso (an 'arrowhead' shape from above).\n"
                    f"   - *Correction*: Never flare elbows out at 90° ('T' shape), as this impinges the supraspinatus rotator cuff tendon against the acromion.\n\n"
                    f"2. **Rigid Core Plank & Pelvic Alignment**:\n"
                    f"   - Your body must operate as a single rigid lever from the crown of the head through heels.\n"
                    f"   - Engage the abdominals and squeeze glutes to prevent anterior pelvic tilt and lumbar spine sagging.\n\n"
                    f"3. **Range of Motion & Scapular Motion**:\n"
                    f"   - Lower under control until the sternum is 5–7 cm from the floor, then press to full elbow extension.\n"
                    f"   - Allow natural scapular retraction on the descent and protraction ('pushing the floor away') at the top.\n\n"
                    f"💡 **Top Cue**: *'Screw your palms into the floor'* to create external rotation torque in the shoulders."
                )
            elif is_balance:
                bal_rec = records_by_slug.get("single-leg-balance") or current_assessment or {}
                val = bal_rec.get("val") or bal_rec.get("headlineValue") or curr_val or "88"
                return (
                    f"### ⚖️ Biomechanical Form Analysis: Single-Leg Balance Stability\n\n"
                    f"Here is your neuromuscular and postural sway evaluation, **{name}** (stability score: **{val}/100**):\n\n"
                    f"1. **Foot Tripod & Proprioceptive Grip**:\n"
                    f"   - Distribute weight evenly across the heel, base of the first metatarsal, and base of the fifth metatarsal.\n"
                    f"   - Active gripping of the floor with your toes stabilizes the medial longitudinal arch.\n\n"
                    f"2. **Pelvic Neutrality & Glute Medius**:\n"
                    f"   - Ensure the pelvis remains level horizontally. If the non-stance hip drops (Trendelenburg sign), activate the standing-leg gluteus medius.\n\n"
                    f"3. **Vestibular & Visual Fixation**:\n"
                    f"   - Keep eyes locked on a stationary target at eye level 2–3 meters ahead to steady the vestibular-ocular reflex.\n\n"
                    f"💡 **Key Technical Focus**: *Keep a slight micro-bend in the standing knee—locking the knee joint reduces muscle activation and increases sway.*"
                )
            elif is_agility:
                agi_rec = records_by_slug.get("side-to-side-agility") or current_assessment or {}
                val = agi_rec.get("val") or agi_rec.get("headlineValue") or curr_val or "15"
                return (
                    f"### ⚡ Biomechanical Form Analysis: Side-to-Side Agility & Deceleration\n\n"
                    f"Here is your lateral change-of-direction form assessment, **{name}** (recorded contacts: **{val}**):\n\n"
                    f"1. **Center of Mass Elevation**:\n"
                    f"   - Maintain a low, loaded athletic stance with chest up and hips dropped. Rising upright during lateral transitions slows down deceleration.\n\n"
                    f"2. **Plant Step & Braking Mechanics**:\n"
                    f"   - When approaching the line, plant the outside foot with ankle inversion stiffness and bend the knee to dissipate momentum eccentrically.\n\n"
                    f"3. **Lateral Shuffle Cadence**:\n"
                    f"   - Use rapid, explosive shuffles without crossing your feet over each other, keeping feet ready to produce instantaneous ground reaction force.\n\n"
                    f"💡 **Key Technical Focus**: *Sink your hips on the plant step to reverse direction in a single explosive push.*"
                )
            else:
                return (
                    f"### 🏃 Comprehensive Movement Form & Kinematic Evaluation\n\n"
                    f"Hey **{name}**! Here is an overview of your biomechanical movement form across your athletic battery:\n\n"
                    f"- **Squat Form (Lower Body Stability)**: Good depth control and hip mobility. Prioritize vertical chest posture and driving knees over 2nd toes to eliminate inward knee valgus.\n"
                    f"- **Vertical Jump (Triple Extension)**: Strong explosive force transmission through hips and ankles. Ensure an aggressive upward arm drive and soft knee-flexed landings.\n"
                    f"- **Push-Up (Upper Body & Core)**: Keep elbows tucked at 45° to torso and maintain a rigid abdominal plank to avoid lower back sagging.\n"
                    f"- **Single-Leg Balance (Neuromuscular Control)**: Maintain a micro-bend in the standing knee and active foot tripod grip to minimize postural sway.\n"
                    f"- **Lateral Agility (Change of Direction)**: Stay low in your athletic stance to keep center of gravity close to the floor for instant braking and push-off.\n\n"
                    f"Would you like a deep-dive form critique into a specific movement, or specific cues to fix a movement fault?"
                )

        # ====================================================================
        # INTENT 2: HOW TO IMPROVE / ELEVATE SCORES / REACH TARGETS
        # e.g. "how to improve", "how can i jump higher", "get better"
        # ====================================================================
        is_improve_query = any(w in q for w in [
            "improve", "higher", "elevation", "better", "increase", "boost",
            "add", "progress", "faster", "stronger", "more reps", "depth", "scale"
        ])

        if is_improve_query:
            if is_jump or any(w in q for w in ["jump", "vertical"]):
                jump_rec = records_by_slug.get("vertical-jump") or current_assessment or {}
                val = jump_rec.get("val") or jump_rec.get("headlineValue") or curr_val or "52.4"
                return (
                    f"### 🚀 Elevating Your Vertical Jump (Target: +5 cm)\n\n"
                    f"Great question, **{name}**! Your recorded mark of **{val} cm** proves you already have a solid foundation. "
                    f"To unlock an immediate 3–5 cm increase in vertical displacement, focus on **Rate of Force Development (RFD)** and ankle reactive stiffness:\n\n"
                    f"1. **Depth Jumps (Reactive Stretch-Shortening Cycle)**: 4 sets × 4 reps from a 30cm box. Ground contact must be under 0.20s.\n"
                    f"2. **Trap Bar / Dumbbell Jump Squats**: 4 sets × 5 reps at 20% bodyweight for peak concentric velocity.\n"
                    f"3. **Pogo Hops (Ankle Plantarflexion)**: 3 sets × 20s with stiff knees to train tendon recoil energy.\n\n"
                    f"💡 *Biomechanics Tip*: Accelerate your arm swing downward during the countermovement—an aggressive arm swing adds 10–15% extra vertical impulse at takeoff!"
                )
            elif is_squat or any(w in q for w in ["squat", "depth"]):
                squat_rec = records_by_slug.get("squat") or current_assessment or {}
                val = squat_rec.get("val") or squat_rec.get("headlineValue") or curr_val or "82.7"
                return (
                    f"### 🦵 Optimizing Squat Depth & Lower-Body Power\n\n"
                    f"Hey **{name}**, in your squat assessment, knee flexion angle was measured at **{val}°**.\n\n"
                    f"To hit parallel or full Olympic depth (90°–100°) safely without knee valgus (knees caving inward):\n\n"
                    f"1. **Goblet Squats with 3s Pause at Bottom**: 4 sets × 6 reps. Focus on driving knees out over the second toe.\n"
                    f"2. **Ankle Dorsiflexion Wall Mobilization**: 3 sets × 12 reps per ankle to allow forward knee travel without heel lift.\n"
                    f"3. **Banded Glute Bridges & Monster Walks**: 3 sets × 15 reps to fire the gluteus medius for hip abduction stability.\n\n"
                    f"🛡️ *Injury Prevention*: Keep your chest upright and maintain a neutral lumbar curve to protect the L4-S1 spine during peak depth."
                )
            elif is_pushup or any(w in q for w in ["push", "pushup", "chest"]):
                push_rec = records_by_slug.get("push-up") or current_assessment or {}
                val = push_rec.get("val") or push_rec.get("headlineValue") or curr_val or "18"
                return (
                    f"### 💪 Increasing Push-Up Volume & Kinetic Form\n\n"
                    f"Nice work recording **{val} reps**, **{name}**! Here is how to scale to 30+ strict reps:\n\n"
                    f"1. **Grease-the-Groove Submaximal Sets**: Perform 5–8 sets of 50% max reps spaced throughout the day.\n"
                    f"2. **Tempo Deficit Push-Ups (3-1-X)**: 3 sets × 8 reps. 3 seconds down, 1 second pause, explosive press upward.\n"
                    f"3. **Hollow-Body Plank Holds**: 3 sets × 45 seconds to prevent anterior pelvic tilt and lower back sagging.\n\n"
                    f"📐 *Elbow Geometry*: Maintain elbows at a 45° angle to the torso rather than flaring out at 90° to protect the rotator cuff."
                )
            elif is_balance or any(w in q for w in ["balance", "stability"]):
                bal_rec = records_by_slug.get("single-leg-balance") or current_assessment or {}
                val = bal_rec.get("val") or bal_rec.get("headlineValue") or curr_val or "88"
                return (
                    f"### ⚖️ Mastering Single-Leg Stability & Neuromuscular Control\n\n"
                    f"Your balance stability index was scored at **{val}/100**, **{name}**.\n\n"
                    f"To eliminate sway and protect the ankle-knee kinetic chain:\n\n"
                    f"1. **Single-Leg Romanian Deadlifts (SL-RDL)**: 3 sets × 8 reps per leg with a 2-second eccentric descent.\n"
                    f"2. **Eyes-Closed Balance on Foam Pad**: 4 sets × 30 seconds per leg to train vestibular and proprioceptive reflexes.\n"
                    f"3. **Multi-Directional Clock Taps**: Balance on one leg while reaching the free toe to 12, 3, 6, and 9 o'clock.\n\n"
                    f"💡 *Proprioception Cue*: Grip the floor with the 'foot tripod' (heel, base of big toe, and base of pinky toe)."
                )
            elif is_agility or any(w in q for w in ["agility", "speed"]):
                agi_rec = records_by_slug.get("side-to-side-agility") or current_assessment or {}
                val = agi_rec.get("val") or agi_rec.get("headlineValue") or curr_val or "15"
                return (
                    f"### ⚡ Lateral Deceleration & Change-of-Direction Speed\n\n"
                    f"In your agility test, you recorded **{val} contacts**, **{name}**.\n\n"
                    f"To cut down transition ground contact time and boost change of direction:\n\n"
                    f"1. **5-10-5 Pro Agility Shuttles**: 4 sets with full 90-second recovery between sprints.\n"
                    f"2. **Lateral Heiden Jumps with Stick Landing**: 3 sets × 6 reps per side for eccentric braking power.\n"
                    f"3. **Speed Ladder In-In-Out-Out Footwork**: 4 sets × 20s focusing on forefoot elasticity and cadence.\n\n"
                    f"👟 *Biomechanical Cue*: Lower your center of mass before the plant step to redirect horizontal momentum efficiently."
                )
            else:
                return (
                    f"### 📈 Comprehensive Athletic Progression Roadmap for {name}\n\n"
                    f"To systematically raise your athletic scores across the board, implement these three pillars:\n\n"
                    f"1. **Explosive Power & RFD**: Contrast plyometrics (depth jumps paired with weighted trap bar jumps) to increase motor unit recruitment velocity.\n"
                    f"2. **Kinematic Mobility**: Daily ankle dorsiflexion and thoracic rotation to allow deeper, safer joint travel in squats and lateral changes of direction.\n"
                    f"3. **Eccentric Deceleration**: Focus on slow lowering phases (3–4 seconds) on all squats and jumps to strengthen tendons against landing forces."
                )

        # ====================================================================
        # INTENT 3: WEAKNESSES, BOTTLENECK, FLAWS, FIXES
        # e.g. "what are my weaknesses", "what should i fix", "my bottlenecks"
        # ====================================================================
        if any(w in q for w in ["weakness", "weak", "bottleneck", "flaw", "mistake", "error", "what should i fix", "struggle", "bad"]):
            return (
                f"### 🎯 Kinetic Chain Bottleneck & Weak Link Analysis for {name}\n\n"
                f"Based on your movement assessment telemetry, here are the primary technical bottlenecks to address:\n\n"
                f"1. **Eccentric Deceleration Absorptive Capacity**:\n"
                f"   - Athletes with high reactive power frequently under-train their eccentric deceleration, increasing knee impact stress.\n"
                f"   - *Corrective Drill*: 3x6 Lateral Heiden bounds with a 3-second stick landing.\n\n"
                f"2. **Ankle Dorsiflexion Mobility**:\n"
                f"   - Stiff ankle joint capsules restrict forward tibial translation, forcing early chest collapse in deep squats.\n"
                f"   - *Corrective Drill*: Band-distracted ankle rocks against a wall (2 min per side daily).\n\n"
                f"3. **Rotator Cuff Anterior Shoulder Stability**:\n"
                f"   - In high-volume push-ups, the shoulders can fatigue faster than the chest, causing elbow flare.\n"
                f"   - *Corrective Drill*: Prone Y-T-W raises (3 sets × 12 reps) to strengthen lower traps and serratus anterior."
            )

        # ====================================================================
        # INTENT 4: WORKOUT PLANS, 7-DAY ROUTINES, DRILLS, EXERCISES
        # e.g. "give me a workout plan", "7-day routine", "training schedule"
        # ====================================================================
        if any(w in q for w in ["workout", "plan", "routine", "7-day", "schedule", "drills", "exercise", "program", "blueprint"]):
            return (
                f"### 🏋️ Personalized 7-Day Performance Blueprint for {name}\n\n"
                f"Based on your athletic assessment history, here is your high-performance schedule:\n\n"
                f"- **Monday (Power & Kinetic Extension)**: Dynamic warmup, 4x4 Box Depth Jumps, Trap Bar Deadlifts, 3x8 Single-Leg RDL.\n"
                f"- **Tuesday (Movement Agility & Core)**: 5-10-5 Agility Shuttles, Banded Pallof Presses, 4x30s Hollow Planks.\n"
                f"- **Wednesday (Active Recovery & Mobility)**: 20 min foam rolling, ankle dorsiflexion stretches, hip opener yoga.\n"
                f"- **Thursday (Upper Body & Kinetic Force Transfer)**: Tempo Push-Ups, Pull-ups, Rotational Med-Ball Slams.\n"
                f"- **Friday (Plyometric Reactive Speed)**: Contrast jump squats, single-leg bounds, broad jumps.\n"
                f"- **Saturday (Sport-Specific Simulation & Skills)**: High-tempo technical sport drills and practice.\n"
                f"- **Sunday**: Full systemic recovery and hydration recharge."
            )

        # ====================================================================
        # INTENT 5: INJURY PREVENTION, ACL, JOINT SAFETY, LANDING MECHANICS
        # e.g. "injury prevention", "check acl risk", "landing safety"
        # ====================================================================
        if any(w in q for w in ["injury", "acl", "pain", "landing", "safe", "hurt", "knee", "joint", "back", "protect"]):
            return (
                f"### 🛡️ Biomechanical Injury Resilience & Joint Protection\n\n"
                f"Protecting your kinetic chain is our top priority, **{name}**!\n\n"
                f"- **Soft Deceleration Mechanics**: When landing from any jump, absorb force by bending hips, knees, and ankles simultaneously. Stiff-legged landings transmit up to 7x bodyweight force through the knee joint.\n"
                f"- **Zero Knee Valgus**: Your knee caps must stay tracked directly over your 2nd and 3rd toes. Never let knees collapse inward during landing or squats.\n"
                f"- **Posterior Chain Activation**: Strengthen hamstrings and glutes with Nordic curls and Romanian deadlifts to counterbalance quadriceps dominance, reducing ACL strain by up to 60%."
            )

        # ====================================================================
        # INTENT 6: SPORT MATCHING & TALENT PATHWAY
        # e.g. "why volleyball", "why basketball", "what sport is best for me"
        # ====================================================================
        if any(w in q for w in ["sport", "match", "talent", "why", "volleyball", "basketball", "football", "tennis", "cricket", "badminton", "which sport", "recommend"]):
            return (
                f"### 🏆 Your Biomechanical Sport Transfer Analysis\n\n"
                f"Your neuromuscular profile demonstrates an extraordinary match for **Volleyball & Basketball**, **{name}**!\n\n"
                f"- **Why it fits**: Your measured explosive vertical power and rapid takeoff velocity allow you to contest high-elevation attacks, spikes, and rebounds.\n"
                f"- **Competitive Edge**: Your bilateral takeoff symmetry ensures consistent vertical reach with balanced kinetic force delivery, minimizing one-sided wear on joints.\n"
                f"- **Agility & Court Coverage**: Fast lateral deceleration allows quick transitions from defense to offensive takeoff."
            )

        # ====================================================================
        # INTENT 7: SCORES, METRICS, STATS, RESULTS RECAP
        # e.g. "what is my score", "my stats", "metrics"
        # ====================================================================
        if any(w in q for w in ["score", "metrics", "number", "how many", "what was my", "stats", "history", "result"]):
            history_lines = []
            for h in history[:5]:
                h_name = h.get("assessmentName") or h.get("name") or "Assessment"
                h_res = h.get("result") or f"{h.get('val', '')} {h.get('unit', '')}"
                history_lines.append(f"- **{h_name}**: {h_res}")
            hist_block = "\n".join(history_lines) if history_lines else f"- **{curr_name}**: {curr_val} {curr_unit}"
            return (
                f"### 📊 Athletic Performance Telemetry for {name}\n\n"
                f"Here is your latest recorded assessment battery summary:\n\n"
                f"{hist_block}\n\n"
                f"Your athletic traits indicate **well-developed explosive power and neuromuscular control**. "
                f"Ask me for specific drills on any test to elevate your numbers!"
            )

        # ====================================================================
        # INTENT 8: GREETING & GENERAL CONVERSATIONAL
        # e.g. "hello", "hi", "who are you", "what can you do", "help"
        # ====================================================================
        if any(w in q for w in ["hi", "hello", "hey", "who are you", "what can you do", "help", "coach"]):
            return (
                f"Hey **{name}**! I am Coach Qwen, your personal Olympic Biomechanics & Sports Science Coach.\n\n"
                f"I analyze your joint kinematics, force development, and movement symmetry to help you maximize your athletic potential.\n\n"
                f"Here are a few things you can ask me:\n"
                f"- *'How is my form?'* (detailed joint angle & kinetic chain critique)\n"
                f"- *'How can I add 5 cm to my jump?'* (plyometric RFD protocols)\n"
                f"- *'Give me a 7-day training schedule'* (custom sets, reps & drills)\n"
                f"- *'Check my injury risk'* (landing deceleration & knee alignment)"
            )

        # ====================================================================
        # INTENT 9: OPEN-ENDED ATHLETIC ADVICE (NEVER repetitive menu)
        # ====================================================================
        return (
            f"### 💡 Olympic Biomechanics Guidance for {name}\n\n"
            f"Regarding your question (*'{last_message}'*):\n\n"
            f"From an athletic movement science perspective, optimal performance comes down to three key biomechanical principles:\n\n"
            f"1. **Force Production & Ground Reaction**: Maximizing concentric power output while minimizing transition (amortization) time.\n"
            f"2. **Kinetic Chain Alignment**: Transferring force from your feet through your hips and core without energy leakage or spinal buckling.\n"
            f"3. **Neuromuscular Adaptation**: Progressive overload paired with adequate recovery to build reactive tendon stiffness.\n\n"
            f"To dial this in for your current training, would you like a **movement-specific drill**, a **form check on a recent assessment**, or a **weekly training plan**?"
        )

    async def stream_chat_response_async(
        self,
        messages: List[Dict[str, str]],
        athlete_name: str = "Athlete",
        athlete_profile: Optional[Dict[str, Any]] = None,
        current_assessment: Optional[Dict[str, Any]] = None,
        history_summary: Optional[List[Dict[str, Any]]] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        status_info = self.get_engine_status()
        is_ollama = status_info["ollama_online"] and status_info.get("qwen_detected", False)

        system_prompt = self._build_chat_system_prompt(
            athlete_name=athlete_name,
            athlete_profile=athlete_profile,
            current_assessment=current_assessment,
            history_summary=history_summary,
        )

        ollama_messages = [{"role": "system", "content": system_prompt}]
        for m in messages:
            ollama_messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})

        # 1. Cloud LLM support (Groq / OpenAI)
        groq_key = os.getenv("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", "")
        openai_key = os.getenv("OPENAI_API_KEY")

        if groq_key or openai_key:
            cloud_url = "https://api.groq.com/openai/v1/chat/completions" if groq_key else "https://api.openai.com/v1/chat/completions"
            cloud_key = groq_key or openai_key
            cloud_model = getattr(settings, "GROQ_MODEL", "qwen/qwen3.8-27b") if groq_key else "gpt-4o-mini"
            try:
                yield {
                    "type": "status",
                    "mode": "cloud_llm",
                    "active_model": cloud_model,
                }
                headers = {"Authorization": f"Bearer {cloud_key}", "Content-Type": "application/json"}
                payload = {
                    "model": cloud_model,
                    "messages": ollama_messages,
                    "stream": True,
                    "temperature": 0.6,
                    "max_tokens": 1500,
                }
                async with httpx.AsyncClient(timeout=30.0, verify=_get_ssl_verify()) as client:
                    async with client.stream("POST", cloud_url, json=payload, headers=headers) as response:
                        if response.status_code == 200:
                            async for raw_line in response.aiter_lines():
                                line = raw_line.strip()
                                if not line or not line.startswith("data: "):
                                    continue
                                chunk_str = line[6:].strip()
                                if chunk_str == "[DONE]":
                                    break
                                try:
                                    chunk = json.loads(chunk_str)
                                    delta = chunk.get("choices", [{}])[0].get("delta", {})
                                    token = delta.get("content", "")
                                    if token:
                                        yield {"type": "token", "content": token}
                                except Exception:
                                    continue
                            return
                        else:
                            logger.warning(f"Cloud LLM stream returned HTTP {response.status_code}")
            except Exception as e:
                logger.warning(f"Cloud LLM stream error ({e}). Falling back.")

        # 2. Local Ollama LLM support
        yield {
            "type": "status",
            "mode": "ollama_live" if is_ollama else "deterministic_fallback",
            "active_model": status_info.get("active_model") if is_ollama else None,
        }

        if is_ollama:
            try:
                payload = {
                    "model": self.OLLAMA_MODEL,
                    "messages": ollama_messages,
                    "stream": True,
                    "options": {
                        "temperature": 0.5,
                        "num_predict": 512,
                    },
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    async with client.stream("POST", f"{self.OLLAMA_BASE_URL}/api/chat", json=payload) as response:
                        if response.status_code == 200:
                            async for raw_line in response.aiter_lines():
                                line = raw_line.strip()
                                if not line:
                                    continue
                                try:
                                    chunk = json.loads(line)
                                    msg = chunk.get("message", {})
                                    token = msg.get("content", "")
                                    if token:
                                        yield {"type": "token", "content": token}
                                    if chunk.get("done", False):
                                        break
                                except json.JSONDecodeError:
                                    continue
                            return
            except Exception as e:
                logger.warning(f"Ollama chat streaming error ({e}). Using deterministic chat fallback.")

        # 3. Comprehensive Deterministic Olympic Biomechanics Engine
        last_msg = messages[-1].get("content", "") if messages else ""
        fallback_text = self._generate_deterministic_chat_reply(
            last_message=last_msg,
            athlete_name=athlete_name,
            current_assessment=current_assessment,
            history_summary=history_summary,
            athlete_profile=athlete_profile,
        )
        words = fallback_text.split(" ")
        for i, word in enumerate(words):
            yield {"type": "token", "content": word + (" " if i < len(words) - 1 else "")}
            await asyncio.sleep(0.015)


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


