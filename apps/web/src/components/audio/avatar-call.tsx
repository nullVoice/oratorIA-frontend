/**
 * Embeds a Tavus conversation video (which runs on Daily.co) and exposes
 * lifecycle callbacks. Joins the room on mount, destroys it on unmount, and
 * also fires `onEnd` when the user leaves the call (left-meeting event).
 *
 * Subscribes to Daily's `app-message` events to capture Tavus' Interactions
 * Protocol stream — utterances (with user_visual_analysis / user_audio_analysis
 * from Raven-1), started/stopped speaking, perception_tool_call, etc. The
 * accumulated events are exposed through `onEvent` so the parent route can
 * batch them and POST them to /sessions/:id/avatar-end.
 *
 * Daily enforces a singleton: only one DailyIframe may exist per page. React
 * StrictMode (and HMR) can mount the same component twice in dev, so before
 * creating a frame we tear down any existing one.
 */

import DailyIframe, { type DailyCall } from "@daily-co/daily-js";
import { useEffect, useRef } from "react";

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

interface AvatarCallProps {
  conversationUrl: string;
  onEnd: () => void;
  onError?: (err: Error) => void;
  onEvent?: (event: TavusEvent) => void;
}

export function AvatarCall({
  conversationUrl,
  onEnd,
  onError,
  onEvent,
}: AvatarCallProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callRef = useRef<DailyCall | null>(null);
  const onEndRef = useRef(onEnd);
  const onErrorRef = useRef(onError);
  const onEventRef = useRef(onEvent);

  // Keep callbacks fresh without retriggering the effect.
  useEffect(() => {
    onEndRef.current = onEnd;
    onErrorRef.current = onError;
    onEventRef.current = onEvent;
  }, [onEnd, onError, onEvent]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Tear down any existing instance — StrictMode double-mount or HMR can
    // leave one behind, and Daily refuses to create a second one.
    const existing = DailyIframe.getCallInstance();
    if (existing) {
      try {
        existing.destroy();
      } catch {
        /* already torn down */
      }
    }

    let frame: DailyCall;
    try {
      frame = DailyIframe.createFrame(containerRef.current, {
        iframeStyle: {
          position: "absolute",
          inset: "0",
          width: "100%",
          height: "100%",
          border: "0",
          borderRadius: "12px",
        },
        showLeaveButton: true,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // StrictMode/HMR double-mount: Daily refuses to create two instances.
      // The sibling mount owns the working frame, so just bail silently.
      if (msg.toLowerCase().includes("duplicate")) {
        return;
      }
      onErrorRef.current?.(err instanceof Error ? err : new Error(msg));
      return;
    }
    callRef.current = frame;

    const handleLeft = () => {
      onEndRef.current();
    };
    const handleError = (e: { errorMsg?: string; error?: { msg?: string } }) => {
      const msg = e.errorMsg ?? e.error?.msg ?? "Error en la videollamada";
      onErrorRef.current?.(new Error(msg));
    };

    // Tavus' Interactions Protocol piggy-backs on Daily's app-message
    // channel. Each event carries message_type="conversation" and an
    // event_type like "conversation.utterance".
    const handleAppMessage = (e: { data?: unknown; fromId?: string }) => {
      const data = e.data;
      if (!data || typeof data !== "object") return;
      const obj = data as Record<string, unknown>;
      const message_type = obj.message_type;
      if (message_type !== "conversation") return;
      const event_type = typeof obj.event_type === "string" ? obj.event_type : "";
      if (!event_type) return;
      onEventRef.current?.({
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
      });
    };

    frame.on("left-meeting", handleLeft);
    frame.on("error", handleError);
    frame.on("app-message", handleAppMessage);

    frame.join({ url: conversationUrl }).catch((err: unknown) => {
      onErrorRef.current?.(err instanceof Error ? err : new Error(String(err)));
    });

    return () => {
      frame.off("left-meeting", handleLeft);
      frame.off("error", handleError);
      frame.off("app-message", handleAppMessage);
      try {
        frame.destroy();
      } catch {
        /* ignore double-destroy */
      }
      callRef.current = null;
    };
  }, [conversationUrl]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-xl bg-black"
    />
  );
}
