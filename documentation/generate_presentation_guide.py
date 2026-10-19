import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    Image,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import (
    Drawing,
    Rect,
    String,
    Line,
    Polygon,
    Group,
)

# ----------------------------------------------------------------------
# Numbered Canvas for Two-Pass Dynamic Page Numbering & Header/Footer
# ----------------------------------------------------------------------
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        page_w, page_h = A4

        # Header (Pages 2, 3, 4)
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#065f46")) # Dark emerald
            self.drawString(36, page_h - 26, "SPORTSENSE AI")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748b")) # Slate
            self.drawString(110, page_h - 26, "|   Final-Year Major Project Presentation & Viva Guide")
            
            # Header line
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(36, page_h - 32, page_w - 36, page_h - 32)

        # Footer (All pages)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(36, 32, page_w - 36, 32)

        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(36, 20, "SportSense AI — Biomechanics & Machine Learning Talent Assessment Platform")

        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(page_w - 36, 20, page_str)
        self.restoreState()


# ----------------------------------------------------------------------
# Helper to build vector architecture diagram for Page 2
# ----------------------------------------------------------------------
def create_architecture_diagram():
    # Width: 523pt, Height: 110pt
    d = Drawing(523, 110)

    # Background canvas
    d.add(Rect(0, 0, 523, 110, fillColor=colors.HexColor("#f8fafc"), strokeColor=colors.HexColor("#e2e8f0"), strokeWidth=0.75, rx=6, ry=6))

    # Helper function for drawing boxes
    def draw_box(x, y, w, h, title, subtitle, bg_col, border_col, title_col=colors.white):
        d.add(Rect(x, y, w, h, fillColor=colors.HexColor(bg_col), strokeColor=colors.HexColor(border_col), strokeWidth=0.8, rx=4, ry=4))
        d.add(String(x + w / 2, y + h - 13, title, textAnchor="middle", fontName="Helvetica-Bold", fontSize=7.5, fillColor=title_col))
        if subtitle:
            d.add(String(x + w / 2, y + 6, subtitle, textAnchor="middle", fontName="Helvetica", fontSize=6.2, fillColor=colors.HexColor("#e2e8f0") if title_col == colors.white else colors.HexColor("#64748b")))

    def draw_arrow(x1, y1, x2, y2, color="#059669"):
        d.add(Line(x1, y1, x2, y2, strokeColor=colors.HexColor(color), strokeWidth=1.2))
        # Arrowhead
        if x2 > x1: # Rightward
            d.add(Polygon([x2, y2, x2 - 4, y2 + 2.5, x2 - 4, y2 - 2.5], fillColor=colors.HexColor(color), strokeColor=colors.HexColor(color)))
        elif y1 > y2: # Downward
            d.add(Polygon([x2, y2, x2 - 2.5, y2 + 4, x2 + 2.5, y2 + 4], fillColor=colors.HexColor(color), strokeColor=colors.HexColor(color)))
        elif x1 > x2: # Leftward
            d.add(Polygon([x2, y2, x2 + 4, y2 + 2.5, x2 + 4, y2 - 2.5], fillColor=colors.HexColor(color), strokeColor=colors.HexColor(color)))

    # ROW 1 (Y: 65, Height: 32)
    # 1. Athlete / Web Camera
    draw_box(10, 68, 75, 30, "Athlete / Camera", "30 FPS Video Input", "#0f172a", "#334155")
    draw_arrow(85, 83, 97, 83)

    # 2. React + Vite Frontend
    draw_box(97, 68, 88, 30, "React 18 Frontend", "TanStack + MediaPipe", "#047857", "#059669")
    draw_arrow(185, 83, 197, 83)

    # 3. Vercel Reverse Proxy
    draw_box(197, 68, 80, 30, "Vercel Gateway", "/api/ Rewrite Proxy", "#0284c7", "#0369a1")
    draw_arrow(277, 83, 289, 83)

    # 4. FastAPI Backend (Render)
    draw_box(289, 68, 95, 30, "FastAPI Backend", "Python Async REST", "#0f172a", "#334155")
    draw_arrow(384, 83, 396, 83)

    # 5. OpenCV & MediaPipe
    draw_box(396, 68, 116, 30, "OpenCV & MediaPipe", "33 3D Pose Landmarks", "#d97706", "#b45309")

    # Downward connection from Row 1 to Row 2
    draw_arrow(454, 68, 454, 48)

    # ROW 2 (Y: 12, Height: 32)
    # 6. Biomechanical Kinematics
    draw_box(396, 12, 116, 30, "Kinematics Engine", "Angles, Flight Physics", "#047857", "#059669")
    draw_arrow(396, 27, 384, 27)

    # 7. Scikit-Learn ML Classifier
    draw_box(284, 12, 100, 30, "Multi-Model ML", "Sport Match (GroupKFold)", "#6d28d9", "#5b21b6")
    draw_arrow(284, 27, 272, 27)

    # 8. Ollama / Qwen LLM
    draw_box(172, 12, 100, 30, "Qwen 2.5:3b (LLM)", "AI Coach + Fallback", "#0284c7", "#0369a1")
    draw_arrow(172, 27, 160, 27)

    # 9. Supabase PostgreSQL
    draw_box(75, 12, 85, 30, "Supabase Cloud", "PostgreSQL + RLS", "#0f172a", "#334155")
    draw_arrow(75, 27, 63, 27)

    # 10. Dashboard & Report
    draw_box(10, 12, 53, 30, "Results", "Talent Report", "#047857", "#059669")

    return d


