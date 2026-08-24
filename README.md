# SportSense AI Pro

Build a professional, modern, responsive web/mobile-first frontend for an AI-powered Sports Talent Assessment Platform.

PROJECT CONCEPT:

The application helps users assess their physical and movement abilities using standardized fitness exercises recorded through a smartphone camera. The system will later use computer vision and machine learning to analyze the recorded videos, extract performance metrics, and recommend sports based on the athlete's characteristics.

IMPORTANT:

For this phase, build ONLY the frontend UI and frontend interaction flow.

Do NOT implement the AI/ML model, pose estimation, LLM, video analysis backend, authentication backend, database, or API integration yet.

Use realistic mock data wherever backend data would eventually be required.

However, structure the frontend cleanly so that a separate backend can easily be connected later through REST APIs.

DESIGN DIRECTION:

Create a premium sports-tech / AI product experience.

The design should feel like a combination of:

- modern fitness application

- professional athlete assessment platform

- AI analytics dashboard

Avoid a generic gym website look.

Use:

- clean modern typography

- strong visual hierarchy

- professional dark/light interface

- subtle gradients

- cards with rounded corners

- clean icons

- meaningful micro-interactions

- smooth transitions

- responsive layouts

- accessible contrast

- mobile-first design

- professional data visualization areas

Do not overuse animations, gradients, glassmorphism, or decorative elements.

The interface should look suitable for a real startup/product and also be appropriate for an academic engineering project demonstration.

APPLICATION NAME:

"SportSense AI"

TAGLINE:

"Discover your athletic potential."

CORE USER FLOW:

1. LANDING / WELCOME PAGE

Create a professional landing page containing:

Hero section:

"Discover Your Athletic Potential"

Supporting text:

"Assess your movement, measure your performance, and discover which sports match your athletic profile."

Primary CTA:

"Start Assessment"

Secondary CTA:

"How It Works"

Include a visual representation of an athlete assessment / movement analysis.

Explain the three-step process:

1. Perform

Record standardized fitness assessments using your smartphone.

2. Analyze

Movement and performance metrics are extracted from your assessment.

3. Discover

Receive personalized sport suitability recommendations.

Add sections for:

- Key Features

- How It Works

- Supported Assessments

- Why SportSense AI

- Privacy / Responsible AI

- Footer

2. USER ONBOARDING

Create a simple onboarding flow that collects:

- Name

- Age

- Gender (optional)

- Height

- Fitness level

- Preferred sports (optional)

Do not collect unnecessary personal information.

Add a clear disclaimer:

"Sport suitability results are recommendations based on assessed performance characteristics and should not be treated as professional medical or sports-selection advice."

3. DASHBOARD

Create a professional athlete dashboard.

Header:

- User profile

- Notifications

- Settings

Main section:

"Good morning, [Name]"

"Ready to assess your performance?"

Show:

Assessment Progress

- Tests completed

- Tests remaining

- Overall assessment progress

Quick Action:

"Start New Assessment"

Recent Assessments:

Show assessment cards with:

- Test name

- Date

- Status

- Result placeholder

Athletic Profile section:

Display placeholder metrics:

- Explosive Power

- Agility

- Balance

- Strength

- Coordination

Use charts/progress indicators but keep them clearly marked as sample/mock data until backend integration.

4. ASSESSMENT SELECTION

Create a page titled:

"Choose an Assessment"

Explain:

"Complete standardized exercises in front of a stationary camera. These assessments will later be analyzed using computer vision."

Create assessment cards for:

A. Vertical Jump

Description:

"Measure explosive lower-body power and vertical jump performance."

Status:

"Available"

B. Squat

Description:

"Assess lower-body movement, stability, depth, and consistency."

Status:

"Coming Soon"

C. Single-Leg Balance

Description:

"Assess balance, stability, and postural control."

Status:

"Coming Soon"

D. Push-Up

Description:

"Assess upper-body strength and movement consistency."

Status:

"Coming Soon"

E. Side-to-Side Agility

Description:

"Assess controlled lateral movement, coordination, and agility."

Status:

"Coming Soon"

Only the Vertical Jump assessment should be fully interactive in this first frontend version.

5. VERTICAL JUMP ASSESSMENT

Create a professional assessment page.

Header:

"Vertical Jump Assessment"

Show:

- Test objective

- Estimated duration

- Number of attempts: 3

- Difficulty: Beginner

Instructions:

"Before you begin"

1. Place your smartphone on a stable surface.

2. Position the camera so your entire body and feet are visible.

3. Stand approximately 2–3 metres from the camera.

4. Make sure the area is well lit.

5. Keep the camera stationary.

6. Perform 3 vertical jumps.

7. Return to the starting position after each attempt.

Add a visual camera-position guide.

Include:

"Camera Setup Check"

Checklist:

✓ Full body visible

✓ Feet visible

✓ Good lighting

