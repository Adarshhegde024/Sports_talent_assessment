import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.path import Path

def generate_architecture_diagram(output_path: str):
    fig, ax = plt.subplots(figsize=(14, 7.8), dpi=300)
    fig.patch.set_facecolor('#0f172a') # Dark slate background
    ax.set_facecolor('#0f172a')

    # Remove all axis borders and ticks
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 7.8)
    ax.axis('off')

    # Title header
    ax.text(7.0, 7.4, "SPORTSENSE AI — SYSTEM ARCHITECTURE & DATA PIPELINE", 
            ha='center', va='center', fontsize=15, fontweight='bold', color='#34d399', fontfamily='sans-serif')
    ax.text(7.0, 7.05, "Decoupled End-to-End Processing: Browser Ingestion ➔ Asynchronous CV ➔ ML Classification ➔ LLM Coaching ➔ Supabase Storage", 
            ha='center', va='center', fontsize=9, color='#94a3b8', fontfamily='sans-serif')

    # Helper function for drawing rounded boxes with subtitles and badges
    def draw_component(x, y, w, h, title, subtitle, detail, fill_color, border_color, badge_text=""):
        # Shadow
        shadow = patches.FancyBboxPatch((x + 0.05, y - 0.05), w, h, boxstyle="round,pad=0.08,rounding_size=0.15",
                                        facecolor='#020617', edgecolor='none', alpha=0.5)
        ax.add_patch(shadow)
        
        # Main box
        box = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08,rounding_size=0.15",
                                     facecolor=fill_color, edgecolor=border_color, linewidth=1.5)
        ax.add_patch(box)
        
        # Texts
        ax.text(x + w/2, y + h - 0.28, title, ha='center', va='center', fontsize=9.5, fontweight='bold', color='#ffffff')
        ax.text(x + w/2, y + h - 0.62, subtitle, ha='center', va='center', fontsize=8, fontweight='medium', color='#6ee7b7' if '065f' in fill_color or '0478' in fill_color else '#bae6fd')
        ax.text(x + w/2, y + 0.3, detail, ha='center', va='center', fontsize=7.2, color='#cbd5e1')
        
        if badge_text:
            badge = patches.FancyBboxPatch((x + 0.12, y + h - 0.12), len(badge_text)*0.11 + 0.2, 0.25,
                                           boxstyle="round,pad=0.02,rounding_size=0.06",
                                           facecolor='#059669', edgecolor='none')
            ax.add_patch(badge)
            ax.text(x + 0.12 + (len(badge_text)*0.11 + 0.2)/2, y + h, badge_text,
                    ha='center', va='center', fontsize=6, fontweight='bold', color='#ffffff')

    # Helper for smooth arrows
    def draw_arrow(x1, y1, x2, y2, color='#10b981', rad=0.0):
        connectionstyle = f"arc3,rad={rad}" if rad != 0.0 else "arc3"
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="-|>", color=color, lw=2.0, mutation_scale=14, connectionstyle=connectionstyle))

    # -------------------------------------------------------------
    # STAGE 1: CLIENT & VIDEO INGESTION TIER (Top Row)
    # -------------------------------------------------------------
    # Outer group container
    grp1 = patches.FancyBboxPatch((0.4, 4.3), 13.2, 2.45, boxstyle="round,pad=0.1,rounding_size=0.2",
                                  facecolor='#1e293b', edgecolor='#334155', linewidth=1.0, linestyle='--')
    ax.add_patch(grp1)
    ax.text(0.7, 6.55, "CLIENT CAPTURE & GATEWAY TIER", fontsize=7.5, fontweight='bold', color='#38bdf8')

    # Box 1: Athlete & Camera
    draw_component(0.7, 4.6, 2.5, 1.65, "Athlete & Camera", "30 FPS Video Input", "Webcam / Mobile Upload", "#047857", "#059669", "SOURCE")
    draw_arrow(3.2, 5.4, 3.8, 5.4)

    # Box 2: React 18 SPA Frontend
    draw_component(3.8, 4.6, 2.7, 1.65, "React 18 Frontend", "TanStack Router + Tailwind", "getUserMedia + Live Canvas", "#065f46", "#10b981", "CLIENT")
    draw_arrow(6.5, 5.4, 7.1, 5.4)

    # Box 3: Vercel Reverse Proxy
    draw_component(7.1, 4.6, 2.5, 1.65, "Vercel Edge Proxy", "Rewrite /api/* Gateway", "SSL & Zero-CORS Bridge", "#0369a1", "#0284c7", "GATEWAY")
    draw_arrow(9.6, 5.4, 10.2, 5.4)

    # Box 4: FastAPI Backend (Render)
    draw_component(10.2, 4.6, 3.1, 1.65, "FastAPI Backend", "Async Python 3.11 REST", "Multipart Ingestion & Orchestration", "#1e1b4b", "#4338ca", "BACKEND")

    # Connect Row 1 to Row 2
    draw_arrow(11.75, 4.6, 11.75, 3.8, color='#38bdf8')

    # -------------------------------------------------------------
    # STAGE 2: BIOMECHANICAL & AI INTELLIGENCE TIER (Bottom Row)
    # -------------------------------------------------------------
    grp2 = patches.FancyBboxPatch((0.4, 0.4), 13.2, 3.5, boxstyle="round,pad=0.1,rounding_size=0.2",
                                  facecolor='#1e293b', edgecolor='#334155', linewidth=1.0, linestyle='--')
    ax.add_patch(grp2)
    ax.text(0.7, 3.7, "COMPUTER VISION, ML CLASSIFICATION & PERSISTENCE TIER", fontsize=7.5, fontweight='bold', color='#34d399')

    # Box 5: OpenCV Video Stream Decoder
    draw_component(10.2, 1.8, 3.1, 1.65, "OpenCV (cv2)", "Frame Decoding & Optical Flow", "30 FPS Frame Matrix Sampling", "#b45309", "#d97706", "CV ENGINE")
    draw_arrow(10.2, 2.6, 9.6, 2.6)

    # Box 6: MediaPipe Pose Landmark Detection
    draw_component(6.9, 1.8, 2.7, 1.65, "MediaPipe Pose", "33 3D Body Landmarks", "Real-time Joint Extraction", "#b45309", "#f59e0b", "POSE TRACKING")
    draw_arrow(6.9, 2.6, 6.3, 2.6)

    # Box 7: Biomechanical Kinematics Physics
    draw_component(3.6, 1.8, 2.7, 1.65, "Kinematics Physics", "Flight Time: h = 1/8·g·t²", "Angles, Reps, Sway, Velocity", "#047857", "#10b981", "PHYSICS")
    draw_arrow(3.6, 2.6, 3.0, 2.6)

    # Box 8: Scikit-Learn Multi-Sport Classifier
    draw_component(0.7, 1.8, 2.3, 1.65, "Scikit-Learn ML", "GroupKFold Benchmark", "6 Sports Probability Scoring", "#581c87", "#7c3aed", "ML MODEL")

    # Down from ML to Bottom Sub-row
    draw_arrow(1.85, 1.8, 1.85, 1.4, color='#a855f7')

    # Box 9: Ollama Qwen2.5:3b LLM Engine
    draw_component(0.7, 0.6, 3.8, 1.1, "Ollama Qwen2.5:3b (LLM)", "Personalized AI Coach Guidance", "Deterministic Olympic Fallback", "#0369a1", "#38bdf8", "AI COACH")
    draw_arrow(4.5, 1.15, 5.1, 1.15)

    # Box 10: Supabase PostgreSQL Database
    draw_component(5.1, 0.6, 4.3, 1.1, "Supabase PostgreSQL 15", "8 Relational Tables (Profiles, Runs, Reports)", "Row-Level Security (RLS) & JWT Auth", "#0f172a", "#334155", "DATABASE")
    draw_arrow(9.4, 1.15, 10.0, 1.15)

    # Box 11: Athlete Dashboard & Talent Report
    draw_component(10.0, 0.6, 3.3, 1.1, "Dashboard & Talent Report", "Radar Charts, Ranks & PDF Export", "Interactive Athlete Analytics UI", "#047857", "#10b981", "OUTPUT")

    # Save to disk
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
    plt.close()
    print(f"Architecture diagram generated successfully at: {output_path}")

if __name__ == "__main__":
    out_dir = os.path.join(os.getcwd(), "documentation")
    os.makedirs(out_dir, exist_ok=True)
    img_path = os.path.join(out_dir, "system_architecture_diagram.png")
    generate_architecture_diagram(img_path)
