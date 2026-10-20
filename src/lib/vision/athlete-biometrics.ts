import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export interface AnthropometricVector {
  shoulderToTorso: number;
  torsoToLeg: number;
  femurToTibia: number;
  armToTorso: number;
  shoulderToHip: number;
  timestamp: number;
  athleteName?: string;
}

export interface FacialBiometricVector {
  eyeToNoseRatio: number;
  mouthWidthRatio: number;
  noseToMouthRatio: number;
  faceBreadthRatio: number;
  faceHeightRatio: number;
  timestamp: number;
  athleteName?: string;
}

export interface BiometricMatchResult {
  isMatch: boolean;
  similarityScore: number; // 0 to 1
  mismatchConfidence: number; // 0 to 1
  reason?: string;
}

/**
 * 3D Euclidean distance between two MediaPipe landmarks
 */
function dist3D(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Midpoint between two landmarks
 */
function midpoint(a: NormalizedLandmark, b: NormalizedLandmark): NormalizedLandmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: ((a.z ?? 0) + (b.z ?? 0)) / 2,
    visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1),
  };
}

/**
 * Extracts a scale-invariant facial biometric vector from MediaPipe landmarks (0-10).
 * Features are normalized by the Inter-Pupillary Distance (IPD) to ensure scale and distance invariance.
 */
export function extractFacialVector(
  landmarks: NormalizedLandmark[] | null,
  athleteName?: string
): FacialBiometricVector | null {
  if (!landmarks || landmarks.length < 11) return null;

  // MediaPipe Face Landmarks:
  // 0: nose, 2: left_eye, 5: right_eye, 7: left_ear, 8: right_ear, 9: mouth_left, 10: mouth_right
  const nose = landmarks[0];
  const leftEye = landmarks[2];
  const rightEye = landmarks[5];
  const leftEar = landmarks[7];
  const rightEar = landmarks[8];
  const mouthLeft = landmarks[9];
  const mouthRight = landmarks[10];

  const faceNodes = [nose, leftEye, rightEye, mouthLeft, mouthRight];
  const minVis = 0.4;
  const allVisible = faceNodes.every((n) => n && (n.visibility ?? 1) >= minVis);
  if (!allVisible) return null;

  // Base normalization unit: Inter-Pupillary Distance (distance between eyes)
  const ipd = Math.max(0.015, dist3D(leftEye, rightEye));

  const midEyes = midpoint(leftEye, rightEye);
  const midMouth = midpoint(mouthLeft, mouthRight);

  const eyeToNose = dist3D(midEyes, nose);
  const noseToMouth = dist3D(nose, midMouth);
  const mouthWidth = dist3D(mouthLeft, mouthRight);
  const earDistance = dist3D(leftEar, rightEar);

  return {
    eyeToNoseRatio: parseFloat((eyeToNose / ipd).toFixed(4)),
    mouthWidthRatio: parseFloat((mouthWidth / ipd).toFixed(4)),
    noseToMouthRatio: parseFloat((noseToMouth / ipd).toFixed(4)),
    faceBreadthRatio: parseFloat((earDistance / ipd).toFixed(4)),
    faceHeightRatio: parseFloat(((eyeToNose + noseToMouth) / ipd).toFixed(4)),
    timestamp: Date.now(),
    athleteName,
  };
}

/**
 * Compares an active candidate facial vector against the locked baseline athlete face vector.
 * Returns match status, weighted similarity score (0 to 1), and confidence.
 */
