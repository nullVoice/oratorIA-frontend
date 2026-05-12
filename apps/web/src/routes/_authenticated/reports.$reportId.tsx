import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/reports/$reportId")({
  component: ReportRoute,
});

function ReportRoute() {
  const { reportId } = Route.useParams();
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 py-10 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
        Reporte
      </h1>
      <p className="text-sm text-gray-600">
        ID: <code className="rounded bg-gray-100 px-2 py-0.5">{reportId}</code>
      </p>
      <p className="text-sm text-gray-600">
        Página de reporte en construcción (tarea 5.7).
      </p>
    </div>
  );
}
