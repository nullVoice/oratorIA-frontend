import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { FillersPanel } from "@/components/practice/fillers-panel";
import { FinalReport } from "@/components/practice/final-report";
import { LiveMetrics } from "@/components/practice/live-metrics";
import { RecordButton } from "@/components/practice/record-button";
import { TranscriptPanel } from "@/components/practice/transcript-panel";
import { api } from "@/lib/api/client";
import { calculateWpm, detectFillers } from "@/lib/practice/fillers";
import { useRecorder } from "@/lib/practice/use-recorder";

interface FinalizeResponse {
  score: number;
  summary: string;
  strength_title: string;
  strength_text: string;
  improvement_title: string;
  improvement_text: string;
}

export const Route = createFileRoute("/_authenticated/practice")({
  component: PracticeRoute,
});

function PracticeRoute() {
  const navigate = useNavigate();
  const [report, setReport] = useState<FinalizeResponse | null>(null);
  const [finalMetrics, setFinalMetrics] = useState<{
    durationSeconds: number;
    fillerTotal: number;
    wpm: number;
  } | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const recorder = useRecorder({
    transcribeIntervalMs: 8000,
    onError: (err) => toast.error(err.message || "Error al grabar"),
  });

  const fillers = useMemo(() => detectFillers(recorder.transcript), [recorder.transcript]);
  const wpm = useMemo(
    () => calculateWpm(recorder.transcript, recorder.elapsedSeconds),
    [recorder.transcript, recorder.elapsedSeconds],
  );

  const handleStart = async () => {
    setReport(null);
    setFinalMetrics(null);
    try {
      await recorder.start();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo acceder al micrófono";
      toast.error(msg);
    }
  };

  const handleStop = async () => {
    try {
      await recorder.stop();
      const finalTranscript = recorder.transcript;
      const finalDuration = recorder.elapsedSeconds;
      const finalFillers = detectFillers(finalTranscript);
      const finalWpm = calculateWpm(finalTranscript, finalDuration);
      setFinalMetrics({
        durationSeconds: finalDuration,
        fillerTotal: finalFillers.total,
        wpm: finalWpm,
      });

      if (!finalTranscript.trim()) {
        toast.error("No detectamos audio. Intenta hablar más fuerte.");
        return;
      }

      setIsFinalizing(true);
      const resp = (await api
        .post("api/v1/practice/finalize", {
          json: {
            transcript: finalTranscript,
            duration_seconds: finalDuration,
            filler_words_count: finalFillers.total,
            words_per_minute: finalWpm,
          },
        })
        .json()) as FinalizeResponse;
      setReport(resp);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al finalizar";
      toast.error(msg);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleNewSession = () => {
    setReport(null);
    setFinalMetrics(null);
    recorder.reset();
  };

  // Render the report once Claude returns.
  if (report && finalMetrics) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-7">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A]">
            Tu reporte
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Análisis basado en {Math.round(finalMetrics.durationSeconds)} segundos de audio.
          </p>
        </div>
        <FinalReport
          score={report.score}
          summary={report.summary}
          strengthTitle={report.strength_title}
          strengthText={report.strength_text}
          improvementTitle={report.improvement_title}
          improvementText={report.improvement_text}
          metrics={finalMetrics}
          onNewSession={handleNewSession}
          onBackToDashboard={() => navigate({ to: "/dashboard" })}
        />
      </div>
    );
  }

  // While Claude evaluates.
  if (isFinalizing) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#0A0A0A]" />
        <h2 className="text-xl font-extrabold tracking-tight text-[#0A0A0A]">
          Analizando tu desempeño
        </h2>
        <p className="text-sm text-gray-600">
          OratorIA Coach está revisando tu transcripción y métricas.
        </p>
      </div>
    );
  }

  // Recording / idle UI.
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A]">
          Sesión en tiempo real
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Habla con naturalidad. Detectamos muletillas, ritmo y duración mientras hablas; al
          finalizar te damos un reporte con score, fortaleza y mejora.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white p-8">
        <RecordButton state={recorder.state} onStart={handleStart} onStop={handleStop} />
        <p className="text-sm font-semibold text-gray-700">
          {recorder.state === "recording"
            ? "Pulsa para detener y analizar"
            : recorder.state === "starting"
              ? "Solicitando micrófono…"
              : recorder.state === "stopping"
                ? "Procesando última transcripción…"
                : "Pulsa para empezar a grabar"}
        </p>
      </div>

      <LiveMetrics
        elapsedSeconds={recorder.elapsedSeconds}
        fillerTotal={fillers.total}
        wpm={wpm}
      />

      <FillersPanel fillers={fillers} />

      <TranscriptPanel
        transcript={recorder.transcript}
        isTranscribing={recorder.isTranscribing}
        recording={recorder.state === "recording"}
      />
    </div>
  );
}
