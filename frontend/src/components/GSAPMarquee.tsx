"use client";

import { useEffect, useRef } from "react";
import { getGsap } from "@/lib/gsap-safe";

interface GSAPMarqueeProps {
  items: string[];
  speed?: number;
  className?: string;
  reverse?: boolean;
}

export default function GSAPMarquee({
  items,
  speed = 30,
  className = "",
  reverse = false,
}: GSAPMarqueeProps) {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof window === "undefined") return;

    getGsap().then(({ gsap }) => {
      const totalWidth = track.scrollWidth / 2;

      const tween = gsap.to(track, {
        x: reverse ? totalWidth / 2 : -totalWidth / 2,
        duration: speed,
        ease: "none",
        repeat: -1,
        modifiers: {
          x: gsap.utils.unitize((x: number) => {
            return parseFloat(String(x)) % totalWidth;
          }),
        },
      });

      // Store tween for cleanup
      (track as any)._marqueeTween = tween;  
    }).catch((e) => {
      console.warn("GSAPMarquee: failed to init", e);
    });

    return () => {
      const tween = (track as any)?._marqueeTween;  
      if (tween && typeof tween.kill === "function") tween.kill();
    };
  }, [items, speed, reverse]);

  const duplicatedItems = [...items, ...items, ...items, ...items];

  return (
    <div ref={marqueeRef} className={`overflow-hidden ${className}`}>
      <div ref={trackRef} className="flex items-center gap-12 whitespace-nowrap w-max">
        {duplicatedItems.map((item, i) => (
          <span
            key={i}
            className="text-sm sm:text-base font-semibold text-[#A2BDDB]/20 tracking-tight hover:text-[#A2BDDB]/50 transition-colors duration-300 cursor-default"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
