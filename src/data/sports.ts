import basketball from "@/assets/sports/basketball.jpg";
import volleyball from "@/assets/sports/volleyball.jpg";
import football from "@/assets/sports/football.jpg";
import cricket from "@/assets/sports/cricket.jpg";
import tennis from "@/assets/sports/tennis.jpg";
import badminton from "@/assets/sports/badminton.jpg";

export interface ShowcaseSport {
  /** Stable key — matches the `sport` field a future ML endpoint will return. */
  id: string;
  name: string;
  image: string;
  description: string;
  attributes: string[];
  /** Reserved for future backend suitability scores (0-100). Unused today. */
  suitability?: number;
}

export const SHOWCASE_SPORTS: ShowcaseSport[] = [
  {
    id: "basketball",
    name: "Basketball",
    image: basketball,
    description: "Repeated maximal jumps and rapid direction changes under fatigue.",
    attributes: ["Explosive Power", "Vertical Jump", "Agility", "Coordination"],
  },
  {
    id: "volleyball",
    name: "Volleyball",
    image: volleyball,
    description: "Short approach jumps combined with fast upper-body reaction timing.",
    attributes: ["Vertical Jump", "Reaction", "Agility", "Body Control"],
  },
  {
    id: "football",
    name: "Football",
    image: football,
    description: "Sustained running load with sharp accelerations and cutting movements.",
    attributes: ["Acceleration", "Agility", "Balance", "Coordination"],
  },
  {
    id: "cricket",
    name: "Cricket",
    image: cricket,
    description: "Short bursts of movement with precise hand-eye timing and stable stance.",
    attributes: ["Reaction", "Coordination", "Agility", "Balance"],
  },
  {
    id: "tennis",
    name: "Tennis",
    image: tennis,
    description: "Lateral court coverage with repeated lunges and quick recovery steps.",
    attributes: ["Agility", "Reaction", "Coordination", "Balance"],
  },
  {
    id: "badminton",
    name: "Badminton",
    image: badminton,
    description: "Very high movement frequency with explosive lunges and overhead work.",
    attributes: ["Agility", "Reaction", "Explosive Movement", "Coordination"],
  },
];
