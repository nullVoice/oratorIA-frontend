import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { createSession } from "@/lib/api/sessions";

export const Route = createFileRoute("/_authenticated/practice/new")({
  component: NewPracticeRoute,
});

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
      navigate({
        to: "/practice/$sessionId",
        params: { sessionId: session.id },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo crear la sesión";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <header>
        <Link
          to="/dashboard"
          className="text-xs font-semibold text-gray-500 underline-offset-4 hover:underline"
        >
          ← Volver al dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0A0A0A]">
          Nueva práctica
        </h1>
        <p className="mt-2 text-[15px] text-gray-600">
          Cuéntanos el contexto. Con esa información el coach IA evalúa tu
          presentación con más precisión.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-[13px] font-semibold text-gray-700">
            Tipo de presentación
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PRESENTATION_TYPES.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                  presentationType === opt.value
                    ? "border-[#C6FF3D] bg-[#F7FFE0]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="presentation_type"
                  value={opt.value}
                  checked={presentationType === opt.value}
                  onChange={() => setPresentationType(opt.value)}
                  className="sr-only"
                />
                <span className="font-medium text-[#0A0A0A]">{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <TextareaField
          id="audience"
          label="¿Quién es tu audiencia?"
          placeholder="Ej: comité de tesis de cinco profesores"
          value={audience}
          onChange={setAudience}
          error={errors.audience}
        />

        <TextareaField
          id="objective"
          label="¿Cuál es tu objetivo?"
          placeholder="Ej: convencer al jurado de la viabilidad de mi proyecto"
          value={objective}
          onChange={setObjective}
          error={errors.objective}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-[13px] font-semibold text-gray-700">
            Nivel de formalidad
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {FORMALITY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 transition-colors ${
                  formality === opt.value
                    ? "border-[#C6FF3D] bg-[#F7FFE0]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="formality"
                  value={opt.value}
                  checked={formality === opt.value}
                  onChange={() => setFormality(opt.value)}
                  className="sr-only"
                />
                <span className="text-sm font-semibold text-[#0A0A0A]">
                  {opt.label}
                </span>
                <span className="text-xs text-gray-500">{opt.description}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="duration_target"
            className="text-[13px] font-semibold text-gray-700"
          >
            Duración objetivo (minutos)
          </label>
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
            className={`h-11 w-full max-w-[160px] rounded-lg border px-4 text-[15px] outline-none transition-all focus:ring-3 ${
              errors.duration_target
                ? "border-red-500 focus:ring-red-500/15"
                : "border-gray-200 focus:border-[#C6FF3D] focus:ring-[#C6FF3D]/25"
            }`}
          />
          {errors.duration_target && (
            <span className="text-xs font-medium text-red-500">
              {errors.duration_target}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#C6FF3D] text-[15px] font-bold text-[#0A0A0A] transition-all hover:-translate-y-0.5 hover:bg-[#D4FF7A] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:self-start sm:px-6"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Empezar práctica
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

interface TextareaFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

function TextareaField({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
}: TextareaFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-gray-700">
        {label}
      </label>
      <textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        aria-invalid={!!error}
        className={`w-full resize-none rounded-lg border px-4 py-3 text-[15px] outline-none transition-all focus:ring-3 ${
          error
            ? "border-red-500 focus:ring-red-500/15"
            : "border-gray-200 focus:border-[#C6FF3D] focus:ring-[#C6FF3D]/25"
        }`}
      />
      {error && (
        <span className="text-xs font-medium text-red-500">{error}</span>
      )}
    </div>
  );
}
