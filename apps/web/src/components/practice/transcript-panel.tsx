import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

import { SPANISH_FILLERS } from "@/lib/practice/fillers";

interface TranscriptPanelProps {
  transcript: string;
  isTranscribing: boolean;
  recording: boolean;
}

const FILLER_SET = new Set<string>(SPANISH_FILLERS as readonly string[]);
const FILLER_RE = new RegExp(
  `\\b(${SPANISH_FILLERS.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "gi",
);

/**
 * Tokenises the transcript and wraps detected fillers in a highlighted span.
 * Bounded by a max-h-48 scroll container so a long transcript never pushes
 * the rest of the UI off-screen.
 */
export function TranscriptPanel({ transcript, isTranscribing, recording }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcript]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <h3 className="text-sm font-bold tracking-tight text-[#0A0A0A]">
          Transcripción en vivo
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {isTranscribing && (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Transcribiendo…</span>
            </>
          )}
          {!isTranscribing && recording && (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span>Escuchando</span>
            </>
          )}
          {!recording && transcript && <span>Final</span>}
        </div>
      </div>
      <div ref={scrollRef} className="max-h-48 overflow-y-auto px-5 py-4">
        {transcript ? (
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-gray-800">
            {renderHighlighted(transcript)}
          </p>
        ) : (
          <p className="text-[14px] italic text-gray-400">
            {recording
              ? "Empieza a hablar; las primeras palabras aparecerán en unos segundos…"
              : "La transcripción aparecerá aquí cuando empieces a grabar."}
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
  // The regex is global; reset lastIndex to be safe across renders.
  FILLER_RE.lastIndex = 0;
  while ((match = FILLER_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      out.push(text.slice(lastIndex, match.index));
    }
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
