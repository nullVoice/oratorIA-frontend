import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthVisualSignup } from "@/components/auth/auth-visual-signup";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { getApiErrorMessage } from "@/lib/api/errors";
import { UserSegmentSchema } from "@/lib/api/schemas";
import { useAuthStore } from "@/stores/auth-store";

const RegisterSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  full_name: z.string().min(1, "Nombre requerido").max(255),
  segment: UserSegmentSchema,
});

type FormErrors = Partial<
  Record<keyof z.infer<typeof RegisterSchema> | "terms", string>
>;

const SEGMENT_OPTIONS: Array<{
  value: z.infer<typeof UserSegmentSchema>;
  label: string;
  description: string;
}> = [
  { value: "education", label: "Educación", description: "Estudio o enseño" },
  {
    value: "business",
    label: "Empresa",
    description: "Trabajo en una organización",
  },
  {
    value: "hr",
    label: "RRHH",
    description: "Busco entrevistas / nuevo empleo",
  },
];

export const Route = createFileRoute("/register")({
  component: RegisterRoute,
});

function calculateStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_HINT = [
  "",
  "Muy débil · agrega más caracteres",
  "Débil · prueba con mayúsculas y números",
  "Buena contraseña · agrega un símbolo para máxima seguridad",
  "Excelente seguridad",
];

