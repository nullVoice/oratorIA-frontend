import { ArrowRight, BookOpen, Mic, Target, Users } from "lucide-react";

const AUDIO_BAR_KEYFRAMES = `
  @keyframes oratoria-audio-bar {
    0%, 100% { transform: scaleY(0.4); }
    50% { transform: scaleY(1.2); }
  }
`;

interface PreSessionProps {
  onStart: () => void;
  starting: boolean;
}

export function PreSession({ onStart, starting }: PreSessionProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-7">
      <style>{AUDIO_BAR_KEYFRAMES}</style>

      <div className="text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
          OratorIA Coach está listo
        </span>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-[#0A0A0A]">
          ¿Listo para empezar?
        </h1>
        <p className="mt-2 text-[15px] text-gray-600">
          Habla con naturalidad sobre lo que prefieras. Detectamos muletillas, ritmo y
          duración mientras hablas.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <ContextPill icon={<Target className="h-3.5 w-3.5" strokeWidth={1.8} />} label="Práctica libre" />
        <ContextPill icon={<Users className="h-3.5 w-3.5" strokeWidth={1.8} />} label="Audiencia general" />
        <ContextPill icon={<BookOpen className="h-3.5 w-3.5" strokeWidth={1.8} />} label="Tono natural" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Mic check */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:col-span-2">
          <header className="mb-3 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
              <Mic className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <div>
              <div className="text-[13px] font-bold text-[#0A0A0A]">Micrófono</div>
              <div className="text-[11px] font-semibold text-emerald-700">
                ✓ Te escucharemos perfectamente
              </div>
            </div>
          </header>
          <AudioBars />
          <p className="mt-2 font-mono text-[10px] text-gray-500">
            Pediremos permiso al iniciar · navegador maneja la captura
          </p>
        </div>

        {/* Streaming behavior */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <header className="mb-3 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gray-100 text-[#0A0A0A]">
              <Target className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <div>
              <div className="text-[13px] font-bold text-[#0A0A0A]">Análisis</div>
              <div className="text-[11px] font-semibold text-gray-500">cada 8 s</div>
            </div>
          </header>
          <p className="text-xs leading-relaxed text-gray-600">
            La transcripción se actualiza periódicamente; las muletillas y el ritmo
            se calculan en el navegador.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#D4FF7A] bg-[#F7FFE0] p-5">
        <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-[#0A0A0A]">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-[#C6FF3D] text-[#0A0A0A]">
            <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          Antes de empezar
        </div>
        <ul className="flex flex-col gap-2 text-[13px] leading-relaxed text-gray-700">
          <Tip>Habla como si fuera real, no leas un guión.</Tip>
          <Tip>Mantén un tono natural; no exageres si normalmente no lo harías.</Tip>
          <Tip>Después de detener te damos un reporte con score, fortaleza y mejora.</Tip>
        </ul>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onStart}
          disabled={starting}
          className="inline-flex h-14 items-center gap-2 rounded-xl bg-[#C6FF3D] px-7 text-[15px] font-bold text-[#0A0A0A] shadow-[0_8px_24px_-4px_rgba(198,255,61,0.5)] transition-all hover:-translate-y-0.5 hover:bg-[#D4FF7A] hover:shadow-[0_12px_32px_-4px_rgba(198,255,61,0.7)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {starting ? "Solicitando micrófono…" : "Estoy listo, empezar"}
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function ContextPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700">
      <span className="text-[#0A0A0A]">{icon}</span>
      {label}
    </span>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0A0A0A]" />
      <span>{children}</span>
    </li>
  );
}

function AudioBars() {
  const heights = [30, 60, 80, 100, 70, 90, 50, 75, 35, 55, 65, 25];
  return (
    <div className="flex h-9 items-end gap-[3px]">
      {heights.map((h, i) => (
        <span
          key={i}
          className="flex-1 rounded-sm bg-[#C6FF3D]"
          style={{
            height: `${h}%`,
            minHeight: 4,
            animation: "oratoria-audio-bar 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.08}s`,
            transformOrigin: "bottom",
          }}
        />
      ))}
    </div>
  );
}
