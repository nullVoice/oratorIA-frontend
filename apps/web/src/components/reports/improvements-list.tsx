import { GlassCard, type GlassTone } from "./glass-card";
import { DIMENSION_META, DimensionTag, type Dimension } from "./strengths-list";

export type Priority = "high" | "medium" | "low";

export interface Improvement {
  title: string;
  description?: string;
  dimension?: Dimension | string;
  evidence?: string;
  suggestion?: string;
  priority?: Priority | string;
}

const PRIORITY_TEXT: Record<string, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

const PRIORITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function priorityOrder(p: string | undefined): number {
  return p !== undefined ? (PRIORITY_ORDER[p] ?? 3) : 3;
}

function blobTone(priority: string | undefined): GlassTone {
  if (priority === "high") return "red";
  if (priority === "medium") return "amber";
  return "sky";
}

function iconBg(priority: string | undefined): string {
  if (priority === "high") return "bg-red-500/10";
  if (priority === "medium") return "bg-amber-500/10";
  if (priority === "low") return "bg-sky-500/10";
  return "bg-surface-2";
}

function pillClasses(priority: string | undefined): string {
  if (priority === "high")
    return "bg-red-500/10 text-red-600 dark:text-red-400";
  if (priority === "medium")
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  if (priority === "low") return "bg-sky-500/10 text-sky-600 dark:text-sky-400";
  return "bg-surface-2 text-ink-faint";
}

interface ImprovementsListProps {
  items: Improvement[];
}

/** Single improvement card (also used as a carousel slide). */
export function ImprovementCard({
  m,
  index = 0,
}: {
  m: Improvement;
  index?: number;
}) {
  const meta = m.dimension ? DIMENSION_META[m.dimension] : undefined;
  const emoji = meta?.emoji ?? "📈";
  const p = m.priority;

  return (
    <GlassCard tone={blobTone(p)} index={index}>
      <div className="p-5 sm:p-6">
        {/* Header row */}
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xl ${iconBg(p)}`}
            aria-hidden
          >
            {emoji}
          </span>

          <h3 className="flex-1 text-[15px] font-semibold text-ink">
            {m.title}
          </h3>

          {p && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${pillClasses(p)}`}
            >
              {PRIORITY_TEXT[p] ?? p}
            </span>
          )}

          {meta && <DimensionTag label={meta.label} />}
        </div>

        {m.description && (
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {m.description}
          </p>
        )}

        {m.evidence && (
          <blockquote className="mt-3 border-l-2 border-line pl-3 text-sm italic text-ink-faint">
            {stripQuotes(m.evidence)}
          </blockquote>
        )}

        {/* Suggestion callout */}
        {m.suggestion && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-lime/30 bg-lime/10 p-3.5">
            <span className="text-base leading-none" aria-hidden>
              💡
            </span>
            <div>
              <p className="mb-0.5 text-xs font-semibold text-accent">
                Sugerencia
              </p>
              <p className="text-sm leading-relaxed text-ink-soft">
                {m.suggestion}
              </p>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export function ImprovementsList({ items }: ImprovementsListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        No detectamos mejoras prioritarias en esta sesión.
      </p>
    );
  }

  const sorted = [...items].sort(
    (a, b) => priorityOrder(a.priority) - priorityOrder(b.priority),
  );

  return (
    <div className="flex flex-col gap-4">
      {sorted.map((m, i) => (
        <ImprovementCard key={i} m={m} index={i} />
      ))}
    </div>
  );
}

function stripQuotes(text: string): string {
  return text.replace(/^["""'\s]+|["""'\s]+$/g, "");
}
