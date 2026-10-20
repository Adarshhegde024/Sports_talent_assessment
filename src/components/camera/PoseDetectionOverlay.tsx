import React, { useEffect, useRef, useState } from "react";
import { ClientPoseDetector, SKELETON_CONNECTIONS } from "@/lib/vision/pose-detector";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { CheckCircle, ShieldAlert, Sparkles, UserCheck, UserX, AlertTriangle } from "lucide-react";
import {
  extractAnthropometricVector,
  compareBiometrics,
  type AnthropometricVector,
  type BiometricMatchResult,
} from "@/lib/vision/athlete-biometrics";

interface PoseDetectionOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isRecording?: boolean;
  onPoseDetected?: (landmarks: NormalizedLandmark[]) => void;
  athleteName?: string;
  biometricBaseline?: AnthropometricVector | null;
  onBiometricBaselineExtracted?: (vector: AnthropometricVector) => void;
  onBiometricComparison?: (result: BiometricMatchResult) => void;
  isMalpracticeActive?: boolean;
}

export function PoseDetectionOverlay({
  videoRef,
  isRecording = false,
  onPoseDetected,
  athleteName = "Athlete",
  biometricBaseline,
  onBiometricBaselineExtracted,
  onBiometricComparison,
  isMalpracticeActive = false,
}: PoseDetectionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<ClientPoseDetector | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const frameCounterRef = useRef<number>(0);
  const calibrationSamplesRef = useRef<AnthropometricVector[]>([]);

  const [isHumanDetected, setIsHumanDetected] = useState(false);
  const [nodesCount, setNodesCount] = useState(0);
  const [kneeAngle, setKneeAngle] = useState<number | null>(null);
  const [isFullBodyVisible, setIsFullBodyVisible] = useState(false);
  const [liveSimilarity, setLiveSimilarity] = useState<number | null>(null);

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
          // Synchronize canvas internal dimensions with actual video resolution
          const vWidth = video.videoWidth || 640;
          const vHeight = video.videoHeight || 480;

          if (canvas.width !== vWidth || canvas.height !== vHeight) {
            canvas.width = vWidth;
            canvas.height = vHeight;
          }

          // Always clear previous frame canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Enforce strictly monotonic timestamps for MediaPipe
          const frameTime = Math.max(timestamp, lastTimestampRef.current + 1);
          lastTimestampRef.current = frameTime;

          // Detect live pose from video feed
          const rawLandmarks = detectorRef.current?.detectPose(video, frameTime) || null;

          // Verify whether a genuine human is in frame
          const humanPresent = isValidHumanPose(rawLandmarks);

          if (humanPresent && rawLandmarks) {
            setIsHumanDetected(true);
            onPoseDetected?.(rawLandmarks);

            frameCounterRef.current += 1;

            // Extract biometric vector every 3 frames for anti-malpractice verification
            if (frameCounterRef.current % 3 === 0) {
              const vector = extractAnthropometricVector(rawLandmarks, athleteName);
              if (vector) {
                if (!biometricBaseline && onBiometricBaselineExtracted) {
                  // Calibration: Collect 10 stable frame vectors to lock the baseline
                  calibrationSamplesRef.current.push(vector);
                  if (calibrationSamplesRef.current.length >= 10) {
                    const samples = calibrationSamplesRef.current;
                    const avgVector: AnthropometricVector = {
                      shoulderToTorso: samples.reduce((acc, s) => acc + s.shoulderToTorso, 0) / samples.length,
                      torsoToLeg: samples.reduce((acc, s) => acc + s.torsoToLeg, 0) / samples.length,
                      femurToTibia: samples.reduce((acc, s) => acc + s.femurToTibia, 0) / samples.length,
                      armToTorso: samples.reduce((acc, s) => acc + s.armToTorso, 0) / samples.length,
                      shoulderToHip: samples.reduce((acc, s) => acc + s.shoulderToHip, 0) / samples.length,
                      timestamp: Date.now(),
                      athleteName,
                    };
                    onBiometricBaselineExtracted(avgVector);
                  }
                } else if (biometricBaseline && onBiometricComparison) {
                  const comp = compareBiometrics(biometricBaseline, vector);
                  setLiveSimilarity(comp.similarityScore);
                  onBiometricComparison(comp);
                }
              }
            }

            // Count valid visible nodes
            const visibleNodes = rawLandmarks.filter(
              (lm) => (lm.visibility ?? 1) >= 0.3
            ).length;
            setNodesCount(visibleNodes);

            // Check full body coverage (head, hips, knees, ankles)
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
            // NO HUMAN DETECTED: Canvas stays completely clean, no ghost lines/dots
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
  }, [videoRef, isRecording, onPoseDetected]);

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

        {/* Biometric Identity Verification Badge */}
        {biometricBaseline && isHumanDetected && (
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-md shadow-lg transition-all ${
              isMalpracticeActive
                ? "bg-red-950/80 text-red-300 border border-red-500/60 animate-pulse"
                : "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
            }`}
          >
            {isMalpracticeActive ? (
              <>
                <ShieldAlert className="size-3.5 text-red-400" />
                <span>Malpractice: Proxy Detected {liveSimilarity !== null ? `(${Math.round(liveSimilarity * 100)}%)` : ""}</span>
              </>
            ) : (
              <>
                <UserCheck className="size-3.5 text-emerald-400" />
                <span>Identity Verified: {biometricBaseline.athleteName || athleteName}</span>
              </>
            )}
          </div>
        )}

        {/* Live Knee Angle Readout (Only visible when human is detected) */}
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

/**
 * Validates that detected landmarks correspond to a genuine human presence in frame.
 */
function isValidHumanPose(landmarks: NormalizedLandmark[] | null): boolean {
  if (!landmarks || landmarks.length < 25) return false;

  // Key anatomical reference points
  const nose = landmarks[0];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  // At least 2 primary landmarks must have solid visibility/presence
  const keyPoints = [nose, leftShoulder, rightShoulder, leftHip, rightHip];
  const visibleKeyCount = keyPoints.filter((p) => p && (p.visibility ?? 1) >= 0.4).length;

  return visibleKeyCount >= 2;
}

/**
 * Draws kinematic skeleton bones / edges connecting anatomical nodes.
 */
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

    // Only draw edge if BOTH joints are detected with high confidence
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

      // Outer glow line
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

      // Inner crisp bone line
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

/**
 * Draws glowing joint nodes on every tracked anatomical point.
 */
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
    // Only draw node if visibility threshold is met
    if ((lm.visibility ?? 1) >= 0.35) {
      const x = lm.x * width;
      const y = lm.y * height;

      const isMajorJoint = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(idx);
      const radius = isMajorJoint ? 5.5 : 3.5;

      // Outer glow circle
      ctx.beginPath();
      ctx.arc(x, y, radius + 3, 0, 2 * Math.PI);
      ctx.fillStyle = isMalpractice
        ? "rgba(239, 68, 68, 0.5)"
        : isRecording
        ? "rgba(239, 68, 68, 0.35)"
        : "rgba(6, 182, 212, 0.35)";
      ctx.fill();

      // Inner solid node core
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

      // Center bright pip
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }
  });

  ctx.restore();
}

/**
 * Calculates joint angle between 3 points in 2D space.
 */
function calculateAngle(p1: NormalizedLandmark, p2: NormalizedLandmark, p3: NormalizedLandmark): number {
  const radians =
    Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return angle;
}
