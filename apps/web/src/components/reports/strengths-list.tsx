import { CheckCircle2 } from "lucide-react";

export type Dimension = "verbal" | "paraverbal" | "strategic";

export interface Strength {
  title: string;
  description?: string;
  dimension?: Dimension | string;
  evidence?: string;
  impact?: string;
}

const DIMENSION_LABEL: Record<string, string> = {
  verbal: "Verbal",
  paraverbal: "Paraverbal",
  strategic: "Estratégica",
};

interface StrengthsListProps {
  items: Strength[];
}

export function StrengthsList({ items }: StrengthsListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No detectamos fortalezas claras en esta sesión.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {items.map((s, i) => (
        <li
          key={i}
          className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-[#0A0A0A]">
                {s.title}
              </h3>
              {s.dimension && (
                <DimensionBadge dimension={s.dimension} />
              )}
            </div>
            {s.description && (
              <p className="mt-1 text-[13px] leading-relaxed text-gray-700">
                {s.description}
              </p>
            )}
            {s.evidence && (
              <blockquote className="mt-2 border-l-2 border-emerald-300 pl-3 text-[13px] italic text-gray-600">
                “{stripQuotes(s.evidence)}”
              </blockquote>
            )}
            {s.impact && (
              <p className="mt-2 text-xs text-emerald-700">
                <span className="font-semibold">Impacto:</span> {s.impact}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
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
