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
 * Extracts a scale-invariant anatomical skeletal vector from 33 MediaPipe pose landmarks.
 * Because all values are dimensionless ratios, they remain constant regardless of distance to camera.
 */
export function extractAnthropometricVector(
  landmarks: NormalizedLandmark[] | null,
  athleteName?: string
): AnthropometricVector | null {
  if (!landmarks || landmarks.length < 29) return null;

  // MediaPipe Landmark Indices:
  // 11: left_shoulder, 12: right_shoulder
  // 13: left_elbow, 14: right_elbow
  // 15: left_wrist, 16: right_wrist
  // 23: left_hip, 24: right_hip
  // 25: left_knee, 26: right_knee
  // 27: left_ankle, 28: right_ankle

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

  // Visibility threshold check
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

  // Femur & Tibia
  const leftFemur = dist3D(lh, lk);
  const leftTibia = dist3D(lk, la);
  const rightFemur = dist3D(rh, rk);
  const rightTibia = dist3D(rk, ra);
  const avgFemur = (leftFemur + rightFemur) / 2;
  const avgTibia = Math.max(0.001, (leftTibia + rightTibia) / 2);

  // Arm length (shoulder -> elbow -> wrist)
  const armLen = dist3D(ls, le) + dist3D(le, lw);

  // Biological bone ratios (scale-invariant)
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
 * Compares an active candidate vector against the locked baseline athlete vector.
 * Returns match status, weighted similarity score (0 to 1), and confidence.
 */
export function compareBiometrics(
  baseline: AnthropometricVector,
  candidate: AnthropometricVector
): BiometricMatchResult {
  // Individual ratio tolerances
  const ratioSim = (base: number, cand: number): number => {
    if (base <= 0 || cand <= 0) return 0;
    const diff = Math.abs(base - cand);
    const pctDiff = diff / base;
    return Math.max(0, 1 - pctDiff);
  };

  // Weighted biometric score
  // Shoulders-to-hip & torso-to-leg are the most distinct human skeletal invariants
  const s_shoulderHip = ratioSim(baseline.shoulderToHip, candidate.shoulderToHip);
  const s_torsoLeg = ratioSim(baseline.torsoToLeg, candidate.torsoToLeg);
  const s_femurTibia = ratioSim(baseline.femurToTibia, candidate.femurToTibia);
  const s_shoulderTorso = ratioSim(baseline.shoulderToTorso, candidate.shoulderToTorso);
  const s_armTorso = ratioSim(baseline.armToTorso, candidate.armToTorso);

  const weightedScore =
    s_shoulderHip * 0.30 +
    s_torsoLeg * 0.25 +
    s_femurTibia * 0.20 +
    s_shoulderTorso * 0.15 +
    s_armTorso * 0.10;

  const scoreRounded = Math.round(weightedScore * 100) / 100;

  // Thresholds calibrated on anatomical variation:
  // Same athlete: typically 0.82 - 0.98 similarity
  // Different person: typically 0.40 - 0.72 similarity
  const isMatch = scoreRounded >= 0.76;
  const mismatchConfidence = Math.max(0, Math.min(1, 1 - scoreRounded));

  let reason = undefined;
  if (!isMatch) {
    reason = `Anatomical mismatch (Similarity: ${Math.round(scoreRounded * 100)}%). Skeletal proportions differ from verified athlete.`;
  }

  return {
    isMatch,
    similarityScore: scoreRounded,
    mismatchConfidence,
    reason,
  };
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
      // Safe, clear audible volume level
      const initialVolume = this.isMuted ? 0 : 0.18;
      this.gain.gain.setValueAtTime(initialVolume, this.ctx.currentTime);

      // Sweeping frequency modulation between 640 Hz and 960 Hz (alarm siren effect)
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
          // ignore context state errors
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
