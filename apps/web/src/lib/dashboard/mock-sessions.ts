/**
 * Demo fallback dataset for the dashboard.
 *
 * Rendered ONLY when the backend returns zero sessions, so a fresh
 * account still showcases the product's value proposition (real-time
 * coaching + structured feedback across verbal, paraverbal and
 * strategic dimensions) instead of an empty state. Real sessions always
 * take precedence once the user creates them.
 *
 * Dates are generated relative to "now" so the streak and weekly
 * counters stay alive whenever the demo is opened.
 */
import type { SessionSummary } from "@/lib/api/sessions";

const DAY = 24 * 60 * 60 * 1000;

function daysAgoISO(days: number, hour = 9): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setTime(d.getTime() - days * DAY);
  return d.toISOString();
}

interface MockSeed {
  id: string;
  type: "live" | "async";
  daysAgo: number;
  durationSeconds: number;
  score: number;
  summary: string;
  context: Record<string, unknown>;
}

const SEEDS: MockSeed[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    type: "live",
    daysAgo: 0,
    durationSeconds: 612,
    score: 91,
    summary:
      "Pitch de inversión ante audiencia simulada escéptica. Apertura con gancho potente y cierre con llamado a la acción claro. Redujiste muletillas un 40% frente a tu última sesión.",
    context: {
      presentation_type: "Pitch de inversión",
      audience: "Inversores Serie A",
      objective: "Cerrar ronda de financiamiento",
    },
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    type: "async",
    daysAgo: 1,
    durationSeconds: 428,
    score: 88,
    summary:
      "Análisis de video: presentación de resultados trimestrales. Buen ritmo y pausas intencionales; mejorá el contacto visual en los datos clave.",
    context: {
      presentation_type: "Reporte ejecutivo",
      audience: "Directorio",
      objective: "Comunicar resultados Q2",
    },
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    type: "live",
    daysAgo: 2,
    durationSeconds: 540,
    score: 84,
    summary:
      "Práctica de manejo de objeciones. La audiencia IA te interrumpió 3 veces; mantuviste la calma y reencauzaste el mensaje en 2 de 3.",
    context: {
      presentation_type: "Defensa de propuesta",
      audience: "Comité de compras",
      objective: "Superar objeciones de precio",
    },
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    type: "live",
    daysAgo: 3,
    durationSeconds: 365,
    score: 79,
    summary:
      "Elevator pitch de 90 segundos. Estructura sólida, pero la velocidad subió a 185 ppm en el cierre. Trabajemos pausas intencionales.",
    context: {
      presentation_type: "Elevator pitch",
      audience: "Networking",
      objective: "Generar interés en 90s",
    },
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    type: "async",
    daysAgo: 4,
    durationSeconds: 702,
    score: 86,
    summary:
      "Clase magistral simulada. Excelente claridad estratégica y uso de ejemplos; el feedback paraverbal detectó tono monótono en el minuto 6.",
    context: {
      presentation_type: "Charla educativa",
      audience: "Estudiantes universitarios",
      objective: "Explicar un concepto complejo",
    },
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    type: "live",
    daysAgo: 5,
    durationSeconds: 489,
    score: 82,
    summary:
      "Entrevista de trabajo simulada para rol de liderazgo. Respuestas estructuradas con método STAR; reforzá la confianza en preguntas sobre debilidades.",
    context: {
      presentation_type: "Entrevista laboral",
      audience: "Reclutador senior",
      objective: "Transmitir liderazgo y seguridad",
    },
  },
];

export function buildMockSessions(): SessionSummary[] {
  return SEEDS.map((s) => {
    const createdAt = daysAgoISO(s.daysAgo);
    const startedAt = createdAt;
    const endedAt = new Date(
      new Date(createdAt).getTime() + s.durationSeconds * 1000,
    ).toISOString();
    return {
      id: s.id,
      type: s.type,
      status: "completed",
      started_at: startedAt,
      ended_at: endedAt,
      duration_seconds: s.durationSeconds,
      score: s.score,
      summary: s.summary,
      context: s.context,
      created_at: createdAt,
    } satisfies SessionSummary;
  });
}
