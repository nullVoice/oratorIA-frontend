import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ActiveTranscript } from "@/components/practice/active-transcript";
import { AnalyzingState } from "@/components/practice/analyzing-state";
import { RadialRecorder } from "@/components/practice/radial-recorder";
import {
  evaluateSession,
  fetchSessionDetail,
  uploadSessionAudio,
} from "@/lib/api/sessions";
import { calculateWpm, paceLabel } from "@/lib/practice/fillers";
import { useDeepgram, countFillersFromTranscript } from "@/lib/practice/use-deepgram";
import { useRecorder } from "@/lib/practice/use-recorder";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/practice/$sessionId/")({
  component: ActivePracticeRoute,
});

const FORMALITY_LABELS: Record<string, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

function ActivePracticeRoute() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const sessionQuery = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => fetchSessionDetail(sessionId),
  });

  // --- Recording (blob + stream) ---
  // useRecorder still owns MediaRecorder + the final audio blob.
  // We pass transcribeIntervalMs=Infinity to disable the 4s Whisper
  // polling — Deepgram replaces that path entirely.
  const recorder = useRecorder({
    transcribeIntervalMs: Infinity,
    onError: (err) => toast.error(err.message || "Error al grabar"),
  });
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // --- Live transcription via Deepgram streaming ---
  // Pass the live mic stream; hook opens a WS while stream is active.
  const deepgram = useDeepgram(recorder.stream);

  // Show connection error as a non-blocking toast (don't block the UI).
  const deepgramErrorRef = { current: "" };
  if (deepgram.error && deepgram.error !== deepgramErrorRef.current) {
    deepgramErrorRef.current = deepgram.error;
    toast.error(`Deepgram: ${deepgram.error}`);
  }

  // The live display combines the stable transcript + current interim.
  const liveDisplay = deepgram.interim
    ? `${deepgram.transcript} ${deepgram.interim}`.trim()
    : deepgram.transcript;

  // Lexical fillers from the stable transcript (F2-U-05/06 — no flicker).
  const fillers = countFillersFromTranscript(deepgram.transcript);
  // Total = lexical fillers + prolonged vocalizations ("eeee"/"ehhh") detected
  // from Deepgram word durations.
  const totalFillers = fillers.total + deepgram.prolonged;
  const wpm = calculateWpm(deepgram.transcript, recorder.elapsedSeconds);
  const pace = paceLabel(wpm);

  // hasSpoken: use deepgram transcript or the live interim, or the recording state.
  const hasSpoken = liveDisplay.length > 0 || recorder.state === "recording";

  const handleStart = async () => {
    try {
      setAudioBlob(null);
      await recorder.start();
    } catch {
      // Error already toasted in onError.
    }
  };

  const handleStop = async () => {
    try {
      const blob = await recorder.stop();
      setAudioBlob(blob);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al detener";
      toast.error(msg);
    }
  };

  const handleFinalize = async () => {
    if (!audioBlob) {
      toast.error("Aún no hay audio. Grabá algo antes de evaluar.");
      return;
    }
    setSubmitting(true);
    try {
      const ext = guessExtension(audioBlob.type);
      await uploadSessionAudio(sessionId, audioBlob, `audio.${ext}`);
      await evaluateSession(sessionId);
      navigate({
        to: "/reports/$reportId",
        params: { reportId: sessionId },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al evaluar";
      toast.error(msg);
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (recorder.state === "recording") {
      void recorder.stop().catch(() => undefined);
    }
    recorder.reset();
    setAudioBlob(null);
    navigate({ to: "/dashboard" });
  };

  if (submitting) {
    return <AnalyzingState />;
  }

  if (sessionQuery.isLoading) {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-soft">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }
  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-3 py-12 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">
          No encontramos esta sesión
        </h1>
        <p className="text-sm text-ink-soft">
          Puede haber sido eliminada o no te pertenece.
        </p>
        <Link
          to="/dashboard"
          className="mx-auto mt-2 inline-flex h-10 items-center gap-2 rounded-lg bg-lime px-4 text-sm font-bold text-on-lime transition-colors hover:bg-lime-dim"
        >
          Volver al dashboard
        </Link>
      </div>
    );
  }

  const session = sessionQuery.data;
  const ctx = session.context as Record<string, unknown>;
  const presentationType = String(ctx.presentation_type ?? "Presentación");
  const audience = String(ctx.audience ?? "");
  const objective = String(ctx.objective ?? "");
  const formality = String(ctx.formality ?? "");
  const durationTarget = ctx.duration_target;

  const recording = recorder.state === "recording";
  const canFinalize = audioBlob !== null && !recording;
  const targetMinutes = Number(durationTarget) || 5;
  const formalityLabel = FORMALITY_LABELS[formality] ?? formality;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Sesión en curso
          </h1>
          <p className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-ink-soft">
            <span className="font-semibold text-ink">
              {humanPresentation(presentationType)}
            </span>
            <span className="text-ink-faint">·</span>
            <span>Formalidad {formalityLabel.toLowerCase()}</span>
            <span className="text-ink-faint">·</span>
            <span>Objetivo {targetMinutes} min</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          aria-label="Cancelar"
          className="grid h-10 w-10 place-items-center rounded-full text-ink-faint transition-colors hover:bg-surface hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Open studio — no boxes, editorial composition */}
      <div className="relative grid items-center gap-x-10 gap-y-12 py-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:py-12">
        {recording && (
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/10 blur-3xl"
          />
        )}

        {/* Brief (left) */}
        <dl className="order-2 w-full max-w-xs justify-self-center lg:order-1 lg:justify-self-start">
          <Meta label="Audiencia" value={audience} />
          <Meta label="Objetivo" value={objective} />
        </dl>

        {/* Recorder (center) */}
        <div className="relative order-1 flex flex-col items-center gap-5 lg:order-2">
          <RadialRecorder
            stream={recorder.stream}
            state={recorder.state}
            duration={recorder.elapsedSeconds}
            targetMinutes={targetMinutes}
            onStart={handleStart}
            onStop={handleStop}
            disabled={submitting}
          />
          <div className="text-center">
            <div className="font-display text-4xl font-bold tabular-nums text-ink">
              {fmt(recorder.elapsedSeconds)}
            </div>
            <div className="mt-1.5 text-sm text-ink-soft">
              {recording ? (
                <span className="inline-flex items-center gap-2 font-medium">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  Grabando · análisis en vivo
                  {deepgram.isConnected && (
                    <span className="text-[11px] text-ink-faint">· DG</span>
                  )}
                </span>
              ) : audioBlob ? (
                "Grabación lista — finalizá para evaluar"
              ) : (
                "Tocá el micrófono para empezar"
              )}
            </div>
          </div>
        </div>

        {/* Live feedback (right) */}
        <dl className="order-3 w-full max-w-xs justify-self-center lg:justify-self-end">
          <Meta
            label="Muletillas"
            value={hasSpoken ? String(totalFillers) : "—"}
            align="right"
            large
            tone={totalFillers > 5 ? "warn" : undefined}
          />
          <Meta
            label="Palabras / min"
            value={wpm > 0 ? `${Math.round(wpm)} · ${pace.label}` : "—"}
            align="right"
            large
            tone={pace.tone === "fast" ? "warn" : undefined}
          />
          <Meta
            label="Transcurrido"
            value={fmt(recorder.elapsedSeconds)}
            align="right"
            large
          />
        </dl>
      </div>

      {/* Live transcript with fillers highlighted (Deepgram-powered) */}
      {hasSpoken && (
        <ActiveTranscript
          transcript={liveDisplay}
          isTranscribing={recording && !deepgram.isConnected}
          recording={recording}
        />
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {audioBlob && !recording && (
          <button
            type="button"
            onClick={() => {
              recorder.reset();
              setAudioBlob(null);
            }}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-surface px-4 text-sm font-semibold text-ink-soft ring-1 ring-line transition-colors hover:text-ink hover:ring-line-strong"
          >
            Volver a grabar
          </button>
        )}
        <button
          type="button"
          onClick={handleFinalize}
          disabled={!canFinalize || submitting}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-lime px-5 text-sm font-bold text-on-lime shadow-[0_0_28px_var(--color-lime-shadow)] transition-colors hover:bg-lime-dim disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          Finalizar y evaluar
          <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
  align = "left",
  large,
  highlight,
  tone,
}: {
  label: string;
  value: string;
  align?: "left" | "right";
  large?: boolean;
  highlight?: boolean;
  tone?: "warn";
}) {
  return (
    <div
      className={cn(
        "border-b border-line py-3.5 first:border-t",
        align === "right" && "text-right",
      )}
    >
      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 truncate",
          large ? "font-display text-xl font-bold tabular-nums" : "text-sm",
          tone === "warn"
            ? "text-amber-600 dark:text-amber-400"
            : highlight
              ? "text-accent"
              : "text-ink",
        )}
      >
        {value || "—"}
      </dd>
    </div>
  );
}

function fmt(seconds: number): string {
  const t = Math.max(0, Math.floor(seconds));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function humanPresentation(t: string): string {
  switch (t) {
    case "tesis":
      return "Tesis";
    case "pitch":
      return "Pitch";
    case "entrevista":
      return "Entrevista";
    case "reporte_ejecutivo":
      return "Reporte ejecutivo";
    case "clase":
      return "Clase";
    default:
      return t;
  }
}

function guessExtension(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("mpeg")) return "mp3";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}
