import { useEffect, useState } from "react";

interface ScoreCardProps {
  score: number;
  size?: "md" | "lg";
  animate?: boolean;
}

interface Tier {
  stroke: string;
  text: string;
}

function tier(score: number): Tier {
  if (score >= 75) return { stroke: "#10b981", text: "text-emerald-500" };
  if (score >= 50) return { stroke: "#f59e0b", text: "text-amber-500" };
  return { stroke: "#ef4444", text: "text-red-500" };
}

const COUNT_DURATION_MS = 1200;

export function ScoreCard({
  score,
  size = "lg",
  animate = true,
}: ScoreCardProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const [displayed, setDisplayed] = useState(animate ? 0 : clamped);

  useEffect(() => {
    if (!animate) {
      setDisplayed(clamped);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_DURATION_MS);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplayed(Math.round(from + (clamped - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, clamped]);

  const dim = size === "lg" ? 200 : 128;
  const strokeWidth = size === "lg" ? 10 : 8;
  const radius = (dim - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayed / 100) * circumference;
  const colors = tier(clamped);
  const numCls = size === "lg" ? "text-6xl" : "text-4xl";

  return (
    <div
      className="relative inline-block"
      style={{ width: dim, height: dim }}
      role="img"
      aria-label={`Score ${clamped} de 100`}
    >
      <svg
        className="absolute inset-0 -rotate-90"
        viewBox={`0 0 ${dim} ${dim}`}
      >
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: animate ? "stroke-dashoffset 200ms linear" : undefined,
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div
            className={`${numCls} font-bold leading-none tracking-tight tabular-nums ${colors.text}`}
          >
            {displayed}
          </div>
          <div className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            de 100
          </div>
        </div>
      </div>
    </div>
  );
}
