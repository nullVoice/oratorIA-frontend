import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { z } from "zod";

import { AvatarCall } from "@/components/audio/avatar-call";
import {
  deriveAvatarSpeaking,
  type TavusEvent,
} from "@/lib/practice/tavus-events";
import { AnalyzingState } from "@/components/practice/analyzing-state";
import { LiveFillersHud } from "@/components/practice/live-fillers-hud";
import {
  endAvatarSession,
  startAvatarSession,
  type AvatarStartResponse,
} from "@/lib/api/avatar";
import { getApiErrorMessage } from "@/lib/api/errors";
import { fetchSessionDetail } from "@/lib/api/sessions";
import { useAuthStore } from "@/stores/auth-store";
import { calculateWpm, paceLabel } from "@/lib/practice/fillers";
import {
  countFillersFromTranscript,
  useDeepgram,
} from "@/lib/practice/use-deepgram";

const SearchSchema = z.object({
  interactive: z.boolean().default(false).catch(false),
});

export const Route = createFileRoute(
  "/_authenticated/practice/$sessionId/avatar",
)({
  validateSearch: SearchSchema.parse,
  component: AvatarPracticeRoute,
});

type Phase = "starting" | "live" | "ending" | "evaluating" | "done" | "error";

function AvatarPracticeRoute() {
  const { sessionId } = Route.useParams();
  const { interactive } = Route.useSearch();
  const navigate = useNavigate();
  const presenterName = useAuthStore((s) => s.user?.full_name) ?? undefined;
  const [phase, setPhase] = useState<Phase>("starting");
  const [conversation, setConversation] = useState<AvatarStartResponse | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reportTimedOut, setReportTimedOut] = useState(false);
  const startedRef = useRef(false);
  const eventsRef = useRef<TavusEvent[]>([]);
  // Live paraverbal overlay state (Deepgram muletillas/pace over the avatar).
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // Latest Raven-1 reading of the user's camera (from Tavus utterance events),
  // surfaced live in the self-view so the analysis is visible, not just logged.
  const [visualInsight, setVisualInsight] = useState<string | null>(null);

  // 1) Start the avatar conversation exactly once.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      try {
        const data = await startAvatarSession(sessionId, { interactive });
        setConversation(data);
        setPhase("live");
      } catch (err) {
        const msg = await getApiErrorMessage(
          err,
          "No pudimos iniciar la audiencia digital. Prueba de nuevo o usa la Práctica simple.",
        );
        setErrorMsg(msg);
        setPhase("error");
        toast.error(msg);
      }
    })();
  }, [interactive, sessionId]);

  // 2) When the call ends, hit /avatar-end with the accumulated event
  //    stream and switch to evaluating.
  const handleEnd = async () => {
    if (phase !== "live") return;
    setPhase("ending");
    try {
      const result = await endAvatarSession(sessionId, {
        events: eventsRef.current,
      });
      if (result.report_ready) {
        navigate({
          to: "/reports/$reportId",
          params: { reportId: sessionId },
        });
      } else {
        setPhase("evaluating");
      }
    } catch (err) {
      const msg = await getApiErrorMessage(err, "No pudimos cerrar la sesión.");
      toast.error(msg);
      setPhase("evaluating");
    }
  };

  // Accumulate every Daily app-message event in a ref so we can ship them
  // all to the backend in one shot when the call ends. Also derive the echo
  // gate: while the avatar (replica) is speaking, we pause mic ingestion to
  // Deepgram so the avatar's own voice is never counted as the user's fillers.
  const handleEvent = (ev: TavusEvent) => {
    eventsRef.current.push(ev);
    setAvatarSpeaking((prev) => deriveAvatarSpeaking(prev, ev));
    const visual = extractVisualAnalysis(ev);
    if (visual) setVisualInsight(visual);
  };

  // 3) While "evaluating", poll GET /sessions/:id until the report appears
  //    (delivered by the Tavus transcription_ready webhook), then navigate to
  //    /reports/:id. Caps at ~60s of polling.
  const reportPoll = useQuery({
    queryKey: ["session-report", sessionId, "poll"],
    queryFn: async () => {
      const detail = await fetchSessionDetail(sessionId);
      if (detail.report) {
        navigate({
          to: "/reports/$reportId",
          params: { reportId: sessionId },
        });
        return detail;
      }
      throw new Error("report not ready yet");
    },
    enabled: phase === "evaluating" && !reportTimedOut,
    refetchInterval: 3000,
    retry: 20,
  });

  // If polling exhausts its retries without a report (e.g. the Tavus webhook
  // never reached the backend because the tunnel is down), stop spinning on the
  // analyzing screen and surface a clear, non-blocking message instead.
  useEffect(() => {
    if (phase === "evaluating" && reportPoll.isError) {
      setReportTimedOut(true);
    }
  }, [phase, reportPoll.isError]);

  // 4) Live paraverbal overlay: capture a dedicated mic stream (AEC on) for
  //    Deepgram. The Daily prebuilt iframe owns its own getUserMedia and does
  //    not expose its track to the parent, so we open an independent capture;
  //    echoCancellation references the speaker output to suppress the avatar's
  //    voice, and the per-utterance echo gate (avatarSpeaking) is the backstop.
  useEffect(() => {
    if (phase !== "live") return;
    let active = true;
    let local: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      .then((s) => {
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        local = s;
        setMicStream(s);
      })
      .catch(() => {
        // Mic denied/unavailable — the HUD just stays empty; the avatar call
        // (which manages its own mic via Daily) is unaffected.
      });
    return () => {
      active = false;
      local?.getTracks().forEach((t) => t.stop());
      setMicStream(null);
    };
  }, [phase]);

  // Elapsed timer drives WPM and the HUD clock; runs only while live.
  useEffect(() => {
    if (phase !== "live") return;
    const startedAt = Date.now();
    setElapsedSeconds(0);
    const id = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const deepgram = useDeepgram(micStream, { paused: avatarSpeaking });
  const fillers = countFillersFromTranscript(deepgram.transcript);
  const totalFillers = fillers.total + deepgram.prolonged;
  const wpm = calculateWpm(deepgram.transcript, elapsedSeconds);
  const pace = paceLabel(wpm);
  const liveLine = deepgram.interim
    ? `${deepgram.transcript} ${deepgram.interim}`.trim()
    : deepgram.transcript;
  const hasSpoken = liveLine.length > 0;

  if (phase === "starting") {
    return (
      <div className="grid place-items-center py-24 text-sm text-gray-500">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Preparando a tu audiencia…</span>
        </div>
      </div>
    );
  }

  if (phase === "error" || !conversation) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-3 py-16 text-center">
        <h1 className="text-xl font-bold tracking-tight text-[#0A0A0A]">
          No pudimos iniciar la audiencia digital
        </h1>
        <p className="text-sm text-gray-600">
          {errorMsg ?? "Intenta nuevamente o usa el modo de práctica simple."}
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-[#0A0A0A] hover:border-gray-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al dashboard
          </button>
          <button
            type="button"
            onClick={() =>
              navigate({
                to: "/practice/$sessionId",
                params: { sessionId },
              })
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0A0A0A] px-4 text-sm font-bold text-white hover:bg-gray-800"
          >
            Usar práctica simple
          </button>
        </div>
      </div>
    );
  }

  if (phase === "ending" || phase === "evaluating") {
    if (reportTimedOut) {
      return (
        <div className="mx-auto flex max-w-md flex-col gap-3 py-16 text-center">
          <h1 className="text-xl font-bold tracking-tight text-[#0A0A0A]">
            Tu reporte está tardando más de lo normal
          </h1>
          <p className="text-sm text-gray-600">
            Tu sesión se guardó. El análisis puede demorar unos minutos en
            aparecer; revisa tu historial más tarde.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate({ to: "/dashboard" })}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-[#0A0A0A] hover:border-gray-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al dashboard
            </button>
            <button
              type="button"
              onClick={() => {
                setReportTimedOut(false);
                void reportPoll.refetch();
              }}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0A0A0A] px-4 text-sm font-bold text-white hover:bg-gray-800"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return <AnalyzingState />;
  }

  // phase === "live" — full-viewport takeover, portaled to <body> so the
  // dashboard sidebar/topbar never bleed through (the layout's right column is
  // a containing block for `fixed`, so an in-tree overlay would be clipped).
  const clock = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(
    elapsedSeconds % 60,
  ).padStart(2, "0")}`;

  const liveView = (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0A0A0A]">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3 text-white">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C6FF3D] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
            Live
          </span>
          <span className="text-sm font-semibold">Audiencia digital</span>
          <span className="hidden text-xs text-white/50 sm:inline">
            {interactive ? "interactiva" : "solo escucha"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm tabular-nums text-white/70">
            {clock}
          </span>
          <button
            type="button"
            onClick={handleEnd}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-500 px-4 text-xs font-bold text-white transition-colors hover:bg-red-600"
          >
            Terminar
          </button>
        </div>
      </header>
      <main className="relative flex-1 overflow-hidden p-3 sm:p-4">
        <div className="relative mx-auto h-full w-full max-w-6xl">
          {conversation && (
            <AvatarCall
              conversationUrl={conversation.conversation_url}
              userName={presenterName}
              visualInsight={visualInsight}
              onEnd={handleEnd}
              onEvent={handleEvent}
              onError={(err) => {
                toast.error(err.message);
              }}
            />
          )}
          <LiveFillersHud
            fillers={totalFillers}
            wpm={wpm}
            paceLabel={pace.label}
            paceWarn={pace.tone === "fast"}
            elapsedSeconds={elapsedSeconds}
            connected={deepgram.isConnected}
            gated={avatarSpeaking}
            hasSpoken={hasSpoken}
            liveLine={liveLine}
          />
        </div>
      </main>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(liveView, document.body)
    : null;
}

/**
 * Pull the Raven-1 visual analysis of the USER out of a Tavus utterance event.
 * Only user turns carry `user_visual_analysis`; replica turns don't. Returns
 * null when the event isn't a user utterance with a visual reading.
 */
function extractVisualAnalysis(ev: TavusEvent): string | null {
  if (ev.event_type !== "conversation.utterance") return null;
  const props = ev.properties ?? {};
  const role = String(props.role ?? props.speaker ?? "").toLowerCase();
  if (role && !["user", "participant", "human"].includes(role)) return null;
  const visual = props.user_visual_analysis;
  return typeof visual === "string" && visual.trim() ? visual.trim() : null;
}
