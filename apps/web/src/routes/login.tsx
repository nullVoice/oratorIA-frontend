import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

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

export const Route = createFileRoute('/login')({
  component: LoginRoute,
});

function LoginRoute() {
  const navigate = useNavigate();
  const [isLoginView, setIsLoginView] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const calculatePasswordStrength = (pw: string): number => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = calculatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLoginView) {
        await authClient.signIn.email({
          email,
          password,
        }, {
          onSuccess: () => {
            toast.success('Sesión iniciada correctamente');
            navigate({ to: '/' });
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || 'Error al iniciar sesión');
          }
        });
      } else {
        await authClient.signUp.email({
          email,
          password,
          name,
        }, {
          onSuccess: () => {
            toast.success('Cuenta creada correctamente');
            navigate({ to: '/' });
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || 'Error al crear cuenta');
          }
        });
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-[1200px] bg-white rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 xl:grid-cols-2 min-h-[820px]">
        {/* Lado izquierdo: Formulario */}
        <section className="flex flex-col justify-center px-8 py-14 lg:px-16 relative">
          <div className="max-w-md w-full mx-auto">
            <img src="/OratorIA-lockup.svg" alt="OratorIA" className="h-8 mb-12" />

            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
              {isLoginView ? 'Bienvenido de vuelta' : 'Empieza a hablar mejor hoy'}
            </h2>
            <p className="text-gray-600 text-sm mb-8">
              {isLoginView
                ? 'Continúa tu camino de orador y mejora tus habilidades.'
                : 'Crea tu cuenta gratis. No requiere tarjeta de crédito.'}
            </p>

            {/* Botones Sociales */}
            <div className="flex flex-col gap-3 mb-6">
              <Button variant="outline" className="h-11 w-full flex items-center gap-2">
                <GithubIcon className="w-5 h-5" />
                {isLoginView ? 'Iniciar con GitHub' : 'Continuar con GitHub'}
              </Button>
              <Button variant="outline" className="h-11 w-full flex items-center gap-2">
                <LinkedinIcon className="w-5 h-5 text-[#0A66C2]" />
                {isLoginView ? 'Iniciar con LinkedIn' : 'Continuar con LinkedIn'}
              </Button>
            </div>

            <div className="flex items-center gap-3 my-6 text-xs font-medium uppercase text-gray-400 tracking-wider">
              <div className="flex-1 h-px bg-gray-200" />
              <span>o usa tu email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {!isLoginView && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input 
                    id="name" 
                    placeholder="Ej. Ana García" 
                    required 
                    className="h-11"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    className="h-11 pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="h-11 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Medidor de fuerza de contraseña (Solo en registro) */}
                {!isLoginView && (
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4].map((level) => (
                      <span
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          password.length === 0
                            ? 'bg-gray-200'
                            : level <= strength
                              ? strength <= 2
                                ? 'bg-orange-400'
                                : strength === 3
                                  ? 'bg-yellow-400'
                                  : 'bg-lime-500'
                              : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {isLoginView && (
                <div className="flex justify-end">
                  <a href="#" className="text-sm font-semibold text-lime-600 hover:text-lime-700">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-2 bg-[#C6FF3D] hover:bg-[#b5f02c] text-black font-bold text-base shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isLoginView ? (
                  'Iniciar sesión'
                ) : (
                  'Crear cuenta gratis'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-8">
              {isLoginView ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
              <button
                onClick={() => {
                  setIsLoginView(!isLoginView);
                  setPassword('');
                }}
                className="font-bold text-black hover:underline"
              >
                {isLoginView ? 'Regístrate aquí' : 'Inicia sesión'}
              </button>
            </p>
          </div>
        </section>

        {/* Lado derecho: Visual Showcase */}
        <section className="hidden xl:flex flex-col justify-between bg-zinc-950 p-12 relative overflow-hidden text-white">
          {/* Decorative Background */}
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-lime-500/20 rounded-full blur-[120px] pointer-events-none" />

          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-xs font-semibold w-max z-10">
            <span className="w-2 h-2 rounded-full bg-lime-400 shadow-[0_0_8px_#C6FF3D] animate-pulse"></span>
            {isLoginView ? 'OratorIA Active Sessions: 1,240' : '+12.000 oradores entrenándose hoy'}
          </div>

          {/* Central Mockup */}
          <div className="z-10 bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center font-bold text-black text-xl">
                O
              </div>
              <div>
                <h3 className="font-bold text-lg">Tu Coach Personal</h3>
                <p className="text-sm text-gray-400">Análisis en tiempo real</p>
              </div>
            </div>
            
            {/* Visualizer Mock */}
            <div className="h-32 flex items-end gap-2 justify-center py-4">
              {[40, 70, 45, 90, 65, 30, 85, 50, 20].map((h, i) => (
                <div 
                  key={i} 
                  className="w-4 bg-lime-400 rounded-t-sm" 
                  style={{ height: `${h}%`, opacity: 0.5 + (h / 200) }}
                />
              ))}
            </div>
            <p className="text-center text-sm font-medium text-lime-400 mt-4">Analizando tono y ritmo...</p>
          </div>

          {/* Testimonial Quote */}
          <div className="z-10 mt-12">
            <span className="font-serif text-6xl leading-[0.5] text-lime-400 font-extrabold block mb-4">"</span>
            <blockquote className="text-xl font-medium text-gray-200 mb-6">
              Pasé de tartamudear en mis pitches a cerrar mi primera ronda de inversión. OratorIA cambió mi carrera.
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-800" />
              <div>
                <p className="font-bold text-sm">Carlos M.</p>
                <p className="text-xs text-gray-400">CEO & Founder en TechCorp</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
