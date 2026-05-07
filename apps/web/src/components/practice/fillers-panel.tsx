import type { FillerSummary } from "@/lib/practice/fillers";

interface FillersPanelProps {
  fillers: FillerSummary;
}

export function FillersPanel({ fillers }: FillersPanelProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight text-[#0A0A0A]">
          Muletillas detectadas
        </h3>
        <span className="text-xs font-semibold text-gray-500">
          Total: <strong className="text-[#0A0A0A]">{fillers.total}</strong>
        </span>
      </div>
      {fillers.byWord.length === 0 ? (
        <p className="text-sm text-gray-500">
          Aún no detectamos muletillas — sigue así. 👏
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {fillers.byWord.map(({ word, count }) => (
            <li
              key={word}
              className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs"
            >
              <span className="font-semibold text-[#0A0A0A]">“{word}”</span>
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                {count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
