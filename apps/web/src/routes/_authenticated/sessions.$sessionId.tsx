import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { FinalReport } from "@/components/practice/final-report";
import {
  fetchSessionDetail,
  type SessionDetail,
} from "@/lib/api/sessions";

export const Route = createFileRoute("/_authenticated/sessions/$sessionId")({
  component: SessionDetailRoute,
});

function SessionDetailRoute() {
  const navigate = useNavigate();
  const { sessionId } = useParams({ from: "/_authenticated/sessions/$sessionId" });
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchSessionDetail(sessionId);
        if (!cancelled) setSession(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "No pudimos cargar la sesión";
        toast.error(msg.includes("404") ? "Esta sesión no existe o no es tuya." : msg);
        if (!cancelled) setSession(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading) {
    return (
      <div className="grid place-items-center py-24 text-sm text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-gray-600">No encontramos esta sesión.</p>
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard" })}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-[#0A0A0A] hover:border-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </button>
      </div>
    );
  }

  if (!session.report) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-gray-600">
          Esta sesión todavía no tiene reporte (estado: {session.status}).
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard" })}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-[#0A0A0A] hover:border-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </button>
      </div>
    );
  }

  const r = session.report;
  const strength = r.strengths[0] ?? { title: "—", text: "—" };
  const improvement = r.improvements[0] ?? { title: "—", text: "—" };
  const para = r.paraverbal_metrics;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard" })}
          className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">Reporte</h1>
          <p className="mt-0.5 text-sm text-gray-600">
            {new Date(session.created_at).toLocaleString("es", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      <FinalReport
        score={r.score}
        summary={r.summary}
        strengthTitle={strength.title}
        strengthText={strength.text}
        improvementTitle={improvement.title}
        improvementText={improvement.text}
        metrics={{
          durationSeconds: session.duration_seconds ?? para.duration_seconds ?? 0,
          fillerTotal: para.filler_words_count,
          fillerByWord: para.filler_by_word ?? [],
          wpm: para.words_per_minute,
          transcript: session.transcript ?? "",
        }}
        onNewSession={() => navigate({ to: "/practice" })}
        onBackToDashboard={() => navigate({ to: "/dashboard" })}
      />
    </div>
  );
}
