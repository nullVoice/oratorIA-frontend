import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2, Mic, Users, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { createSession } from "@/lib/api/sessions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/practice/new")({
  component: NewPracticeRoute,
});

type PracticeMode = "simple" | "avatar";

const PRESENTATION_TYPES = [
  { value: "tesis", label: "Tesis o defensa académica" },
  { value: "pitch", label: "Pitch / propuesta" },
  { value: "entrevista", label: "Entrevista" },
  { value: "reporte_ejecutivo", label: "Reporte ejecutivo" },
  { value: "clase", label: "Clase o exposición" },
] as const;

const FORMALITY_OPTIONS = [
  { value: "alta", label: "Alta", description: "Formal, profesional" },
  { value: "media", label: "Media", description: "Cordial, equilibrada" },
  { value: "baja", label: "Baja", description: "Casual, cercana" },
] as const;

const FormSchema = z.object({
  presentation_type: z.enum(
    PRESENTATION_TYPES.map((p) => p.value) as [string, ...string[]],
  ),
  audience: z.string().min(3, "Describe brevemente a tu audiencia").max(500),
  objective: z.string().min(3, "Cuéntanos tu objetivo").max(500),
  formality: z.enum(["alta", "media", "baja"]),
  duration_target: z
    .number({ message: "Indica una duración en minutos" })
    .int()
    .min(1, "Mínimo 1 minuto")
    .max(60, "Máximo 60 minutos"),
});

type FormErrors = Partial<Record<keyof z.infer<typeof FormSchema>, string>>;

