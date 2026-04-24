"use client";

import { useEffect, useRef } from "react";
import { getGsap, killTriggersFor } from "@/lib/gsap-safe";

interface GSAPSectionRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "left" | "right" | "scale" | "clip";
  delay?: number;
  stagger?: boolean;
}

export default function GSAPSectionReveal({
  children,
  className = "",
  direction = "up",
  delay = 0,
  stagger = false,
}: GSAPSectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    getGsap().then(({ gsap }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const from: any = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const to: any = {
        opacity: 1,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
          once: true,
        },
      };

      switch (direction) {
        case "up":
          from.opacity = 0;
          from.y = 60;
          to.y = 0;
          break;
        case "left":
          from.opacity = 0;
          from.x = -80;
          to.x = 0;
          break;
        case "right":
          from.opacity = 0;
          from.x = 80;
          to.x = 0;
          break;
        case "scale":
          from.opacity = 0;
          from.scale = 0.85;
          to.scale = 1;
          break;
        case "clip":
          from.clipPath = "inset(100% 0% 0% 0%)";
          to.clipPath = "inset(0% 0% 0% 0%)";
          to.duration = 1;
          to.ease = "power4.inOut";
          break;
      }

      const targets = stagger ? el.children : el;

      gsap.set(targets, from);
      gsap.to(targets, { ...to, delay, stagger: stagger ? 0.12 : 0 });
    }).catch((e) => {
      console.warn("GSAPSectionReveal: failed to init", e);
    });

    return () => {
      killTriggersFor(el);
    };
  }, [direction, delay, stagger]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
