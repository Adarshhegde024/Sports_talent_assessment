import React, { useEffect, useRef, useState } from "react";
import { ClientPoseDetector, SKELETON_CONNECTIONS } from "@/lib/vision/pose-detector";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { CheckCircle, ShieldAlert, Sparkles, UserCheck, UserX } from "lucide-react";
import {
  extractFacialVector,
  compareFaceBiometrics,
  captureFaceSnapshot,
  type FacialBiometricVector,
  type BiometricMatchResult,
} from "@/lib/vision/athlete-biometrics";
import type { AthleteFaceProfile } from "@/lib/assessment-session";

interface PoseDetectionOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isRecording?: boolean;
  onPoseDetected?: (landmarks: NormalizedLandmark[]) => void;
  athleteName?: string;
  isProctoringEnabled?: boolean; // false = Assessment 1 (Enrollment), true = Assessments 2-5 (Active Verification)
  faceProfile?: AthleteFaceProfile | null;
  onFaceCaptured?: (vector: FacialBiometricVector, photoDataUrl: string) => void;
  onFaceComparison?: (result: BiometricMatchResult, candidateSnapshot?: string) => void;
  isMalpracticeActive?: boolean;
}

export function PoseDetectionOverlay({
  videoRef,
  isRecording = false,
  onPoseDetected,
  athleteName = "Athlete",
  isProctoringEnabled = false,
  faceProfile,
  onFaceCaptured,
  onFaceComparison,
  isMalpracticeActive = false,
}: PoseDetectionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<ClientPoseDetector | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const frameCounterRef = useRef<number>(0);
  const faceStableCountRef = useRef<number>(0);

  const [isHumanDetected, setIsHumanDetected] = useState(false);
  const [nodesCount, setNodesCount] = useState(0);
  const [kneeAngle, setKneeAngle] = useState<number | null>(null);
  const [isFullBodyVisible, setIsFullBodyVisible] = useState(false);
  const [liveSimilarity, setLiveSimilarity] = useState<number | null>(null);
  const [faceEnrolledSuccessfully, setFaceEnrolledSuccessfully] = useState(false);

  // Initialize MediaPipe PoseLandmarker
  useEffect(() => {
    const detector = new ClientPoseDetector();
    detectorRef.current = detector;

    let isMounted = true;
    detector.initialize().then((ready) => {
      if (isMounted && ready) {
        console.log("MediaPipe Pose Landmarker ready for live stream");
      }
    });

    return () => {
      isMounted = false;
      detector.close();
      detectorRef.current = null;
    };
  }, []);

  // Frame-by-Frame Real-Time Detection & Rendering Loop
  useEffect(() => {
    const renderLoop = (timestamp: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const vWidth = video.videoWidth || 640;
          const vHeight = video.videoHeight || 480;

          if (canvas.width !== vWidth || canvas.height !== vHeight) {
            canvas.width = vWidth;
            canvas.height = vHeight;
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const frameTime = Math.max(timestamp, lastTimestampRef.current + 1);
          lastTimestampRef.current = frameTime;

          const rawLandmarks = detectorRef.current?.detectPose(video, frameTime) || null;
          const humanPresent = isValidHumanPose(rawLandmarks);

          if (humanPresent && rawLandmarks) {
            setIsHumanDetected(true);
            onPoseDetected?.(rawLandmarks);

            frameCounterRef.current += 1;

            // Process biometrics every 3 frames (~20 checks per second)
            if (frameCounterRef.current % 3 === 0) {
              const faceVec = extractFacialVector(rawLandmarks, athleteName);

              if (!isProctoringEnabled) {
                // ==========================================
                // PHASE 1: ASSESSMENT #1 (REGISTRATION ONLY)
                // ==========================================
                if (faceVec) {
                  faceStableCountRef.current += 1;
                  // Capture high-quality face profile after 4 stable face frames
                  if (faceStableCountRef.current >= 4 && !faceEnrolledSuccessfully) {
                    const photo = captureFaceSnapshot(video, rawLandmarks);
                    if (photo && onFaceCaptured) {
                      onFaceCaptured(faceVec, photo);
                      setFaceEnrolledSuccessfully(true);
                    }
                  }
                }
                // NOTE: In Phase 1, onFaceComparison is NEVER called!
              } else if (isProctoringEnabled && faceProfile?.vector && onFaceComparison) {
                // ==========================================
                // PHASE 2: ASSESSMENTS #2, 3, 4, 5 (VERIFICATION)
                // ==========================================
                if (faceVec) {
                  const comp = compareFaceBiometrics(faceProfile.vector, faceVec);
                  setLiveSimilarity(comp.similarityScore);

                  let proxySnapshot: string | undefined = undefined;
                  if (!comp.isMatch) {
                    proxySnapshot = captureFaceSnapshot(video, rawLandmarks) || undefined;
                  }
                  onFaceComparison(comp, proxySnapshot);
                }
              }
            }

            const visibleNodes = rawLandmarks.filter(
              (lm) => (lm.visibility ?? 1) >= 0.3
            ).length;
            setNodesCount(visibleNodes);

            const head = rawLandmarks[0];
            const leftHip = rawLandmarks[23];
            const rightHip = rawLandmarks[24];
            const leftKnee = rawLandmarks[25];
            const rightKnee = rawLandmarks[26];
            const leftAnkle = rawLandmarks[27];
            const rightAnkle = rawLandmarks[28];

            const fullBody =
              (head?.visibility ?? 1) > 0.35 &&
              ((leftHip?.visibility ?? 1) > 0.35 || (rightHip?.visibility ?? 1) > 0.35) &&
              ((leftKnee?.visibility ?? 1) > 0.35 || (rightKnee?.visibility ?? 1) > 0.35) &&
              ((leftAnkle?.visibility ?? 1) > 0.35 || (rightAnkle?.visibility ?? 1) > 0.35);

            setIsFullBodyVisible(fullBody);

            // Calculate Knee Joint Angle
            if (leftHip && leftKnee && leftAnkle && (leftKnee.visibility ?? 1) > 0.3) {
              const angle = calculateAngle(leftHip, leftKnee, leftAnkle);
              setKneeAngle(Math.round(angle));
            } else if (rightHip && rightKnee && rightAnkle && (rightKnee.visibility ?? 1) > 0.3) {
              const angle = calculateAngle(rightHip, rightKnee, rightAnkle);
              setKneeAngle(Math.round(angle));
            } else {
              setKneeAngle(null);
            }

            // Draw Skeletal Edges (Bones connecting joints)
            drawSkeletonEdges(ctx, rawLandmarks, canvas.width, canvas.height, isRecording, isMalpracticeActive);

            // Draw Joint Nodes on tracked landmarks
            drawJointNodes(ctx, rawLandmarks, canvas.width, canvas.height, isRecording, isMalpracticeActive);

            // Draw Center of Mass (Midpoint of Hips)
            if (leftHip && rightHip && (leftHip.visibility ?? 1) > 0.3 && (rightHip.visibility ?? 1) > 0.3) {
              const comX = ((leftHip.x + rightHip.x) / 2) * canvas.width;
              const comY = ((leftHip.y + rightHip.y) / 2) * canvas.height;

              ctx.save();
              ctx.beginPath();
              ctx.arc(comX, comY, 7, 0, 2 * Math.PI);
              ctx.fillStyle = isMalpracticeActive ? "#dc2626" : isRecording ? "#ef4444" : "#10b981";
              ctx.shadowColor = isMalpracticeActive ? "rgba(220, 38, 38, 1)" : isRecording ? "rgba(239, 68, 68, 0.9)" : "rgba(16, 185, 129, 0.9)";
              ctx.shadowBlur = 10;
              ctx.fill();
              ctx.restore();
            }

            // If Malpractice is active, draw floating red warning tag over the head
            if (isMalpracticeActive && head && (head.visibility ?? 1) > 0.35) {
              const hx = head.x * canvas.width;
              const hy = Math.max(28, head.y * canvas.height - 30);
              ctx.save();
              ctx.fillStyle = "rgba(220, 38, 38, 0.92)";
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 1.5;
              ctx.font = "bold 11px system-ui, sans-serif";
              ctx.textAlign = "center";
              const tagText = "🚨 PROXY / UNAUTHORIZED PERSON";
              const textWidth = ctx.measureText(tagText).width + 16;
              ctx.beginPath();
              ctx.roundRect(hx - textWidth / 2, hy - 14, textWidth, 22, 6);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = "#ffffff";
              ctx.fillText(tagText, hx, hy + 2);
              ctx.restore();
            }
          } else {
            setIsHumanDetected(false);
            setNodesCount(0);
            setKneeAngle(null);
            setIsFullBodyVisible(false);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [videoRef, isRecording, onPoseDetected, isProctoringEnabled, faceProfile, onFaceCaptured, onFaceComparison, isMalpracticeActive, athleteName, faceEnrolledSuccessfully]);

  return (
    <div className="pointer-events-none absolute inset-0 size-full overflow-hidden">
      {/* 60 FPS Transparent Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="size-full object-cover"
        style={{ transform: "scaleX(1)" }}
      />

      {/* Top Pose HUD Badges */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
        {/* Human Detection Status Badge */}
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-md shadow-lg transition-all ${
            isHumanDetected
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "bg-black/60 text-muted-foreground border border-white/10"
          }`}
        >
          {isHumanDetected ? (
            <>
              <UserCheck className="size-3.5 text-emerald-400" />
              <span>Tracking {nodesCount} Body Nodes</span>
            </>
          ) : (
            <>
              <UserX className="size-3.5 text-muted-foreground" />
              <span>No athlete detected in frame</span>
            </>
          )}
        </div>

        {/* PHASE 1 (Assessment 1): Face Enrollment Badge */}
        {!isProctoringEnabled && isHumanDetected && (
          <div className="flex items-center gap-2 rounded-full bg-emerald-950/85 px-3 py-1.5 text-xs font-semibold text-emerald-300 border border-emerald-500/40 backdrop-blur-md shadow-lg animate-in fade-in">
            {faceProfile?.photoDataUrl ? (
              <img
                src={faceProfile.photoDataUrl}
                alt="Enrolled Face"
                className="size-5 rounded-full object-cover border border-emerald-400"
              />
            ) : (
              <UserCheck className="size-3.5 text-emerald-400" />
            )}
            <span>
              {faceProfile?.photoDataUrl
                ? `Face Enrolled: ${faceProfile.athleteName || athleteName}`
                : "Registering Face Profile..."}
            </span>
          </div>
        )}

        {/* PHASE 2 (Assessments 2-5): Active Face Verification Badge */}
        {isProctoringEnabled && faceProfile?.vector && isHumanDetected && (
          <div
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-md shadow-lg transition-all ${
              isMalpracticeActive
                ? "bg-red-950/90 text-red-300 border border-red-500/70 animate-pulse"
                : "bg-emerald-950/85 text-emerald-300 border border-emerald-500/40"
            }`}
          >
            {faceProfile?.photoDataUrl && (
              <img
                src={faceProfile.photoDataUrl}
                alt="Registered Athlete"
                className={`size-5 rounded-full object-cover border ${
                  isMalpracticeActive ? "border-red-400" : "border-emerald-400"
                }`}
              />
            )}
            {isMalpracticeActive ? (
              <>
                <ShieldAlert className="size-3.5 text-red-400" />
                <span>Malpractice: Unauthorized Person Detected</span>
              </>
            ) : (
              <>
                <UserCheck className="size-3.5 text-emerald-400" />
                <span>
                  Verified: {faceProfile.athleteName || athleteName}{" "}
                  {liveSimilarity !== null ? `(${Math.round(liveSimilarity * 100)}%)` : ""}
                </span>
              </>
            )}
          </div>
        )}

        {/* Live Knee Angle Readout */}
        {isHumanDetected && kneeAngle !== null && (
          <div className="flex items-center gap-1.5 rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/40 backdrop-blur-md shadow-lg animate-in fade-in">
            <Sparkles className="size-3 text-cyan-400" />
            <span>Knee Angle: {kneeAngle}°</span>
          </div>
        )}

        {/* Full Body Coverage Positioning Guide */}
        {isHumanDetected && (
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md border shadow-lg animate-in fade-in ${
              isFullBodyVisible
                ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                : "bg-amber-950/60 text-amber-300 border-amber-500/30"
            }`}
          >
            {isFullBodyVisible ? (
              <>
                <CheckCircle className="size-3 text-emerald-400" />
                <span>Full Body In Frame</span>
              </>
            ) : (
              <>
                <ShieldAlert className="size-3 text-amber-400" />
                <span>Step back to fit full body</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function isValidHumanPose(landmarks: NormalizedLandmark[] | null): boolean {
  if (!landmarks || landmarks.length < 25) return false;

  const nose = landmarks[0];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  const keyPoints = [nose, leftShoulder, rightShoulder, leftHip, rightHip];
  const visibleKeyCount = keyPoints.filter((p) => p && (p.visibility ?? 1) >= 0.4).length;

  return visibleKeyCount >= 2;
}

function drawSkeletonEdges(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  isRecording: boolean,
  isMalpractice = false
) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const conn of SKELETON_CONNECTIONS) {
    const p1 = landmarks[conn.from];
    const p2 = landmarks[conn.to];

    if (
      p1 &&
      p2 &&
      (p1.visibility ?? 1) >= 0.35 &&
      (p2.visibility ?? 1) >= 0.35
    ) {
      const x1 = p1.x * width;
      const y1 = p1.y * height;
      const x2 = p2.x * width;
      const y2 = p2.y * height;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isMalpractice
        ? "rgba(239, 68, 68, 0.75)"
        : isRecording
        ? "rgba(239, 68, 68, 0.45)"
        : "rgba(16, 185, 129, 0.45)";
      ctx.lineWidth = isMalpractice ? 7 : 6;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isMalpractice
        ? "#ef4444"
        : isRecording
        ? "#f87171"
        : (conn.color || "#34d399");
      ctx.lineWidth = isMalpractice ? 3 : 2.5;
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawJointNodes(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  isRecording: boolean,
  isMalpractice = false
) {
  ctx.save();

  landmarks.forEach((lm, idx) => {
    if ((lm.visibility ?? 1) >= 0.35) {
      const x = lm.x * width;
      const y = lm.y * height;

      const isMajorJoint = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(idx);
      const radius = isMajorJoint ? 5.5 : 3.5;

      ctx.beginPath();
      ctx.arc(x, y, radius + 3, 0, 2 * Math.PI);
      ctx.fillStyle = isMalpractice
        ? "rgba(239, 68, 68, 0.5)"
        : isRecording
        ? "rgba(239, 68, 68, 0.35)"
        : "rgba(6, 182, 212, 0.35)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isMalpractice
        ? "#ef4444"
        : isRecording
        ? "#ffffff"
        : isMajorJoint
        ? "#06b6d4"
        : "#10b981";
      ctx.shadowColor = isMalpractice ? "#dc2626" : isRecording ? "#ef4444" : "#06b6d4";
      ctx.shadowBlur = isMalpractice ? 12 : 8;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }
  });

  ctx.restore();
}

function calculateAngle(p1: NormalizedLandmark, p2: NormalizedLandmark, p3: NormalizedLandmark): number {
  const radians =
    Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return angle;
}
