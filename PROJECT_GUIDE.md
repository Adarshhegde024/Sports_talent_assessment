# SportSense AI Pro — Full Project Architecture, Engineering & Logic Guide

> **SportSense AI Pro** is an edge-AI athletic talent assessment and biomechanical movement analysis platform. It enables athletes, coaches, and sports academies to record standardized fitness tests using standard smartphone or webcam hardware, extracts real-time kinematic and biometric measurements via on-device computer vision, safeguards testing integrity with anti-proxy biometric proctoring, and recommends optimal sports pathways based on multi-assessment talent identification models.

---

## Table of Contents
1. [Project Overview & Core Mission](#1-project-overview--core-mission)
2. [Complete Technology Stack](#2-complete-technology-stack)
3. [System Architecture & Module Flow](#3-system-architecture--module-flow)
4. [Computer Vision & Edge-AI Kinematics Engine](#4-computer-vision--edge-ai-kinematics-engine)
5. [Two-Phase Biometric Identity & Anti-Malpractice Proctoring](#5-two-phase-biometric-identity--anti-malpractice-proctoring)
6. [Talent Identification & Biomechanical Scoring Logic](#6-talent-identification--biomechanical-scoring-logic)
7. [The 5-Assessment Testing Battery](#7-the-5-assessment-testing-battery)
8. [Comprehensive Talent Report & Offline Certificate](#8-comprehensive-talent-report--offline-certificate)
9. [AI Biomechanics Coach Assistant](#9-ai-biomechanics-coach-assistant)
10. [Database Schema & State Management](#10-database-schema--state-management)
11. [Codebase Directory Structure](#11-codebase-directory-structure)
12. [Local Setup, Environment Variables & Build Pipeline](#12-local-setup-environment-variables--build-pipeline)

---

## 1. Project Overview & Core Mission

### The Problem
Traditional sports talent identification relies on expensive hardware (force plates, 3D optical mocap, photocell timing gates) and subjective visual evaluations by scouts. This creates high barriers of entry for grassroots athletes, school programs, and regional talent pipelines. Additionally, remote video assessments are vulnerable to impersonation, proxy athletes, or tampered submissions.

### The Solution: SportSense AI Pro
SportSense AI Pro delivers Olympic-grade movement analytics and talent scouting directly in the browser:
- **Zero Hardware Requirement**: Runs 100% in-browser on standard smartphones, tablets, or laptops using HTML5 video and WebGL/WASM acceleration.
- **Real-Time Kinematics**: Tracks 33 3D anatomical skeletal landmarks at 60 FPS, calculating joint flexion angles, center-of-mass trajectory, and movement tempo.
- **Anti-Proxy AI Proctoring**: Automatically enrolls the athlete's facial geometry and photo on Assessment #1, and locks down Assessments #2–5 against impersonation or multi-person tampering with a synthesized security siren and 30-second countdown.
- **Multifactor Talent Identification**: Synthesizes results across the 5-test battery into five core athletic traits (Explosive Power, Agility, Balance, Strength, Coordination) to scientifically recommend the sports where the athlete has the highest potential to excel.

---

## 2. Complete Technology Stack

| Layer | Technologies & Libraries | Key Responsibilities |
|---|---|---|
| **Frontend Framework** | **React 19**, **TypeScript 5.8** | Component architecture, modern React 19 hooks, strict typing |
| **Routing & SSR** | **TanStack Start**, **TanStack Router 1.170**, **Nitro 3** | Type-safe file-based routing, SSR hydration, route parameters (`useParams`, `useNavigate`) |
| **Styling & UI Design** | **Tailwind CSS v4**, **Radix UI Primitives**, **Lucide Icons** | Dark/light theme design system, accessible UI primitives (Dialogs, Selects, Drawers, Sheets, Tabs, Progress) |
| **Edge Computer Vision** | **MediaPipe Tasks-Vision 1.0 (`PoseLandmarker`)**, **WebGL/WASM** | 33-point 3D human pose tracking, multi-pose tracking (`numPoses: 3`), skeletal connections, HTML5 Canvas overlay |
| **Audio Synthesis** | **Web Audio API** | Real-time browser-synthesized dual-tone siren alarm (640 Hz to 960 Hz frequency sweep) with zero external audio assets |
| **State & Data Caching** | **TanStack React Query v5**, **React Context API**, **LocalStorage** | Server cache management, real-time invalidation, session state, biometrics persistence |
| **Data Visualization** | **Recharts 2.15**, **Canvas API** | Interactive radar charts, athletic trait bars, progress indicators, printable SVG/canvas outputs |
| **Backend & Database** | **Supabase (PostgreSQL, GoTrue Auth, Storage, RLS)** | Athlete user authentication, profile data, assessment runs, attempts video storage |
| **Build & Tooling** | **Vite 8**, **ESLint 9**, **Prettier 3** | Fast HMR dev server, optimized rollup bundling, code quality enforcement |

---

## 3. System Architecture & Module Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   USER / ATHLETE                                        │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                             AUTHENTICATION & ONBOARDING                                 │
│  - Email / Password / Magic Link / Phone OTP / Google OAuth                             │
│  - Profile Calibration (Height, Age, Gender, Fitness Level, Preferred Sports)          │
│  - Profile Completeness Metric Calculation (0% - 100%)                                  │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ATHLETE DASHBOARD                                     │
│  - Summary of Completed Tests (out of 5 in Battery)                                     │
│  - Athletic Trait Radar Chart (Explosive Power, Agility, Balance, Strength, Coord.)     │
│  - Next Recommended Assessment CTA                                                      │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               STANDARDIZED ASSESSMENT FLOW                              │
│                                                                                         │
│  Step 1: Instructions & Phone Placement Setup (3m distance, lighting, protocol)        │
│  Step 2: Video Mode Check (Live Camera Capture vs File Upload)                         │
│                                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │                    REAL-TIME VISION & PROCTORING PIPELINE                         │  │
│  │                                                                                   │  │
│  │  [Live Video Feed (30-60 FPS)]                                                    │  │
│  │         │                                                                         │  │
│  │         ▼                                                                         │  │
│  │  [MediaPipe PoseLandmarker (numPoses: 3)]                                         │  │
│  │         │                                                                         │  │
│  │         ├───► Joint Angle Math (Knee flexion, Hip alignment, Center of Mass)     │  │
│  │         ├───► Skeletal Mesh Canvas Renderer (Glowing Nodes, Bone Connections)     │  │
│  │         │                                                                         │  │
│  │         ▼                                                                         │  │
│  │  [Biometric Proctoring Engine]                                                    │  │
│  │         ├── Assessment #1: Guarded Face & IPD Biometric Enrollment               │  │
│  │         └── Assessments #2–5: Anti-Proxy & Multi-Person Malpractice Defense      │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                           │                                             │
│  Step 3: Attempt Recording (MediaRecorder API -> WebM Blob)                             │
│  Step 4: Attempt Review & Multilateral Kinematic Upload                                 │
│  Step 5: Dynamic Trait Scoring & Kinematic Computation                                  │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           TALENT SCOUTING & RECOMMENDATION                              │
│  - Individual Assessment Results (/results/:runId)                                      │
│  - Final Comprehensive Talent Report (/talent-report)                                   │
│  - Trait-Weighted Sport Matching Algorithm (Basketball, Volleyball, Football, etc.)    │
│  - 4-Week Structured Practice Roadmap                                                   │
│  - Official Printable Talent Assessment Certificate                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Computer Vision & Edge-AI Kinematics Engine

The core vision subsystem resides in `src/lib/vision/` and `src/components/camera/`:

### A. MediaPipe Tasks-Vision Integration (`pose-detector.ts`)
The `ClientPoseDetector` wraps Google's `@mediapipe/tasks-vision` `PoseLandmarker`:
- **WASM & GPU Acceleration**: Loads official WebAssembly binaries via `FilesetResolver` and configures the GPU delegate for 60 FPS real-time execution.
- **Multi-Pose Detection (`numPoses: 3`)**: Detects up to 3 persons in a single frame to support anti-tampering multi-person checks.
- **Confidence Thresholds**:
  - `minPoseDetectionConfidence: 0.5`
  - `minPosePresenceConfidence: 0.5`
  - `minTrackingConfidence: 0.5`
- **Ghost Detection Filtering**: Discards phantom or noisy detections by verifying that at least 5 anatomical nodes have visibility $\ge 0.35$.

### B. Joint Angle & Kinematic Computations
Joint angles are computed on-the-fly using trigonometric vectors:
$$\theta = \left| \operatorname{atan2}(y_3 - y_2, x_3 - x_2) - \operatorname{atan2}(y_1 - y_2, x_1 - x_2) \right| \times \frac{180}{\pi}$$
- **Knee Angle**: Calculated between `Hip (23/24)`, `Knee (25/26)`, and `Ankle (27/28)`. Used during squats and jumps to measure flexion depth and extension velocity.
- **Center of Mass (CoM)**: Midpoint between Left Hip (`landmark 23`) and Right Hip (`landmark 24`), rendered with a dynamic glowing orb that transitions from emerald to red if movement imbalances or malpractice occur.
- **Full-Body Visibility Validation**: Evaluates head, both hips, knees, and ankles before allowing valid recording countdowns.

---

## 5. Two-Phase Biometric Identity & Anti-Malpractice Proctoring

A signature innovation of SportSense AI Pro is the **Two-Phase Biometric Proctoring Lifecycle** implemented in `athlete-biometrics.ts`, `PoseDetectionOverlay.tsx`, and `assessments.$slug.record.tsx`.

```
                    TWO-PHASE BIOMETRIC LIFECYCLE

        TEST #1                                       TESTS #2, #3, #4, #5
   (ENROLLMENT PHASE)                                  (PROCTORING PHASE)
  
 ┌──────────────────────┐                           ┌──────────────────────────┐
 │ Exactly 1 Person In  │                           │   Continuous Camera      │
 │ Frame for 6+ Frames  │                           │   Detection Loop         │
 └──────────┬───────────┘                           └────────────┬─────────────┘
            │                                                    │
            ▼                                                    ▼
 ┌──────────────────────┐                     ┌──────────────────┴──────────────────┐
 │ Extract IPD Vector   │                     │                                     │
 │ & Face JPEG Snapshot │                     ▼                                     ▼
 └──────────┬───────────┘             [0 Persons in Frame]               [Multiple Persons (>1)]
            │                         - Status: Waiting                   - 2s Analysis Window
            ▼                         - NO MALPRACTICE                    - 🚨 Malpractice Alert
 ┌──────────────────────┐                                                           │
 │ Lock Profile & Sync  │                                                           ▼
 │ Avatar to /profile   │                                                [1 Person in Frame]
 └──────────────────────┘                                                 - Compare Biometric Vector
                                                                          - 2s Analysis Window
                                                                                    │
                                                                   ┌────────────────┴────────────────┐
                                                                   ▼                                 ▼
                                                            [Match >= 76%]                   [Mismatch < 76%]
                                                            - Verified Athlete               - 🚨 Malpractice Alert
                                                            - Green HUD Badge                - Side-by-Side Face Modal
                                                            - Recording Unlocked             - Audio Siren Alarm
                                                                                             - 30s Auto-Abort Timer
```

### 1. Mathematical Biometrics: Inter-Pupillary Distance (IPD) Normalization
To prevent depth and camera-distance bias, facial landmarks are normalized against the **Inter-Pupillary Distance** (distance between left eye and right eye):
$$\text{IPD} = \sqrt{(x_{\text{left}} - x_{\text{right}})^2 + (y_{\text{left}} - y_{\text{right}})^2 + (z_{\text{left}} - z_{\text{right}})^2}$$

The `FacialBiometricVector` extracts 5 scale-invariant ratios:
1. `eyeToNoseRatio`: Distance from inter-eye midpoint to nose tip, divided by IPD.
2. `mouthWidthRatio`: Distance between left mouth corner and right mouth corner, divided by IPD.
3. `noseToMouthRatio`: Distance from nose tip to mouth midpoint, divided by IPD.
4. `faceBreadthRatio`: Distance between left ear tragion and right ear tragion, divided by IPD.
5. `faceHeightRatio`: Composite vertical facial height, divided by IPD.

Weighted similarity scoring:
$$\text{Score} = 0.25 \cdot S_{\text{mouth}} + 0.20 \cdot S_{\text{eye-nose}} + 0.20 \cdot S_{\text{nose-mouth}} + 0.20 \cdot S_{\text{breadth}} + 0.15 \cdot S_{\text{height}}$$

- **Match Threshold**: $\ge 0.76$ (same athlete typically scores $0.84 - 0.98$; different individuals score $< 0.72$).

### 2. Phase 1: Guarded Face & Biometric Enrollment (Assessment #1)
- **Zero Malpractice Triggers**: Proctoring checks are completely deactivated during the first assessment.
- **Empty-Frame Immunity**: If the athlete is not in frame, the profile is **never locked**.
- **Enrollment Condition**: Only when exactly **1 person** is detected with full facial landmarks visible for **6 consecutive frames** is the facial vector and a $128 \times 128$ cropped JPEG thumbnail captured.
- **Profile Synchronization**: The face thumbnail is immediately synchronized to `profile.avatarUrl` in state, localStorage, and Supabase, rendering on `/profile` with a *"Biometric Face ID Enrolled"* badge.

### 3. Phase 2: Anti-Proxy Malpractice Defense (Assessments #2–5)
- **Rule 1: Empty Room (0 Persons)**: Stepping away or adjusting equipment triggers **no alarms**. The HUD displays *"Waiting for athlete..."*.
- **Rule 2: Multiple Persons (>1 Persons)**: If more than one person enters the camera frame, secondary persons are highlighted with amber/red skeletal overlays. If sustained for $\ge 2.0$ seconds, malpractice triggers with: *"Multiple persons detected in camera frame. Only the registered athlete is permitted."*
- **Rule 3: Substitute / Proxy Athlete**: If a different person steps in, the system initiates a **2.0-second analysis window** (*"Analyzing Athlete Identity..."*) before confirming a mismatch.
- **Malpractice Reactions**:
  1. **Side-by-Side Face Modal**: Displays the registered athlete's photo next to the detected unauthorized proxy's live snapshot.
  2. **Synthesized Security Siren**: A continuous dual-tone audio alarm generated directly via the browser's Web Audio API (`MalpracticeSiren`).
  3. **Recording Hard-Lock**: All recording and submission buttons are disabled.
  4. **30-Second Auto-Abort Timer**:
     - *Athlete Returns within 30s*: Siren cuts off, alert dismisses, and recording unlocks.
     - *30s Expire*: Assessment aborts, recorded attempts are deleted, and the user is redirected to `/dashboard`.

---

## 6. Talent Identification & Biomechanical Scoring Logic

In `src/lib/api.ts`, kinematic movement values are transformed into normalized athletic traits and matched against Olympic/elite sports profiles.

### Dynamic Movement Trait Calculation
Every assessment calculates five foundational traits ($0 - 100$ scale):
1. **Explosive Power ($E$)**: Dominated by Vertical Jump height and rapid hip/knee extension velocity.
2. **Agility ($A$)**: Dominated by Side-to-Side Agility contact frequency and change-of-direction speed.
3. **Balance ($B$)**: Dominated by Single-Leg Balance postural stability and minimal sway index.
4. **Strength ($S$)**: Dominated by Squat depth control and Push-Up repetitions.
5. **Coordination ($C$)**: Cross-joint synchronization derived from limb tracking symmetry.

### Sport Suitability Matching Formula
Each sport maintains a weighted profile vector ($W_E, W_A, W_B, W_S, W_C$) and height preference:

| Sport | Primary Weighted Traits | Ideal Height Profile |
|---|---|---|
| **Volleyball** | Explosive Power (45%), Coordination (25%), Agility (15%) | Tall ($\ge 180\text{ cm}$ gives bonus) |
| **Basketball** | Explosive Power (40%), Agility (25%), Coordination (20%) | Tall ($\ge 185\text{ cm}$ gives bonus) |
| **Football (Soccer)**| Agility (35%), Coordination (25%), Explosive Power (20%) | Balanced ($170 - 182\text{ cm}$) |
| **Cricket** | Coordination (35%), Agility (25%), Explosive Power (20%) | Balanced |
| **Badminton** | Agility (40%), Explosive Power (25%), Coordination (25%) | Agile / Lightweight |
| **Tennis** | Agility (30%), Coordination (30%), Strength (20%) | High endurance / upper body |

$$\text{Suitability Score} = \sum_{i} (W_i \times \text{Trait}_i) + \text{HeightAdjustment}$$

---

## 7. The 5-Assessment Testing Battery

```
Assessment 1: Vertical Jump
├── Measures: Explosive displacement (Jump height in cm)
├── Protocol: 3 maximal countermovement jumps
└── Biometrics: Enrolls Athlete Face Profile & IPD Biometrics

Assessment 2: Squat
├── Measures: Knee flexion angle depth & movement tempo
├── Protocol: 5 controlled reps with thighs parallel to floor
└── Biometrics: Proctoring verifies identity against enrolled face

Assessment 3: Single-Leg Balance
├── Measures: Postural sway & stability index
├── Protocol: 30-second single-leg hold per leg
└── Biometrics: Proctoring monitors stability & prevents substitute athlete

Assessment 4: Push-Up
├── Measures: Upper-body muscular strength & chest-to-floor depth
├── Protocol: Maximum valid repetitions in 60 seconds
└── Biometrics: Proctoring checks side-profile face continuity

Assessment 5: Side-to-Side Agility
├── Measures: Lateral change-of-direction speed (Contacts / 20s)
├── Protocol: 3-metre lateral line touches for 20 seconds
└── Biometrics: Proctoring ensures registered athlete performs high-speed drill
```

---

## 8. Comprehensive Talent Report & Offline Certificate

Located at `src/routes/talent-report.tsx`:
- **Definitive Recommendation**: Identifies the athlete's primary sport aptitude and secondary sport alternative.
- **Multidimensional Radar Chart**: Visualizes trait strengths against benchmark profiles.
- **4-Week Structured Practice Roadmap**: Automatically formats a week-by-week progressive training plan tailored to the athlete's identified sport.
- **Official Printable Talent Certificate**:
  - Functions 100% offline via client-side HTML/CSS rendering (`generateOfflineCertificateHtml`).
  - Includes athlete name, biometrics verification status, primary sport recommendation, suitability score, and official date stamp.
  - Can be printed or saved directly as PDF via browser print preview.

---

## 9. AI Biomechanics Coach Assistant

Located at `src/components/coach/AICoachDrawer.tsx`:
- **Interactive Sliding Coach Drawer**: Accessible across any page via the persistent bottom-right Coach action button.
- **Olympic Benchmark Tiers**:
  - *Olympic / Elite Tier*
  - *State / College Tier*
  - *Trained Athlete Tier*
  - *Beginner Tier*
- **Kinematic Tips & Drill Recommendations**: Contextual movement correction, eccentric tempo advice, and plyometric drills tailored to the athlete's lowest-scoring trait.

---

## 10. Database Schema & State Management

### A. Supabase PostgreSQL Schema
- **`profiles` Table**:
  - `id`: UUID (Primary Key, references `auth.users.id`)
  - `full_name`: Text
  - `age`: Integer
  - `height`: Integer (cm)
  - `fitness_level`: Enum (`beginner`, `recreational`, `trained`, `competitive`)
  - `avatar_url`: Text (base64 data URL or storage URI)
  - `disclaimer_accepted`: Boolean
- **`user_sports` Table**: Many-to-many relationship tracking preferred sports.
- **`assessment_runs` Table**:
  - `id`: UUID
  - `user_id`: UUID
  - `assessment_id`: Text (e.g. `vertical-jump`)
  - `status`: Text (`completed`, `processing`, `failed`)
  - `result`: Text (metric readout with unit)

### B. Client-Side Session Context (`assessment-session.tsx`)
- Provides centralized state via React Context:
  - `profile`: Current `AthleteProfile`
  - `isOnboarded`: Boolean (checks $\ge 100\%$ completeness score)
  - `attempts`: Array of `RecordedAttempt` (video blobs, previews, duration)
  - `faceProfile`: `AthleteFaceProfile` (`vector`, `photoDataUrl`, `athleteName`, `enrolledAt`, `isLocked`)
- Automatically falls back to local storage (`sportsense.athlete_face_profile`, `sportsense.profile`) for offline resilience.

---

## 11. Codebase Directory Structure

```
athlete-spark-coach/
├── src/
│   ├── assets/                      # Static imagery (hero, sport banners)
│   ├── components/
│   │   ├── auth/                    # Auth forms, ProtectedRoute guard
│   │   ├── brand/                   # SportSense AI logo & branding
│   │   ├── camera/                  # PoseDetectionOverlay.tsx (Canvas + HUD)
│   │   ├── coach/                   # AICoachDrawer.tsx, CoachContext.tsx
│   │   ├── layout/                  # AppShell.tsx, SiteHeader, SiteFooter
│   │   ├── metrics/                 # MetricBar.tsx (progress & suitability)
│   │   ├── sports/                  # SportsCarousel.tsx
│   │   ├── theme/                   # ThemeToggle.tsx (Dark/Light mode)
│   │   └── ui/                      # Radix UI primitives (Button, Dialog, etc.)
│   ├── data/
│   │   ├── mock.ts                  # Standard assessment definitions & protocols
│   │   └── sports.ts                # Sport catalog & benchmark requirements
│   ├── lib/
│   │   ├── supabase/                # Supabase client instantiation
│   │   ├── vision/
│   │   │   ├── athlete-biometrics.ts # IPD vectors, face comparison & siren
│   │   │   └── pose-detector.ts      # MediaPipe PoseLandmarker wrapper
│   │   ├── api.ts                   # Scoring engine, upload pipeline & report math
│   │   ├── assessment-session.tsx   # Global session & biometrics provider
│   │   ├── auth-context.tsx         # Supabase GoTrue authentication context
│   │   ├── types.ts                 # TypeScript domain interfaces
│   │   └── utils.ts                 # Tailwind cn() merge utilities
│   ├── routes/                      # TanStack file-based routing
│   │   ├── __root.tsx               # Root layout & error boundaries
│   │   ├── index.tsx                # Public landing page
│   │   ├── login.tsx                # Authentication & OAuth sign-in
│   │   ├── onboarding.tsx           # Profile calibration onboarding
│   │   ├── dashboard.tsx            # Athlete dashboard & radar overview
│   │   ├── assessments.index.tsx    # Assessment catalogue overview
│   │   ├── assessments.$slug.index.tsx  # Step 1: Assessment instructions
│   │   ├── assessments.$slug.record.tsx # Step 2: Camera capture & proctoring
│   │   ├── results.$runId.tsx       # Individual assessment run analysis
│   │   ├── talent-report.tsx        # Definitive 5-test talent recommendation
│   │   ├── profile.tsx              # Athlete profile & Face ID badge
│   │   ├── history.tsx              # Historical assessment log
│   │   ├── settings.tsx             # User account settings
│   │   └── reset-password.tsx       # Password recovery flow
│   ├── router.tsx                   # TanStack router instance
│   └── styles.css                   # Tailwind CSS styling & keyframe animations
├── package.json                     # Dependencies & build scripts
├── vite.config.ts                   # Vite configuration with TanStack plugin
└── README.md                        # Project landing guide
```

---

## 12. Local Setup, Environment Variables & Build Pipeline

### Prerequisites
- Node.js $\ge 20$ (Node 22 recommended)
- Modern web browser with WebGL & Camera permissions (Chrome, Edge, Safari, Firefox)

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/Adarshhegde024/Sports_talent_assessment.git

# Enter project directory
cd Sports_talent_assessment

# Install dependencies
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: Dedicated Python / Kinematic Backend URL
# If omitted, defaults to in-browser client kinematics
VITE_API_BASE_URL=
```

### 3. Running Locally
```bash
# Start local development server with HMR
npm run dev
```
Open your browser at `http://localhost:5173` (or network IP for testing with a smartphone camera).

### 4. Production Build & Verification
```bash
# Type check and generate production bundle
npm run build

# Preview production build locally
npm run preview
```

---

*SportSense AI Pro — Engineered with precision for athletic talent discovery.*
