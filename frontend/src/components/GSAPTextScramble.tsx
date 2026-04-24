"use client";

import { useEffect, useRef } from "react";
import { getGsap, killTriggersFor } from "@/lib/gsap-safe";

interface GSAPTextScrambleProps {
  text: string;
  className?: string;
  scrambleChars?: string;
  speed?: number;
  revealOnScroll?: boolean;
}

export default function GSAPTextScramble({
  text,
  className = "",
  scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*",
  speed = 0.04,
  revealOnScroll = false,
}: GSAPTextScrambleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const charsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return;

    getGsap().then(({ gsap, ScrollTrigger }) => {
      const chars = charsRef.current.filter(Boolean) as HTMLSpanElement[];

      if (revealOnScroll) {
        gsap.set(chars, { opacity: 0, y: 20, rotateX: -90 });
        ScrollTrigger.batch(chars, {
          onEnter: (batch: any[]) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            batch.forEach((el, i) => {
              scrambleChar(el as HTMLSpanElement, i * speed * 3);
            });
          },
          start: "top 85%",
          once: true,
        });
      } else {
        chars.forEach((char, i) => {
          scrambleChar(char, i * speed);
        });
      }

      function scrambleChar(el: HTMLSpanElement, delay: number) {
        const original = el.dataset.char || "";
        let frame = 0;
        const maxFrames = 8;

        gsap.set(el, { opacity: 1, y: 0, rotateX: 0 });

        const interval = setInterval(() => {
          frame++;
          if (frame >= maxFrames) {
            el.textContent = original;
            clearInterval(interval);
            intervalsRef.current = intervalsRef.current.filter((id) => id !== interval);
            return;
          }
          if (original === " ") return;
          el.textContent = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
        }, 30 + delay * 200);

        intervalsRef.current.push(interval);
      }
    }).catch((e) => {
      console.warn("GSAPTextScramble: failed to init", e);
    });

    return () => {
      intervalsRef.current.forEach(clearInterval);
      intervalsRef.current = [];
      if (container) killTriggersFor(container);
    };
  }, [text, scrambleChars, speed, revealOnScroll]);

  return (
    <div ref={containerRef} className={`flex flex-wrap ${className}`} style={{ perspective: "500px" }}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          ref={(el) => { charsRef.current[i] = el; }}
          data-char={char}
          className="inline-block"
          style={{ opacity: 0, transformOrigin: "center bottom", whiteSpace: char === " " ? "pre" : "normal" }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </div>
  );
}
