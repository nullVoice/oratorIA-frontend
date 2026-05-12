/**
 * Waveform visualizer.
 *
 * Two modes:
 *   - Live: pass a MediaStream while recording → renders a real-time
 *     amplitude trace using Web Audio API + canvas.
 *   - Playback: pass an audioBlob → wavesurfer.js renders the full
 *     waveform with click-to-seek.
 */
import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

interface WaveformProps {
  stream?: MediaStream | null;
  audioBlob?: Blob | null;
  height?: number;
}

export function Waveform({ stream, audioBlob, height = 80 }: WaveformProps) {
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const playbackContainerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  // Live mode: draw amplitude from AnalyserNode → canvas.
  useEffect(() => {
    if (!stream || !liveCanvasRef.current) return;

    const canvas = liveCanvasRef.current;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const AudioCtor: typeof AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const audioCtx = new AudioCtor();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    const bufferLen = analyser.fftSize;
    const data = new Uint8Array(bufferLen);
    let raf = 0;

    const draw = () => {
      analyser.getByteTimeDomainData(data);
      const { width, height: h } = canvas;
      ctx2d.clearRect(0, 0, width, h);
      ctx2d.lineWidth = 2;
      ctx2d.strokeStyle = "#0A0A0A";
      ctx2d.beginPath();
      const slice = width / bufferLen;
      let x = 0;
      for (let i = 0; i < bufferLen; i++) {
        const v = data[i] / 128.0;
        const y = (v * h) / 2;
        if (i === 0) ctx2d.moveTo(x, y);
        else ctx2d.lineTo(x, y);
        x += slice;
      }
      ctx2d.lineTo(width, h / 2);
      ctx2d.stroke();
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      source.disconnect();
      analyser.disconnect();
      void audioCtx.close();
    };
  }, [stream]);

  // Playback mode: wavesurfer.js renders the recorded blob.
  useEffect(() => {
    if (!audioBlob || !playbackContainerRef.current) return;

    const ws = WaveSurfer.create({
      container: playbackContainerRef.current,
      waveColor: "#0A0A0A",
      progressColor: "#C6FF3D",
      cursorColor: "#0A0A0A",
      height,
      barWidth: 2,
      barRadius: 2,
      barGap: 2,
      normalize: true,
    });
    wavesurferRef.current = ws;

    const url = URL.createObjectURL(audioBlob);
    void ws.load(url);

    return () => {
      ws.destroy();
      wavesurferRef.current = null;
      URL.revokeObjectURL(url);
    };
  }, [audioBlob, height]);

  if (stream) {
    return (
      <canvas
        ref={liveCanvasRef}
        width={800}
        height={height}
        className="w-full rounded-lg bg-gray-50"
        style={{ height }}
      />
    );
  }
  if (audioBlob) {
    return <div ref={playbackContainerRef} className="w-full rounded-lg" />;
  }
  return (
    <div
      className="grid w-full place-items-center rounded-lg bg-gray-50 text-xs text-gray-400"
      style={{ height }}
    >
      Sin audio
    </div>
  );
}
