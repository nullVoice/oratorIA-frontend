/** Client wrappers + Zod schemas for /api/v1/sessions/:id/avatar-*. */

import { z } from "zod";

import { api } from "@/lib/api/client";

export const AvatarStartResponseSchema = z.object({
  conversation_id: z.string(),
  conversation_url: z.string().url(),
  interactive: z.boolean(),
  persona_id: z.string(),
  replica_id: z.string(),
  started_at: z.string(),
});
export type AvatarStartResponse = z.infer<typeof AvatarStartResponseSchema>;

export const AvatarEndResponseSchema = z.object({
  conversation_id: z.string(),
  status: z.string(),
  report_ready: z.boolean(),
});
export type AvatarEndResponse = z.infer<typeof AvatarEndResponseSchema>;

export async function startAvatarSession(
  sessionId: string,
  opts: { interactive: boolean },
): Promise<AvatarStartResponse> {
  const data = await api
    .post(`api/v1/sessions/${sessionId}/avatar-start`, {
      json: { interactive: opts.interactive },
      timeout: 60_000,
    })
    .json();
  return AvatarStartResponseSchema.parse(data);
}

export async function endAvatarSession(
  sessionId: string,
): Promise<AvatarEndResponse> {
  const data = await api
    .post(`api/v1/sessions/${sessionId}/avatar-end`, { timeout: 60_000 })
    .json();
  return AvatarEndResponseSchema.parse(data);
}
