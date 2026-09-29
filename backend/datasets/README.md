# SportSense AI — Athletic Datasets

This directory contains datasets used for training and evaluating the Machine Learning Sport Suitability Classifiers.

---

## 📁 Structure

```
backend/datasets/
├── raw/            # Raw athletic jump video annotations and landmark coordinate timeseries
├── processed/      # Extracted kinematic feature matrices (CSV / Parquet)
└── README.md       # Dataset provenance, schema, and collection guidelines
```

---

## 📊 Feature Matrix Specification

- `jump_height_cm` (float): Gravitational flight-time vertical elevation in centimeters
- `flight_time_sec` (float): Duration airborne between takeoff and landing in seconds
- `explosive_power` (int): Normalized lower-body power score (0–100)
- `takeoff_velocity` (float): Velocity at takeoff in m/s ($v = g \cdot \frac{t_{\text{flight}}}{2}$)
- `athlete_height_cm` (float): Athlete height in cm
- `age` (float): Athlete age in years
- `symmetry_score` (float): Left/right takeoff and landing balance percentage
- `sport_label` (int): Target classification index (0: Basketball, 1: Volleyball, 2: Football, 3: Tennis, 4: Badminton, 5: Cricket)

---

## 🛡️ Data Splitting Rule
All model training MUST use **Subject-Independent Group Splitting** (`GroupKFold` by `athlete_id`) to prevent data leakage across multiple attempts by the same athlete.
