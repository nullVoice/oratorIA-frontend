/** Right-hand visual panel shared by /login and /register. */

interface AuthShowcaseProps {
  badge: string;
}

export function AuthShowcase({ badge }: AuthShowcaseProps) {
  return (
    <section className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-12 text-white xl:flex">
      <div className="pointer-events-none absolute right-[-10%] top-[-20%] h-[600px] w-[600px] rounded-full bg-lime-500/20 blur-[120px]" />

      <div className="z-10 inline-flex w-max items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur-md">
        <span className="h-2 w-2 animate-pulse rounded-full bg-lime-400 shadow-[0_0_8px_#C6FF3D]" />
        {badge}
      </div>

      <div className="z-10 rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 text-xl font-bold text-black">
            O
          </div>
          <div>
            <h3 className="text-lg font-bold">Tu Coach Personal</h3>
            <p className="text-sm text-gray-400">Análisis en tiempo real</p>
          </div>
        </div>
        <div className="flex h-32 items-end justify-center gap-2 py-4">
          {[40, 70, 45, 90, 65, 30, 85, 50, 20].map((h, i) => (
            <div
              key={i}
              className="w-4 rounded-t-sm bg-lime-400"
              style={{ height: `${h}%`, opacity: 0.5 + h / 200 }}
            />
          ))}
        </div>
        <p className="mt-4 text-center text-sm font-medium text-lime-400">
          Analizando tono y ritmo...
        </p>
      </div>

      <div className="z-10 mt-12">
        <span className="mb-4 block font-serif text-6xl font-extrabold leading-[0.5] text-lime-400">
          &quot;
        </span>
        <blockquote className="mb-6 text-xl font-medium text-gray-200">
          Pasé de tartamudear en mis pitches a cerrar mi primera ronda de inversión. OratorIA cambió mi carrera.
        </blockquote>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-800" />
          <div>
            <p className="text-sm font-bold">Carlos M.</p>
            <p className="text-xs text-gray-400">CEO &amp; Founder en TechCorp</p>
          </div>
        </div>
      </div>
    </section>
  );
}
