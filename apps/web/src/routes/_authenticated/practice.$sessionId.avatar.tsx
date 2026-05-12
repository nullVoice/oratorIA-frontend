import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AvatarCall } from "@/components/audio/avatar-call";
import { AnalyzingState } from "@/components/practice/analyzing-state";
import {
  endAvatarSession,
  startAvatarSession,
  type AvatarStartResponse,
} from "@/lib/api/avatar";
import { fetchSessionDetail } from "@/lib/api/sessions";

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
  const [phase, setPhase] = useState<Phase>("starting");
  const [conversation, setConversation] = useState<AvatarStartResponse | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const startedRef = useRef(false);

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
        const msg =
          err instanceof Error
            ? err.message
            : "No pudimos iniciar la audiencia digital";
        setErrorMsg(msg);
        setPhase("error");
        toast.error(msg);
      }
    })();
  }, [interactive, sessionId]);

  // 2) When the call ends, hit /avatar-end and switch to evaluating.
  const handleEnd = async () => {
    if (phase !== "live") return;
    setPhase("ending");
    try {
      const result = await endAvatarSession(sessionId);
      if (result.report_ready) {
        navigate({
          to: "/reports/$reportId",
          params: { reportId: sessionId },
        });
      } else {
        setPhase("evaluating");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "No pudimos cerrar la sesión";
      toast.error(msg);
      setPhase("evaluating");
    }
  };

  // 3) While "evaluating", poll GET /sessions/:id until report appears, then
  //    navigate to /reports/:id. Caps at ~60s of polling.
  useQuery({
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
    enabled: phase === "evaluating",
    refetchInterval: 3000,
    retry: 20,
  });

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
    return <AnalyzingState />;
  }

  // phase === "live"
  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-black">
      <header className="flex items-center justify-between gap-3 bg-[#0A0A0A] px-5 py-3 text-white">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-[#C6FF3D] text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A]">
            Live
          </span>
          <span className="text-sm font-semibold">
            Audiencia digital — {interactive ? "interactiva" : "solo escucha"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleEnd}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-500 px-4 text-xs font-bold text-white hover:bg-red-600"
        >
          Terminar
        </button>
      </header>
      <main className="relative flex-1 p-3">
        {conversation && (
          <AvatarCall
            conversationUrl={conversation.conversation_url}
            onEnd={handleEnd}
            onError={(err) => {
              toast.error(err.message);
            }}
          />
        )}
      </main>
    </div>
  );
}
