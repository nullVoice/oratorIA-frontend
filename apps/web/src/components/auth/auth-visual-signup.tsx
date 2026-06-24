/** Right-hand visual panel for the SIGN-UP screen — light lime background. */

export function AuthVisualSignup() {
  return (
    <aside className="relative hidden flex-col justify-center overflow-hidden p-12 lg:flex">
      <img
        src="/auth-visual.png"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      {/* Soft scrim: lifts the floating cards' legibility over the artwork
          without washing out the lime energy at the edges. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-white/5 to-transparent"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-col gap-8">
        <div className="float-soft">
          <SignupMockup />
        </div>
        <div className="float-soft--delayed">
          <QuoteCard />
        </div>
      </div>
    </aside>
  );
}

function SignupMockup() {
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
            app.oratoria.io
          </span>
        </div>
        <div className="p-6">
          <div
            className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#C6FF3D]"
            style={{
              boxShadow:
                "0 0 0 8px rgba(198,255,61,0.18), 0 0 0 16px rgba(198,255,61,0.08)",
            }}
          >
            <Equalizer />
          </div>
          <p className="text-center text-sm font-semibold text-[#0A0A0A]">
            Tu primera sesión
          </p>
          <p className="mt-0.5 text-center text-xs text-gray-500">
            Pitch de dos minutos · análisis al final
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniStat value="5" label="minutos" />
            <MiniStat value="3" label="métricas" />
            <MiniStat value="∞" label="retomas" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-2.5 text-center">
      <div className="text-lg font-bold tracking-tight text-[#0A0A0A]">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-gray-500">{label}</div>
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
