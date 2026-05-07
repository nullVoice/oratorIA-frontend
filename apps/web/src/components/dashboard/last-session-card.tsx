import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";

import type { SessionSummary } from "@/lib/api/sessions";

interface LastSessionCardProps {
  session: SessionSummary;
}

function formatDate(iso: string): string {
  const created = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffH = Math.floor(diffMs / (60 * 60 * 1000));
  if (diffH < 1) {
    const diffMin = Math.max(1, Math.round(diffMs / (60 * 1000)));
    return `Hace ${diffMin} min`;
  }
  if (diffH < 24) return `Hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Ayer";
  if (diffD < 7) return `Hace ${diffD} días`;
  return created.toLocaleDateString("es", { day: "numeric", month: "short" });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} s`;
  return `${m} min`;
}

export function LastSessionCard({ session }: LastSessionCardProps) {
  const summary = session.summary?.trim()
    ? session.summary
    : "Sesión completada — abre el reporte para los detalles.";
  return (
    <div className="grid grid-cols-1 items-center gap-5 rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 sm:grid-cols-[80px_1fr_auto_auto]">
      <Thumbnail />

      <div className="min-w-0">
        <h4 className="truncate text-base font-bold tracking-tight text-[#0A0A0A]">
          Sesión de práctica
        </h4>
        <p className="mt-1 text-xs text-gray-500">
          {formatDate(session.created_at)} · {formatDuration(session.duration_seconds)}
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-gray-700">{summary}</p>
      </div>

      <div className="flex flex-col items-center justify-center self-stretch border-x border-gray-200 px-4">
        <span className="text-3xl font-bold leading-none tracking-tight text-[#0A0A0A]">
          {session.score ?? "—"}
        </span>
        <span className="mt-1 text-xs text-gray-500">Score</span>
      </div>

      <Link
        to="/sessions/$sessionId"
        params={{ sessionId: session.id }}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0A0A0A] px-4 text-sm font-bold text-white transition-colors hover:bg-gray-800"
      >
        <Clock className="h-4 w-4" strokeWidth={1.8} />
        Ver reporte
      </Link>
    </div>
  );
}

function Thumbnail() {
  return (
    <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gray-50">
      <div className="flex items-end gap-[3px]">
        {[14, 24, 32, 22, 16].map((h, i) => (
          <span
            key={i}
            className="w-1 rounded-sm bg-[#0A0A0A]"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
    </div>
  );
}
