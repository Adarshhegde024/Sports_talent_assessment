# SportSense AI Pro

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-cyan.svg)](https://react.dev/)
[![TanStack Router](https://img.shields.io/badge/TanStack_Router-1.170-emerald.svg)](https://tanstack.com/router)
[![MediaPipe Tasks-Vision](https://img.shields.io/badge/MediaPipe-Tasks_Vision-orange.svg)](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3ecf8e.svg)](https://supabase.com/)

> **SportSense AI Pro** is a cutting-edge edge-AI athletic talent assessment and biomechanical movement analysis platform. It empowers athletes, coaches, and sports academies to record standardized physical fitness tests using ordinary smartphone or webcam cameras, extracts real-time kinematic measurements using in-browser computer vision, prevents impersonation with biometric anti-proxy proctoring, and recommends optimal sports pathways based on multi-assessment talent identification models.

---

## 📖 Complete Technical Documentation

A full deep-dive architectural and engineering guide is available in **[`PROJECT_GUIDE.md`](./PROJECT_GUIDE.md)**:
- [System Architecture & Flow Diagrams](./PROJECT_GUIDE.md#3-system-architecture--module-flow)
- [Computer Vision & Joint Angle Kinematics Engine](./PROJECT_GUIDE.md#4-computer-vision--edge-ai-kinematics-engine)
- [Two-Phase Biometric Identity & Anti-Proxy Malpractice Proctoring](./PROJECT_GUIDE.md#5-two-phase-biometric-identity--anti-malpractice-proctoring)
- [Talent Identification & Biomechanical Scoring Formulas](./PROJECT_GUIDE.md#6-talent-identification--biomechanical-scoring-logic)
- [The 5-Assessment Standardized Battery](./PROJECT_GUIDE.md#7-the-5-assessment-testing-battery)
- [Offline Certificate Generation](./PROJECT_GUIDE.md#8-comprehensive-talent-report--offline-certificate)
- [Interactive AI Biomechanics Coach Drawer](./PROJECT_GUIDE.md#9-ai-biomechanics-coach-assistant)
- [Database Schema & State Management](./PROJECT_GUIDE.md#10-database-schema--state-management)

---

## 🌟 Key Features

### 1. 100% In-Browser Edge Computer Vision
- Built with **Google MediaPipe Tasks-Vision** `PoseLandmarker` running via WebAssembly and WebGL/GPU acceleration.
- Renders a 60 FPS transparent canvas overlay with glowing anatomical joint nodes, kinematic bone edges, and dynamic Center-of-Mass (CoM) tracking.
- Calculates live joint angles (e.g., knee flexion depth) and full-body spatial positioning.

### 2. Two-Phase Biometric Identity & Anti-Proxy Proctoring
- **Phase 1 (Assessment #1 - Guarded Enrollment)**:
  - Zero false alarms: proctoring comparison is deactivated during Test 1.
  - Automatically captures facial geometry (Inter-Pupillary Distance ratios) and a high-resolution face thumbnail when exactly 1 athlete is stably detected in frame for 6+ consecutive frames.
  - Auto-syncs the enrolled face photo to the athlete's **Profile Section** (`/profile`).
- **Phase 2 (Assessments #2 through #5 - Active Verification)**:
  - **Empty-Room Immunity**: Stepping away or adjusting equipment triggers no alarms.
  - **Multi-Person Tamper Defense**: Detects when more than one person enters the frame (`numPoses: 3`) and triggers malpractice after a 2-second analysis window.
  - **Proxy Athlete Detection**: Evaluates facial biometrics against the baseline. If an unauthorized person is detected, it triggers:
    1. A side-by-side face comparison modal (`Registered Athlete` vs. `Detected Unauthorized Person`).
    2. A synthesized dual-tone Web Audio security siren.
    3. Hard-locked recording controls.
    4. A 30-second recovery countdown (stops siren if original athlete returns; aborts session to `/dashboard` if 30s elapse).

### 3. Standardized 5-Assessment Battery
1. **Vertical Jump** — Explosive lower-body power (flight time and vertical displacement).
2. **Squat** — Knee flexion depth, tempo, and joint alignment.
3. **Single-Leg Balance** — Postural sway and unilateral stability index.
4. **Push-Up** — Upper-body muscular strength and chest-to-floor depth consistency.
5. **Side-to-Side Agility** — Lateral change-of-direction speed and coordination.

### 4. Definitive Talent Discovery & Official Certificate
- Synthesizes all 5 test results into 5 core athletic traits: **Explosive Power**, **Agility**, **Balance**, **Strength**, and **Coordination**.
- Matches performance traits against weighted profiles for **Basketball**, **Volleyball**, **Football**, **Cricket**, **Badminton**, and **Tennis**.
- Generates a **4-Week Structured Practice Roadmap** and an **Official Printable Talent Assessment Certificate** that works completely offline.

### 5. Interactive AI Coach Assistant
- Persistent sliding drawer offering real-time biomechanical guidance.
- Compares athlete measurements against **Olympic/Elite**, **State/College**, and **Trained** benchmark tiers.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, TanStack Start, TanStack Router, Nitro SSR
- **Styling**: Tailwind CSS v4, Radix UI Primitives, Lucide Icons, Sonner Toasts
- **Vision & AI**: MediaPipe Tasks-Vision (GPU/WASM), HTML5 Canvas API
- **Audio Engine**: Web Audio API (Synthesized frequency sweep siren)
- **Backend & Auth**: Supabase (PostgreSQL, GoTrue Auth, Row Level Security)
- **Data Visualization**: Recharts (Radar charts, Trait suitability bars)
- **Tooling**: Vite 8, ESLint, Prettier

---

## 🚀 Getting Started

### Prerequisites
- Node.js $\ge 20$ (Node 22 recommended)
- A modern web browser with camera and WebGL support

### 1. Installation
```bash
git clone https://github.com/Adarshhegde024/Sports_talent_assessment.git
cd Sports_talent_assessment
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run Development Server
```bash
npm run dev
```
Visit `http://localhost:5173` in your browser.

### 4. Production Build
```bash
npm run build
npm run preview
```

---

## 📄 License
This project is open-source under the MIT License.
