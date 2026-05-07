/** Spanish filler-word detection — same list the backend uses. */

export const SPANISH_FILLERS = [
  "este",
  "eh",
  "ehh",
  "em",
  "mmm",
  "ah",
  "pues",
  "o sea",
  "como que",
  "tipo",
  "bueno",
  "vale",
  "okey",
  "okay",
  "y entonces",
  "digamos",
  "verdad",
  "a ver",
] as const;

export interface FillerSummary {
  /** Sum across every filler. */
  total: number;
  /** Per-filler counts, only entries with count > 0. */
  byWord: Array<{ word: string; count: number }>;
}

/** Count fillers with word boundaries so "esteban" doesn't match "este". */
export function detectFillers(transcript: string): FillerSummary {
  const text = transcript.toLowerCase();
  const byWord: Array<{ word: string; count: number }> = [];
  let total = 0;
  for (const filler of SPANISH_FILLERS) {
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "g");
    const matches = text.match(re);
    if (matches && matches.length > 0) {
      byWord.push({ word: filler, count: matches.length });
      total += matches.length;
    }
  }
  byWord.sort((a, b) => b.count - a.count);
  return { total, byWord };
}

/** Words / minutes; ignores punctuation tokens. */
export function calculateWpm(transcript: string, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  const tokens = transcript.match(/\b[\wáéíóúñü]+\b/gi) ?? [];
  return tokens.length / (durationSeconds / 60);
}

export function paceLabel(wpm: number): { label: string; tone: "ok" | "slow" | "fast" } {
  if (wpm < 90) return { label: "Lento", tone: "slow" };
  if (wpm < 130) return { label: "Moderado", tone: "ok" };
  if (wpm < 170) return { label: "Ágil", tone: "ok" };
  return { label: "Demasiado rápido", tone: "fast" };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
