/**
 * Vitest tests for tavus-events.ts pure helpers.
 *
 * TV-U-01: parseAppMessage — ignores non-conversation messages.
 * TV-U-02: parseAppMessage — ignores missing/empty event_type.
 * TV-U-03: parseAppMessage — maps all standard fields correctly.
 * TV-U-04: parseAppMessage — attaches raw payload and client timestamp.
 * TV-U-05: deriveAvatarSpeaking — replica start/stop toggle.
 * TV-U-06: deriveAvatarSpeaking — non-replica events leave state unchanged.
 * TV-U-07: deriveAvatarSpeaking — matching is case-insensitive.
 */

import { describe, expect, it } from "vitest";

import { parseAppMessage, deriveAvatarSpeaking } from "./tavus-events";
import type { TavusEvent } from "./tavus-events";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid Daily app-message data payload. */
function makePayload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    message_type: "conversation",
    event_type: "conversation.utterance",
    conversation_id: "conv_abc",
    seq: 1,
    turn_idx: 0,
    properties: { text: "hello" },
    ...overrides,
  };
}

/** Build a minimal TavusEvent for use with deriveAvatarSpeaking. */
function makeEvent(event_type: string): TavusEvent {
  return { event_type, timestamp_client_ms: Date.now() };
}

// ---------------------------------------------------------------------------
// TV-U-01: parseAppMessage — ignores non-conversation messages
// ---------------------------------------------------------------------------

