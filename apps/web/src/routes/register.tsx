import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthShowcase } from "@/components/auth/auth-showcase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserSegmentSchema } from "@/lib/api/schemas";
import { useAuthStore } from "@/stores/auth-store";

const RegisterSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  full_name: z.string().min(1, "Nombre requerido").max(255),
  segment: UserSegmentSchema,
});

type FormErrors = Partial<Record<keyof z.infer<typeof RegisterSchema>, string>>;

const SEGMENT_OPTIONS: Array<{
  value: z.infer<typeof UserSegmentSchema>;
  label: string;
  description: string;
}> = [
  { value: "education", label: "Educación", description: "Estudio o enseño" },
  { value: "business", label: "Empresa", description: "Trabajo en una organización" },
  { value: "hr", label: "RRHH", description: "Busco entrevistas / nuevo empleo" },
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

function RegisterRoute() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [segment, setSegment] = useState<z.infer<typeof UserSegmentSchema> | "">("");
  const [errors, setErrors] = useState<FormErrors>({});

  const strength = calculateStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

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
      navigate({ to: "/" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear cuenta";
      const friendly = message.includes("400") || message.includes("REGISTER_USER_ALREADY_EXISTS")
        ? "Ya existe una cuenta con ese email"
        : message;
      toast.error(friendly);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4 md:p-6">
      <div className="grid min-h-[820px] w-full max-w-[1200px] grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl xl:grid-cols-2">
        <section className="relative flex flex-col justify-center px-8 py-14 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <img src="/OratorIA-lockup.svg" alt="OratorIA" className="mb-10 h-8" />

            <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900">
              Empieza a hablar mejor hoy
            </h2>
            <p className="mb-8 text-sm text-gray-600">
              Crea tu cuenta gratis. No requiere tarjeta de crédito.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <div className="flex flex-col gap-2">
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input
                  id="full_name"
                  placeholder="Ej. Ana García"
                  autoComplete="name"
                  required
                  className="h-11"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  aria-invalid={!!errors.full_name}
                />
                {errors.full_name && <p className="text-xs text-red-600">{errors.full_name}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    required
                    className="h-11 pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className="h-11 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4].map((level) => {
                    const color = password.length === 0
                      ? "bg-gray-200"
                      : level <= strength
                        ? strength <= 2
                          ? "bg-orange-400"
                          : strength === 3
                            ? "bg-yellow-400"
                            : "bg-lime-500"
                        : "bg-gray-200";
                    return (
                      <span
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${color}`}
                      />
                    );
                  })}
                </div>
                {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
              </div>

              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-medium text-gray-900">¿En qué contexto te ves?</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {SEGMENT_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 transition-colors ${
                        segment === opt.value
                          ? "border-lime-500 bg-lime-50"
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
                      <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
                      <span className="text-xs text-gray-500">{opt.description}</span>
                    </label>
                  ))}
                </div>
                {errors.segment && <p className="text-xs text-red-600">{errors.segment}</p>}
              </fieldset>

              <Button
                type="submit"
                disabled={isLoading}
                className="mt-2 h-12 w-full bg-[#C6FF3D] text-base font-bold text-black shadow-lg transition-all hover:bg-[#b5f02c] hover:shadow-xl"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Crear cuenta gratis"}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="font-bold text-black hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </section>

        <AuthShowcase badge="+12.000 oradores entrenándose hoy" />
      </div>
    </main>
  );
}