function NewPracticeRoute() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<PracticeMode>("simple");
  const [interactive, setInteractive] = useState(false);
  const [presentationType, setPresentationType] = useState<string>(
    PRESENTATION_TYPES[0].value,
  );
  const [audience, setAudience] = useState("");
  const [objective, setObjective] = useState("");
  const [formality, setFormality] = useState<"alta" | "media" | "baja">(
    "media",
  );
  const [durationTarget, setDurationTarget] = useState<number | "">(5);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const modeLabel = mode === "simple" ? "Práctica simple" : "Audiencia digital";
  const typeLabel =
    PRESENTATION_TYPES.find((t) => t.value === presentationType)?.label ?? "—";
  const formalityLabel =
    FORMALITY_OPTIONS.find((f) => f.value === formality)?.label ?? "—";
  const durationLabel =
    typeof durationTarget === "number" ? `${durationTarget} min` : "—";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = FormSchema.safeParse({
      presentation_type: presentationType,
      audience,
      objective,
      formality,
      duration_target:
        typeof durationTarget === "number" ? durationTarget : Number.NaN,
    });
    if (!parsed.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const session = await createSession(parsed.data);
      if (mode === "avatar") {
        navigate({
          to: "/practice/$sessionId/avatar",
          params: { sessionId: session.id },
          search: { interactive },
        });
      } else {
        navigate({
          to: "/practice/$sessionId",
          params: { sessionId: session.id },
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo crear la sesión";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid w-full gap-10 lg:grid-cols-[clamp(260px,24%,340px)_1fr] lg:gap-16">
      {/* Intro pane (sticky on desktop) */}
      <header className="lg:sticky lg:top-8 lg:self-start">
        <Link
          to="/dashboard"
          className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          ← Volver
        </Link>
        <h1 className="font-display mt-5 text-4xl font-bold leading-[0.95] tracking-tight text-ink sm:text-5xl">
          Nueva
          <br />
          práctica
        </h1>
        <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-soft">
          Elige el modo y cuéntanos el contexto. Con esa información el coach
          evalúa tu presentación con más precisión.
        </p>

        <dl className="mt-10 border-t border-line">
          <SummaryRow label="Modo" value={modeLabel} />
          <SummaryRow label="Tipo" value={typeLabel} />
          <SummaryRow label="Audiencia" value={truncate(audience)} />
          <SummaryRow label="Objetivo" value={truncate(objective)} />
          <SummaryRow label="Formalidad" value={formalityLabel} />
          <SummaryRow label="Duración" value={durationLabel} />
        </dl>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-14" noValidate>
        {/* ── Zona 1 — Qué tipo de práctica ─────────────────────────────── */}
        <section className="flex flex-col gap-8">
          <Field legend="Modo de práctica">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ModeCard
                selected={mode === "simple"}
                onClick={() => setMode("simple")}
                icon={Mic}
                title="Práctica simple"
                description="Graba audio y recibe un reporte con score, fortalezas y mejoras."
              />
              <ModeCard
                selected={mode === "avatar"}
                onClick={() => setMode("avatar")}
                icon={Users}
                title="Audiencia digital"
                description="Preséntate ante un avatar que escucha y reacciona en tiempo real."
                badge="Nuevo"
              />
            </div>

            {mode === "avatar" && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-surface p-4 ring-1 ring-line transition-colors focus-within:ring-2 focus-within:ring-accent hover:ring-line-strong">
                <input
                  type="checkbox"
                  checked={interactive}
                  onChange={(e) => setInteractive(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-lime"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-ink">
                    Permitir que el avatar me interrumpa con preguntas
                  </span>
                  <span className="text-xs leading-relaxed text-ink-soft">
                    Si está activado, el avatar puede interrumpir 1–2 veces
                    durante tu presentación. Si no, solo escucha y pregunta al
                    final.
                  </span>
                </span>
              </label>
            )}
          </Field>

          <Field legend="Tipo de presentación">
            <div className="flex flex-wrap gap-2">
              {PRESENTATION_TYPES.map((opt) => (
                <PillRadio
                  key={opt.value}
                  name="presentation_type"
                  value={opt.value}
                  checked={presentationType === opt.value}
                  onChange={() => setPresentationType(opt.value)}
                >
                  {opt.label}
                </PillRadio>
              ))}
            </div>
          </Field>
        </section>

        {/* ── Zona 2 — Contexto ─────────────────────────────────────────── */}
        <section className="flex flex-col gap-6">
          <TextareaField
            id="audience"
            label="¿Quién es tu audiencia?"
            hint="Ej: comité de tesis de cinco profesores"
            value={audience}
            onChange={setAudience}
            error={errors.audience}
          />

          <TextareaField
            id="objective"
            label="¿Cuál es tu objetivo?"
            hint="Ej: convencer al jurado de la viabilidad de mi proyecto"
            value={objective}
            onChange={setObjective}
            error={errors.objective}
          />
        </section>

        {/* ── Zona 3 — Ajustes + acción ─────────────────────────────────── */}
        <section className="flex flex-col gap-8">
          <Field legend="Nivel de formalidad">
            <div className="grid grid-cols-3 gap-2">
              {FORMALITY_OPTIONS.map((opt) => (
                <SelectTile
                  key={opt.value}
                  name="formality"
                  value={opt.value}
                  checked={formality === opt.value}
                  onChange={() => setFormality(opt.value)}
                >
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      formality === opt.value ? "text-accent" : "text-ink",
                    )}
                  >
                    {opt.label}
                  </span>
                  <span className="text-xs text-ink-soft">
                    {opt.description}
                  </span>
                </SelectTile>
              ))}
            </div>
          </Field>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="duration_target"
              className="font-display text-[17px] font-semibold leading-tight tracking-tight text-ink"
            >
              Duración objetivo
            </label>
            <p
              id="duration-hint"
              className="font-mono text-[11px] tracking-wide text-ink-faint"
            >
              1 a 60 minutos
            </p>
            <input
              id="duration_target"
              type="number"
              min={1}
              max={60}
              step={1}
              value={durationTarget}
              onChange={(e) =>
                setDurationTarget(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              aria-invalid={!!errors.duration_target}
              aria-describedby={
                errors.duration_target
                  ? "duration-hint duration-error"
                  : "duration-hint"
              }
              className={cn(
                "mt-1 h-11 w-full max-w-[160px] rounded-lg bg-surface px-4 text-[15px] text-ink outline-none ring-1 transition-all focus:ring-2",
                errors.duration_target
                  ? "ring-red-500/60 focus:ring-red-500/40"
                  : "ring-line focus:ring-lime/50",
              )}
            />
            {errors.duration_target && (
              <span
                id="duration-error"
                role="alert"
                className="text-xs font-medium text-red-400"
              >
                {errors.duration_target}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime px-7 text-[15px] font-bold text-on-lime shadow-[0_0_28px_var(--color-lime-shadow)] transition-colors hover:bg-lime-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-stage disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                {mode === "avatar"
                  ? "Empezar con audiencia digital"
                  : "Empezar práctica"}
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
              </>
            )}
          </button>
        </section>
      </form>
    </div>
  );
}

/** First ~32 chars of a free-text field, or em dash when empty. */
function truncate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "—";
  return trimmed.length > 32 ? `${trimmed.slice(0, 32)}…` : trimmed;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const empty = value === "—";
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-2.5">
      <dt className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ink-faint">
        {label}
      </dt>
      <dd
        className={cn(
          "max-w-[60%] truncate text-right text-sm font-medium",
          empty ? "text-ink-faint" : "text-ink",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Field({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-5 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

interface ModeCardProps {
  selected: boolean;
  onClick: () => void;
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}

function ModeCard({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
  badge,
}: ModeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "relative flex items-start gap-3 rounded-2xl p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        selected
          ? "bg-surface-2 ring-2 ring-accent"
          : "bg-surface ring-1 ring-line hover:ring-line-strong",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0 transition-colors",
          selected ? "text-accent" : "text-ink-faint",
        )}
        strokeWidth={1.8}
        aria-hidden
      />
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-ink">{title}</span>
          {badge && (
            <span className="rounded-full bg-lime px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-on-lime">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
          {description}
        </span>
      </span>
    </button>
  );
}

function SelectTile({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col gap-0.5 rounded-lg p-3.5 transition-all focus-within:ring-2 focus-within:ring-accent",
        checked
          ? "bg-surface-2 ring-2 ring-accent"
          : "bg-surface ring-1 ring-line hover:ring-line-strong",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {children}
    </label>
  );
}

function PillRadio({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "cursor-pointer rounded-full px-4 py-2.5 text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-lime focus-within:ring-offset-1 focus-within:ring-offset-stage",
        checked
          ? "bg-lime text-on-lime"
          : "bg-surface text-ink-soft ring-1 ring-line hover:text-ink hover:ring-line-strong",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {children}
    </label>
  );
}

interface TextareaFieldProps {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

function TextareaField({
  id,
  label,
  hint,
  value,
  onChange,
  error,
}: TextareaFieldProps) {
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-display text-[17px] font-semibold leading-tight tracking-tight text-ink"
      >
        {label}
      </label>
      {hint && (
        <p
          id={`${id}-hint`}
          className="text-[13px] leading-snug text-ink-faint"
        >
          {hint}
        </p>
      )}
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={cn(
          "mt-1 w-full resize-none rounded-lg bg-surface px-4 py-3 text-[15px] text-ink outline-none ring-1 transition-all focus:ring-2",
          error
            ? "ring-red-500/60 focus:ring-red-500/40"
            : "ring-line focus:ring-lime/50",
        )}
      />
      {error && (
        <span
          id={`${id}-error`}
          role="alert"
          className="text-xs font-medium text-red-400"
        >
          {error}
        </span>
      )}
    </div>
  );
}
