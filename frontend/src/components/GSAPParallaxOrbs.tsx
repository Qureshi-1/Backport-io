"use client";

import { useEffect, useRef } from "react";
import { getGsap, killTriggersFor } from "@/lib/gsap-safe";

interface GSAPParallaxOrbsProps {
  className?: string;
}

export default function GSAPParallaxOrbs({ className = "" }: GSAPParallaxOrbsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return;

    getGsap().then(({ gsap }) => {
      const orbs = container.querySelectorAll(".parallax-orb");

      orbs.forEach((orb) => {
        const speed = parseFloat((orb as HTMLElement).dataset.speed || "0.3");

        gsap.to(orb, {
          y: () => speed * -100,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      });
    }).catch((e) => {
      console.warn("GSAPParallaxOrbs: failed to init", e);
    });

    return () => {
      killTriggersFor(container);
    };
  }, []);

  return (
    <div ref={containerRef} className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <div
        className="parallax-orb absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
        style={{ background: "radial-gradient(circle, #04e184, transparent 70%)", top: "-20%", left: "10%" }}
        data-speed="0.4"
      />
      <div
        className="parallax-orb absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-15"
        style={{ background: "radial-gradient(circle, #6BA9FF, transparent 70%)", top: "-5%", right: "5%" }}
        data-speed="0.25"
      />
      <div
        className="parallax-orb absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-10"
        style={{ background: "radial-gradient(circle, #A2BDDB, transparent 70%)", bottom: "10%", left: "30%" }}
        data-speed="0.5"
      />
      <div
        className="parallax-orb absolute w-[300px] h-[300px] rounded-full blur-[60px] opacity-10"
        style={{ background: "radial-gradient(circle, #04e184, transparent 70%)", top: "40%", right: "20%" }}
        data-speed="0.35"
      />
    </div>
  );
}
