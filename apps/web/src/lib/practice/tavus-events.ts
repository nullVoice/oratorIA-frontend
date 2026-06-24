/**
 * Pure helpers for Tavus Interactions Protocol event handling.
 *
 * Extracted from avatar-call.tsx and the avatar route so they can be
 * unit-tested without rendering React or importing Daily.
 *
 * TV-U-01: parseAppMessage maps a raw Daily app-message payload to a
 *           TavusEvent; returns null for non-conversation messages or
 *           messages missing event_type.
 * TV-U-02: deriveAvatarSpeaking drives the echo gate — true while the
 *           replica (avatar) is speaking, false while it is not.
 */

/** Shape of a single Tavus Interactions Protocol event. */
export interface TavusEvent {
  /** e.g. "conversation.utterance", "conversation.user.stopped_speaking" */
  event_type: string;
  conversation_id?: string;
  seq?: number;
  turn_idx?: number;
  properties?: Record<string, unknown>;
  timestamp_client_ms: number;
  /** Original payload — kept for forensics. */
  raw?: unknown;
}

// ---------------------------------------------------------------------------
// TV-U-01: parseAppMessage
// ---------------------------------------------------------------------------

/**
 * Parse a raw Daily `app-message` data payload into a {@link TavusEvent}.
 *
 * Returns `null` when:
 *   - `data` is not an object
 *   - `message_type` is not `"conversation"`
 *   - `event_type` is absent or an empty string
 *
 * Otherwise maps the standard Tavus fields and attaches a client-side
 * timestamp.  This is the exact logic that previously lived inline in
 * `AvatarCall`'s `handleAppMessage` closure.
 */
export function parseAppMessage(data: unknown): TavusEvent | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if (obj.message_type !== "conversation") return null;
  const event_type = typeof obj.event_type === "string" ? obj.event_type : "";
  if (!event_type) return null;
  return {
    event_type,
    conversation_id:
      typeof obj.conversation_id === "string" ? obj.conversation_id : undefined,
    seq: typeof obj.seq === "number" ? obj.seq : undefined,
    turn_idx: typeof obj.turn_idx === "number" ? obj.turn_idx : undefined,
    properties:
      obj.properties && typeof obj.properties === "object"
        ? (obj.properties as Record<string, unknown>)
        : undefined,
    timestamp_client_ms: Date.now(),
    raw: data,
  };
}

// ---------------------------------------------------------------------------
// TV-U-02: deriveAvatarSpeaking
// ---------------------------------------------------------------------------

/**
 * Derive the next `avatarSpeaking` boolean from the current state and one
 * incoming {@link TavusEvent}.
 *
 * Rules (case-insensitive on event_type):
 *   - event_type contains "replica" AND "start" → true  (avatar starts speaking)
 *   - event_type contains "replica" AND "stop"  → false (avatar stops speaking)
 *   - anything else                             → `prev` unchanged
 *
 * This is the exact logic that previously lived inline in the avatar route's
 * `handleEvent` callback.
 */
export function deriveAvatarSpeaking(
  prev: boolean,
  event: TavusEvent,
): boolean {
  const et = event.event_type.toLowerCase();
  if (et.includes("replica")) {
    if (et.includes("start")) return true;
    if (et.includes("stop")) return false;
  }
  return prev;
}
