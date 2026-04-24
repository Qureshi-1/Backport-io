"use client";

import { useEffect, useRef } from "react";

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setCanvasDimensions = () => {
      // Overscan to handle mobile "pull-down" rubber banding
      canvas.width = window.innerWidth * 1.5;
      canvas.height = window.innerHeight * 1.5;
    };

    setCanvasDimensions();
    
    const fontSize = 16; // Slightly larger for better readability
    const columns = Math.ceil(canvas.width / fontSize);
    const drops: number[] = [];
    for (let x = 0; x < columns; x++) {
      drops[x] = Math.random() * -100;
    }

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+{}[]|;:<>?アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレゲゼデベペオォコソトノホモヨョロゴゾドボポヴッン";

    let animationFrameId: number;
    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(16, 185, 129, 0.4)"; 
      ctx.font = `bold ${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", setCanvasDimensions);
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", setCanvasDimensions);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed -top-[20%] -left-[20%] w-[140%] h-[140%] -z-10 pointer-events-none opacity-60"
        aria-hidden="true"
      />
      {/* Dark overlay to keep text readable */}
      <div className="fixed inset-0 bg-black/40 -z-10 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-black/20 to-black -z-10 pointer-events-none" />
    </>
  );
}
