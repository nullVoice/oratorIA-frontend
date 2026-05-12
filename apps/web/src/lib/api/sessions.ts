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
  created_at: z.string(),
});
export type SessionSummary = z.infer<typeof SessionSummarySchema>;

export const FillerByWordSchema = z.object({
  word: z.string(),
  count: z.number().int(),
});
export type FillerByWord = z.infer<typeof FillerByWordSchema>;

export const SessionReportSchema = z.object({
  score: z.number().int(),
  summary: z.string(),
  strengths: z.array(z.object({ title: z.string(), text: z.string() })),
  improvements: z.array(z.object({ title: z.string(), text: z.string() })),
  paraverbal_metrics: z.object({
    words_per_minute: z.number(),
    filler_words_count: z.number().int(),
    filler_by_word: z.array(FillerByWordSchema).default([]),
    duration_seconds: z.number().optional(),
  }),
  next_steps: z.array(z.string()).default([]),
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