✓ Camera stable

✓ Enough space around athlete

CTA:

"Continue to Camera"

6. CAMERA / VIDEO RECORDING SCREEN

Create a professional camera recording interface.

Requirements:

- Camera preview area

- Full-body framing guide

- Recording timer

- Attempt counter

- Start Recording button

- Stop Recording button

- Retake option

Display an overlay guide showing the recommended athlete position.

Example:

"Stand inside the frame"

Show:

"Attempt 1 of 3"

After each successful recording:

"Attempt recorded successfully."

Allow:

- Retake

- Continue

IMPORTANT:

The frontend should only capture/store the video locally or prepare it for future backend upload.

Do not implement actual AI video analysis.

7. VIDEO REVIEW SCREEN

After recording, show:

"Review Your Recording"

Video player with:

- Play/pause

- Timeline

- Volume

- Fullscreen

Show:

"Attempt 1"

Buttons:

"Retake"

"Use This Video"

After selecting:

"Continue to Next Attempt"

After 3 attempts:

"Submit Assessment"

8. ASSESSMENT SUBMISSION

Create a confirmation page:

"Assessment Ready"

Show:

3/3 attempts recorded

Attempt 1 ✓

Attempt 2 ✓

Attempt 3 ✓

Button:

"Submit for Analysis"

For now, after submission show a realistic processing state:

"Preparing your assessment..."

"Your video will be analyzed for movement and performance metrics."

Use a mock loading/progress state.

Do NOT pretend that actual AI analysis is occurring yet.

9. RESULTS PAGE — FRONTEND PLACEHOLDER

Create the complete design for the future results page using MOCK DATA.

Title:

"Your Athletic Assessment"

Show:

Vertical Jump:

48 cm

Attempts:

46 cm

49 cm

49 cm

Average:

48 cm

Performance metrics:

- Explosive Power: 88/100

- Movement Stability: 84/100

- Jump Consistency: 91/100

Create a "Sport Suitability" section.

Example mock data:

Basketball — 92%

Volleyball — 87%

Football — 76%

Athletics — 69%

Clearly label these values:

"Sample Results — AI model not connected"

Create an explanation section:

"Why this recommendation?"

Example:

"Your assessment indicates strong explosive power and agility, which are important characteristics for basketball."

This will later be dynamically generated by the backend/ML model.

10. PROFILE PAGE

Include:

- Personal information

- Assessment history

- Athletic metrics

- Recommended sports

- Settings

11. SETTINGS

Include:

- Profile settings

- App preferences

- Privacy

- Data management

- About the project

12. ASSESSMENT HISTORY

Create a timeline/list of previous assessments:

Date

Assessment

Result

Status

Allow the user to open an assessment and view its results.

TECHNICAL FRONTEND REQUIREMENTS:

- Use a clean component-based architecture.

- Make components reusable.

- Keep pages modular.

- Use mock JSON/data objects instead of hardcoded repeated values.

- Keep all backend-dependent operations abstracted behind service functions.

- Prepare a clear API service layer for future REST API integration.

- Video upload/recording should be implemented in a way that can later send a video file to a Python/FastAPI backend.

- Do not tightly couple UI components to mock data.

- Use proper loading, empty, success, and error states.

- Validate forms.

- Handle camera permission denial gracefully.

- Handle unsupported camera/browser situations gracefully.

- Make the interface responsive for both mobile and desktop.

- Optimize the UI for smartphone usage because the assessment will primarily be performed using a phone camera.

FUTURE BACKEND INTEGRATION:

Design the frontend assuming the future backend will provide APIs such as:

POST /api/assessments

POST /api/assessments/{id}/video

GET /api/assessments/{id}

GET /api/assessments/{id}/results

GET /api/profile

GET /api/assessment-history

Do not implement these APIs now.

Just structure the frontend so they can be connected later.

FUTURE AI PIPELINE:

The frontend should eventually connect to:

Video

→ Pose Estimation

→ Body Landmarks

→ Feature Extraction

→ ML Model

→ Sport Suitability Prediction

→ Local LLM

→ Explanation / AI Sports Coach

Do not implement this pipeline yet.

IMPORTANT PRODUCT PRINCIPLE:

The application should NOT claim that a person is definitively "best" at a sport.

Use terminology such as:

- Sport Suitability

- Performance Profile

- Athletic Potential

- Recommended Sports

Results should be presented as AI-assisted recommendations based on assessed performance characteristics.

FINAL EXPECTATION:

Deliver a polished, professional, production-style frontend prototype with the complete user journey from onboarding → assessment selection → vertical jump instructions → camera recording → video review → submission → mock results.

The frontend should be visually impressive enough for a university project demonstration while being technically structured for future integration with a Python/FastAPI backend, computer vision pipeline, machine learning model, database, and locally hosted LLM.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/45206bb5-ed9d-40e5-97b3-6067cc100754).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
