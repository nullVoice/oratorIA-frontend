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
      className="glow-border card-hover card-rise relative rounded-[18px]"
      style={{ animationDelay: "0.1s" }}
    >
      <div className="auth-card relative z-[1] p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#C6FF3D] shadow-[0_0_22px_rgba(57,255,20,0.55)]">
            <Equalizer scale={0.7} />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-bold text-white">Hola, María</div>
            <div className="text-[12px] text-white/50">
              14 sesiones · racha de 6 días
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-1.5 flex items-center justify-between text-[12px] text-white/55">
            <span>Score global</span>
            <span className="font-semibold text-[#39FF14]">+8 pts</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-4xl font-bold tabular-nums text-white">
              {score}
            </span>
            <span className="text-[13px] text-white/40">/ 100</span>
          </div>
          <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="progress-fill h-full rounded-full bg-gradient-to-r from-[#99FF33] to-[#39FF14] shadow-[0_0_12px_rgba(57,255,20,0.7)]"
              style={{ width: "87%" }}
            />
            <span aria-hidden className="progress-sheen" />
          </div>
        </div>

        <p className="mt-4 text-center text-[12px] text-white/45">
          Continúa:{" "}
          <strong className="font-semibold text-white">
            Pausas intencionales · 4 de 7
          </strong>
        </p>
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
      className="auth-card card-hover card-rise p-6"
      style={{ animationDelay: "0.25s" }}
    >
      <span
        aria-hidden
        className="font-display block text-3xl leading-none text-[#C6FF3D]"
      >
        &ldquo;
      </span>
      <p className="-mt-2 text-[15px] font-medium leading-relaxed text-white/90">
        Pasé de tartamudear en mis pitches a cerrar mi primera ronda de
        inversión.
      </p>
      <footer className="mt-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-sm font-bold text-white">
          MG
        </div>
        <div>
          <div className="text-[13px] font-bold text-white">María González</div>
          <div className="text-xs text-white/50">CEO · Fintech LATAM</div>
        </div>
      </footer>
    </blockquote>
  );
}
