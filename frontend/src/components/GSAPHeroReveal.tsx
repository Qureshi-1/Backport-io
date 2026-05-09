"use client";

import { useEffect, useRef } from "react";
import { getGsap, killTriggersFor } from "@/lib/gsap-safe";

interface GSAPHeroRevealProps {
  children: React.ReactNode;
  className?: string;
}

export default function GSAPHeroReveal({ children, className = "" }: GSAPHeroRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return;

    getGsap().then(({ gsap }) => {
      const elements = container.children;

      gsap.set(elements, {
        opacity: 0,
        y: 50,
        rotateX: -15,
        filter: "blur(8px)",
      });

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.to(elements, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        filter: "blur(0px)",
        duration: 1,
        stagger: 0.15,
      });

      Array.from(elements).forEach((el, i) => {
        gsap.to(el, {
          y: -20 * (i + 1) * 0.3,
          opacity: 0.3,
          scrollTrigger: {
            trigger: container,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        });
      });
    }).catch((e) => {
      console.warn("GSAPHeroReveal: failed to init", e);
    });

    return () => {
      killTriggersFor(container);
    };
  }, []);

  return (
    <div ref={containerRef} className={`${className}`} style={{ perspective: "800px" }}>
      {children}
    </div>
  );
}
