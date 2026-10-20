import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Circle,
  FileVideo,
  Info,
  Loader2,
  Plus,
  RotateCcw,
  ShieldAlert,
  Timer,
  Trash2,
  Upload,
  UploadCloud,
  Video,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAssessmentSession } from "@/lib/assessment-session";
import { createAssessment, uploadAttempts } from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ASSESSMENTS } from "@/data/mock";
import { useQueryClient } from "@tanstack/react-query";
import { PoseDetectionOverlay } from "@/components/camera/PoseDetectionOverlay";
import {
  MalpracticeSiren,
  type AnthropometricVector,
  type BiometricMatchResult,
} from "@/lib/vision/athlete-biometrics";

export const Route = createFileRoute("/assessments/$slug/record")({
  head: () => ({
    meta: [
      { title: "Record or Upload assessment — SportSense AI" },
      {
        name: "description",
        content: "Record live movement assessment or upload video dataset for AI kinematic analysis.",
      },
      { property: "og:title", content: "Record or Upload assessment — SportSense AI" },
      {
        property: "og:description",
        content: "Smartphone live capture with pose tracking or pre-recorded video dataset analysis.",
      },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <RecordPage />
    </ProtectedRoute>
  ),
});

type Stage = "check" | "record" | "review" | "processing";
type PermissionState = "idle" | "requesting" | "granted" | "denied" | "unsupported";
type CaptureMode = "camera" | "upload";

function RecordPage() {
  const routeParams = useParams({ strict: false }) as { slug?: string };
  const slug = routeParams?.slug || "vertical-jump";
  const navigate = useNavigate();
  const definition = ASSESSMENTS.find((a) => a.slug === slug || a.id === slug) ?? ASSESSMENTS[0]!;
  const totalAttempts = definition.attempts;

  const {
    attempts,
    addAttempt,
    removeAttempt,
    resetAttempts,
    profile,
    biometricBaseline,
    lockBiometricBaseline,
  } = useAssessmentSession();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<CaptureMode>("camera");
  const [stage, setStage] = useState<Stage>("check");
  const [permission, setPermission] = useState<PermissionState>("idle");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Anti-Malpractice & Identity Verification State
  const [isMalpracticeActive, setIsMalpracticeActive] = useState(false);
  const [malpracticeCountdown, setMalpracticeCountdown] = useState(30);
  const [malpracticeReason, setMalpracticeReason] = useState<string>("");
  const [isSirenMuted, setIsSirenMuted] = useState(false);

  const sirenRef = useRef<MalpracticeSiren | null>(null);
  if (!sirenRef.current && typeof window !== "undefined") {
    sirenRef.current = new MalpracticeSiren();
  }
  const isMalpracticeActiveRef = useRef(false);
  const consecutiveMismatchRef = useRef(0);
  const consecutiveMatchRef = useRef(0);

  // Stop siren on component unmount
  useEffect(() => {
    return () => {
      sirenRef.current?.stop();
    };
  }, []);

  // Toggle siren mute for accessibility
  const toggleSirenMute = useCallback(() => {
    setIsSirenMuted((prev) => {
      const next = !prev;
      sirenRef.current?.setMute(next);
      return next;
    });
  }, []);

  // Biometric Baseline Extraction (for initial assessment)
  const handleBiometricBaselineExtracted = useCallback(
    (vector: AnthropometricVector) => {
      if (!biometricBaseline) {
        lockBiometricBaseline({
          ...vector,
          athleteName: profile.name || "Athlete",
        });
        toast.info(
          `Biometric athlete identity locked for ${profile.name || "Athlete"}. All assessments must be completed by this athlete.`,
          { duration: 4000 }
        );
      }
    },
    [biometricBaseline, lockBiometricBaseline, profile.name]
  );

  // Real-Time Biometric Comparison & Impersonation Detection
  const handleBiometricComparison = useCallback(
    (result: BiometricMatchResult) => {
      if (!biometricBaseline) return;

      if (!result.isMatch) {
        consecutiveMatchRef.current = 0;
        consecutiveMismatchRef.current += 1;

        // Sustained mismatch for ~4 frames (~0.5s of detection)
        if (consecutiveMismatchRef.current >= 4) {
          if (!isMalpracticeActiveRef.current) {
            isMalpracticeActiveRef.current = true;
            setIsMalpracticeActive(true);
            setMalpracticeCountdown(30);
            setMalpracticeReason(result.reason || "Anatomical bone proportions do not match the verified athlete.");
            sirenRef.current?.start();

            // If actively recording, halt attempt
            if (recorderRef.current && recorderRef.current.state === "recording") {
              recorderRef.current.stop();
            }
          }
        }
      } else {
        consecutiveMismatchRef.current = 0;
        consecutiveMatchRef.current += 1;

        // Sustained match for ~3 frames (~0.4s) -> Original athlete has returned!
        if (consecutiveMatchRef.current >= 3) {
          if (isMalpracticeActiveRef.current) {
            isMalpracticeActiveRef.current = false;
            setIsMalpracticeActive(false);
            sirenRef.current?.stop();
            setMalpracticeCountdown(30);
            toast.success("Original athlete recognized! Assessment unlocked.", { duration: 3000 });
          }
        }
      }
    },
    [biometricBaseline]
  );

  // 30-Second Malpractice Auto-Abort Timer
  useEffect(() => {
    if (!isMalpracticeActive) return;

    const timer = setInterval(() => {
      setMalpracticeCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-abort!
          sirenRef.current?.stop();
          stopStream();
          resetAttempts();
          toast.error(
            "Assessment Terminated: Malpractice detected — original athlete did not return within 30 seconds.",
            { duration: 7000 }
          );
          navigate({ to: "/dashboard" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isMalpracticeActive, navigate, resetAttempts, stopStream]);

  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  const requestCamera = useCallback(async (overrideFacing?: "environment" | "user") => {
    const targetFacing = overrideFacing || facingMode;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPermission("unsupported");
      return;
    }
    setPermission("requesting");
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: targetFacing, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setPermission("granted");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch {
      setPermission("denied");
    }
  }, [facingMode]);

  const toggleFacingMode = useCallback(() => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    void requestCamera(next);
  }, [facingMode, requestCamera]);

  useEffect(() => {
    if (mode === "camera" && stage === "record" && permission === "granted" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => undefined);
    }
  }, [mode, stage, permission]);

  const startAttempt = useCallback(() => {
    if (!streamRef.current) return;
    setCountdown(3);
    let tick = 3;
    const timer = setInterval(() => {
      tick -= 1;
      if (tick > 0) {
        setCountdown(tick);
        return;
      }
      clearInterval(timer);
      setCountdown(null);
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(streamRef.current!);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => event.data.size > 0 && chunks.push(event.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
        addAttempt({
          index: attempts.length + 1,
          previewUrl: URL.createObjectURL(blob),
          durationSeconds: Math.max(1, Math.round(elapsedRef.current)),
          recordedAt: new Date().toISOString(),
          blob,
        });
        setIsRecording(false);
        setElapsed(0);
      };
      recorder.start();
      setIsRecording(true);
    }, 1000);
  }, [addAttempt, attempts.length]);

  const elapsedRef = useRef(0);
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => setElapsed((e) => e + 0.1), 100);
    return () => clearInterval(timer);
  }, [isRecording]);

  const stopAttempt = useCallback(() => {
    recorderRef.current?.state === "recording" && recorderRef.current.stop();
  }, []);

  // Process uploaded video files into assessment attempts
  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file, idx) => {
        if (!file.type.startsWith("video/") && !file.name.match(/\.(mp4|webm|mov|mkv|avi|m4v)$/i)) {
          return;
        }

        const previewUrl = URL.createObjectURL(file);
        const tempVideo = document.createElement("video");
        tempVideo.preload = "metadata";
        tempVideo.src = previewUrl;

        tempVideo.onloadedmetadata = () => {
          const duration = Math.max(1, Math.round(tempVideo.duration || 5));
          addAttempt({
            index: attempts.length + idx + 1,
            previewUrl,
            durationSeconds: duration,
            recordedAt: new Date().toISOString(),
            blob: file,
          });
        };

        tempVideo.onerror = () => {
          addAttempt({
            index: attempts.length + idx + 1,
            previewUrl,
            durationSeconds: 5,
            recordedAt: new Date().toISOString(),
            blob: file,
          });
        };
      });
    },
    [addAttempt, attempts.length]
  );

  const queryClient = useQueryClient();

  const submit = useCallback(async () => {
    if (attempts.length === 0) return;
    setStage("processing");
    const testSlug = definition.slug || definition.id;
    const run = await createAssessment(testSlug);
    await uploadAttempts(run.id, attempts, setProgress, testSlug);
    await queryClient.invalidateQueries({ queryKey: ["metrics"] });
    await queryClient.invalidateQueries({ queryKey: ["history"] });
    await queryClient.invalidateQueries({ queryKey: ["results"] });
    stopStream();
    resetAttempts();
    navigate({ to: "/results/$runId", params: { runId: run.id } });
  }, [attempts, definition.id, definition.slug, navigate, queryClient, resetAttempts, stopStream]);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label-meta text-emerald-600 dark:text-emerald-400 font-bold">
              {definition.name} / {stageLabel(stage)}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {stage === "check" && "Assessment Capture Setup"}
              {stage === "record" && `Live Recording — Attempt ${Math.min(attempts.length + 1, totalAttempts)} of ${totalAttempts}`}
              {stage === "review" && "Review Assessment Attempts"}
              {stage === "processing" && "Uploading & AI Biomechanical Analysis"}
            </h1>
          </div>

          {/* Mode Switcher Tabs */}
          {stage === "check" && (
            <div className="flex items-center rounded-xl bg-muted/80 p-1 border border-border/80">
              <button
                type="button"
                onClick={() => {
                  setMode("camera");
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  mode === "camera"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Camera className="size-3.5 text-emerald-500" />
                <span>Live Camera</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopStream();
                  setMode("upload");
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  mode === "upload"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UploadCloud className="size-3.5 text-emerald-500" />
                <span>Upload Video Dataset</span>
              </button>
            </div>
          )}
        </div>

        {/* STEP 1: CAPTURE SETUP & VIDEO UPLOAD */}
        {stage === "check" && mode === "camera" && (
          <section className="mt-6 space-y-5">
            <div className="overflow-hidden rounded-2xl border border-border bg-inverse shadow-inner">
              <div className="relative aspect-[3/4] sm:aspect-video max-h-[70vh]">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="size-full object-cover"
                />
                {permission === "granted" && (
                  <>
                    <PoseDetectionOverlay
                      videoRef={videoRef}
                      isRecording={false}
                      biometricBaseline={biometricBaseline}
                      onBiometricBaselineExtracted={handleBiometricBaselineExtracted}
                      onBiometricComparison={handleBiometricComparison}
                      isMalpracticeActive={isMalpracticeActive}
                      athleteName={profile.name || "Athlete"}
                    />
                    {!isMalpracticeActive && (
                      <button
                        type="button"
                        onClick={toggleFacingMode}
                        className="absolute top-3 right-3 z-30 flex items-center gap-1.5 rounded-full bg-zinc-950/80 border border-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-zinc-900 transition-all active:scale-95 shadow-md"
                        title="Flip Camera (Front / Rear)"
                      >
                        <RotateCcw className="size-3.5 text-emerald-400" />
                        <span>{facingMode === "environment" ? "Rear Camera" : "Selfie Camera"}</span>
                      </button>
                    )}
                  </>
                )}

                {/* ANTI-MALPRACTICE RED ALARM OVERLAY */}
                {isMalpracticeActive && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-center bg-red-950/90 backdrop-blur-md border-4 border-red-500 animate-pulse">
                    <div className="relative mb-3">
                      <div className="size-20 rounded-full bg-red-600/30 border-2 border-red-500 flex items-center justify-center animate-ping absolute inset-0" />
                      <div className="relative size-20 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-white shadow-2xl">
                        <ShieldAlert className="size-10" />
                      </div>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-red-100 flex items-center gap-2">
                      <span>🚨 MALPRACTICE DETECTED 🚨</span>
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-red-200">
                      Unauthorized Person / Proxy Impersonation Detected
                    </p>

                    <div className="mt-3 max-w-md rounded-xl bg-black/60 border border-red-500/50 p-3 text-xs text-red-100/90 text-left space-y-1">
                      <p>
                        <strong className="text-white">Registered Athlete:</strong> {biometricBaseline?.athleteName || profile.name || "Original Athlete"}
                      </p>
                      <p>
                        <strong className="text-white">Biometric Violation:</strong> {malpracticeReason || "Candidate's skeletal anthropometrics do not match the verified baseline."}
                      </p>
                      <p className="text-[11px] text-amber-300">
                        ⚠️ Only the athlete who started assessment #1 is authorized to take all subsequent tests.
                      </p>
                    </div>

                    <div className="mt-4 flex flex-col items-center gap-2">
                      <div className="flex items-center gap-3 rounded-full bg-black/80 px-4 py-2 border border-red-400">
                        <Timer className="size-5 text-red-400 animate-spin" />
                        <span className="font-mono text-lg font-black text-white">
                          Auto-Exit in {malpracticeCountdown}s
                        </span>
                      </div>
                      <p className="text-xs text-red-200/80 max-w-sm">
                        Original athlete must return to camera view immediately, or this session will automatically terminate and exit to the Dashboard.
                      </p>
                      <div className="w-64 h-2 bg-red-950 rounded-full overflow-hidden border border-red-500/50 mt-1">
                        <div
                          className="h-full bg-red-500 transition-all duration-1000 ease-linear"
                          style={{ width: `${(malpracticeCountdown / 30) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={toggleSirenMute}
                        className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-all"
                      >
                        {isSirenMuted ? (
                          <>
                            <VolumeX className="size-3.5 text-amber-400" />
                            <span>Unmute Siren Alarm</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="size-3.5 text-red-300 animate-pulse" />
                            <span>Mute Siren Alarm</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sirenRef.current?.stop();
                          stopStream();
                          resetAttempts();
                          navigate({ to: "/dashboard" });
                        }}
                        className="flex items-center gap-1.5 rounded-full bg-red-600/80 hover:bg-red-600 border border-red-400 px-3 py-1.5 text-xs font-semibold text-white transition-all"
                      >
                        <span>Exit to Dashboard Now</span>
                      </button>
                    </div>
                  </div>
                )}

                {permission !== "granted" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-inverse-foreground bg-zinc-950/90 backdrop-blur-sm">
                    <div className="size-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                      <Camera className="size-7" />
                    </div>
                    <h3 className="text-base font-bold text-white">Enable Camera for AI Pose Tracking</h3>
                    <p className="max-w-sm text-xs text-zinc-400">
                      {permission === "denied"
                        ? "Camera access was blocked. Please enable permissions in your browser address bar and retry."
                        : permission === "unsupported"
                          ? "Mobile browsers restrict live webcam over plain HTTP. Tap below to record directly with your phone's camera app or use video upload."
                          : "We use your camera for real-time edge & joint detection. Video is processed locally on your machine."}
                    </p>
                    {permission === "unsupported" ? (
                      <Button
                        onClick={() => {
                          stopStream();
                          setMode("upload");
                        }}
                        className="mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      >
                        <UploadCloud className="size-4 mr-2" />
                        Record with Phone Camera / Upload
                      </Button>
                    ) : (
                      <Button onClick={() => void requestCamera()} disabled={permission === "requesting"} className="mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                        {permission === "requesting" ? (
                          <Loader2 className="size-4 animate-spin mr-2" />
                        ) : (
                          <Camera className="size-4 mr-2" />
                        )}
                        {permission === "denied" ? "Retry Camera Access" : "Enable Live Camera"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 text-xs text-muted-foreground flex items-start gap-3 shadow-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <div>
                <strong className="text-foreground">Optimal Recording Guidance:</strong> Position device at hip height, 2.5–3.5m away so your head and feet remain fully visible inside the frame throughout the exercise.
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className={`w-full sm:w-auto rounded-xl font-semibold shadow-md active:scale-95 transition-all ${
                  isMalpracticeActive
                    ? "bg-red-600 hover:bg-red-700 text-white cursor-not-allowed opacity-90"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
                disabled={permission !== "granted" || isMalpracticeActive}
                onClick={() => setStage("record")}
              >
                {isMalpracticeActive ? (
                  <>
                    <ShieldAlert className="size-4 mr-2 text-white animate-bounce" />
                    ⛔ Locked: Malpractice Detected
                  </>
                ) : (
                  <>
                    <Video className="size-4 mr-2" />
                    Start Live Recording Session
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto rounded-xl border-border hover:bg-muted/50"
                disabled={isMalpracticeActive}
                onClick={() => {
                  stopStream();
                  setMode("upload");
                }}
              >
                <UploadCloud className="size-4 mr-2 text-muted-foreground" />
                Switch to Video Upload Mode
              </Button>
            </div>
          </section>
        )}

        {/* STEP 1 (ALT): UPLOAD RECORDED VIDEO DATASET */}
        {stage === "check" && mode === "upload" && (
          <section className="mt-6 space-y-5">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.length) {
                  handleFiles(e.dataTransfer.files);
                }
              }}
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
                isDragging
                  ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
                  : "border-border bg-card hover:border-emerald-500/50 hover:bg-muted/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*,.mp4,.webm,.mov,.avi,.mkv,.m4v"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    handleFiles(e.target.files);
                  }
                }}
              />

              <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UploadCloud className="size-8" />
              </div>

              <h3 className="mt-4 text-base font-bold">Upload Recorded {definition.name} Video(s)</h3>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                Drag and drop your dataset video files here, or browse from your computer. Supports MP4, WebM, MOV, and AVI formats.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  size="lg"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md active:scale-95 transition-all"
                >
                  <FileVideo className="size-4 mr-2" />
                  Select Video Files
                </Button>
              </div>

              <p className="mt-3 text-[11px] text-muted-foreground">
                💡 Useful for dataset testing, offline recorded clips, and high-frame-rate smartphone exports.
              </p>
            </div>

            {/* List of Loaded Attempt Videos */}
            {attempts.length > 0 && (
              <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span>Loaded Video Attempts ({attempts.length})</span>
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="size-3.5 mr-1" />
                    Add Another File
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {attempts.map((attempt) => (
                    <div
                      key={attempt.index}
                      className="overflow-hidden rounded-xl border border-border bg-muted/40 shadow-sm"
                    >
                      <video
                        src={attempt.previewUrl || undefined}
                        controls
                        playsInline
                        className="aspect-video w-full bg-black object-cover"
                      />
                      <div className="flex items-center justify-between p-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">Attempt {attempt.index}</p>
                          <p className="label-meta text-muted-foreground">
                            {attempt.durationSeconds}s duration
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeAttempt(attempt.index)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/60">
                  <Button
                    size="lg"
                    onClick={submit}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md active:scale-95 transition-all"
                  >
                    <Upload className="size-4 mr-2" />
                    Analyze Uploaded Video Dataset ({attempts.length} {attempts.length === 1 ? "attempt" : "attempts"})
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetAttempts}
                    className="rounded-xl text-xs text-muted-foreground"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* STEP 2: LIVE RECORDING STAGE */}
        {stage === "record" && (
          <section className="mt-6 space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-inverse shadow-inner">
              <div className="relative aspect-[3/4] sm:aspect-video max-h-[70vh]">
                <video ref={videoRef} playsInline muted className="size-full object-cover" />
                {permission === "granted" && (
                  <PoseDetectionOverlay
                    videoRef={videoRef}
                    isRecording={isRecording}
                    biometricBaseline={biometricBaseline}
                    onBiometricBaselineExtracted={handleBiometricBaselineExtracted}
                    onBiometricComparison={handleBiometricComparison}
                    isMalpracticeActive={isMalpracticeActive}
                    athleteName={profile.name || "Athlete"}
                  />
                )}
                {!isRecording && !isMalpracticeActive && permission === "granted" && (
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    className="absolute top-4 right-4 z-30 flex items-center gap-1.5 rounded-full bg-zinc-950/80 border border-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-zinc-900 transition-all active:scale-95 shadow-md"
                    title="Flip Camera (Front / Rear)"
                  >
                    <RotateCcw className="size-3.5 text-emerald-400" />
                    <span>{facingMode === "environment" ? "Rear View" : "Selfie View"}</span>
                  </button>
                )}

                {/* ANTI-MALPRACTICE RED ALARM OVERLAY (RECORDING STAGE) */}
                {isMalpracticeActive && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-center bg-red-950/90 backdrop-blur-md border-4 border-red-500 animate-pulse">
                    <div className="relative mb-3">
                      <div className="size-20 rounded-full bg-red-600/30 border-2 border-red-500 flex items-center justify-center animate-ping absolute inset-0" />
                      <div className="relative size-20 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-white shadow-2xl">
                        <ShieldAlert className="size-10" />
                      </div>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-red-100 flex items-center gap-2">
                      <span>🚨 MALPRACTICE DETECTED 🚨</span>
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-red-200">
                      Unauthorized Person / Proxy Impersonation Detected
                    </p>

                    <div className="mt-3 max-w-md rounded-xl bg-black/60 border border-red-500/50 p-3 text-xs text-red-100/90 text-left space-y-1">
                      <p>
                        <strong className="text-white">Registered Athlete:</strong> {biometricBaseline?.athleteName || profile.name || "Original Athlete"}
                      </p>
                      <p>
                        <strong className="text-white">Biometric Violation:</strong> {malpracticeReason || "Candidate's skeletal anthropometrics do not match the verified baseline."}
                      </p>
                      <p className="text-[11px] text-amber-300">
                        ⚠️ Only the athlete who started assessment #1 is authorized to take all subsequent tests.
                      </p>
                    </div>

                    <div className="mt-4 flex flex-col items-center gap-2">
                      <div className="flex items-center gap-3 rounded-full bg-black/80 px-4 py-2 border border-red-400">
                        <Timer className="size-5 text-red-400 animate-spin" />
                        <span className="font-mono text-lg font-black text-white">
                          Auto-Exit in {malpracticeCountdown}s
                        </span>
                      </div>
                      <p className="text-xs text-red-200/80 max-w-sm">
                        Original athlete must return to camera view immediately, or this session will automatically terminate and exit to the Dashboard.
                      </p>
                      <div className="w-64 h-2 bg-red-950 rounded-full overflow-hidden border border-red-500/50 mt-1">
                        <div
                          className="h-full bg-red-500 transition-all duration-1000 ease-linear"
                          style={{ width: `${(malpracticeCountdown / 30) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={toggleSirenMute}
                        className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-all"
                      >
                        {isSirenMuted ? (
                          <>
                            <VolumeX className="size-3.5 text-amber-400" />
                            <span>Unmute Siren Alarm</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="size-3.5 text-red-300 animate-pulse" />
                            <span>Mute Siren Alarm</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sirenRef.current?.stop();
                          stopStream();
                          resetAttempts();
                          navigate({ to: "/dashboard" });
                        }}
                        className="flex items-center gap-1.5 rounded-full bg-red-600/80 hover:bg-red-600 border border-red-400 px-3 py-1.5 text-xs font-semibold text-white transition-all"
                      >
                        <span>Exit to Dashboard Now</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-dashed border-primary/70" />
                <div className="pointer-events-none absolute left-1/2 top-6 bottom-6 w-px -translate-x-1/2 bg-primary/30" />
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-inverse/80 px-3 py-1.5 backdrop-blur-md">
                  <Circle
                    className={`size-2.5 ${isRecording ? "animate-pulse fill-destructive text-destructive" : "fill-inverse-muted text-inverse-muted"}`}
                  />
                  <span className="readout text-xs text-inverse-foreground">
                    {elapsed.toFixed(1)}s
                  </span>
                </div>
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-inverse/60 backdrop-blur-sm">
                    <span className="readout text-7xl text-inverse-foreground">{countdown}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isRecording ? (
                <Button
                  size="lg"
                  className={`rounded-xl font-semibold shadow-md active:scale-95 transition-all ${
                    isMalpracticeActive
                      ? "bg-red-600 hover:bg-red-700 text-white cursor-not-allowed opacity-90"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                  onClick={startAttempt}
                  disabled={countdown !== null || attempts.length >= totalAttempts || isMalpracticeActive}
                >
                  {isMalpracticeActive ? (
                    <>
                      <ShieldAlert className="size-4 mr-2 text-white animate-bounce" />
                      ⛔ Locked: Malpractice Detected
                    </>
                  ) : (
                    <>
                      <Circle className="size-3.5 fill-current mr-2 text-red-400" />
                      Record Attempt ({attempts.length + 1} of {totalAttempts})
                    </>
                  )}
                </Button>
              ) : (
                <Button size="lg" variant="destructive" className="rounded-xl font-semibold shadow-md active:scale-95 transition-all" onClick={stopAttempt}>
                  Stop Recording
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl"
                disabled={attempts.length === 0 || isMalpracticeActive}
                onClick={() => setStage("review")}
              >
                Review Attempts ({attempts.length}/{totalAttempts})
              </Button>
            </div>
          </section>
        )}

        {/* STEP 3: REVIEW CAPTURED & UPLOADED ATTEMPTS */}
        {stage === "review" && (
          <section className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {attempts.map((attempt) => (
                <div
                  key={attempt.index}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                >
                  <video
                    src={attempt.previewUrl ?? undefined}
                    controls
                    playsInline
                    className="aspect-video w-full bg-black object-cover"
                  />
                  <div className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-semibold">Attempt {attempt.index}</p>
                      <p className="label-meta text-muted-foreground">
                        {attempt.durationSeconds}s captured
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete attempt ${attempt.index}`}
                      onClick={() => removeAttempt(attempt.index)}
                    >
                      <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button size="lg" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md" onClick={submit} disabled={attempts.length === 0}>
                <Upload className="size-4 mr-2" />
                Submit for AI Analysis
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl" onClick={() => setStage("record")}>
                <RotateCcw className="size-4 mr-2" />
                Record More Attempts
              </Button>
            </div>
          </section>
        )}

        {/* STEP 4: PROCESSING & ANALYSIS */}
        {stage === "processing" && (
          <section className="mt-6 rounded-2xl border border-border bg-card p-8 text-center shadow-md">
            <Loader2 className="mx-auto size-8 animate-spin text-emerald-600 dark:text-emerald-400" />
            <h3 className="mt-4 text-lg font-bold">Analyzing Movement Kinematics</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Processing video frames, calculating joint angles, and synthesizing Olympic coach report…
            </p>
            <Progress value={progress} className="mx-auto mt-6 max-w-md h-2" />
            <p className="readout mt-3 text-sm font-bold text-emerald-600 dark:text-emerald-400">{progress}%</p>
            <ul className="mx-auto mt-6 max-w-sm space-y-2.5 text-left text-xs text-muted-foreground border-t border-border/60 pt-4">
              {[
                "Uploading assessment video frames",
                "MediaPipe skeletal keypoint & joint detection",
                "Calculating biomechanical angle & force metrics",
                "Machine Learning multi-sport classification",
                "Olympic AI Coach report synthesis",
              ].map((step, i) => (
                <li key={step} className="flex items-center gap-2.5">
                  <CheckCircle2
                    className={`size-4 ${progress > (i + 1) * 18 ? "text-emerald-500" : "text-muted-foreground/30"}`}
                  />
                  <span className={progress > (i + 1) * 18 ? "text-foreground font-medium" : ""}>
                    {step}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function stageLabel(stage: Stage) {
  return {
    check: "Step 02 / Setup & Upload",
    record: "Step 03 / Live Capture",
    review: "Step 04 / Review",
    processing: "Step 05 / AI Analysis",
  }[stage];
}
