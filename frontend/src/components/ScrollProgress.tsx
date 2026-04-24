"use client";

import { useEffect, useRef } from "react";
import { getGsap } from "@/lib/gsap-safe";

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar || typeof window === "undefined") return;

    let tween: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

    getGsap().then(({ gsap }) => {
      tween = gsap.to(bar, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
        },
      });
    }).catch((e) => {
      console.warn("ScrollProgress: GSAP failed to load", e);
    });

    return () => {
      if (tween && typeof tween.kill === "function") tween.kill();
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[2px]">
      <div
        ref={barRef}
        className="h-full origin-left scale-x-0"
        style={{
          background: "linear-gradient(90deg, #04e184, #6BA9FF, #04e184)",
          backgroundSize: "200% 100%",
          animation: "shimmer 2s linear infinite",
        }}
      />
    </div>
  );
}