describe("TV-U-01: parseAppMessage ignores non-conversation messages", () => {
  it("returns null when data is null", () => {
    expect(parseAppMessage(null)).toBeNull();
  });

  it("returns null when data is undefined", () => {
    expect(parseAppMessage(undefined)).toBeNull();
  });

  it("returns null when data is a string", () => {
    expect(parseAppMessage("not-an-object")).toBeNull();
  });

  it("returns null when data is a number", () => {
    expect(parseAppMessage(42)).toBeNull();
  });

  it("returns null when message_type is missing", () => {
    expect(
      parseAppMessage({ event_type: "conversation.utterance" }),
    ).toBeNull();
  });

  it("returns null when message_type is 'transcription'", () => {
    expect(
      parseAppMessage({
        message_type: "transcription",
        event_type: "conversation.utterance",
      }),
    ).toBeNull();
  });

  it("returns null when message_type is an empty string", () => {
    expect(
      parseAppMessage({
        message_type: "",
        event_type: "conversation.utterance",
      }),
    ).toBeNull();
  });

  it("returns null when message_type is 'CONVERSATION' (case-sensitive check)", () => {
    // The protocol specifies lowercase "conversation" exactly.
    expect(
      parseAppMessage({
        message_type: "CONVERSATION",
        event_type: "conversation.utterance",
      }),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// TV-U-02: parseAppMessage — ignores missing/empty event_type
// ---------------------------------------------------------------------------

describe("TV-U-02: parseAppMessage ignores missing or empty event_type", () => {
  it("returns null when event_type is absent", () => {
    expect(parseAppMessage({ message_type: "conversation" })).toBeNull();
  });

  it("returns null when event_type is an empty string", () => {
    expect(
      parseAppMessage({ message_type: "conversation", event_type: "" }),
    ).toBeNull();
  });

  it("returns null when event_type is a number", () => {
    expect(
      parseAppMessage({ message_type: "conversation", event_type: 99 }),
    ).toBeNull();
  });

  it("returns null when event_type is null", () => {
    expect(
      parseAppMessage({ message_type: "conversation", event_type: null }),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// TV-U-03: parseAppMessage — maps standard fields correctly
// ---------------------------------------------------------------------------

describe("TV-U-03: parseAppMessage maps fields correctly", () => {
  it("maps event_type", () => {
    const result = parseAppMessage(makePayload());
    expect(result?.event_type).toBe("conversation.utterance");
  });

  it("maps conversation_id when present", () => {
    const result = parseAppMessage(
      makePayload({ conversation_id: "conv_xyz" }),
    );
    expect(result?.conversation_id).toBe("conv_xyz");
  });

  it("omits conversation_id when absent", () => {
    const payload = makePayload();
    delete payload.conversation_id;
    const result = parseAppMessage(payload);
    expect(result?.conversation_id).toBeUndefined();
  });

  it("omits conversation_id when it is a number (not a string)", () => {
    const result = parseAppMessage(makePayload({ conversation_id: 123 }));
    expect(result?.conversation_id).toBeUndefined();
  });

  it("maps seq when it is a number", () => {
    const result = parseAppMessage(makePayload({ seq: 7 }));
    expect(result?.seq).toBe(7);
  });

  it("omits seq when it is absent", () => {
    const payload = makePayload();
    delete payload.seq;
    const result = parseAppMessage(payload);
    expect(result?.seq).toBeUndefined();
  });

  it("omits seq when it is a string", () => {
    const result = parseAppMessage(makePayload({ seq: "7" }));
    expect(result?.seq).toBeUndefined();
  });

  it("maps turn_idx when it is a number", () => {
    const result = parseAppMessage(makePayload({ turn_idx: 3 }));
    expect(result?.turn_idx).toBe(3);
  });

  it("omits turn_idx when absent", () => {
    const payload = makePayload();
    delete payload.turn_idx;
    const result = parseAppMessage(payload);
    expect(result?.turn_idx).toBeUndefined();
  });

  it("maps properties when present and is an object", () => {
    const result = parseAppMessage(makePayload({ properties: { score: 0.9 } }));
    expect(result?.properties).toEqual({ score: 0.9 });
  });

  it("omits properties when absent", () => {
    const payload = makePayload();
    delete payload.properties;
    const result = parseAppMessage(payload);
    expect(result?.properties).toBeUndefined();
  });

  it("omits properties when it is a string (not an object)", () => {
    const result = parseAppMessage(makePayload({ properties: "bad" }));
    expect(result?.properties).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// TV-U-04: parseAppMessage — raw payload and client timestamp
// ---------------------------------------------------------------------------

describe("TV-U-04: parseAppMessage attaches raw and timestamp_client_ms", () => {
  it("sets raw to the original data object", () => {
    const payload = makePayload();
    const result = parseAppMessage(payload);
    expect(result?.raw).toBe(payload);
  });

  it("sets timestamp_client_ms to a recent epoch ms value", () => {
    const before = Date.now();
    const result = parseAppMessage(makePayload());
    const after = Date.now();
    expect(result?.timestamp_client_ms).toBeGreaterThanOrEqual(before);
    expect(result?.timestamp_client_ms).toBeLessThanOrEqual(after);
  });

  it("returns a non-null result for a fully-populated payload", () => {
    expect(parseAppMessage(makePayload())).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// TV-U-05: deriveAvatarSpeaking — replica start/stop toggle
// ---------------------------------------------------------------------------

describe("TV-U-05: deriveAvatarSpeaking toggles on replica start/stop", () => {
  it("returns true on 'conversation.replica.started_speaking'", () => {
    expect(
      deriveAvatarSpeaking(
        false,
        makeEvent("conversation.replica.started_speaking"),
      ),
    ).toBe(true);
  });

  it("returns false on 'conversation.replica.stopped_speaking'", () => {
    expect(
      deriveAvatarSpeaking(
        true,
        makeEvent("conversation.replica.stopped_speaking"),
      ),
    ).toBe(false);
  });

  it("stays true when already true and start arrives again", () => {
    expect(
      deriveAvatarSpeaking(
        true,
        makeEvent("conversation.replica.started_speaking"),
      ),
    ).toBe(true);
  });

  it("stays false when already false and stop arrives again", () => {
    expect(
      deriveAvatarSpeaking(
        false,
        makeEvent("conversation.replica.stopped_speaking"),
      ),
    ).toBe(false);
  });

  it("transitions: false → start → true → stop → false", () => {
    let speaking = false;
    speaking = deriveAvatarSpeaking(
      speaking,
      makeEvent("conversation.replica.started_speaking"),
    );
    expect(speaking).toBe(true);
    speaking = deriveAvatarSpeaking(
      speaking,
      makeEvent("conversation.replica.stopped_speaking"),
    );
    expect(speaking).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TV-U-06: deriveAvatarSpeaking — non-replica events leave state unchanged
// ---------------------------------------------------------------------------

describe("TV-U-06: deriveAvatarSpeaking leaves state unchanged for non-replica events", () => {
  it("ignores utterance events (does not change false)", () => {
    expect(
      deriveAvatarSpeaking(false, makeEvent("conversation.utterance")),
    ).toBe(false);
  });

  it("ignores utterance events (does not change true)", () => {
    expect(
      deriveAvatarSpeaking(true, makeEvent("conversation.utterance")),
    ).toBe(true);
  });

  it("ignores user.started_speaking events", () => {
    expect(
      deriveAvatarSpeaking(
        false,
        makeEvent("conversation.user.started_speaking"),
      ),
    ).toBe(false);
  });

  it("ignores user.stopped_speaking events", () => {
    expect(
      deriveAvatarSpeaking(
        true,
        makeEvent("conversation.user.stopped_speaking"),
      ),
    ).toBe(true);
  });

  it("ignores perception_tool_call events", () => {
    expect(
      deriveAvatarSpeaking(
        true,
        makeEvent("conversation.perception_tool_call"),
      ),
    ).toBe(true);
  });

  it("ignores unknown event types", () => {
    expect(deriveAvatarSpeaking(false, makeEvent("some.unknown.event"))).toBe(
      false,
    );
  });
});

// ---------------------------------------------------------------------------
// TV-U-07: deriveAvatarSpeaking — case-insensitive matching
// ---------------------------------------------------------------------------

describe("TV-U-07: deriveAvatarSpeaking matches event_type case-insensitively", () => {
  it("'REPLICA.STARTED_SPEAKING' is treated as a start event", () => {
    expect(
      deriveAvatarSpeaking(
        false,
        makeEvent("CONVERSATION.REPLICA.STARTED_SPEAKING"),
      ),
    ).toBe(true);
  });

  it("'Replica.Stopped_Speaking' is treated as a stop event", () => {
    expect(
      deriveAvatarSpeaking(
        true,
        makeEvent("Conversation.Replica.Stopped_Speaking"),
      ),
    ).toBe(false);
  });

  it("mixed-case replica event with 'start' in it returns true", () => {
    expect(deriveAvatarSpeaking(false, makeEvent("REPLICA_START"))).toBe(true);
  });

  it("mixed-case replica event with 'stop' in it returns false", () => {
    expect(deriveAvatarSpeaking(true, makeEvent("REPLICA_STOP"))).toBe(false);
  });
});
