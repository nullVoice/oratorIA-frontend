# oratorIA-frontend

Frontend de **OratorIA**, plataforma SaaS que usa IA para entrenar habilidades de oratoria. Esta app consume el backend de [`oratorIA-backend`](../oratorIA-backend/).

Stack: **TanStack Start** (SSR + TanStack Router) + **React 19** + **Vite** + **TypeScript** + **TailwindCSS v4** + **better-auth**, dentro de un monorepo Turborepo gestionado con **Bun**.

## Requisitos previos

| Tool                 | Versión mínima | Cómo instalar (Windows)                                 |
| -------------------- | -------------- | ------------------------------------------------------- |
| **Bun**              | 1.3+           | https://bun.com/docs/installation                       |
| **Backend corriendo**| —              | ver [`oratorIA-backend/README.md`](../oratorIA-backend/README.md) |

El frontend hace fetch a `VITE_API_URL` (por defecto `http://localhost:8000`). Si el backend no está corriendo, las llamadas de red fallarán pero la UI sí carga.

## Setup local

```bash
# 1. Clonar y entrar
git clone https://github.com/nullVoice/oratorIA-frontend.git
cd oratorIA-frontend

# 2. Instalar dependencias (workspaces de Bun)
bun install

# 3. Variables de entorno (apps/web)
cat > apps/web/.env.local <<'EOF'
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
EOF

# 4. Servidor de desarrollo
bun run dev
```

App disponible en `http://localhost:3001` (puerto fijado en `apps/web/vite.config.ts`).

## Comandos útiles

```bash
bun run dev          # turbo dev: arranca todos los apps en watch mode
bun run dev:web      # sólo apps/web
bun run build        # build de todos los apps
bun run check-types  # tsc --noEmit en todos los packages
```

## Estructura

```
oratoria-frontend/
├── apps/
│   └── web/                    # App TanStack Start (Vite + React 19)
│       ├── src/                # routes, components, lib, stores
│       ├── public/             # assets estáticos
│       └── vite.config.ts      # puerto 3001, plugins TanStack/Tailwind
├── packages/
│   ├── config/                 # tsconfig base compartido
│   └── env/                    # validación de variables de entorno (@t3-oss/env-core)
│       └── src/
│           ├── web.ts          # vars expuestas al cliente (VITE_*)
│           ├── server.ts       # vars del server SSR
│           └── native.ts       # vars de runtime nativo (futuro)
├── package.json                # workspace root, scripts de turbo
├── turbo.json                  # pipeline de Turborepo
└── bun.lock
```

## Variables de entorno

Las VITE\_-prefijadas se exponen al cliente vía `import.meta.env`. La validación strict vive en `packages/env/src/web.ts` (actualmente con schema vacío — agregar entradas ahí cuando una variable se use programáticamente con tipos).

| Variable        | Default                  | Uso                                |
| --------------- | ------------------------ | ---------------------------------- |
| `VITE_API_URL`  | `http://localhost:8000`  | Base URL para `fetch`/`ky`/TanStack Query |
| `VITE_WS_URL`   | `ws://localhost:8000/ws` | Base WebSocket para sesiones live  |

## Backend

Ver [`../oratorIA-backend/README.md`](../oratorIA-backend/README.md) para los pasos de levantar la API antes de correr el frontend.

## Licencia

Propietaria — © OratorIA.
