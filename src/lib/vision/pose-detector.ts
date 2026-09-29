/**
 * SportSense AI — Client-Side Real-Time Pose & Skeleton Detection Engine
 * Integrates MediaPipe Tasks-Vision PoseLandmarker with 60 FPS Canvas rendering,
 * glowing anatomical joint nodes, kinematic bone edges, and joint angle telemetry.
 */

import { FilesetResolver, PoseLandmarker, type NormalizedLandmark } from "@mediapipe/tasks-vision";

export interface PoseNode {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  name: string;
}

export interface SkeletonEdge {
  from: number;
  to: number;
  color?: string;
}

export const SKELETON_CONNECTIONS: SkeletonEdge[] = [
  // Face & Neck
  { from: 0, to: 1 }, // nose -> left eye inner
  { from: 1, to: 2 }, // left eye inner -> left eye
  { from: 2, to: 3 }, // left eye -> left eye outer
  { from: 0, to: 4 }, // nose -> right eye inner
  { from: 4, to: 5 }, // right eye inner -> right eye
  { from: 5, to: 6 }, // right eye -> right eye outer
  { from: 0, to: 11 }, // nose -> left shoulder
  { from: 0, to: 12 }, // nose -> right shoulder

  // Torso
  { from: 11, to: 12, color: "#10b981" }, // left shoulder -> right shoulder
  { from: 11, to: 23, color: "#10b981" }, // left shoulder -> left hip
  { from: 12, to: 24, color: "#10b981" }, // right shoulder -> right hip
  { from: 23, to: 24, color: "#10b981" }, // left hip -> right hip

  // Left Arm
  { from: 11, to: 13, color: "#06b6d4" }, // left shoulder -> left elbow
  { from: 13, to: 15, color: "#06b6d4" }, // left elbow -> left wrist
  { from: 15, to: 17, color: "#06b6d4" }, // left wrist -> left pinky
  { from: 15, to: 19, color: "#06b6d4" }, // left wrist -> left index
  { from: 15, to: 21, color: "#06b6d4" }, // left wrist -> left thumb

  // Right Arm
  { from: 12, to: 14, color: "#06b6d4" }, // right shoulder -> right elbow
  { from: 14, to: 16, color: "#06b6d4" }, // right elbow -> right wrist
  { from: 16, to: 18, color: "#06b6d4" }, // right wrist -> right pinky
  { from: 16, to: 20, color: "#06b6d4" }, // right wrist -> right index
  { from: 16, to: 22, color: "#06b6d4" }, // right wrist -> right thumb

  // Left Leg
  { from: 23, to: 25, color: "#10b981" }, // left hip -> left knee
  { from: 25, to: 27, color: "#10b981" }, // left knee -> left ankle
  { from: 27, to: 29, color: "#10b981" }, // left ankle -> left heel
  { from: 29, to: 31, color: "#10b981" }, // left heel -> left foot index
  { from: 27, to: 31, color: "#10b981" }, // left ankle -> left foot index

  // Right Leg
  { from: 24, to: 26, color: "#10b981" }, // right hip -> right knee
  { from: 26, to: 28, color: "#10b981" }, // right knee -> right ankle
  { from: 28, to: 30, color: "#10b981" }, // right ankle -> right heel
  { from: 30, to: 32, color: "#10b981" }, // right heel -> right foot index
  { from: 28, to: 32, color: "#10b981" }, // right ankle -> right foot index
];

export class ClientPoseDetector {
  private poseLandmarker: PoseLandmarker | null = null;
  private isInitializing = false;
  private isReady = false;

  public async initialize(): Promise<boolean> {
    if (this.isReady) return true;
    if (this.isInitializing) return false;
    this.isInitializing = true;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.isReady = true;
      this.isInitializing = false;
      return true;
    } catch (err) {
      console.warn("MediaPipe Tasks-Vision initialization fallback:", err);
      this.isInitializing = false;
      return false;
    }
  }

  public detectPose(videoElement: HTMLVideoElement, timestampMs: number): NormalizedLandmark[] | null {
    if (!this.poseLandmarker || !this.isReady) return null;
    if (videoElement.readyState < 2) return null;

    try {
      const results = this.poseLandmarker.detectForVideo(videoElement, timestampMs);
      if (results.landmarks && results.landmarks.length > 0) {
        return results.landmarks[0]!;
      }
    } catch {
      // ignore frame dropped
    }
    return null;
  }

  public close() {
    if (this.poseLandmarker) {
      this.poseLandmarker.close();
      this.poseLandmarker = null;
      this.isReady = false;
    }
  }
}
