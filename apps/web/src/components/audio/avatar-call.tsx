/**
 * Embeds a Tavus conversation video (which runs on Daily.co) and exposes
 * lifecycle callbacks. Joins the room on mount, destroys it on unmount, and
 * also fires `onEnd` when the user leaves the call (left-meeting event).
 *
 * The parent route is responsible for calling the backend's
 * /sessions/:id/avatar-end whenever this component invokes onEnd.
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

  useEffect(() => {
    if (!containerRef.current) return;
    if (callRef.current) return;

    const frame = DailyIframe.createFrame(containerRef.current, {
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
    callRef.current = frame;

    const handleLeft = () => {
      onEnd();
    };
    const handleError = (e: { errorMsg?: string; error?: { msg?: string } }) => {
      const msg = e.errorMsg ?? e.error?.msg ?? "Error en la videollamada";
      onError?.(new Error(msg));
    };

    frame.on("left-meeting", handleLeft);
    frame.on("error", handleError);

    frame.join({ url: conversationUrl }).catch((err: unknown) => {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    });

    return () => {
      frame.off("left-meeting", handleLeft);
      frame.off("error", handleError);
      frame.destroy();
      callRef.current = null;
    };
  }, [conversationUrl, onEnd, onError]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-xl bg-black"
    />
  );
}
