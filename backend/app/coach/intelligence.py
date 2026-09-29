from typing import Dict, Any, List

class AthleticCoachIntelligence:
    """
    Contextual Athletic Intelligence Engine.
    Synthesizes movement kinematics, flight dynamics, and ML predictions
    into structured coaching insights, biomechanical notes, and tailored drills.
    """

    def generate_assessment_report(
        self,
        athlete_name: str,
        jump_height_cm: float,
        flight_time_sec: float,
        explosive_power: int,
        takeoff_velocity: float,
        landing_stability: int,
        symmetry_score: int,
        top_sport: str,
        sport_scores: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        
        name = athlete_name if athlete_name and athlete_name.lower() != "athlete" else "Athlete"

        # Athletic narrative synthesis
        if jump_height_cm >= 55.0:
            power_tier = "Elite Explosive Tier"
            summary_desc = (
                f"Outstanding explosive performance by {name}. Achieving a peak vertical displacement of "
                f"{jump_height_cm} cm with a {flight_time_sec}s flight phase demonstrates rapid rate of force "
                f"development (RFD) and strong stretch-shortening cycle (SSC) efficiency."
            )
        elif jump_height_cm >= 45.0:
            power_tier = "Advanced Athletic Tier"
            summary_desc = (
                f"Strong mechanical power output by {name}. A measured {jump_height_cm} cm vertical jump "
                f"reflects solid lower-body neuromuscular coordination, with an explosive power index of {explosive_power}/100."
            )
        else:
            power_tier = "Developing Power Tier"
            summary_desc = (
                f"Promising baseline established for {name}. The measured {jump_height_cm} cm jump provides "
                f"a calibrated benchmark for progressive plyometric and reactive strength conditioning."
            )

        # Biomechanical observations
        takeoff_notes = (
            f"Takeoff velocity measured at {takeoff_velocity} m/s. Rapid extension through ankles, knees, "
            f"and hips produced efficient upward momentum with {symmetry_score}% bilateral symmetry."
        )
        landing_notes = (
            f"Landing stability scored at {landing_stability}/100. Effective eccentric knee flexion absorbed "
            f"ground reaction forces smoothly with stable joint alignment."
        )

        # Sport match rationale
        sport_rationale = (
            f"Your high explosive power score ({explosive_power}/100) and rapid takeoff velocity make you an exceptional "
            f"match for {top_sport}, where aerial reach, quick transition rebounding, and explosive vertical mechanics "
            f"provide a decisive competitive advantage."
        )

        # Prescribed Drills
        drills = [
            {
                "name": "Depth Jumps (Reactive SSC)",
                "sets": "3 sets × 5 reps",
                "focus": "Step off a 30cm box and immediately explode vertically with minimal ground contact time.",
            },
            {
                "name": "Trap Bar Jumps or Weighted Squat Jumps",
                "sets": "4 sets × 4 reps (20% 1RM)",
                "focus": "Maximizing concentric peak rate of force development through full triple extension.",
            },
            {
                "name": "Banded Terminal Knee Extensions & Single-Leg Landings",
                "sets": "3 sets × 8 reps per leg",
                "focus": "Strengthening eccentric deceleration stability and protecting knee ligaments upon landing.",
            },
        ]

        return {
            "tier": power_tier,
            "summary": summary_desc,
            "takeoff_mechanics": takeoff_notes,
            "landing_mechanics": landing_notes,
            "sport_match_rationale": sport_rationale,
            "prescribed_drills": drills,
        }
