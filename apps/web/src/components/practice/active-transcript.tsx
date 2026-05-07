import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

import { SPANISH_FILLERS } from "@/lib/practice/fillers";

interface ActiveTranscriptProps {
  transcript: string;
  isTranscribing: boolean;
  recording: boolean;
}

const FILLER_SET = new Set<string>(SPANISH_FILLERS as readonly string[]);
const FILLER_RE = new RegExp(
  `\\b(${SPANISH_FILLERS.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "gi",
);

export function ActiveTranscript({
  transcript,
  isTranscribing,
  recording,
}: ActiveTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcript]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <h3 className="text-sm font-bold text-[#0A0A0A]">Transcripción</h3>
        {isTranscribing && (
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Transcribiendo
          </span>
        )}
      </div>
      <div
        ref={scrollRef}
        className="max-h-44 overflow-y-auto px-5 py-4 font-mono text-[14px] leading-relaxed text-gray-800"
      >
        {transcript ? (
          <p className="whitespace-pre-wrap">
            {renderHighlighted(transcript)}
            {recording && (
              <span className="ml-0.5 inline-block h-[18px] w-0.5 animate-pulse bg-[#0A0A0A] align-middle" />
            )}
          </p>
        ) : (
          <p className="italic text-gray-400">
            {recording
              ? "Las primeras palabras aparecerán en unos segundos."
              : "Aún no hay transcripción."}
          </p>
        )}
      </div>
    </div>
  );
}

function renderHighlighted(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  FILLER_RE.lastIndex = 0;
  while ((match = FILLER_RE.exec(text)) !== null) {
    if (match.index > lastIndex) out.push(text.slice(lastIndex, match.index));
    const matched = match[0];
    const isFiller = FILLER_SET.has(matched.toLowerCase());
    out.push(
      <mark
        key={`${match.index}-${matched}`}
        className={
          isFiller
            ? "rounded bg-amber-200/70 px-1 py-0 font-semibold text-amber-900"
            : ""
        }
      >
        {matched}
      </mark>,
    );
    lastIndex = match.index + matched.length;
  }
  if (lastIndex < text.length) out.push(text.slice(lastIndex));
  return out;
}
