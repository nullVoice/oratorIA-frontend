/**
 * HTTP client for the OratorIA backend.
 *
 * - prefixUrl is read from VITE_API_URL (set in apps/web/.env.local).
 * - beforeRequest attaches the bearer token from localStorage when present.
 * - afterResponse redirects to /login on 401 and clears the stale token.
 *
 * Auth state lives in `stores/auth-store` (created in 3.6); both modules
 * agree on the same localStorage key, defined here as the single source
 * of truth.
 */
import ky from "ky";

export const AUTH_TOKEN_STORAGE_KEY = "oratoria.auth.token";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function clearToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export const api = ky.create({
  prefixUrl: API_BASE_URL,
  retry: { limit: 0 },
  hooks: {
    beforeRequest: [
      (request) => {
        const token = readToken();
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      (request, _options, response) => {
        if (response.status !== 401) return response;
        // The login form posts to /api/v1/auth/login; a 401 there is the
        // user's bad credentials, not an expired session — don't bounce.
        if (request.url.includes("/api/v1/auth/login")) return response;
        clearToken();
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return response;
      },
    ],
  },
});
