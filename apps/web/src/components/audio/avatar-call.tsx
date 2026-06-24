/**
 * Embeds a Tavus conversation (which runs on Daily.co) using a Daily CALL
 * OBJECT instead of Daily's prebuilt iframe.  Call objects have no prejoin UI
 * whatsoever, so the Tavus replica appears immediately — no lobby, no English
 * "Enter your name" / device-setup screens.
 *
 * The component renders the remote participant (the Tavus replica) into a
 * <video> element by assembling a MediaStream from the subscribed remote
 * tracks and assigning it as srcObject.  Local mic + camera are sent by
 * default (Daily defaults capture both), which Tavus/Raven-1 requires to
 * hear and see the user.
 *
 * Subscribes to Daily's `app-message` events to capture Tavus' Interactions
 * Protocol stream — utterances (with user_visual_analysis / user_audio_analysis
 * from Raven-1), started/stopped speaking, perception_tool_call, etc.  The
 * accumulated events are exposed through `onEvent` so the parent route can
 * batch them and POST them to /sessions/:id/avatar-end.
 *
 * Daily enforces a singleton: only one DailyIframe instance may exist per
 * page.  React StrictMode (and HMR) can mount the same component twice in dev,
 * so before creating a call object we tear down any existing one.
 */

import DailyIframe, {
  type DailyCall,
  type DailyParticipant,
} from "@daily-co/daily-js";
import { useEffect, useRef } from "react";

import { parseAppMessage, type TavusEvent } from "@/lib/practice/tavus-events";

export type { TavusEvent };

interface AvatarCallProps {
  conversationUrl: string;
  /** Presenter name passed to Daily on join. */
  userName?: string;
  onEnd: () => void;
  onError?: (err: Error) => void;
  onEvent?: (event: TavusEvent) => void;
}

// ---------------------------------------------------------------------------
// Remote media helpers
// ---------------------------------------------------------------------------

/**
 * Extract the best available MediaStreamTrack for a Daily track slot.
 * Daily's call object exposes `persistentTrack` (preferred — survives
 * renegotiation) and `track` (the raw RTCRtpReceiver track).  Both are typed
 * as MediaStreamTrack | null | undefined depending on the SDK version, so we
 * fall back gracefully.
 */
function pickTrack(
  slot:
    | {
        persistentTrack?: MediaStreamTrack | null;
        track?: MediaStreamTrack | null;
      }
    | undefined,
): MediaStreamTrack | null {
  if (!slot) return null;
  // Only include tracks in a live/playable state.
  const candidate = slot.persistentTrack ?? slot.track ?? null;
  if (!candidate) return null;
  if (candidate.readyState === "ended") return null;
  return candidate;
}

/**
 * Rebuild the remote MediaStream from the first non-local Daily participant
 * (the Tavus replica) and assign it to the <video> element's srcObject.
 *
 * Reassigns srcObject only when the track set actually changes to avoid
 * unnecessary flicker / seek resets.
 */
