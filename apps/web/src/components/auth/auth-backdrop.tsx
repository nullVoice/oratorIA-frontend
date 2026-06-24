/** Raycast-style dark backdrop for the auth panels: diagonal green light
 * "blades" drifting slowly over a green-tinted dark stage, plus film grain.
 * Purely decorative and animated; the cards on top stay static. */
import type { CSSProperties } from "react";

type Blade = {
  left: string;
  width: string;
  rot: string;
  blur: string;
  dur: string;
  dx: string;
  dy: string;
  opacity: number;
  color: string;
};

// Brightest blades cluster slightly right-of-centre (Raycast's hot zone),
// fading to thin, dim edges. Varied durations keep the drift organic.
const BLADES: Blade[] = [
  {
    left: "14%",
    width: "7%",
    rot: "-31deg",
    blur: "46px",
    dur: "17s",
    dx: "4%",
    dy: "-3%",
    opacity: 0.35,
    color: "rgba(174,224,41,0.9)",
  },
  {
    left: "30%",
    width: "12%",
    rot: "-31deg",
    blur: "40px",
    dur: "14s",
    dx: "5%",
    dy: "-4%",
    opacity: 0.6,
    color: "rgba(198,255,61,0.95)",
  },
  {
    left: "46%",
    width: "16%",
    rot: "-31deg",
    blur: "38px",
    dur: "19s",
    dx: "-4%",
    dy: "3%",
    opacity: 0.85,
    color: "rgba(214,255,122,1)",
  },
  {
    left: "63%",
    width: "11%",
    rot: "-31deg",
    blur: "42px",
    dur: "15s",
    dx: "5%",
    dy: "-3%",
    opacity: 0.65,
    color: "rgba(198,255,61,0.95)",
  },
  {
    left: "77%",
    width: "8%",
    rot: "-31deg",
    blur: "48px",
    dur: "21s",
    dx: "-3%",
    dy: "4%",
    opacity: 0.4,
    color: "rgba(120,170,30,0.85)",
  },
  {
    left: "88%",
    width: "5%",
    rot: "-31deg",
    blur: "54px",
    dur: "18s",
    dx: "4%",
    dy: "-2%",
    opacity: 0.25,
    color: "rgba(174,224,41,0.7)",
  },
];

export function AuthBackdrop() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(130% 90% at 64% 28%, #16210d 0%, #0b0f07 46%, #060704 100%)",
      }}
    >
      {BLADES.map((b, i) => (
        <div
          key={i}
          className="auth-blade"
          style={
            {
              left: b.left,
              width: b.width,
              opacity: b.opacity,
              background: `linear-gradient(180deg, transparent 0%, ${b.color} 45%, ${b.color} 60%, transparent 100%)`,
              "--blade-rot": b.rot,
              "--blade-blur": b.blur,
              "--blade-dur": b.dur,
              "--blade-dx": b.dx,
              "--blade-dy": b.dy,
            } as CSSProperties
          }
        />
      ))}
      {/* Soft top-right bloom + bottom vignette for depth. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 40% at 70% 18%, rgba(198,255,61,0.18), transparent 70%), linear-gradient(to bottom, transparent 55%, rgba(0,0,0,0.45) 100%)",
        }}
      />
      <div className="auth-grain" />
    </div>
  );
}
