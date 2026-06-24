import { GlassCard } from "./glass-card";

export type Dimension = "verbal" | "paraverbal" | "strategic";

export interface Strength {
  title: string;
  description?: string;
  dimension?: Dimension | string;
  evidence?: string;
  impact?: string;
}

// Emoji per dimension — warmer / less "AI" than line icons, and consistent
// with the emojis already used elsewhere (hero-card.tsx: 🏆 🔥 💪 🎯).
export const DIMENSION_META: Record<string, { label: string; emoji: string }> =
  {
    verbal: { label: "Verbal", emoji: "💬" },
    paraverbal: { label: "Paraverbal", emoji: "🎙️" },
    strategic: { label: "Estratégica", emoji: "🎯" },
  };

interface StrengthsListProps {
  items: Strength[];
}

/** Single strength card (also used as a carousel slide). */
export function StrengthCard({
  s,
  index = 0,
}: {
  s: Strength;
  index?: number;
}) {
  const meta = s.dimension ? DIMENSION_META[s.dimension] : undefined;
  const emoji = meta?.emoji ?? "💪";

  return (
    <GlassCard tone="emerald" index={index}>
      <div className="p-5 sm:p-6">
        {/* Header row */}
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-xl"
            aria-hidden
          >
            {emoji}
          </span>

          <h3 className="flex-1 text-[15px] font-semibold text-ink">
            {s.title}
          </h3>

          {meta && <DimensionTag label={meta.label} />}
        </div>

        {s.description && (
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {s.description}
          </p>
        )}

        {s.evidence && (
          <blockquote className="mt-3 border-l-2 border-emerald-500/40 pl-3 text-sm italic text-ink-faint">
            {stripQuotes(s.evidence)}
          </blockquote>
        )}

        {s.impact && (
          <div className="mt-3 flex items-start gap-1.5">
            <span className="leading-none" aria-hidden>
              ✅
            </span>
            <p className="text-[13px] leading-relaxed text-ink-soft">
              <span className="font-bold">Impacto:</span> {s.impact}
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export function StrengthsList({ items }: StrengthsListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        No detectamos fortalezas claras en esta sesión.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((s, i) => (
        <StrengthCard key={i} s={s} index={i} />
      ))}
    </div>
  );
}

export function DimensionTag({ label }: { label: string }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
      {label}
    </span>
  );
}

function stripQuotes(text: string): string {
  return text.replace(/^["""'\s]+|["""'\s]+$/g, "");
}
