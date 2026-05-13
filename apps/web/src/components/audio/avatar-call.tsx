/**
 * Embeds a Tavus conversation video (which runs on Daily.co) and exposes
 * lifecycle callbacks. Joins the room on mount, destroys it on unmount, and
 * also fires `onEnd` when the user leaves the call (left-meeting event).
 *
 * Daily enforces a singleton: only one DailyIframe may exist per page. React
 * StrictMode (and HMR) can mount the same component twice in dev, so before
 * creating a frame we tear down any existing one. We also keep `onEnd` and
 * `onError` in refs so the effect only re-runs when the URL itself changes.
 */

import DailyIframe, { type DailyCall } from "@daily-co/daily-js";
import { useEffect, useRef } from "react";

interface AvatarCallProps {
  conversationUrl: string;
  onEnd: () => void;
  onError?: (err: Error) => void;
}

export function AvatarCall({ conversationUrl, onEnd, onError }: AvatarCallProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callRef = useRef<DailyCall | null>(null);
  const onEndRef = useRef(onEnd);
  const onErrorRef = useRef(onError);

  // Keep callbacks fresh without retriggering the effect.
  useEffect(() => {
    onEndRef.current = onEnd;
    onErrorRef.current = onError;
  }, [onEnd, onError]);

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

    frame.on("left-meeting", handleLeft);
    frame.on("error", handleError);

    frame.join({ url: conversationUrl }).catch((err: unknown) => {
      onErrorRef.current?.(err instanceof Error ? err : new Error(String(err)));
    });

    return () => {
      frame.off("left-meeting", handleLeft);
      frame.off("error", handleError);
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
