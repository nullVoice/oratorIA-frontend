import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/practice/$sessionId")({
  component: ActivePracticeRoute,
});

function ActivePracticeRoute() {
  const { sessionId } = Route.useParams();
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 py-10 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
        Sesión creada
      </h1>
      <p className="text-sm text-gray-600">
        ID: <code className="rounded bg-gray-100 px-2 py-0.5">{sessionId}</code>
      </p>
      <p className="text-sm text-gray-600">
        Pantalla de grabación en construcción (tarea 5.4).
      </p>
    </div>
  );
}
