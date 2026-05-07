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

export async function fetchSessions(): Promise<SessionSummary[]> {
  const data = await api.get("api/v1/sessions").json();
  return z.array(SessionSummarySchema).parse(data);
}

export async function fetchSessionDetail(id: string): Promise<SessionDetail> {
  const data = await api.get(`api/v1/sessions/${id}`).json();
  return SessionDetailSchema.parse(data);
}
