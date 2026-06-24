/** Right-hand visual panel for the LOGIN screen — light lime background. */

export function AuthVisualLogin() {
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
        <ProgressMockup />
        <QuoteCard />
      </div>
    </aside>
  );
}

function ProgressMockup() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_30px_60px_-20px_rgba(10,10,10,0.18)]">
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
            <span className="text-3xl font-bold tracking-tight text-[#0A0A0A]">
              87
            </span>
            <span className="text-[13px] text-gray-500">/ 100</span>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-sm bg-gray-200">
            <div
              className="h-full rounded-sm bg-[#C6FF3D]"
              style={{ width: "87%" }}
            />
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
          className="w-1 rounded-sm bg-[#0A0A0A]"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

function QuoteCard() {
  return (
    <blockquote className="rounded-2xl bg-white/85 p-6 shadow-[0_8px_24px_-8px_rgba(10,10,10,0.10)] backdrop-blur">
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
