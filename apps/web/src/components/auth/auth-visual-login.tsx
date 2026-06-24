/** Right-hand visual panel for the LOGIN screen — branded artwork + animated
 * showcase cards (live equalizer, self-filling score, rotating lime glow). */
import { useEffect, useState } from "react";

import { AuthBackdrop } from "./auth-backdrop";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Eases a number from 0 to `target` on mount (easeOutCubic). Honors
 * reduced-motion by jumping straight to the target. */
function useCountUp(target: number, duration = 1300) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - p) ** 3;
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export function AuthVisualLogin() {
  return (
    <aside className="relative hidden flex-col justify-center overflow-hidden p-12 lg:flex">
      <AuthBackdrop />

      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-col gap-7">
        <header className="px-1">
          <h2 className="text-balance text-[28px] font-bold leading-[1.15] tracking-tight text-white">
            Tu escenario para{" "}
            <span className="text-[#C6FF3D]">hablar mejor</span>
          </h2>
          <p className="mt-2.5 text-[14px] leading-relaxed text-white/55">
            Practicá, medí tu progreso y ganá confianza con un coach de IA que
            te escucha 24/7.
          </p>
        </header>
        <ProgressMockup />
        <QuoteCard />
      </div>
    </aside>
  );
}

function ProgressMockup() {
  const score = useCountUp(87);
  return (
    <div
      className="glow-border card-hover card-rise relative rounded-2xl"
      style={{ animationDelay: "0.1s" }}
    >
      <div className="relative z-[1] overflow-hidden rounded-2xl bg-white shadow-[0_30px_60px_-20px_rgba(10,10,10,0.18)]">
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3.5">
          <span className="flex gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
          </span>
          <span className="ml-2 font-mono text-[11px] text-gray-500">
            tu progreso
          </span>
        </div>
        <div className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#C6FF3D]">
              <Equalizer scale={0.7} />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[#0A0A0A]">
                Hola, María
              </div>
              <div className="text-[11px] text-gray-500">
                14 sesiones · racha de 6 días
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-3.5">
            <div className="mb-2 flex justify-between text-xs text-gray-500">
              <span>Score global</span>
              <span className="font-semibold text-emerald-600">+8 pts</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tracking-tight text-[#0A0A0A] tabular-nums">
                {score}
              </span>
              <span className="text-[13px] text-gray-500">/ 100</span>
            </div>
            <div className="relative mt-2.5 h-1.5 overflow-hidden rounded-sm bg-gray-200">
              <div
                className="progress-fill h-full rounded-sm bg-[#C6FF3D]"
                style={{ width: "87%" }}
              />
              <span aria-hidden className="progress-sheen" />
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-gray-600">
            Continúa:{" "}
            <strong className="text-[#0A0A0A]">
              Pausas intencionales · 4 de 7
            </strong>
          </p>
        </div>
      </div>
    </div>
  );
}

function Equalizer({ scale = 1 }: { scale?: number }) {
  const heights = [14, 22, 30, 22, 14];
  return (
    <div
      className="flex items-center gap-[3px]"
      style={{ transform: `scale(${scale})` }}
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className="eq-bar w-1 rounded-sm bg-[#0A0A0A]"
          style={{ height: `${h}px`, animationDelay: `${i * 0.13}s` }}
        />
      ))}
    </div>
  );
}

function QuoteCard() {
  return (
    <blockquote
      className="card-hover card-rise rounded-2xl bg-white/85 p-6 shadow-[0_8px_24px_-8px_rgba(10,10,10,0.10)] backdrop-blur"
      style={{ animationDelay: "0.25s" }}
    >
      <p className="text-[15px] font-medium leading-relaxed text-[#0A0A0A]">
        Pasé de tartamudear en mis pitches a cerrar mi primera ronda de
        inversión.
      </p>
      <footer className="mt-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-sm font-bold text-[#0A0A0A]">
          MG
        </div>
        <div>
          <div className="text-[13px] font-bold text-[#0A0A0A]">
            María González
          </div>
          <div className="text-xs text-gray-600">CEO · Fintech LATAM</div>
        </div>
      </footer>
    </blockquote>
  );
}
