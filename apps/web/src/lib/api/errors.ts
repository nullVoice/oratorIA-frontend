import { HTTPError } from "ky";

/**
 * Turn any thrown error into a human-friendly Spanish message.
 *
 * For backend errors (ky HTTPError) it reads FastAPI's `detail` field — which
 * holds the clear, user-facing message — instead of ky's generic
 * "Request failed with status code 503". Falls back to a friendly default so
 * the user never sees a cryptic stack-trace-y string.
 */
export async function getApiErrorMessage(
  err: unknown,
  fallback = "Algo no salió como esperábamos. Probá de nuevo en un momento.",
): Promise<string> {
  if (err instanceof HTTPError) {
    try {
      const data = (await err.response.json()) as {
        detail?: unknown;
      };
      const detail = data?.detail;
      if (typeof detail === "string" && detail.trim()) return detail;
      // Pydantic validation errors come back as a list of { msg, loc }.
      if (Array.isArray(detail) && typeof detail[0]?.msg === "string") {
        return detail[0].msg as string;
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
