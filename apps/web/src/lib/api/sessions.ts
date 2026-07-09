/** Client wrappers + Zod schemas for /api/v1/sessions and /api/v1/practice. */

import { z } from "zod";

import { api } from "@/lib/api/client";

export const SessionSummarySchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  status: z.string(),
  started_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  duration_seconds: z.number().int().nullable(),
  score: z.number().int().nullable(),
  summary: z.string().nullable(),
  context: z.record(z.string(), z.unknown()).default({}),
  created_at: z.string(),
});
export type SessionSummary = z.infer<typeof SessionSummarySchema>;

export const FillerByWordSchema = z.object({
  word: z.string(),
  count: z.number().int(),
});
export type FillerByWord = z.infer<typeof FillerByWordSchema>;

// Two report shapes can land here:
//   - Legacy (/practice/finalize): strengths/improvements as {title, text}
//   - New (/sessions/:id/evaluate): strengths as
//     {title, description, dimension, evidence, impact} and
//     improvements as {... suggestion, priority}.
// Use loose record types and let the UI layer normalize per-item.
export const PitchSectionSchema = z.object({
  label: z.string(),
  content: z.string(),
});
export const StructuredPitchSchema = z.object({
  headline: z.string(),
  sections: z.array(PitchSectionSchema),
  delivery_note: z.string(),
});
export type StructuredPitch = z.infer<typeof StructuredPitchSchema>;

export const SessionReportSchema = z.object({
  score: z.number().int(),
  summary: z.string(),
  strengths: z.array(z.record(z.string(), z.unknown())),
  improvements: z.array(z.record(z.string(), z.unknown())),
  paraverbal_metrics: z.record(z.string(), z.unknown()),
  next_steps: z.array(z.string()).default([]),
  structured_pitch: StructuredPitchSchema.nullable().default(null),
});
export type SessionReport = z.infer<typeof SessionReportSchema>;

export const SessionDetailSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  status: z.string(),
  started_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  duration_seconds: z.number().int().nullable(),
  context: z.record(z.string(), z.unknown()).default({}),
  transcript: z.string().nullable(),
  report: SessionReportSchema.nullable(),
  created_at: z.string(),
});
export type SessionDetail = z.infer<typeof SessionDetailSchema>;

export const SessionReadSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.string(),
  status: z.string(),
  title: z.string().nullable().default(null),
  context: z.record(z.string(), z.unknown()).default({}),
  started_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type SessionRead = z.infer<typeof SessionReadSchema>;

export interface SessionContext {
  presentation_type: string;
  audience: string;
  objective: string;
  formality: "alta" | "media" | "baja";
  duration_target: number;
}

export async function createSession(
  context: SessionContext,
  type: "live" | "async" = "live",
): Promise<SessionRead> {
  const data = await api
    .post("api/v1/sessions", { json: { type, context } })
    .json();
  return SessionReadSchema.parse(data);
}

export async function uploadSessionAudio(
  sessionId: string,
  audio: Blob,
  filename = "audio.webm",
): Promise<SessionRead> {
  const form = new FormData();
  form.append("audio", audio, filename);
  const data = await api
    .post(`api/v1/sessions/${sessionId}/audio`, { body: form })
    .json();
  return SessionReadSchema.parse(data);
}

export const ReportReadSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.record(z.string(), z.unknown())),
  improvements: z.array(z.record(z.string(), z.unknown())),
  paraverbal_metrics: z.record(z.string(), z.unknown()),
  next_steps: z.array(z.string()),
  pdf_url: z.string().nullable().default(null),
  created_at: z.string(),
});
export type ReportRead = z.infer<typeof ReportReadSchema>;

export async function evaluateSession(sessionId: string): Promise<ReportRead> {
  const data = await api
    .post(`api/v1/sessions/${sessionId}/evaluate`, {
      timeout: 120_000,
    })
    .json();
  return ReportReadSchema.parse(data);
}

export const SessionListResponseSchema = z.object({
  items: z.array(SessionSummarySchema),
  total: z.number().int(),
  page: z.number().int(),
  page_size: z.number().int(),
});
export type SessionListResponse = z.infer<typeof SessionListResponseSchema>;

export async function fetchSessions(
  params: { page?: number; page_size?: number } = {},
): Promise<SessionSummary[]> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.page_size) search.set("page_size", String(params.page_size));
  const path = search.size
    ? `api/v1/sessions?${search.toString()}`
    : "api/v1/sessions";
  const data = await api.get(path).json();
  return SessionListResponseSchema.parse(data).items;
}

export async function fetchSessionsPaginated(
  params: { page?: number; page_size?: number } = {},
): Promise<SessionListResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.page_size) search.set("page_size", String(params.page_size));
  const path = search.size
    ? `api/v1/sessions?${search.toString()}`
    : "api/v1/sessions";
  const data = await api.get(path).json();
  return SessionListResponseSchema.parse(data);
}

export async function fetchSessionDetail(id: string): Promise<SessionDetail> {
  const data = await api.get(`api/v1/sessions/${id}`).json();
  return SessionDetailSchema.parse(data);
}
