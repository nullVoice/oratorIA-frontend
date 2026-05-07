import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthShowcase } from "@/components/auth/auth-showcase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";

const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export const Route = createFileRoute("/login")({
  component: LoginRoute,
});

function LoginRoute() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

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
      navigate({ to: "/" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión";
      const friendly = message.includes("401") || message.includes("Unauthorized")
        ? "Email o contraseña incorrectos"
        : message;
      toast.error(friendly);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4 md:p-6">
      <div className="grid min-h-[820px] w-full max-w-[1200px] grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl xl:grid-cols-2">
        <section className="relative flex flex-col justify-center px-8 py-14 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <img src="/OratorIA-lockup.svg" alt="OratorIA" className="mb-12 h-8" />

            <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900">
              Bienvenido de vuelta
            </h2>
            <p className="mb-8 text-sm text-gray-600">
              Continúa tu camino de orador y mejora tus habilidades.
            </p>

            {/* Social login — disabled until OAuth lands. */}
            <div className="mb-6 flex flex-col gap-3">
              <Button
                variant="outline"
                className="flex h-11 w-full items-center gap-2"
                disabled
                title="Próximamente"
              >
                <GithubIcon className="h-5 w-5" />
                Iniciar con GitHub
                <span className="ml-auto text-xs text-gray-400">Próximamente</span>
              </Button>
              <Button
                variant="outline"
                className="flex h-11 w-full items-center gap-2"
                disabled
                title="Próximamente"
              >
                <LinkedinIcon className="h-5 w-5 text-[#0A66C2]" />
                Iniciar con LinkedIn
                <span className="ml-auto text-xs text-gray-400">Próximamente</span>
              </Button>
            </div>

            <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-gray-400">
              <div className="h-px flex-1 bg-gray-200" />
              <span>o usa tu email</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
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
                    autoComplete="current-password"
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
                {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
              </div>

              <div className="flex justify-end">
                <a href="#" className="text-sm font-semibold text-lime-600 hover:text-lime-700">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="mt-2 h-12 w-full bg-[#C6FF3D] text-base font-bold text-black shadow-lg transition-all hover:bg-[#b5f02c] hover:shadow-xl"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Iniciar sesión"}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600">
              ¿No tienes cuenta?{" "}
              <Link to="/register" className="font-bold text-black hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </section>

        <AuthShowcase badge="OratorIA Active Sessions: 1,240" />
      </div>
    </main>
  );
}
