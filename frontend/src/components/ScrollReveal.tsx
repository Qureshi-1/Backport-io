"use client";

import { useEffect, useRef } from "react";
import { getGsap, killTriggersFor } from "@/lib/gsap-safe";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  duration?: number;
  stagger?: boolean;
  once?: boolean;
}

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = 40,
  duration = 0.8,
  stagger = false,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    const directionMap = {
      up: { y: distance, x: 0 },
      down: { y: -distance, x: 0 },
      left: { x: distance, y: 0 },
      right: { x: -distance, y: 0 },
      none: { x: 0, y: 0 },
    };

    const { x, y } = directionMap[direction];
    const targets = stagger ? el.children : el;

    getGsap().then(({ gsap }) => {
      gsap.set(targets, { opacity: 0, x, y });

      const tween = gsap.to(targets, {
        opacity: 1,
        x: 0,
        y: 0,
        duration,
        delay,
        stagger: stagger ? 0.1 : 0,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          end: "bottom 10%",
          toggleActions: once ? "play none none none" : "play reverse play reverse",
        },
      });

      (el as any)._tween = tween; // eslint-disable-line
    }).catch((e) => console.warn("ScrollReveal: failed to init", e));

    return () => {
      const tween = (el as any)?._tween; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (tween && typeof tween.kill === "function") tween.kill();
      killTriggersFor(el);
    };
  }, [delay, direction, distance, duration, stagger, once]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
