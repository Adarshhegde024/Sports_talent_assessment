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