def generate_pdf(output_path: str):
    # Page setup
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    header_title_style = ParagraphStyle(
        "HeaderTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=18,
        textColor=colors.HexColor("#065f46"),
        alignment=0,
    )
    header_subtitle_style = ParagraphStyle(
        "HeaderSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#475569"),
        alignment=0,
    )
    section_h1 = ParagraphStyle(
        "SectionH1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=13,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=0,
        spaceAfter=3,
        keepWithNext=True,
    )
    section_h2 = ParagraphStyle(
        "SectionH2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#065f46"),
        spaceBefore=2,
        spaceAfter=2,
        keepWithNext=True,
    )
    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.6,
        leading=10.2,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=1,
        spaceAfter=2,
    )
    body_bold = ParagraphStyle(
        "BodyDarkBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.6,
        leading=10.2,
        textColor=colors.HexColor("#0f172a"),
    )
    bullet_style = ParagraphStyle(
        "BulletText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.4,
        leading=9.8,
        textColor=colors.HexColor("#1e293b"),
        leftIndent=10,
        firstLineIndent=-6,
        spaceBefore=1,
        spaceAfter=1,
    )
    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.2,
        leading=9.4,
        textColor=colors.HexColor("#1e293b"),
    )
    table_cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.2,
        leading=9.4,
        textColor=colors.HexColor("#0f172a"),
    )
    script_style = ParagraphStyle(
        "ScriptText",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=7.2,
        leading=9.4,
        textColor=colors.HexColor("#047857"),
    )
    badge_style = ParagraphStyle(
        "BadgeText",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=6.5,
        leading=8,
        textColor=colors.white,
    )

    story = []

    # ==================================================================
    # PAGE 1: PROJECT OVERVIEW & SCOPE
    # ==================================================================
    # Header Banner Box
    banner_data = [
        [
            Paragraph("<b>SPORTSENSE AI</b> — Biomechanical Movement & Sports Talent Assessment", header_title_style),
        ],
        [
            Paragraph("<b>Major Project Presentation & Viva Guide</b> | Department of Computer Science & Engineering | Academic Year 2025–2026", header_subtitle_style),
        ]
    ]
    banner_table = Table(banner_data, colWidths=[523])
    banner_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f0fdf4")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#86efac")),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 7),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 6))

    # 2-Minute College Presentation Intro Callout
    intro_box = [
        [
            Paragraph("<b>2-Minute Project Elevator Pitch (For College Presentation Opening):</b><br/><i>\"Respected evaluators, modern sports academies rely on expensive force plates and 3D motion-capture laboratories costing lakhs of rupees, making scientific talent assessment inaccessible to 95% of grassroots and school athletes. SportSense AI solves this problem by using standard smartphone and webcam video to capture 33 human anatomical landmarks in real-time with MediaPipe and OpenCV. By extracting kinematic physics parameters across five standardized assessments, classifying athletic suitability across six sports with machine learning, and delivering natural-language coaching via an LLM, our system provides objective, democratized athletic talent identification without any specialized hardware.\"</i>", script_style)
        ]
    ]
    intro_table = Table(intro_box, colWidths=[523])
    intro_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#cbd5e1")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(intro_table)
    story.append(Spacer(1, 7))

    # Section 1 & 2: Problem Statement & Proposed Solution (Two Columns)
    col1_text = """
    <b>1. Problem Statement</b><br/>
    • <b>High Barrier to Entry:</b> Professional biomechanical labs (Vicon, force plates) require proprietary hardware costing over $20,000.<br/>
    • <b>Subjective Scouting:</b> Physical education teachers and school coaches rely on manual stopwatches and eyeball observations, introducing human bias.<br/>
    • <b>Unidentified Talent:</b> Rural and semi-urban athletes lack access to scientific sport recommendations matching their natural kinematic strengths.
    """
    col2_text = """
    <b>2. Proposed Solution</b><br/>
    • <b>Commodity Hardware:</b> Works on standard 30 FPS webcams and mobile phones with zero external sensors.<br/>
    • <b>Deterministic Kinematics:</b> Measures true physics metrics (flight time, joint flexion angles, balance sway, agility transition velocity).<br/>
    • <b>Multi-Model AI Guidance:</b> Combines scikit-learn classification for multi-sport fit scoring with local Ollama Qwen2.5:3b for athlete coaching.
    """
    two_col_table = Table([
        [Paragraph(col1_text, body_style), Paragraph(col2_text, body_style)]
    ], colWidths=[258, 258])
    two_col_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(two_col_table)
    story.append(Spacer(1, 7))

    # Section 3: The 5 Standardized Biomechanical Assessments (Table)
    story.append(Paragraph("<b>3. The Five Supported Biomechanical Assessment Protocols (Verified in Codebase)</b>", section_h1))
    assessments_data = [
        [
            Paragraph("<b>Assessment Protocol</b>", table_cell_bold),
            Paragraph("<b>Physical Trait Measured</b>", table_cell_bold),
            Paragraph("<b>Computer Vision Landmark Method</b>", table_cell_bold),
            Paragraph("<b>Primary Metric & Unit</b>", table_cell_bold),
        ],
        [
            Paragraph("<b>Vertical Jump</b>", table_cell_bold),
            Paragraph("Explosive Power", table_cell_style),
            Paragraph("Hip center-of-mass trajectory; takeoff & landing detection", table_cell_style),
            Paragraph("Flight Time (s) & Jump Height (cm)", table_cell_style),
        ],
        [
            Paragraph("<b>Squat Assessment</b>", table_cell_bold),
            Paragraph("Strength & Hip Mobility", table_cell_style),
            Paragraph("Knee flexion angle (Hip-Knee-Ankle); depth vs hip plane", table_cell_style),
            Paragraph("Min Knee Flexion (deg) & Depth Score", table_cell_style),
        ],
        [
            Paragraph("<b>Single-Leg Balance</b>", table_cell_bold),
            Paragraph("Stability & Balance", table_cell_style),
            Paragraph("Center-of-mass sway variance over 15–30s hold period", table_cell_style),
            Paragraph("Stability Index (%) & Trunk Sway", table_cell_style),
        ],
        [
            Paragraph("<b>Push-Up</b>", table_cell_bold),
            Paragraph("Upper-Body Endurance", table_cell_style),
            Paragraph("Elbow angle state-machine tracking (UP → DOWN → UP)", table_cell_style),
            Paragraph("Completed Repetitions & Form Integrity", table_cell_style),
        ],
        [
            Paragraph("<b>Side-to-Side Agility</b>", table_cell_bold),
            Paragraph("Agility & Lateral Speed", table_cell_style),
            Paragraph("Lateral hip displacement past left/right boundary thresholds", table_cell_style),
            Paragraph("Direction Switches & Transition Time (s)", table_cell_style),
        ],
    ]
    assess_table = Table(assessments_data, colWidths=[95, 95, 203, 130])
    assess_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#065f46")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    for row_idx in range(len(assessments_data)):
        if row_idx == 0:
            for col_idx in range(4):
                assessments_data[row_idx][col_idx].style.textColor = colors.white
    story.append(assess_table)
    story.append(Spacer(1, 7))

    # Section 4: Project Objectives & Intended Users
    obj_users_data = [
        [
            Paragraph("<b>Key Project Objectives</b><br/>"
                      "1. Eliminate requirement for lab hardware by using 2D RGB video.<br/>"
                      "2. Deliver objective kinematics in &lt;3 seconds per video test.<br/>"
                      "3. Multi-model ML classification across 6 Olympic sports.<br/>"
                      "4. Synthesize personalized natural-language AI coaching drills.", body_style),
            Paragraph("<b>Target End-Users</b><br/>"
                      "• <b>School Athletes:</b> Track personal developmental milestones.<br/>"
                      "• <b>Coaches & P.E. Teachers:</b> Rapid screening of large squads.<br/>"
                      "• <b>Sports Academies:</b> Unbiased metric-driven scout shortlisting.<br/>"
                      "• <b>Parents:</b> Discover children's sports suitability early.", body_style),
        ]
    ]
    obj_users_table = Table(obj_users_data, colWidths=[258, 258])
    obj_users_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f0fdf4")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#86efac")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(obj_users_table)
    story.append(Spacer(1, 5))

    # Verified Implementation Status Box
    status_text = "<b>Verified Implementation Status:</b> Full-stack system is live and verified. Frontend is deployed on <b>Vercel Edge</b>; FastAPI backend is deployed on <b>Render Linux</b>; Auth & Database are managed on <b>Supabase Cloud</b>. Video capture works via WebRTC camera and file upload with client-to-backend reverse proxy routing."
    story.append(Paragraph(status_text, body_style))

    # Page Break to Page 2
    story.append(PageBreak())

    # ==================================================================
    # PAGE 2: SYSTEM ARCHITECTURE & WORKING
    # ==================================================================
    story.append(Paragraph("<b>2. System Architecture & End-to-End Technical Working</b>", section_h1))
    story.append(Paragraph("The SportSense AI architecture decouples browser video capture, asynchronous computer vision processing, scikit-learn machine learning, and natural language generation:", body_style))
    story.append(Spacer(1, 4))

    # Embedded High-Resolution System Architecture Diagram Image
    diag_img = os.path.join(os.getcwd(), "documentation", "system_architecture_diagram.png")
    if os.path.exists(diag_img):
        story.append(Image(diag_img, width=523, height=200))
    else:
        story.append(create_architecture_diagram())
    story.append(Spacer(1, 5))

    # Technical Components Explanation (Grid)
    story.append(Paragraph("<b>Technical Stack Breakdown (Explained in Plain English)</b>", section_h2))
    tech_stack_data = [
        [
            Paragraph("<b>Component</b>", table_cell_bold),
            Paragraph("<b>Technology Used</b>", table_cell_bold),
            Paragraph("<b>Exact Role in the Application</b>", table_cell_bold),
        ],
        [
            Paragraph("<b>Frontend UI</b>", table_cell_bold),
            Paragraph("React 18, Vite, TanStack Router, Tailwind", table_cell_style),
            Paragraph("Renders responsive athlete interface, manages camera stream via <code>getUserMedia</code>, draws live skeleton canvas overlay, and presents dynamic Radar charts.", table_cell_style),
        ],
        [
            Paragraph("<b>Backend API</b>", table_cell_bold),
            Paragraph("FastAPI, Uvicorn, Python 3.11+", table_cell_style),
            Paragraph("Asynchronous REST service. Accepts multipart video uploads, handles temporary streaming buffers, orchestrates vision pipelines, and exposes modular API endpoints.", table_cell_style),
        ],
        [
            Paragraph("<b>Computer Vision</b>", table_cell_bold),
            Paragraph("OpenCV (<code>cv2</code>) &amp; MediaPipe Pose", table_cell_style),
            Paragraph("Extracts 33 anatomical landmarks (x, y, z, visibility) per frame at 30 FPS. Calculates joint angles and applies optical flow fallback if keypoints are obscured.", table_cell_style),
        ],
        [
            Paragraph("<b>Database &amp; Auth</b>", table_cell_bold),
            Paragraph("Supabase Cloud (PostgreSQL 15)", table_cell_style),
            Paragraph("Stores profiles, runs, attempts, and results across 8 relational tables. Implements Row-Level Security (RLS) and handles Google OAuth and Email authentication.", table_cell_style),
        ],
        [
            Paragraph("<b>Machine Learning</b>", table_cell_bold),
            Paragraph("Scikit-Learn (LogisticRegression, GroupKFold)", table_cell_style),
            Paragraph("Evaluated 6 classifiers (LR, Random Forest, SVM, KNN, Naive Bayes, XGBoost). Best model maps 5 kinematic traits to multi-sport probability distributions.", table_cell_style),
        ],
        [
            Paragraph("<b>AI Coaching LLM</b>", table_cell_bold),
            Paragraph("Ollama (Qwen2.5:3b) + Deterministic Fallback", table_cell_style),
            Paragraph("Generates structured coaching summaries, athletic strengths, and specific training drills. Automatically falls back to calibrated biomechanical rules if offline.", table_cell_style),
        ],
        [
            Paragraph("<b>Deployment</b>", table_cell_bold),
            Paragraph("Vercel (Frontend) &amp; Render (Backend)", table_cell_style),
            Paragraph("Frontend served at global edge with reverse proxy rewrite (<code>/api/*</code>). Backend containerized on Linux cloud with OpenCV libraries and CORS integration.", table_cell_style),
        ],
    ]
    tech_table = Table(tech_stack_data, colWidths=[90, 140, 293])
    tech_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("PADDING", (0, 0), (-1, -1), 3.5),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    for col_idx in range(3):
        tech_stack_data[0][col_idx].style.textColor = colors.white
    story.append(tech_table)
    story.append(Spacer(1, 6))

    # Crucial Distinction Section (CV vs ML vs LLM & Deterministic vs Predicted)
    distinction_data = [
        [
            Paragraph("<b>CRITICAL VIVA DISTINCTION — CV vs. ML vs. LLM:</b><br/>"
                      "• <b>Computer Vision (OpenCV + MediaPipe):</b> <i>Observes &amp; Measures.</i> Detects physical keypoints and derives raw kinematic metrics (e.g., flight time = 0.58s, knee angle = 88°).<br/>"
                      "• <b>Machine Learning (Scikit-Learn Classifier):</b> <i>Pattern Recognizes &amp; Classifies.</i> Maps the 5 normalized physical traits (Explosive Power, Strength, Balance, Agility, Coordination) to the top matching sport among Basketball, Volleyball, Football, Tennis, Badminton, and Cricket.<br/>"
                      "• <b>Large Language Model (Ollama / Qwen2.5):</b> <i>Explains &amp; Communicates.</i> Synthesizes measurements into plain-English coaching advice. <b>The LLM never directly measures movement!</b>", body_style)
        ]
    ]
    dist_table = Table(distinction_data, colWidths=[523])
    dist_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eff6ff")), # Light blue
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#93c5fd")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(dist_table)
    story.append(Spacer(1, 6))

    # Concrete End-to-End Walkthrough Example (Vertical Jump)
    walkthrough_text = """
    <b>Concrete Example: How an Uploaded Vertical Jump Video Becomes a Talent Assessment Result:</b><br/>
    <b>1. Video Input:</b> Athlete records a jump; video is posted to <code>/api/assessments/analyze-movement</code>.<br/>
    <b>2. Landmark Tracking:</b> OpenCV samples frames at 30 FPS; MediaPipe Pose identifies landmarks #23 and #24 (Hips) as Center of Mass (COM).<br/>
    <b>3. Kinematic Physics:</b> Temporal analysis identifies takeoff frame (COM begins ascending) and landing frame (COM impacts baseline). Measured flight time: <code>t_flight = 0.58 s</code>. Flight gravity equation: <code>h = (1/8) * g * (t_flight)^2 = (1/8) * 9.80665 * (0.58)^2 = 41.2 cm</code>.<br/>
    <b>4. Trait Vector Synthesis:</b> 41.2 cm jump scales to <code>Explosive Power = 88/100</code>; combined with other baseline scores into a 5-feature vector.<br/>
    <b>5. ML Classification:</b> Logistic Regression model predicts top sport match: <code>Basketball (88%)</code>, followed by <code>Volleyball (84%)</code>.<br/>
    <b>6. LLM Coaching:</b> Qwen2.5:3b outputs actionable guidance: <i>\"Alex demonstrated strong vertical impulse. To increase apex height, focus on deepening your eccentric countermovement and explosive ankle plantarflexion.\"</i>
    """
    example_table = Table([[Paragraph(walkthrough_text, body_style)]], colWidths=[523])
    example_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(example_table)

    # Page Break to Page 3
    story.append(PageBreak())

    # ==================================================================
    # PAGE 3: TEAM DIVISION & PRESENTATION ROLES
    # ==================================================================
    story.append(Paragraph("<b>3. Team Presentation Division & Viva Responsibilities (4 Members)</b>", section_h1))
    story.append(Paragraph("The project is divided into four balanced, technically robust modules. Each member covers their exact domain:", body_style))
    story.append(Spacer(1, 4))

    # Member 1 & Member 2 in 2 Columns or Stacked Cards
    # Let's create compact cards for each member
    def build_member_card(title, role_desc, tech_list, script_text, viva_qas):
        content = [
            Paragraph(f"<b>{title}</b> — <font color='#065f46'>{role_desc}</font>", section_h2),
            Paragraph(f"<b>Core Technologies:</b> {tech_list}", body_style),
            Paragraph(f"<b>Presentation Script (1.5 Minutes):</b><br/><i>\"{script_text}\"</i>", script_style),
            Paragraph("<b>Targeted Viva Questions &amp; Clear Answers:</b>", body_bold),
        ]
        for q, a in viva_qas:
            content.append(Paragraph(f"• <b>Q: {q}</b><br/>&nbsp;&nbsp;<b>A:</b> {a}", bullet_style))
        
        card_table = Table([[content]], colWidths=[523])
        card_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#cbd5e1")),
            ("PADDING", (0, 0), (-1, -1), 4.5),
        ]))
        return card_table

    # MEMBER 1
    m1_card = build_member_card(
        "MEMBER 1",
        "Frontend Engineering, UI/UX, Camera Capture & Authentication",
        "React 18, TypeScript, TanStack Router, Tailwind CSS, Lucide Icons, MediaDevices Web API, Sonner.",
        "I was responsible for the client-side user experience, authentication workflows, and real-time camera interfaces. Our frontend is structured using TanStack Router for type-safe routing. We implemented Google OAuth with auto-profile sync and Email/Password authentication. When an athlete begins an assessment, our interface uses HTML5 MediaDevices to stream 30 FPS video, displays live positioning guides and countdown overlays, captures video buffers, and posts them to our backend while displaying interactive Radar charts and talent breakdown reports.",
        [
            ("Why did you choose TanStack Router over standard React Router?",
             "TanStack Router provides 100% type-safe route parameters, automatic search-param validation, and built-in code-splitting without runtime navigation crashes."),
            ("How does video recording work directly inside the browser?",
             "We access the user's camera using <code>navigator.mediaDevices.getUserMedia</code>, render the stream onto an HTML5 <code>&lt;video&gt;</code> element, and capture compressed video blobs using the <code>MediaRecorder</code> API before transmitting to the FastAPI server."),
        ]
    )
    story.append(m1_card)
    story.append(Spacer(1, 5))

    # MEMBER 2
    m2_card = build_member_card(
        "MEMBER 2",
        "Backend Architecture, PostgreSQL Database & Cloud Deployment",
        "FastAPI, Python 3.11, Uvicorn, Supabase (PostgreSQL 15), Row-Level Security (RLS), Docker, Render, Vercel.",
        "I managed the backend infrastructure, database design, and cloud deployment pipelines. I built a modular asynchronous REST backend using FastAPI and Pydantic schemas. I designed our Supabase PostgreSQL schema spanning 8 relational tables—including profiles, assessments, attempts, and talent reports—protected by Row-Level Security policies. To deploy, I containerized the backend on Render Linux and configured Vercel edge reverse proxying to route <code>/api/*</code> requests seamlessly without CORS issues.",
        [
            ("Why choose FastAPI instead of traditional Flask or Django?",
             "FastAPI is natively asynchronous (ASGI), allowing high-concurrency video uploads without thread blocking. It also provides automatic OpenAPI Swagger documentation and automatic Pydantic request validation."),
            ("How is database security enforced between different athletes?",
             "We use Supabase PostgreSQL Row-Level Security (RLS). Database policies check the JWT <code>auth.uid()</code>, ensuring athletes can only query and mutate their own assessment attempts and medical profiles."),
        ]
    )
    story.append(m2_card)
    story.append(Spacer(1, 5))

    # MEMBER 3
    m3_card = build_member_card(
        "MEMBER 3",
        "Computer Vision, Pose Tracking & Biomechanical Feature Extraction",
        "OpenCV (cv2), MediaPipe Pose (33 Landmarks), NumPy, Trigonometric Kinematics, Moving Average Smoothing.",
        "My focus was the computer vision pipeline that transforms video frames into biomechanical metrics. We integrate MediaPipe Pose to track 33 3D anatomical keypoints at 30+ FPS. For each of the five assessments, I implemented specialized kinematic extraction: flight-time physics for Vertical Jump, trigonometric knee flexion angles for Squat depth, center-of-mass sway variance for Single-Leg Balance, elbow state machines for Push-Up counting, and lateral bounding threshold checks for Agility.",
        [
            ("Why use MediaPipe Pose instead of heavy models like YOLOv8-pose or OpenPose?",
             "MediaPipe Pose is optimized for lightweight CPU execution, running at 30+ FPS in real-time with low latency, whereas OpenPose and YOLO require dedicated GPUs that are inaccessible for commodity deployments."),
            ("How do you calculate jump height without knowing camera distance?",
             "We use flight-time projectile physics: <code>h = (1/8) * g * (t_flight)^2</code>. By identifying the exact takeoff frame and landing frame, flight time is independent of camera distance, focal length, or pixel perspective."),
        ]
    )
    story.append(m3_card)
    story.append(Spacer(1, 5))

    # MEMBER 4
    m4_card = build_member_card(
        "MEMBER 4",
        "Machine Learning Classification, Local LLM Integration & Talent Synthesis",
        "Scikit-Learn, Joblib, GroupKFold Validation, Ollama, Qwen2.5:3b LLM, Multi-Sport Scoring Engine.",
        "I was responsible for training our multi-sport classification models, integrating our local LLM coaching engine, and synthesizing the final Talent Report. I benchmarked six machine learning models using subject-independent 5-fold GroupKFold validation to prevent data leakage. Logistic Regression achieved the highest balanced F1-score of 53.12% across 6 sports. I integrated local Ollama running Qwen2.5:3b to stream personalized drills, with an automatic deterministic Olympic fallback engine if offline.",
        [
            ("Why did Logistic Regression beat complex models like Random Forest and XGBoost?",
             "With five normalized continuous athletic traits, complex tree ensembles overfit on small sample sizes. Logistic Regression provided superior generalization, zero data leakage, and well-calibrated class probabilities."),
            ("What happens if Ollama or the local LLM server is not running during a demo?",
             "The system features an automated deterministic Olympic Biomechanics fallback engine that parses the measured kinematics and generates structured coaching observations with zero latency, guaranteeing 100% uptime."),
        ]
    )
    story.append(m4_card)

    # Page Break to Page 4
    story.append(PageBreak())

    # ==================================================================
    # PAGE 4: DEMO FLOW, LIMITATIONS & COMPREHENSIVE VIVA Q&A
    # ==================================================================
    story.append(Paragraph("<b>4. Live Demonstration Flow, System Limitations &amp; Master Viva Q&amp;A</b>", section_h1))
    story.append(Spacer(1, 2))

    # Live Demo Walkthrough (Step-by-step box)
    demo_steps = """
    <b>Step-by-Step Live Demonstration Protocol (Follow this during Project Viva):</b><br/>
    <b>1. Authentication:</b> Open <code>https://sports-talent-assessment-green.vercel.app/login</code>. Show Google OAuth sign-in or Email/Password registration. Explain how newly registered users are redirected to Sign In with pre-filled credentials.<br/>
    <b>2. Athlete Dashboard:</b> Point out completed assessment metrics, athlete anthropometrics (height, age), and the recommended next session.<br/>
    <b>3. Launch Assessment:</b> Open <i>Vertical Jump</i> protocol. Show camera positioning instructions and distance calibration guidelines.<br/>
    <b>4. Video Capture:</b> Select webcam recording or upload test clip. Show the 3-second countdown and execution buffer.<br/>
    <b>5. Processing &amp; Kinematics:</b> Highlight backend video analysis completion in &lt;3 seconds, extracting flight time (e.g. 0.58s) and jump height (41.2 cm).<br/>
    <b>6. Machine Learning Sport Fit:</b> Display radar chart and ML sport probability ranks (Basketball #1, Volleyball #2).<br/>
    <b>7. AI Coaching Guidance:</b> Show structured feedback generated by Ollama/Qwen (Kinematic summary, Strengths, Corrective drill).<br/>
    <b>8. Talent Report:</b> Navigate to <code>/talent-report</code> to demonstrate the holistic 5-trait athletic profile report.
    """
    demo_table = Table([[Paragraph(demo_steps, body_style)]], colWidths=[523])
    demo_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f0fdf4")),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#86efac")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(demo_table)
    story.append(Spacer(1, 5))

    # Project Strengths & Limitations (Two columns)
    strengths_text = """
    <b>Project Strengths &amp; Innovations:</b><br/>
    • <b>Zero Hardware Cost:</b> Replaces multi-lakh lab rigs with standard smartphone cameras.<br/>
    • <b>True Biomechanical Physics:</b> Jump equations based on gravitational acceleration (g = 9.81 m/s²).<br/>
    • <b>Zero Data Leakage:</b> ML trained with 5-Fold GroupKFold cross-validation.<br/>
    • <b>Resilient Fallback:</b> Guaranteed uptime even when local LLM server is unavailable.
    """
    limitations_text = """
    <b>Current Limitations &amp; Future Scope:</b><br/>
    • <b>Frame Rate Sensitivity:</b> 30 FPS video yields a ±16.6ms temporal granularity (approx ±1.5 cm jump error). 60 FPS mobile capture recommended.<br/>
    • <b>Single 2D View:</b> Extreme camera tilt or loose clothing can occlude joint landmarks. Future: Multi-view 3D triangulation.<br/>
    • <b>Edge Inference:</b> Future version will port MediaPipe &amp; ONNX ML directly to WebAssembly for zero-server mobile processing.
    """
    str_lim_table = Table([
        [Paragraph(strengths_text, body_style), Paragraph(limitations_text, body_style)]
    ], colWidths=[258, 258])
    str_lim_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(str_lim_table)
    story.append(Spacer(1, 5))

    # Comprehensive Viva Q&A (High-Probability Questions)
    story.append(Paragraph("<b>Top Master Viva Questions &amp; Grounded Technical Answers</b>", section_h2))

    master_viva = [
        ("Why does the system calculate Vertical Jump from flight time rather than pixel displacement?",
         "Pixel displacement is distorted by camera-to-athlete distance, lens focal length, and optical distortion. In contrast, gravitational acceleration (9.81 m/s²) is constant on Earth. By detecting flight duration t, height h = (1/8)*g*t² is mathematically exact regardless of zoom or distance."),
        ("What is the exact role of OpenCV vs. MediaPipe?",
         "OpenCV handles low-level computer vision: reading video containers, frame decoding, color-space conversions (BGR to RGB), and optical flow motion fallbacks. MediaPipe Pose runs the deep neural network that detects the 33 anatomical 3D coordinates from those image frames."),
        ("What database architecture was chosen and why?",
         "Supabase PostgreSQL was chosen over NoSQL because biomechanical sessions are deeply relational (Users → Profiles → Assessments → Runs → Attempts → Results). PostgreSQL enforces foreign key cascades, JSONB flexibility for raw keypoints, and Row-Level Security."),
        ("Why did you benchmark 6 ML models instead of just using a Neural Network?",
         "Tabular kinematic data with 5 continuous features does not justify deep neural networks, which easily overfit small clinical datasets. By benchmarking Logistic Regression, Random Forest, SVM, KNN, Naive Bayes, and XGBoost under 5-Fold GroupKFold, we empirically proved Logistic Regression provides the highest generalization F1-score (53.12%)."),
        ("Can the Large Language Model (Qwen2.5) hallucinate false measurements?",
         "No. The LLM is strictly constrained via prompt engineering to receive already-calculated kinematics (jump height, angles, scores) as static input context. It only translates pre-computed numerical facts into natural-language coaching tips; it never computes numerical values itself."),
        ("How does the production application handle video upload timeouts on cloud hosting?",
         "The FastAPI backend processes videos asynchronously using memory-efficient temporary file buffers and deletes raw video files immediately after landmark extraction to maintain zero persistent storage overhead and preserve athlete privacy."),
    ]

    viva_rows = []
    for q, a in master_viva:
        viva_rows.append([
            Paragraph(f"<b>Q: {q}</b><br/><b>A:</b> {a}", bullet_style)
        ])
    
    viva_table = Table(viva_rows, colWidths=[523])
    viva_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("PADDING", (0, 0), (-1, -1), 3.5),
    ]))
    story.append(viva_table)

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF at: {output_path}")


if __name__ == "__main__":
    out_dir = os.path.join(os.getcwd(), "documentation")
    os.makedirs(out_dir, exist_ok=True)
    pdf_filename = "SportSense_AI_Major_Project_Presentation_Guide.pdf"
    full_path = os.path.join(out_dir, pdf_filename)
    generate_pdf(full_path)