function RegisterRoute() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [segment, setSegment] = useState<
    z.infer<typeof UserSegmentSchema> | ""
  >("");
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});

  const strength = calculateStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!acceptedTerms) {
      setErrors({ terms: "Debes aceptar los términos para crear la cuenta." });
      return;
    }

    const parsed = RegisterSchema.safeParse({
      email,
      password,
      full_name: fullName,
      segment,
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

    try {
      await register(parsed.data);
      toast.success("Cuenta creada correctamente");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const message = await getApiErrorMessage(
        err,
        "No pudimos crear la cuenta. Probá de nuevo.",
      );
      toast.error(message);
    }
  };

  const strengthClass =
    password.length === 0
      ? "bg-gray-200"
      : strength <= 1
        ? "bg-red-500"
        : strength === 2
          ? "bg-amber-400"
          : strength === 3
            ? "bg-[#C6FF3D]"
            : "bg-emerald-500";

  return (
    <main className="grid min-h-svh grid-cols-1 bg-white lg:grid-cols-2">
      {/* Form side */}
      <section className="relative flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" aria-label="OratorIA" className="inline-block">
            <img src="/OratorIA-lockup.svg" alt="OratorIA" className="h-8" />
          </Link>

          <h2 className="mt-8 text-3xl font-bold leading-tight tracking-tight text-[#0A0A0A]">
            Empieza a hablar mejor hoy
          </h2>
          <p className="mb-8 mt-2 text-[15px] text-gray-600">
            Crea tu cuenta gratis. No requiere tarjeta.
          </p>

          <OAuthButtons />

          <AuthDivider>o regístrate con email</AuthDivider>

          <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
            <Field
              id="full_name"
              label="Nombre completo"
              autoComplete="name"
              placeholder="María González"
              value={fullName}
              onChange={setFullName}
              error={errors.full_name}
            />

            <Field
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={setEmail}
              error={errors.email}
            />

            <PasswordField
              id="password"
              label="Contraseña"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={setPassword}
              error={errors.password}
              show={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
              hint={
                password.length > 0 ? (
                  <>
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <span
                          key={level}
                          className={`h-1 flex-1 rounded-sm transition-colors ${
                            level <= strength ? strengthClass : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="mt-1 block text-xs text-gray-500">
                      {STRENGTH_HINT[strength]}
                    </span>
                  </>
                ) : null
              }
            />

            <fieldset className="mb-5 flex flex-col gap-2">
              <legend className="mb-1 text-[13px] font-semibold text-gray-700">
                ¿En qué contexto te ves?
              </legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {SEGMENT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 transition-colors ${
                      segment === opt.value
                        ? "border-[#C6FF3D] bg-[#F7FFE0]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="segment"
                      value={opt.value}
                      checked={segment === opt.value}
                      onChange={() => setSegment(opt.value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-semibold text-[#0A0A0A]">
                      {opt.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {opt.description}
                    </span>
                  </label>
                ))}
              </div>
              {errors.segment && (
                <span className="text-xs font-medium text-red-500">
                  {errors.segment}
                </span>
              )}
            </fieldset>

            <Checkbox
              checked={acceptedTerms}
              onChange={setAcceptedTerms}
              label={
                <>
                  Acepto los{" "}
                  <a
                    href="#"
                    className="font-semibold text-[#0A0A0A] underline decoration-gray-300 underline-offset-[2px] hover:decoration-[#C6FF3D]"
                  >
                    Términos de servicio
                  </a>{" "}
                  y la{" "}
                  <a
                    href="#"
                    className="font-semibold text-[#0A0A0A] underline decoration-gray-300 underline-offset-[2px] hover:decoration-[#C6FF3D]"
                  >
                    Política de privacidad
                  </a>{" "}
                  de OratorIA.
                </>
              }
              error={errors.terms}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#C6FF3D] text-[15px] font-bold text-[#0A0A0A] transition-all hover:-translate-y-0.5 hover:bg-[#D4FF7A] hover:shadow-[0_0_24px_rgba(198,255,61,0.4)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Crear cuenta gratis
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </>
              )}
            </button>

            <p className="mt-6 text-center text-sm text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <Link
                to="/login"
                className="font-bold text-[#0A0A0A] underline decoration-[#C6FF3D] underline-offset-[3px]"
              >
                Iniciar sesión
              </Link>
            </p>
          </form>
        </div>
      </section>

      <AuthVisualSignup />
    </main>
  );
}

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

function Field({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  value,
  onChange,
  error,
}: FieldProps) {
  return (
    <div className="mb-4 flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={`h-11 w-full rounded-lg border px-4 text-[15px] outline-none transition-all focus:ring-3 ${
          error
            ? "border-red-500 focus:ring-red-500/15"
            : "border-gray-200 focus:border-[#C6FF3D] focus:ring-[#C6FF3D]/25"
        }`}
      />
      {error && (
        <span className="mt-0.5 text-xs font-medium text-red-500">{error}</span>
      )}
    </div>
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  autoComplete?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  show: boolean;
  onToggleShow: () => void;
  hint?: React.ReactNode;
}

function PasswordField({
  id,
  label,
  autoComplete,
  placeholder,
  value,
  onChange,
  error,
  show,
  onToggleShow,
  hint,
}: PasswordFieldProps) {
  return (
    <div className="mb-4 flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          className={`h-11 w-full rounded-lg border px-4 pr-11 text-[15px] outline-none transition-all focus:ring-3 ${
            error
              ? "border-red-500 focus:ring-red-500/15"
              : "border-gray-200 focus:border-[#C6FF3D] focus:ring-[#C6FF3D]/25"
          }`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-gray-400 transition-colors hover:text-gray-700"
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {hint}
      {error && (
        <span className="mt-0.5 text-xs font-medium text-red-500">{error}</span>
      )}
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
  error,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="mb-5">
      <label className="flex cursor-pointer select-none items-start gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <span
          aria-hidden
          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
            checked
              ? "border-[#C6FF3D] bg-[#C6FF3D]"
              : "border-gray-300 bg-white"
          }`}
        >
          {checked && (
            <svg
              viewBox="0 0 24 24"
              className="h-3 w-3"
              fill="none"
              stroke="#0A0A0A"
              strokeWidth={3}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        <span className="text-[13px] leading-relaxed text-gray-700">
          {label}
        </span>
      </label>
      {error && (
        <span className="ml-7 mt-1 block text-xs font-medium text-red-500">
          {error}
        </span>
      )}
    </div>
  );
}
