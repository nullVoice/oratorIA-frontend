/**
 * Zod schemas mirroring the backend Pydantic responses.
 *
 * They guard the frontend against silent backend drift and double as
 * the source of truth for the TypeScript types we use in stores and
 * components.
 */
import { z } from "zod";

export const UserPlanSchema = z.enum(["free", "pro", "institutional"]);
export type UserPlan = z.infer<typeof UserPlanSchema>;

export const UserSegmentSchema = z.enum(["education", "business", "hr"]);
export type UserSegment = z.infer<typeof UserSegmentSchema>;

/** Mirrors `oratoria.schemas.user.UserRead`. */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  is_active: z.boolean(),
  is_superuser: z.boolean(),
  is_verified: z.boolean(),
  full_name: z.string().nullable(),
  locale: z.string(),
  plan: UserPlanSchema,
  segment: UserSegmentSchema.nullable(),
});
export type User = z.infer<typeof UserSchema>;

/** Mirrors fastapi-users' `BearerResponse`. */
export const TokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
});
export type Token = z.infer<typeof TokenSchema>;

export const RegisterPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  full_name: z.string().min(1).max(255).optional(),
  segment: UserSegmentSchema.optional(),
  locale: z.string().max(10).optional(),
});
export type RegisterPayload = z.infer<typeof RegisterPayloadSchema>;

export const UserUpdatePayloadSchema = z.object({
  full_name: z.string().min(1).max(255).optional(),
  segment: UserSegmentSchema.nullable().optional(),
  locale: z.string().max(10).optional(),
  password: z.string().min(8).max(128).optional(),
});
export type UserUpdatePayload = z.infer<typeof UserUpdatePayloadSchema>;
