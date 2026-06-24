import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthVisualLogin } from "@/components/auth/auth-visual-login";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useAuthStore } from "@/stores/auth-store";

const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export const Route = createFileRoute("/login")({
  component: LoginRoute,
});

function LoginRoute() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [showPassword, setShowPassword] = useState(false);
  // Never hardcode credentials here — anything in this component ships in the
  // public client bundle. Optional dev-only prefill via .env.local (gitignored,
  // VITE_* so they're build-time public — use throwaway values only).
  const [email, setEmail] = useState(import.meta.env.VITE_DEMO_EMAIL ?? "");
  const [password, setPassword] = useState(
    import.meta.env.VITE_DEMO_PASSWORD ?? "",
  );
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = LoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof typeof errors;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      await login(parsed.data.email, parsed.data.password);
      toast.success("Sesión iniciada correctamente");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const raw = await getApiErrorMessage(
        err,
        "No pudimos iniciar sesión. Revisá tu conexión e intentá de nuevo.",
      );
      const friendly =
        raw.includes("BAD_CREDENTIALS") ||
        raw.includes("401") ||
        raw.includes("Unauthorized")
          ? "Email o contraseña incorrectos."
          : raw;
      toast.error(friendly);
    }
  };

  return (
    <main className="grid min-h-svh grid-cols-1 bg-surface lg:grid-cols-2">
      {/* Form side */}
      <section className="relative flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
        <div className="mx-auto w-full max-w-md">
          <Link
            to="/"
            aria-label="OratorIA"
            className="inline-flex items-center gap-3"
          >
            <img
              src="/OratorIA-isotype.svg"
              alt=""
              className="h-11 w-11 shrink-0"
            />
            <span className="text-[26px] font-bold leading-none tracking-tight text-ink">
              Orator<span className="text-accent">IA</span>
            </span>
          </Link>

          <h2 className="mt-10 text-3xl font-bold leading-tight tracking-tight text-ink">
            Bienvenido de vuelta
          </h2>
          <p className="mb-8 mt-2 text-[15px] text-ink-soft">
            Continúa tu camino de orador.
          </p>

          <OAuthButtons />

          <AuthDivider>o usa tu email</AuthDivider>

          <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
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
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              error={errors.password}
              show={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
              labelExtra={
                <a
                  href="#"
                  className="text-[13px] font-semibold text-ink-soft underline decoration-line underline-offset-[3px] transition-colors hover:text-ink hover:decoration-accent"
                >
                  Olvidé mi contraseña
                </a>
              }
            />

            <Checkbox
              checked={remember}
              onChange={setRemember}
              label="Mantener sesión iniciada en este dispositivo"
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
                  Iniciar sesión
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </>
              )}
            </button>

            <p className="mt-6 text-center text-sm text-ink-soft">
              ¿Nuevo en OratorIA?{" "}
              <Link
                to="/register"
                className="font-bold text-ink underline decoration-accent decoration-2 underline-offset-[3px] transition-colors hover:text-accent"
              >
                Crear cuenta
              </Link>
            </p>
          </form>
        </div>
      </section>

      <AuthVisualLogin />
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
      <label htmlFor={id} className="text-[13px] font-semibold text-ink-soft">
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
        className={`h-11 w-full rounded-lg border bg-surface px-4 text-[15px] text-ink outline-none transition-all placeholder:text-ink-faint focus:ring-3 ${
          error
            ? "border-red-500 focus:ring-red-500/15"
            : "border-line focus:border-[#C6FF3D] focus:ring-[#C6FF3D]/25"
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
  value: string;
  onChange: (v: string) => void;
  error?: string;
  show: boolean;
  onToggleShow: () => void;
  labelExtra?: React.ReactNode;
  hint?: React.ReactNode;
}

function PasswordField({
  id,
  label,
  autoComplete,
  value,
  onChange,
  error,
  show,
  onToggleShow,
  labelExtra,
  hint,
}: PasswordFieldProps) {
  return (
    <div className="mb-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-semibold text-ink-soft">
          {label}
        </label>
        {labelExtra}
      </div>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          className={`h-11 w-full rounded-lg border bg-surface px-4 pr-11 text-[15px] text-ink outline-none transition-all placeholder:text-ink-faint focus:ring-3 ${
            error
              ? "border-red-500 focus:ring-red-500/15"
              : "border-line focus:border-[#C6FF3D] focus:ring-[#C6FF3D]/25"
          }`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-ink-faint transition-colors hover:text-ink"
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
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
}) {
  return (
    <label className="mb-6 flex cursor-pointer select-none items-start gap-2.5">
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
            : "border-line-strong bg-surface"
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
      <span className="text-[13px] leading-relaxed text-ink-soft">{label}</span>
    </label>
  );
}
