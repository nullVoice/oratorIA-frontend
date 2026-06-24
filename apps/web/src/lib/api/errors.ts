import { HTTPError } from "ky";

// fastapi-users returns string codes for common auth errors — map the ones a
// user can actually hit to friendly Spanish copy.
const AUTH_CODE_MESSAGES: Record<string, string> = {
  REGISTER_USER_ALREADY_EXISTS: "Ya existe una cuenta con ese correo.",
  LOGIN_BAD_CREDENTIALS: "Email o contraseña incorrectos.",
  LOGIN_USER_NOT_VERIFIED: "Tu cuenta todavía no está verificada.",
  RESET_PASSWORD_BAD_TOKEN: "El enlace de recuperación no es válido o expiró.",
  VERIFY_USER_BAD_TOKEN: "El enlace de verificación no es válido o expiró.",
};

/**
 * Turn any thrown error into a human-friendly Spanish message.
 *
 * For backend errors (ky HTTPError) it reads FastAPI's `detail` — a string, a
 * Pydantic validation list, OR a fastapi-users object `{ code, reason }` —
 * instead of ky's generic "Request failed with status code N".
 */
export async function getApiErrorMessage(
  err: unknown,
  fallback = "Algo no salió como esperábamos. Prueba de nuevo en un momento.",
): Promise<string> {
  if (err instanceof HTTPError) {
    try {
      const data = (await err.response.json()) as { detail?: unknown };
      const detail = data?.detail;

      if (typeof detail === "string" && detail.trim()) {
        return AUTH_CODE_MESSAGES[detail] ?? detail;
      }
      // Pydantic validation errors: a list of { msg, loc }.
      if (Array.isArray(detail) && typeof detail[0]?.msg === "string") {
        return detail[0].msg as string;
      }
      // fastapi-users: { code, reason } — e.g. invalid password.
      if (detail && typeof detail === "object") {
        const d = detail as { code?: string; reason?: string };
        if (d.code && AUTH_CODE_MESSAGES[d.code])
          return AUTH_CODE_MESSAGES[d.code];
        if (typeof d.reason === "string" && d.reason.trim()) return d.reason;
      }
    } catch {
      /* response had no JSON body — fall through to the fallback */
    }
    return fallback;
  }

  // Non-HTTP errors (e.g. Daily/WebRTC) usually carry a usable message, but
  // skip ky's generic "...status code N" strings.
  if (
    err instanceof Error &&
    err.message &&
    !/status code \d+/i.test(err.message)
  ) {
    return err.message;
  }

  return fallback;
}
