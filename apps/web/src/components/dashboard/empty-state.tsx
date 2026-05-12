import { Link } from "@tanstack/react-router";
import { ArrowRight, Mic } from "lucide-react";

interface EmptyStateProps {
  firstName: string;
}

export function EmptyState({ firstName }: EmptyStateProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center sm:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F7FFE0] text-[#0A0A0A]">
          <Mic className="h-6 w-6" strokeWidth={1.8} />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#0A0A0A]">
          Hola, {firstName}.
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-gray-600">
          Aún no tienes sesiones. Practica unos cuantos minutos hablando con
          naturalidad y te damos tu primer reporte con score, fortaleza y
          mejora.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            to="/practice/new"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#C6FF3D] px-5 text-sm font-bold text-[#0A0A0A] transition-all hover:-translate-y-0.5 hover:bg-[#D4FF7A]"
          >
            Empezar mi primera sesión
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Step n={1} title="Habla con naturalidad" body="Sobre lo que prefieras: un pitch, una clase, una entrevista." />
        <Step n={2} title="Recibe feedback en vivo" body="Detectamos muletillas, ritmo y duración mientras hablas." />
        <Step n={3} title="Lee tu reporte" body="Score 0-100, una fortaleza y una mejora accionable." />
      </section>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-gray-100 text-xs font-bold text-[#0A0A0A]">
        {n}
      </span>
      <h3 className="mt-3 text-sm font-semibold text-[#0A0A0A]">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-gray-600">{body}</p>
    </article>
  );
}
