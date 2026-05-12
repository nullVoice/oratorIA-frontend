import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Recorder, useAudioRecorder } from "@/components/audio/recorder";
import { Waveform } from "@/components/audio/waveform";
import { AnalyzingState } from "@/components/practice/analyzing-state";
import {
  evaluateSession,
  fetchSessionDetail,
  uploadSessionAudio,
} from "@/lib/api/sessions";

export const Route = createFileRoute("/_authenticated/practice/$sessionId")({
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

  const recorder = useAudioRecorder({
    onError: (err) => toast.error(err.message || "Error al grabar"),
  });

  const handleStart = async () => {
    try {
      await recorder.start();
    } catch {
      // Error already toasted in onError.
    }
  };

  const handleStop = async () => {
    try {
      await recorder.stop();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al detener";
      toast.error(msg);
    }
  };

  const handleFinalize = async () => {
    if (!recorder.audioBlob) {
      toast.error("Aún no hay audio. Graba algo antes de evaluar.");
      return;
    }
    setSubmitting(true);
    try {
      const ext = guessExtension(recorder.mimeType);
      await uploadSessionAudio(sessionId, recorder.audioBlob, `audio.${ext}`);
      await evaluateSession(sessionId);
      // The :reportId URL param carries the session id — reports map 1:1
      // to sessions so we fetch /sessions/:id on the report page.
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
    if (recorder.isRecording) {
      void recorder.stop().catch(() => undefined);
    }
    recorder.reset();
    navigate({ to: "/dashboard" });
  };

  if (submitting) {
    return <AnalyzingState />;
  }

  if (sessionQuery.isLoading) {
    return (
      <div className="grid place-items-center py-24 text-sm text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-3 py-12 text-center">
        <h1 className="text-xl font-bold text-[#0A0A0A]">
          No encontramos esta sesión
        </h1>
        <p className="text-sm text-gray-600">
          Puede haber sido eliminada o no te pertenece.
        </p>
        <Link
          to="/dashboard"
          className="mx-auto mt-2 inline-flex h-10 items-center gap-2 rounded-lg bg-[#0A0A0A] px-4 text-sm font-bold text-white hover:bg-gray-800"
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

  const canFinalize = recorder.audioBlob !== null && !recorder.isRecording;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
            {humanPresentation(presentationType)}
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0A0A0A]">
            Sesión en curso
          </h1>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          aria-label="Cancelar"
          className="grid h-10 w-10 place-items-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#0A0A0A]"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <section className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2">
        <ContextRow label="Audiencia" value={audience} />
        <ContextRow label="Objetivo" value={objective} />
        <ContextRow
          label="Formalidad"
          value={FORMALITY_LABELS[formality] ?? formality}
        />
        <ContextRow
          label="Duración objetivo"
          value={
            durationTarget !== undefined ? `${durationTarget} min` : "—"
          }
        />
      </section>

      <section className="flex flex-col items-center gap-5 rounded-2xl border border-gray-200 bg-white p-6">
        <Waveform
          stream={recorder.stream}
          audioBlob={recorder.stream ? null : recorder.audioBlob}
        />
        <Recorder
          state={recorder.state}
          duration={recorder.duration}
          onStart={handleStart}
          onStop={handleStop}
          disabled={submitting}
        />
        {recorder.audioBlob && !recorder.isRecording && (
          <p className="text-xs text-gray-500">
            Grabación lista. Puedes volver a grabar o finalizar para evaluar.
          </p>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {recorder.audioBlob && !recorder.isRecording && (
          <button
            type="button"
            onClick={recorder.reset}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-gray-300"
          >
            Volver a grabar
          </button>
        )}
        <button
          type="button"
          onClick={handleFinalize}
          disabled={!canFinalize || submitting}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#C6FF3D] px-5 text-sm font-bold text-[#0A0A0A] transition-all hover:-translate-y-0.5 hover:bg-[#D4FF7A] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Finalizar y evaluar
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div className="mt-0.5 text-sm text-[#0A0A0A]">{value || "—"}</div>
    </div>
  );
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
