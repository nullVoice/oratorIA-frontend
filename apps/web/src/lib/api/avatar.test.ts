/**
 * Vitest tests for avatar.ts API wrappers.
 *
 * AV-U-01: startAvatarSession sends the correct URL + json body and parses
 *           a valid response through AvatarStartResponseSchema.
 * AV-U-02: startAvatarSession throws on schema validation failure (e.g.
 *           conversation_url is not a URL).
 * AV-U-03: endAvatarSession posts the correct URL + json body (with events)
 *           and parses report_ready from the response.
 * AV-U-04: endAvatarSession defaults events to [] when the payload omits it.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock the ky instance BEFORE importing the module under test so that all
// calls to `api.post(...).json()` are intercepted.
// ---------------------------------------------------------------------------

const mockJson = vi.fn();
const mockPost = vi.fn(() => ({ json: mockJson }));

vi.mock("@/lib/api/client", () => ({
  api: {
    post: mockPost,
  },
}));

import { startAvatarSession, endAvatarSession } from "./avatar";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_START_RESPONSE = {
  conversation_id: "conv_abc123",
  conversation_url: "https://tavus.daily.co/room-xyz",
  interactive: true,
  persona_id: "persona_01",
  replica_id: "replica_01",
  started_at: "2026-06-23T10:00:00Z",
};

const VALID_END_RESPONSE = {
  conversation_id: "conv_abc123",
  status: "ended",
  report_ready: true,
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// AV-U-01: startAvatarSession — happy path
// ---------------------------------------------------------------------------

describe("AV-U-01: startAvatarSession — valid response", () => {
  it("posts to the correct URL with the interactive flag in json body", async () => {
    mockJson.mockResolvedValueOnce(VALID_START_RESPONSE);

    await startAvatarSession("session-42", { interactive: true });

    expect(mockPost).toHaveBeenCalledOnce();
    const [url, options] = mockPost.mock.calls[0] as unknown as [
      string,
      { json: unknown; timeout: number },
    ];
    expect(url).toBe("api/v1/sessions/session-42/avatar-start");
    expect(options.json).toEqual({ interactive: true });
  });

  it("sets the 60 s timeout on the request", async () => {
    mockJson.mockResolvedValueOnce(VALID_START_RESPONSE);

    await startAvatarSession("session-42", { interactive: false });

    const [, options] = mockPost.mock.calls[0] as unknown as [
      string,
      { json: unknown; timeout: number },
    ];
    expect(options.timeout).toBe(60_000);
  });

  it("returns the parsed AvatarStartResponse", async () => {
    mockJson.mockResolvedValueOnce(VALID_START_RESPONSE);

    const result = await startAvatarSession("session-42", {
      interactive: true,
    });

    expect(result).toEqual(VALID_START_RESPONSE);
    expect(result.conversation_url).toBe("https://tavus.daily.co/room-xyz");
    expect(result.interactive).toBe(true);
  });

  it("passes interactive: false when specified", async () => {
    mockJson.mockResolvedValueOnce({
      ...VALID_START_RESPONSE,
      interactive: false,
    });

    const result = await startAvatarSession("session-99", {
      interactive: false,
    });

    const [, options] = mockPost.mock.calls[0] as unknown as [
      string,
      { json: { interactive: boolean } },
    ];
    expect(options.json.interactive).toBe(false);
    expect(result.interactive).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AV-U-02: startAvatarSession — schema validation failure
// ---------------------------------------------------------------------------

describe("AV-U-02: startAvatarSession — invalid response throws", () => {
  it("throws a ZodError when conversation_url is not a URL", async () => {
    mockJson.mockResolvedValueOnce({
      ...VALID_START_RESPONSE,
      conversation_url: "not-a-url",
    });

    await expect(
      startAvatarSession("session-42", { interactive: true }),
    ).rejects.toThrow();
  });

  it("throws when a required field is missing", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { conversation_id: _omitted, ...withoutId } = VALID_START_RESPONSE;
    mockJson.mockResolvedValueOnce(withoutId);

    await expect(
      startAvatarSession("session-42", { interactive: true }),
    ).rejects.toThrow();
  });

  it("throws when replica_id is not a string", async () => {
    mockJson.mockResolvedValueOnce({
      ...VALID_START_RESPONSE,
      replica_id: 42,
    });

    await expect(
      startAvatarSession("session-42", { interactive: true }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// AV-U-03: endAvatarSession — happy path with explicit events
// ---------------------------------------------------------------------------

describe("AV-U-03: endAvatarSession — valid response with events", () => {
  it("posts to the correct URL", async () => {
    mockJson.mockResolvedValueOnce(VALID_END_RESPONSE);

    const events = [
      { event_type: "conversation.utterance", timestamp_client_ms: 1 },
    ];
    await endAvatarSession("session-42", { events });

    const [url] = mockPost.mock.calls[0] as unknown as [string, unknown];
    expect(url).toBe("api/v1/sessions/session-42/avatar-end");
  });

  it("includes the events array in the json body", async () => {
    mockJson.mockResolvedValueOnce(VALID_END_RESPONSE);

    const events = [
      { event_type: "conversation.utterance", timestamp_client_ms: 100 },
      {
        event_type: "conversation.replica.started_speaking",
        timestamp_client_ms: 200,
      },
    ];
    await endAvatarSession("session-42", { events });

    const [, options] = mockPost.mock.calls[0] as unknown as [
      string,
      { json: { events: unknown[] } },
    ];
    expect(options.json.events).toEqual(events);
  });

  it("sets the 120 s timeout on the request", async () => {
    mockJson.mockResolvedValueOnce(VALID_END_RESPONSE);

    await endAvatarSession("session-42", { events: [] });

    const [, options] = mockPost.mock.calls[0] as unknown as [
      string,
      { json: unknown; timeout: number },
    ];
    expect(options.timeout).toBe(120_000);
  });

  it("returns parsed report_ready: true", async () => {
    mockJson.mockResolvedValueOnce(VALID_END_RESPONSE);

    const result = await endAvatarSession("session-42", { events: [] });

    expect(result.report_ready).toBe(true);
    expect(result.conversation_id).toBe("conv_abc123");
    expect(result.status).toBe("ended");
  });

  it("returns parsed report_ready: false", async () => {
    mockJson.mockResolvedValueOnce({
      ...VALID_END_RESPONSE,
      report_ready: false,
    });

    const result = await endAvatarSession("session-42", { events: [] });

    expect(result.report_ready).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AV-U-04: endAvatarSession — defaults events to []
// ---------------------------------------------------------------------------

describe("AV-U-04: endAvatarSession — events defaults to [] when omitted", () => {
  it("sends events: [] when no payload is passed", async () => {
    mockJson.mockResolvedValueOnce(VALID_END_RESPONSE);

    await endAvatarSession("session-42");

    const [, options] = mockPost.mock.calls[0] as unknown as [
      string,
      { json: { events: unknown[] } },
    ];
    expect(options.json.events).toEqual([]);
  });

  it("sends events: [] when payload omits the events key", async () => {
    mockJson.mockResolvedValueOnce(VALID_END_RESPONSE);

    await endAvatarSession("session-42", {});

    const [, options] = mockPost.mock.calls[0] as unknown as [
      string,
      { json: { events: unknown[] } },
    ];
    expect(options.json.events).toEqual([]);
  });

  it("still parses the response correctly when defaulting events", async () => {
    mockJson.mockResolvedValueOnce(VALID_END_RESPONSE);

    const result = await endAvatarSession("session-42");

    expect(result.report_ready).toBe(true);
  });
});