function syncRemoteMedia(call: DailyCall, videoEl: HTMLVideoElement): void {
  const participants = call.participants();

  // Find the first non-local participant (the Tavus replica).
  let replica: DailyParticipant | null = null;
  for (const [id, p] of Object.entries(participants)) {
    if (id !== "local" && !p.local) {
      replica = p;
      break;
    }
  }

  const tracks: MediaStreamTrack[] = [];

  if (replica) {
    const videoTrack = pickTrack(replica.tracks?.video);
    const audioTrack = pickTrack(replica.tracks?.audio);
    if (videoTrack) tracks.push(videoTrack);
    if (audioTrack) tracks.push(audioTrack);
  }

  // Compare with the current srcObject to skip unnecessary reassignments.
  const current = videoEl.srcObject;
  const currentTracks =
    current instanceof MediaStream ? current.getTracks() : [];

  const sameSet =
    tracks.length === currentTracks.length &&
    tracks.every((t) => currentTracks.includes(t));

  if (!sameSet) {
    videoEl.srcObject = tracks.length > 0 ? new MediaStream(tracks) : null;
    if (tracks.length > 0) {
      videoEl.play().catch(() => {
        // Autoplay blocked — browser will unblock on first user gesture.
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AvatarCall({
  conversationUrl,
  userName,
  onEnd,
  onError,
  onEvent,
}: AvatarCallProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const callRef = useRef<DailyCall | null>(null);
  const onEndRef = useRef(onEnd);
  const onErrorRef = useRef(onError);
  const onEventRef = useRef(onEvent);
  // userName arrives asynchronously (auth store hydration). Keep it in a ref so
  // its change does NOT re-run the join effect — re-running mid-join makes Daily
  // leave the meeting and the recreate collides with the singleton, leaving a
  // dead "left-meeting" call (black screen). Any name skips the prejoin anyway.
  const userNameRef = useRef(userName);

  // Keep callbacks + userName fresh without retriggering the join effect.
  useEffect(() => {
    onEndRef.current = onEnd;
    onErrorRef.current = onError;
    onEventRef.current = onEvent;
    userNameRef.current = userName;
  }, [onEnd, onError, onEvent, userName]);

  useEffect(() => {
    // `disposed` guards against the effect being torn down (React re-run, HMR,
    // navigation) before async setup finishes. Daily enforces a global
    // singleton, so we must AWAIT any prior instance's destroy() before
    // creating a new one — otherwise createCallObject throws "Duplicate" and we
    // end up with a dead, half-left call (black screen). Serializing here makes
    // the latest run always win.
    let disposed = false;
    let call: DailyCall | null = null;

    const handleLeft = () => onEndRef.current();
    const handleError = (e: {
      errorMsg?: string;
      error?: { msg?: string };
    }) => {
      const msg = e.errorMsg ?? e.error?.msg ?? "Error en la videollamada";
      onErrorRef.current?.(new Error(msg));
    };
    // Tavus' Interactions Protocol piggy-backs on Daily's app-message channel.
    const handleAppMessage = (e: { data?: unknown }) => {
      const event = parseAppMessage(e.data);
      if (event) onEventRef.current?.(event);
    };
    const handleMediaUpdate = () => {
      if (call && videoRef.current) syncRemoteMedia(call, videoRef.current);
    };
    const detach = (c: DailyCall) => {
      c.off("left-meeting", handleLeft);
      c.off("error", handleError);
      c.off("app-message", handleAppMessage);
      c.off("track-started", handleMediaUpdate);
      c.off("track-stopped", handleMediaUpdate);
      c.off("participant-updated", handleMediaUpdate);
      c.off("participant-joined", handleMediaUpdate);
      c.off("participant-left", handleMediaUpdate);
    };

    void (async () => {
      // Fully tear down any prior instance before creating a new one.
      const prev = DailyIframe.getCallInstance();
      if (prev) {
        try {
          await prev.destroy();
        } catch {
          /* already gone */
        }
      }
      if (disposed) return;

      try {
        call = DailyIframe.createCallObject({
          subscribeToTracksAutomatically: true,
        });
      } catch (err) {
        if (!disposed) {
          onErrorRef.current?.(
            err instanceof Error ? err : new Error(String(err)),
          );
        }
        return;
      }
      if (disposed) {
        try {
          await call.destroy();
        } catch {
          /* ignore */
        }
        return;
      }

      callRef.current = call;
      call.on("left-meeting", handleLeft);
      call.on("error", handleError);
      call.on("app-message", handleAppMessage);
      call.on("track-started", handleMediaUpdate);
      call.on("track-stopped", handleMediaUpdate);
      call.on("participant-updated", handleMediaUpdate);
      call.on("participant-joined", handleMediaUpdate);
      call.on("participant-left", handleMediaUpdate);

      try {
        await call.join({
          url: conversationUrl,
          userName: userNameRef.current || "Orador/a",
        });
        // Some track-started events can fire before listeners attach; sync once.
        if (!disposed && videoRef.current)
          syncRemoteMedia(call, videoRef.current);
      } catch (err) {
        if (!disposed) {
          onErrorRef.current?.(
            err instanceof Error ? err : new Error(String(err)),
          );
        }
      }
    })();

    return () => {
      disposed = true;
      const c = call ?? callRef.current;
      callRef.current = null;
      if (c) {
        detach(c);
        c.leave()
          .catch(() => {})
          .finally(() => {
            try {
              c.destroy();
            } catch {
              /* ignore double-destroy */
            }
          });
      }
    };
    // Only re-join when the conversation URL changes. userName is read from a
    // ref so its async arrival never tears down a live call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationUrl]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-black">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="h-full w-full object-cover"
        // Audio from the replica must NOT be muted so the user hears the avatar.
      />
    </div>
  );
}
