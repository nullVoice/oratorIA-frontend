/**
 * The evaluator sometimes drops raw metric keys into the `evidence` field
 * (e.g. "words_per_minute: 44.12, tone_variance: 0.0") when the speech was too
 * short to quote. Translate those snake_case keys to plain Spanish so the user
 * never sees an English field name.
 *
 * Uses literal split/join replacement (the LLM emits the keys lowercase exactly
 * as named), which avoids the regex word-boundary escaping pitfalls.
 */
const METRIC_LABELS: Array<[string, string]> = [
  ["words_per_minute", "palabras por minuto"],
  ["filler_words_count", "muletillas"],
  ["pause_ratio", "pausas"],
  ["tone_variance", "variación tonal"],
];

export function humanizeEvidence(text: string): string {
  let out = text;
  for (const [key, label] of METRIC_LABELS) {
    out = out.split(key).join(label);
  }
  return out.trim();
}
