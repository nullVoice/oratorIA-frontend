/** Right-hand visual panel for the SIGN-UP screen — Raycast-style backdrop. */
import { AuthBackdrop } from "./auth-backdrop";

export function AuthVisualSignup() {
  return (
    <aside className="relative hidden flex-col justify-center overflow-hidden p-12 lg:flex">
      <AuthBackdrop />

      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-col gap-7">
        <header className="px-1">
          <h2 className="text-balance text-[28px] font-bold leading-[1.15] tracking-tight text-white">
            Empezá a <span className="text-[#C6FF3D]">hablar mejor</span> hoy
          </h2>
          <p className="mt-2.5 text-[14px] leading-relaxed text-white/55">
            Creá tu cuenta y hacé tu primera sesión en minutos. Sin tarjeta.
          </p>
        </header>
        <SignupMockup />
        <QuoteCard />
      </div>
    </aside>
  );
}

function SignupMockup() {
  return (
    <div
      className="glow-border card-hover card-rise relative rounded-[18px]"
      style={{ animationDelay: "0.1s" }}
    >
      <div className="auth-card relative z-[1] p-6">
        <div
          className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#C6FF3D]"
          style={{
            boxShadow:
              "0 0 24px rgba(57,255,20,0.6), 0 0 0 8px rgba(198,255,61,0.12)",
          }}
        >
          <Equalizer />
        </div>
        <p className="text-center text-sm font-semibold text-white">
          Tu primera sesión
        </p>
        <p className="mt-0.5 text-center text-xs text-white/50">
          Pitch de dos minutos · análisis al final
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniStat value="5" label="minutos" />
          <MiniStat value="3" label="métricas" />
          <MiniStat value="∞" label="retomas" />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2.5 text-center">
      <div className="font-display text-lg font-bold text-[#39FF14]">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-white/50">{label}</div>
    </div>
  );
}

function Equalizer() {
  const heights = [14, 22, 30, 22, 14];
  return (
    <div className="flex items-center gap-[3px]">
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
