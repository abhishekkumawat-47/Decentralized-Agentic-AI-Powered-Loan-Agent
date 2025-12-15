"use client";
import { useEffect, useRef } from "react";

interface LiveWaveformProps {
  frequencyData: Uint8Array;
  isActive: boolean;
  height?: number;
}

export function LiveWaveform({
  frequencyData,
  isActive,
  height = 280,
}: LiveWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const smoothRef = useRef<number[]>([]);
  const phaseRef = useRef(0);
  const pulseRef = useRef(0);
  const lastActiveRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const points = 140;
    smoothRef.current = new Array(points).fill(0);

    const drawWaveLayer = (phaseOffset: number, opacity: number) => {
      const width = canvas.offsetWidth;
      const h = height;
      const centerX = width / 2;

      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0.0, `rgba(255,255,255,${0.9 * opacity})`);
      gradient.addColorStop(0.2, `rgba(120,200,255,${0.85 * opacity})`);
      gradient.addColorStop(0.45, `rgba(168,85,247,${0.9 * opacity})`);
      gradient.addColorStop(0.65, `rgba(236,72,153,${0.85 * opacity})`);
      gradient.addColorStop(0.85, `rgba(239,68,68,${0.75 * opacity})`);
      gradient.addColorStop(1, `rgba(20,20,20,${0.2 * opacity})`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(centerX, h);

      /* ---------- RIGHT ---------- */
      for (let i = 0; i <= points / 2; i++) {
        const norm = i / (points / 2);
        const x = centerX + norm * centerX;

        let energy = 0;
        if (isActive && frequencyData.length) {
          const index = Math.floor(norm * frequencyData.length);
          energy = frequencyData[index] / 255;
          energy = Math.pow(energy, 0.75);
        } else {
          // Idle state - smooth breathing wave animation with cap
          const breathe = Math.sin(phaseRef.current * 0.5) * 0.05;
          const ripple = Math.sin(phaseRef.current * 1.5 + norm * 3) * 0.03;
          energy = Math.min(0.18 + breathe + ripple, 0.22);
        }

        // Phase propagation outward
        const phase = isActive 
          ? Math.sin(phaseRef.current + i * 0.25 + phaseOffset) * 0.15
          : Math.sin(phaseRef.current * 0.8 + i * 0.15 + phaseOffset) * 0.08;

        // Center pulse
        const pulse =
          Math.exp(-norm * 6) * pulseRef.current * 0.8;

        const target = energy + phase + pulse;
        const smoothingFactor = isActive ? 0.35 : 0.25;
        smoothRef.current[i] += (target - smoothRef.current[i]) * smoothingFactor;

        const amp = smoothRef.current[i] * h * 0.85;
        ctx.lineTo(x, h - Math.max(amp, 10));
      }

      /* ---------- LEFT (mirror) ---------- */
      for (let i = points / 2; i >= 0; i--) {
        const norm = i / (points / 2);
        const x = centerX - norm * centerX;

        let energy = 0;
        if (isActive && frequencyData.length) {
          const index = Math.floor(norm * frequencyData.length);
          energy = frequencyData[index] / 255;
          energy = Math.pow(energy, 0.75);
        } else {
          // Idle state - smooth breathing wave animation with cap
          const breathe = Math.sin(phaseRef.current * 0.5) * 0.05;
          const ripple = Math.sin(phaseRef.current * 1.5 + norm * 3) * 0.03;
          energy = Math.min(0.18 + breathe + ripple, 0.22);
        }

        const phase = isActive 
          ? Math.sin(phaseRef.current + i * 0.25 + phaseOffset) * 0.15
          : Math.sin(phaseRef.current * 0.8 + i * 0.15 + phaseOffset) * 0.08;
        const pulse =
          Math.exp(-norm * 6) * pulseRef.current * 0.8;

        const target = energy + phase + pulse;
        const smoothingFactor = isActive ? 0.35 : 0.25;
        smoothRef.current[i] += (target - smoothRef.current[i]) * smoothingFactor;

        const amp = smoothRef.current[i] * h * 0.85;
        ctx.lineTo(x, h - Math.max(amp, 10));
      }

      ctx.closePath();
      ctx.fill();
    };

    const draw = () => {
      const width = canvas.offsetWidth;
      const h = height;

      /* ---------- Detect speech start ---------- */
      if (isActive && !lastActiveRef.current) {
        pulseRef.current = 1; // trigger pulse
      }
      lastActiveRef.current = isActive;

      /* ---------- Fade pulse ---------- */
      pulseRef.current *= 0.92;

      /* ---------- Advance phase ---------- */
      phaseRef.current += isActive ? 0.06 : 0.035;

      /* ---------- Background ---------- */
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "rgba(5,5,10,0.96)");
      bg.addColorStop(0.5, "rgba(10,10,20,0.96)");
      bg.addColorStop(1, "rgba(0,0,0,1)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, h);

      /* ---------- Counter-wave layers ---------- */
      drawWaveLayer(0, 1);
      drawWaveLayer(Math.PI, 0.6);

      /* ---------- Glow ---------- */
      ctx.shadowColor = "rgba(168,85,247,0.8)";
      ctx.shadowBlur = 40;

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [frequencyData, isActive, height]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
      <canvas ref={canvasRef} className="w-full" style={{ height }} />
    </div>
  );
}

/* ---------------- Speaking Indicator ---------------- */

export function SpeakingWaveform({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-1 rounded-full bg-white transition-all ${
            isSpeaking ? "animate-pulse" : ""
          }`}
          style={{
            height: isSpeaking ? `${10 + Math.random() * 16}px` : "4px",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