export function compareFaceBiometrics(
  baseline: FacialBiometricVector,
  candidate: FacialBiometricVector
): BiometricMatchResult {
  const ratioSim = (base: number, cand: number): number => {
    if (base <= 0 || cand <= 0) return 0;
    const diff = Math.abs(base - cand);
    const pctDiff = diff / base;
    return Math.max(0, 1 - pctDiff);
  };

  const s_mouthWidth = ratioSim(baseline.mouthWidthRatio, candidate.mouthWidthRatio);
  const s_eyeToNose = ratioSim(baseline.eyeToNoseRatio, candidate.eyeToNoseRatio);
  const s_noseToMouth = ratioSim(baseline.noseToMouthRatio, candidate.noseToMouthRatio);
  const s_faceBreadth = ratioSim(baseline.faceBreadthRatio, candidate.faceBreadthRatio);
  const s_faceHeight = ratioSim(baseline.faceHeightRatio, candidate.faceHeightRatio);

  const weightedScore =
    s_mouthWidth * 0.25 +
    s_eyeToNose * 0.20 +
    s_noseToMouth * 0.20 +
    s_faceBreadth * 0.20 +
    s_faceHeight * 0.15;

  const scoreRounded = Math.round(weightedScore * 100) / 100;

  // Thresholds:
  // Same athlete: typically 0.82 - 0.98 similarity
  // Different person: typically 0.45 - 0.72 similarity
  const isMatch = scoreRounded >= 0.76;
  const mismatchConfidence = Math.max(0, Math.min(1, 1 - scoreRounded));

  let reason = undefined;
  if (!isMatch) {
    reason = `Facial biometric mismatch (Match: ${Math.round(scoreRounded * 100)}%). Face geometry differs from registered athlete.`;
  }

  return {
    isMatch,
    similarityScore: scoreRounded,
    mismatchConfidence,
    reason,
  };
}

/**
 * Extracts a scale-invariant anatomical skeletal vector from 33 MediaPipe pose landmarks.
 * Because all values are dimensionless ratios, they remain constant regardless of distance to camera.
 */
export function extractAnthropometricVector(
  landmarks: NormalizedLandmark[] | null,
  athleteName?: string
): AnthropometricVector | null {
  if (!landmarks || landmarks.length < 29) return null;

  const ls = landmarks[11];
  const rs = landmarks[12];
  const lh = landmarks[23];
  const rh = landmarks[24];
  const lk = landmarks[25];
  const rk = landmarks[26];
  const la = landmarks[27];
  const ra = landmarks[28];
  const le = landmarks[13];
  const lw = landmarks[15];

  const minVis = 0.35;
  const keyNodes = [ls, rs, lh, rh, lk, rk, la, ra];
  const allVisible = keyNodes.every((n) => n && (n.visibility ?? 1) >= minVis);
  if (!allVisible) return null;

  const midShoulder = midpoint(ls, rs);
  const midHip = midpoint(lh, rh);
  const midAnkle = midpoint(la, ra);

  const shoulderWidth = dist3D(ls, rs);
  const hipWidth = dist3D(lh, rh);
  const torsoLength = Math.max(0.001, dist3D(midShoulder, midHip));
  const legLength = Math.max(0.001, dist3D(midHip, midAnkle));

  const leftFemur = dist3D(lh, lk);
  const leftTibia = dist3D(lk, la);
  const rightFemur = dist3D(rh, rk);
  const rightTibia = dist3D(rk, ra);
  const avgFemur = (leftFemur + rightFemur) / 2;
  const avgTibia = Math.max(0.001, (leftTibia + rightTibia) / 2);

  const armLen = dist3D(ls, le) + dist3D(le, lw);

  const shoulderToTorso = shoulderWidth / torsoLength;
  const torsoToLeg = torsoLength / legLength;
  const femurToTibia = avgFemur / avgTibia;
  const armToTorso = armLen / torsoLength;
  const shoulderToHip = shoulderWidth / Math.max(0.001, hipWidth);

  return {
    shoulderToTorso: parseFloat(shoulderToTorso.toFixed(4)),
    torsoToLeg: parseFloat(torsoToLeg.toFixed(4)),
    femurToTibia: parseFloat(femurToTibia.toFixed(4)),
    armToTorso: parseFloat(armToTorso.toFixed(4)),
    shoulderToHip: parseFloat(shoulderToHip.toFixed(4)),
    timestamp: Date.now(),
    athleteName,
  };
}

