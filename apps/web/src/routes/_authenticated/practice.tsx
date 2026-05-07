import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ActiveTranscript } from "@/components/practice/active-transcript";
import { AnalyzingState } from "@/components/practice/analyzing-state";
import { AudioOrb } from "@/components/practice/audio-orb";
import { ControlBar } from "@/components/practice/control-bar";
import { FinalReport } from "@/components/practice/final-report";
import { FloatingMetrics } from "@/components/practice/floating-metrics";
import { LiveTimer } from "@/components/practice/live-timer";
import { PreSession } from "@/components/practice/pre-session";
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

type Phase = "pre" | "active" | "finalizing" | "report";

function PracticeRoute() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("pre");
  const [report, setReport] = useState<FinalizeResponse | null>(null);
  const [finalMetrics, setFinalMetrics] = useState<{
    durationSeconds: number;
    fillerTotal: number;
    wpm: number;
  } | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const muteTrackRef = useRef<MediaStreamTrack | null>(null);

  const recorder = useRecorder({
    transcribeIntervalMs: 8000,
    onError: (err) => toast.error(err.message || "Error al grabar"),
  });

  // Find the active mic track once recording starts so we can toggle mute.
  useEffect(() => {
    if (recorder.state !== "recording") {
      muteTrackRef.current = null;
      return;
    }
    const recorderInstance = (window as unknown as { __recorder?: { stream?: MediaStream } });
    const stream = recorderInstance?.__recorder?.stream;
    if (stream) {
      const track = stream.getAudioTracks()[0];
      if (track) muteTrackRef.current = track;
    }
  }, [recorder.state]);

  const fillers = useMemo(() => detectFillers(recorder.transcript), [recorder.transcript]);
  const wpm = useMemo(
    () => calculateWpm(recorder.transcript, recorder.elapsedSeconds),
    [recorder.transcript, recorder.elapsedSeconds],
  );

  const handleStart = async () => {
    setReport(null);
    setFinalMetrics(null);
    setMicMuted(false);
    try {
      await recorder.start();
      setPhase("active");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo acceder al micrófono";
      toast.error(msg);
    }
  };

  const handleStop = async () => {
    if (recorder.state !== "recording") return;
    setPhase("finalizing");
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
        toast.error("No detectamos audio. Intenta hablar más fuerte y vuelve a empezar.");
        setPhase("pre");
        recorder.reset();
        return;
      }

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
      setPhase("report");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al finalizar";
      toast.error(msg);
      setPhase("active");
    }
  };

  const handleCancel = () => {
    if (recorder.state === "recording") void recorder.stop().catch(() => undefined);
    recorder.reset();
    setReport(null);
    setFinalMetrics(null);
    setPhase("pre");
  };

  const handleNewSession = () => {
    setReport(null);
    setFinalMetrics(null);
    recorder.reset();
    setPhase("pre");
  };

  const handleToggleMic = () => {
    setMicMuted((prev) => {
      const next = !prev;
      const track = muteTrackRef.current;
      if (track) track.enabled = !next;
      return next;
    });
  };

  // ============================ RENDER PHASES ============================

  if (phase === "report" && report && finalMetrics) {
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

  if (phase === "finalizing") {
    return <AnalyzingState />;
  }

  if (phase === "active") {
    return (
      <div className="flex flex-col gap-6">
        {/* Header strip */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Sesión en tiempo real
            </p>
            <h1 className="text-xl font-extrabold tracking-tight text-[#0A0A0A]">
              Cuéntanos lo que practicas
            </h1>
          </div>
          <LiveTimer elapsedSeconds={recorder.elapsedSeconds} />
        </header>

        {/* Stage: orb + floating metrics */}
        <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-[#F7FFE0]/40 to-white p-8">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_auto]">
            <div className="flex flex-col items-center gap-4">
              <AudioOrb state={micMuted ? "idle" : "listening"} />
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                {micMuted ? "Micrófono silenciado" : "Te estamos escuchando"}
              </span>
              <p className="max-w-md text-center text-[15px] font-medium text-gray-700">
                Habla con naturalidad. La transcripción y métricas se actualizan
                cada pocos segundos.
              </p>
            </div>
            <FloatingMetrics
              elapsedSeconds={recorder.elapsedSeconds}
              fillerTotal={fillers.total}
              wpm={wpm}
              isListening={recorder.state === "recording" && !micMuted}
            />
          </div>
        </section>

        {/* Detected fillers (compact strip) */}
        {fillers.byWord.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
            <div className="mb-2 flex items-center justify-between text-[12px] font-semibold text-amber-900">
              <span>Muletillas detectadas</span>
              <span>Total: {fillers.total}</span>
            </div>
            <ul className="flex flex-wrap gap-2">
              {fillers.byWord.map(({ word, count }) => (
                <li
                  key={word}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs"
                >
                  <span className="font-semibold text-[#0A0A0A]">“{word}”</span>
                  <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ActiveTranscript
          transcript={recorder.transcript}
          isTranscribing={recorder.isTranscribing}
          recording={recorder.state === "recording"}
        />

        <ControlBar
          micMuted={micMuted}
          onToggleMic={handleToggleMic}
          onStop={handleStop}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  // Pre-session (default).
  return (
    <PreSession
      starting={recorder.state === "starting"}
      onStart={handleStart}
    />
  );
}
