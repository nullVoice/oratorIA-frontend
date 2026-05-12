import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import type { SessionSummary } from "@/lib/api/sessions";

const PRESENTATION_LABEL: Record<string, string> = {
  tesis: "Tesis",
  pitch: "Pitch",
  entrevista: "Entrevista",
  reporte_ejecutivo: "Reporte ejecutivo",
  clase: "Clase",
};

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  created: { label: "Sin grabar", tone: "bg-gray-50 text-gray-600 ring-gray-200" },
  in_progress: {
    label: "Audio cargado",
    tone: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  processing: {
    label: "Procesando",
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  completed: {
    label: "Completada",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  failed: { label: "Fallida", tone: "bg-red-50 text-red-700 ring-red-200" },
  canceled: { label: "Cancelada", tone: "bg-gray-50 text-gray-500 ring-gray-200" },
};

interface SessionsListProps {
  sessions: SessionSummary[];
}

export function SessionsList({ sessions }: SessionsListProps) {
  if (sessions.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {sessions.map((s) => (
        <li key={s.id}>
          <Link
            to="/reports/$reportId"
            params={{ reportId: s.id }}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="truncate text-sm font-bold text-[#0A0A0A]">
                  {presentationTitle(s)}
                </h4>
                <StatusBadge status={s.status} />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {formatDate(s.created_at)} · {formatDuration(s.duration_seconds)}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xl font-bold leading-none tracking-tight text-[#0A0A0A] tabular-nums">
                {s.score ?? "—"}
              </span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Score
              </span>
            </div>
            <ArrowRight
              className="h-4 w-4 text-gray-400"
              strokeWidth={2}
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_LABEL[status] ?? {
    label: status,
    tone: "bg-gray-50 text-gray-600 ring-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${meta.tone}`}
    >
      {meta.label}
    </span>
  );
}

function presentationTitle(s: SessionSummary): string {
  const ctx = s.context as { presentation_type?: unknown };
  const raw =
    typeof ctx?.presentation_type === "string" ? ctx.presentation_type : "";
  if (raw) return PRESENTATION_LABEL[raw] ?? raw;
  return s.type === "async" ? "Sesión asíncrona" : "Sesión en vivo";
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
  return created.toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} s`;
  return `${m} min`;
}