/**
 * Captures a cropped, optimized JPEG thumbnail (128x128) of the athlete's face from the live video element.
 */
export function captureFaceSnapshot(
  video: HTMLVideoElement | null,
  landmarks: NormalizedLandmark[] | null
): string | null {
  if (!video || !landmarks || landmarks.length < 11) return null;
  if (!video.videoWidth || !video.videoHeight) return null;

  const nose = landmarks[0];
  const leftEye = landmarks[2];
  const rightEye = landmarks[5];
  const mouthLeft = landmarks[9];
  const mouthRight = landmarks[10];
  const leftEar = landmarks[7];
  const rightEar = landmarks[8];

  const facePoints = [nose, leftEye, rightEye, mouthLeft, mouthRight, leftEar, rightEar].filter(Boolean);
  if (facePoints.length < 5) return null;

  let minX = Math.min(...facePoints.map((p) => p.x));
  let maxX = Math.max(...facePoints.map((p) => p.x));
  let minY = Math.min(...facePoints.map((p) => p.y));
  let maxY = Math.max(...facePoints.map((p) => p.y));

  // Add 35% margin for complete head framing
  const width = maxX - minX;
  const height = maxY - minY;
  const padX = width * 0.35;
  const padY = height * 0.35;

  minX = Math.max(0, minX - padX);
  maxX = Math.min(1, maxX + padX);
  minY = Math.max(0, minY - padY);
  maxY = Math.min(1, maxY + padY);

  const srcX = minX * video.videoWidth;
  const srcY = minY * video.videoHeight;
  const srcW = Math.max(10, (maxX - minX) * video.videoWidth);
  const srcH = Math.max(10, (maxY - minY) * video.videoHeight);

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, 128, 128);
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return null;
  }
}

/**
 * Web Audio API Dual-Tone Security Siren
 * Synthesizes an audible police/security style dual-tone alarm with zero external assets.
 */
export class MalpracticeSiren {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private isPlaying = false;
  private sweepTimer: number | null = null;
  private isMuted = false;

  start() {
    if (this.isPlaying) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      if (this.ctx.state === "suspended") {
        void this.ctx.resume();
      }

      this.osc = this.ctx.createOscillator();
      this.gain = this.ctx.createGain();

      this.osc.type = "sawtooth";
      const initialVolume = this.isMuted ? 0 : 0.18;
      this.gain.gain.setValueAtTime(initialVolume, this.ctx.currentTime);

      let freq = 640;
      let rising = true;
      this.osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      this.sweepTimer = window.setInterval(() => {
        if (!this.osc || !this.ctx) return;
        freq = rising ? freq + 45 : freq - 45;
        if (freq >= 960) rising = false;
        if (freq <= 640) rising = true;
        try {
          this.osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        } catch {
          // ignore
        }
      }, 45);

      this.osc.connect(this.gain);
      this.gain.connect(this.ctx.destination);
      this.osc.start();
      this.isPlaying = true;
    } catch (err) {
      console.warn("Could not start Web Audio Malpractice Siren:", err);
    }
  }

  stop() {
    if (!this.isPlaying) return;

    if (this.sweepTimer !== null) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }

    try {
      if (this.gain && this.ctx) {
        this.gain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      this.osc?.stop();
      this.osc?.disconnect();
      this.gain?.disconnect();
      void this.ctx?.close();
    } catch {
      // ignore
    }

    this.osc = null;
    this.gain = null;
    this.ctx = null;
    this.isPlaying = false;
  }

  setMute(mute: boolean) {
    this.isMuted = mute;
    if (this.gain && this.ctx) {
      this.gain.gain.setValueAtTime(mute ? 0 : 0.18, this.ctx.currentTime);
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }
}
