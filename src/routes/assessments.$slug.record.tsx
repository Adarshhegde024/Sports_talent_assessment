import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Circle,
  Loader2,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAssessmentSession } from "@/lib/assessment-session";
import { createAssessment, uploadAttempts } from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ASSESSMENTS } from "@/data/mock";
import { useQueryClient } from "@tanstack/react-query";
import { PoseDetectionOverlay } from "@/components/camera/PoseDetectionOverlay";

export const Route = createFileRoute("/assessments/$slug/record")({
  head: () => ({
    meta: [
      { title: "Record your assessment — SportSense AI" },
      {
        name: "description",
        content: "Camera check, guided recording and review of your assessment attempts.",
      },
      { property: "og:title", content: "Record your assessment — SportSense AI" },
      {
        property: "og:description",
        content: "Guided smartphone capture with framing overlay and attempt review.",
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

function RecordPage() {
  const { slug } = useParams({ from: "/assessments/$slug/record" });
  const navigate = useNavigate();
  const definition = ASSESSMENTS.find((a) => a.slug === slug) ?? ASSESSMENTS[0]!;
  const totalAttempts = definition.attempts;

  const { attempts, addAttempt, removeAttempt, resetAttempts } = useAssessmentSession();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const [stage, setStage] = useState<Stage>("check");
  const [permission, setPermission] = useState<PermissionState>("idle");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  const requestCamera = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPermission("unsupported");
      return;
    }
    setPermission("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
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
  }, []);

  useEffect(() => {
    if (stage === "record" && permission === "granted" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => undefined);
    }
  }, [stage, permission]);

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

  const queryClient = useQueryClient();

  const submit = useCallback(async () => {
    setStage("processing");
    const slug = definition.slug || definition.id;
    const run = await createAssessment(slug);
    await uploadAttempts(run.id, attempts, setProgress, slug);
    await queryClient.invalidateQueries({ queryKey: ["metrics"] });
    await queryClient.invalidateQueries({ queryKey: ["history"] });
    stopStream();
    resetAttempts();
    navigate({ to: "/results/$runId", params: { runId: run.id } });
  }, [attempts, definition.id, definition.slug, navigate, queryClient, resetAttempts, stopStream]);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="label-meta text-muted-foreground">
          {definition.name} / {stageLabel(stage)}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {stage === "check" && "Camera check"}
          {stage === "record" && `Attempt ${Math.min(attempts.length + 1, totalAttempts)} of ${totalAttempts}`}
          {stage === "review" && "Review your attempts"}
          {stage === "processing" && "Uploading & analyzing"}
        </h1>

        {stage === "check" && (
          <section className="mt-6 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-border bg-inverse shadow-inner">
              <div className="relative aspect-[3/4] sm:aspect-video max-h-[70vh]">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="size-full object-cover"
                />
                {permission === "granted" && (
                  <PoseDetectionOverlay videoRef={videoRef} isRecording={false} />
                )}
                {permission !== "granted" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-inverse-foreground">
                    <Camera className="size-6 text-primary" />
                    <p className="max-w-sm text-sm text-inverse-muted">
                      {permission === "denied"
                        ? "Camera access was blocked. Enable it in your browser settings and retry."
                        : permission === "unsupported"
                          ? "This device or browser does not support camera capture."
                          : "We need access to your camera to record the assessment. Video stays on your device."}
                    </p>
                    <Button onClick={requestCamera} disabled={permission === "requesting"} className="active:scale-95 transition-transform">
                      {permission === "requesting" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Camera className="size-4" />
                      )}
                      {permission === "denied" ? "Retry access" : "Enable camera"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
              <p className="flex gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" />
                Check your full body is visible, the phone is stable, and there is space to land
                safely before you begin.
              </p>
            </div>
            <Button
              size="lg"
              className="w-full sm:w-auto active:scale-95 transition-transform"
              disabled={permission !== "granted"}
              onClick={() => setStage("record")}
            >
              Start recording session
            </Button>
          </section>
        )}

        {stage === "record" && (
          <section className="mt-6 space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-inverse shadow-inner">
              <div className="relative aspect-[3/4] sm:aspect-video max-h-[70vh]">
                <video ref={videoRef} playsInline muted className="size-full object-cover" />
                {permission === "granted" && (
                  <PoseDetectionOverlay videoRef={videoRef} isRecording={isRecording} />
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
                  onClick={startAttempt}
                  disabled={countdown !== null || attempts.length >= totalAttempts}
                >
                  Record attempt
                </Button>
              ) : (
                <Button size="lg" variant="destructive" onClick={stopAttempt}>
                  Stop attempt
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                disabled={attempts.length === 0}
                onClick={() => setStage("review")}
              >
                Review {attempts.length}/{totalAttempts}
              </Button>
            </div>
          </section>
        )}

        {stage === "review" && (
          <section className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {attempts.map((attempt) => (
                <div
                  key={attempt.index}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <video
                    src={attempt.previewUrl ?? undefined}
                    controls
                    playsInline
                    className="aspect-video w-full bg-inverse object-cover"
                  />
                  <div className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-medium">Attempt {attempt.index}</p>
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
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={submit} disabled={attempts.length === 0}>
                <Upload className="size-4" />
                Submit for analysis
              </Button>
              <Button size="lg" variant="outline" onClick={() => setStage("record")}>
                <RotateCcw className="size-4" />
                Record more
              </Button>
            </div>
          </section>
        )}

        {stage === "processing" && (
          <section className="mt-6 rounded-2xl border border-border bg-card p-8 text-center">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Uploading attempts and running movement analysis…
            </p>
            <Progress value={progress} className="mx-auto mt-6 max-w-md" />
            <p className="readout mt-3 text-sm">{progress}%</p>
            <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-xs text-muted-foreground">
              {["Uploading video", "Detecting pose keypoints", "Estimating flight time", "Scoring sport suitability"].map(
                (step, i) => (
                  <li key={step} className="flex items-center gap-2">
                    <CheckCircle2
                      className={`size-3.5 ${progress > i * 25 ? "text-primary" : "text-muted-foreground/40"}`}
                    />
                    {step}
                  </li>
                ),
              )}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function stageLabel(stage: Stage) {
  return { check: "Step 02 / Camera", record: "Step 03 / Capture", review: "Step 04 / Review", processing: "Step 05 / Analysis" }[
    stage
  ];
}
