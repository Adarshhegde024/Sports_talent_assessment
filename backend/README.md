# SportSense AI — Backend & AI Engine

Production-grade FastAPI backend for Computer Vision kinematic analysis, multi-model Machine Learning sport suitability scoring, and local athletic intelligence.

---

## 📁 Architecture Overview

```
backend/
├── app/
│   ├── main.py                     # FastAPI application entrypoint & middleware
│   ├── api/
│   │   ├── routes/
│   │   │   ├── health.py           # Healthcheck & engine verification
│   │   │   ├── profile.py          # Authenticated athlete profile endpoints
│   │   │   ├── assessments.py      # Standardized assessment library & session runs
│   │   │   ├── videos.py           # Video attempt upload & CV processing
│   │   │   └── results.py          # Assessment scores & AI coach drill output
│   │   └── dependencies.py         # JWT user extraction & auth guards
│   ├── core/
│   │   ├── config.py               # Application settings & environment vars
│   │   ├── security.py             # Supabase Bearer JWT verification
│   │   └── logging.py              # Structured logging configuration
│   ├── schemas/                    # Pydantic data contract models
│   ├── vision/                     # OpenCV + MediaPipe Kinematic Pose Engine
│   │   ├── pose_detection.py       # Landmark extraction & keypoint tracking
│   │   ├── landmark_processing.py  # Spatial smoothing & joint angle calculations
│   │   ├── vertical_jump.py        # Flight time & jump height physics
│   │   └── feature_extraction.py   # Kinematic feature vectors
│   ├── ml/                         # Multi-Model ML Classification Engine
│   │   └── model_registry.py       # Trained ensemble (Random Forest + Gradient Boosting)
│   └── llm/                        # Athletic Coach Intelligence Engine
│       ├── inference.py            # Local coaching report generation
│       ├── prompts.py              # Biomechanical reasoning prompt templates
│       └── response_formatter.py   # Structured report schema
├── datasets/                       # Raw & processed kinematic data
├── trained_models/                 # Serialized model artifacts
├── tests/                          # Automated Pytest suite
└── requirements.txt                # Python dependencies
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Run the FastAPI Server
```bash
python -m uvicorn backend.app.main:app --port 8000 --reload
```

Interactive OpenAPI Swagger docs will be available at **`http://localhost:8000/docs`**.

### 3. Run Automated Tests
```bash
pytest backend/tests/
```
