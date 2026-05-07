/** Right-hand visual panel for the SIGN-UP screen — light lime background. */

export function AuthVisualSignup() {
  return (
    <aside
      className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex"
      style={{
        background:
          "linear-gradient(135deg, #FFFFFF 0%, #F7FFE0 50%, #EBFFB0 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-30 -top-30 h-90 w-90 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(198,255,61,0.55), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-25 -left-25 h-75 w-75 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(198,255,61,0.35), transparent 70%)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#0A0A0A]/[0.06] bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-gray-700 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
          +12.000 oradores entrenándose hoy
        </span>

        <SignupMockup />

        <QuoteCard />
      </div>
    </aside>
  );
}

function SignupMockup() {
  return (
    <div className="my-8 overflow-hidden rounded-2xl bg-white shadow-[0_30px_60px_-20px_rgba(10,10,10,0.18)]">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3.5">
        <span className="flex gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        </span>
        <span className="ml-2 font-mono text-[11px] text-gray-500">app.oratoria.io</span>
      </div>
      <div className="p-5">
        <div
          className="mx-auto mb-4 mt-2 grid h-16 w-16 place-items-center rounded-full bg-[#C6FF3D]"
          style={{
            boxShadow:
              "0 0 0 8px rgba(198,255,61,0.18), 0 0 0 16px rgba(198,255,61,0.08)",
          }}
        >
          <Equalizer />
        </div>
        <p className="text-center text-[13px] font-semibold text-gray-700">Tu primera sesión</p>
        <p className="mt-0.5 text-center text-[11px] text-gray-500">
          Pitch de 2 minutos · Coach IA listo
        </p>

        <div className="mt-4 grid grid-cols-3 gap-1.5">
          <MiniStat value="5" label="min" />
          <MiniStat value="3" label="métricas" />
          <MiniStat value="∞" label="retomas" />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[10px] border border-gray-100 bg-gray-50 px-1.5 py-2.5 text-center">
      <div className="text-lg font-extrabold tracking-tight text-[#0A0A0A]">{value}</div>
      <div className="mt-0.5 text-[10px] font-medium text-gray-500">{label}</div>
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
          className="w-1 rounded-sm bg-[#0A0A0A]"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

function QuoteCard() {
  return (
    <div className="mt-auto rounded-2xl border border-[#0A0A0A]/[0.06] bg-white/85 p-6 shadow-[0_8px_24px_-8px_rgba(10,10,10,0.10)] backdrop-blur">
      <span
        className="block text-5xl font-extrabold leading-[0.6] text-[#C6FF3D]"
        style={{ fontFamily: "Plus Jakarta Sans, serif" }}
      >
        “
      </span>
      <blockquote className="mb-4 mt-1.5 text-[15px] font-medium leading-relaxed text-[#0A0A0A]">
        Pasé de tartamudear en mis pitches a cerrar mi primera ronda de inversión. OratorIA
        cambió mi carrera.
      </blockquote>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#C6FF3D] to-[#5C7A0F] text-sm font-extrabold text-[#0A0A0A]">
          MG
        </div>
        <div>
          <div className="text-[13px] font-bold text-[#0A0A0A]">María González</div>
          <div className="text-xs text-gray-600">CEO de Fintech LATAM · Serie A · $4.2M</div>
        </div>
      </div>
    </div>
  );
}
