import { Check, Lightbulb, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const PULSE_KF = `
  @keyframes oratoria-ring-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(0.94); }
  }
`;

const STEPS = [
  "Procesando audio · transcripción completa",
  "Detectando muletillas y pausas",
  "Evaluando estructura, claridad y ritmo",
  "Generando recomendaciones personalizadas",
] as const;

const DID_YOU_KNOW = [
  {
    quote:
      "Los grandes oradores usan pausas de 2–3 segundos antes de los puntos clave: aumentan el impacto percibido en un 40%.",
    source: "— Comunicación efectiva, Carmine Gallo",
  },
  {
    quote:
      "Bajar 20 wpm tu ritmo cuando llegas al cierre dispara la retención en la audiencia hasta un 55%.",
    source: "— TED Speaker Coaching, 2022",
  },
  {
    quote:
      "Reemplazar una muletilla por un silencio de 1s te hace sonar 30% más seguro al oído humano.",
    source: "— Stanford GSB · Public Speaking Lab",
  },
];

export function AnalyzingState() {
  const [active, setActive] = useState(0);
  const [tip] = useState(() => DID_YOU_KNOW[Math.floor(Math.random() * DID_YOU_KNOW.length)]);

  useEffect(() => {
    // Step the visual progress every 1.6s up to the second-to-last; the last
    // step finishes when the parent unmounts us with the real report.
    const id = window.setInterval(() => {
      setActive((s) => Math.min(s + 1, STEPS.length - 1));
    }, 1600);
    return () => window.clearInterval(id);
  }, []);

  const pct = Math.min(95, Math.round((active / STEPS.length) * 100) + 25);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-6 text-center">
      <style>{PULSE_KF}</style>

      <div className="relative h-44 w-44">
        <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
          <circle
            cx={100}
            cy={100}
            r={95}
            fill="none"
            stroke="#C6FF3D"
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={597}
            strokeDashoffset={597 - (597 * pct) / 100}
            style={{
              transition: "stroke-dashoffset 800ms ease",
              filter: "drop-shadow(0 0 6px rgba(198,255,61,0.5))",
            }}
          />
        </svg>
        <div
          className="absolute inset-7 grid place-items-center rounded-full bg-gradient-to-br from-[#C6FF3D] to-[#9CCC1F] shadow-[0_0_40px_rgba(198,255,61,0.4)]"
          style={{ animation: "oratoria-ring-pulse 2.5s ease-in-out infinite" }}
        >
          <div className="text-center">
            <div className="text-3xl font-extrabold leading-none tracking-tight text-[#0A0A0A]">
              {pct}
              <span className="text-lg">%</span>
            </div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A]/60">
              Procesando
            </div>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A]">
          Analizando tu sesión…
        </h1>
        <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#0A0A0A]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>{STEPS[active]}</span>
        </div>
      </div>

      <ol className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left">
        {STEPS.map((step, i) => {
          const status = i < active ? "done" : i === active ? "active" : "pending";
          return (
            <li key={step} className="flex items-center gap-3 py-1.5">
              <span
                className={
                  status === "done"
                    ? "grid h-6 w-6 place-items-center rounded-full bg-[#C6FF3D] text-[#0A0A0A]"
                    : status === "active"
                      ? "grid h-6 w-6 place-items-center rounded-full border-2 border-[#C6FF3D] bg-[#F7FFE0] text-[#0A0A0A]"
                      : "grid h-6 w-6 place-items-center rounded-full bg-gray-100 text-gray-400"
                }
              >
                {status === "done" ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : status === "active" ? (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0A0A0A]" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                )}
              </span>
              <span
                className={
                  status === "active"
                    ? "text-[13px] font-bold text-[#0A0A0A]"
                    : status === "done"
                      ? "text-[13px] text-[#0A0A0A]"
                      : "text-[13px] text-gray-400"
                }
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="w-full rounded-2xl border border-[#D4FF7A] bg-gradient-to-br from-[#F7FFE0] to-white p-5 text-left">
        <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-[#C6FF3D] text-[#0A0A0A]">
            <Lightbulb className="h-3 w-3" strokeWidth={2.2} />
          </span>
          ¿Sabías que…?
        </div>
        <p className="text-[14px] leading-relaxed text-[#0A0A0A]">{tip.quote}</p>
        <p className="mt-2 text-xs text-gray-500">{tip.source}</p>
      </div>

      <p className="text-xs text-gray-500">Suele tomar 5–15 segundos.</p>
    </div>
  );
}
