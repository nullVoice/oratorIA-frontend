import { Wrench } from "lucide-react";

import type { Dimension } from "./strengths-list";

export type Priority = "high" | "medium" | "low";

export interface Improvement {
  title: string;
  description?: string;
  dimension?: Dimension | string;
  evidence?: string;
  suggestion?: string;
  priority?: Priority | string;
}

const DIMENSION_LABEL: Record<string, string> = {
  verbal: "Verbal",
  paraverbal: "Paraverbal",
  strategic: "Estratégica",
};

const PRIORITY_META: Record<
  string,
  { label: string; cls: string }
> = {
  high: {
    label: "Prioridad alta",
    cls: "bg-red-50 text-red-700 ring-red-200",
  },
  medium: {
    label: "Prioridad media",
    cls: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  low: {
    label: "Prioridad baja",
    cls: "bg-gray-50 text-gray-600 ring-gray-200",
  },
};

interface ImprovementsListProps {
  items: Improvement[];
}

export function ImprovementsList({ items }: ImprovementsListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No detectamos mejoras prioritarias en esta sesión.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {items.map((m, i) => (
        <li
          key={i}
          className="flex gap-3 rounded-2xl border border-amber-100 bg-amber-50/30 p-4"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
            <Wrench className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-[#0A0A0A]">
                {m.title}
              </h3>
              {m.priority && <PriorityBadge priority={m.priority} />}
              {m.dimension && <DimensionBadge dimension={m.dimension} />}
            </div>
            {m.description && (
              <p className="mt-1 text-[13px] leading-relaxed text-gray-700">
                {m.description}
              </p>
            )}
            {m.evidence && (
              <blockquote className="mt-2 border-l-2 border-amber-300 pl-3 text-[13px] italic text-gray-600">
                “{stripQuotes(m.evidence)}”
              </blockquote>
            )}
            {m.suggestion && (
              <p className="mt-2 rounded-lg bg-white px-3 py-2 text-[13px] leading-relaxed text-[#0A0A0A] ring-1 ring-amber-100">
                <span className="font-semibold text-amber-700">Sugerencia:</span>{" "}
                {m.suggestion}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const meta = PRIORITY_META[priority] ?? {
    label: priority,
    cls: "bg-gray-50 text-gray-600 ring-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${meta.cls}`}
    >
      {meta.label}
    </span>
  );
}

function DimensionBadge({ dimension }: { dimension: string }) {
  const label = DIMENSION_LABEL[dimension] ?? dimension;
  return (
    <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 ring-1 ring-gray-200">
      {label}
    </span>
  );
}

function stripQuotes(text: string): string {
  return text.replace(/^["“”'\s]+|["“”'\s]+$/g, "");
}
