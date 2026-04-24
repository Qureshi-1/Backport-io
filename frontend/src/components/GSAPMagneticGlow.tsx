"use client";

import { useEffect, useRef } from "react";
import { getGsap, killTriggersFor } from "@/lib/gsap-safe";

// GSAP-powered magnetic cursor follower
export default function GSAPMagneticGlow({ className = "" }: { className?: string }) {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow || typeof window === "undefined") return;

    let gsap: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

    getGsap().then((mod) => {
      gsap = mod.gsap;

      const handleMouseMove = (e: MouseEvent) => {
        gsap.to(glow, {
          x: e.clientX - 200,
          y: e.clientY - 200,
          duration: 0.8,
          ease: "power2.out",
        });
      };

      const handleMouseEnter = () => {
        gsap.to(glow, { opacity: 0.15, scale: 1, duration: 0.5 });
      };

      const handleMouseLeave = () => {
        gsap.to(glow, { opacity: 0, scale: 0.5, duration: 0.5 });
      };

      window.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseenter", handleMouseEnter);
      document.addEventListener("mouseleave", handleMouseLeave);

      // Store cleanup references
      (glow as any)._handlers = { handleMouseMove, handleMouseEnter, handleMouseLeave };
    }).catch((e) => {
      console.warn("GSAPMagneticGlow: failed to init", e);
    });

    return () => {
      const handlers = (glow as any)?._handlers;
      if (handlers) {
        window.removeEventListener("mousemove", handlers.handleMouseMove);
        document.removeEventListener("mouseenter", handlers.handleMouseEnter);
        document.removeEventListener("mouseleave", handlers.handleMouseLeave);
      }
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className={`fixed top-0 left-0 pointer-events-none z-50 ${className}`}
      style={{ opacity: 0 }}
      aria-hidden="true"
    >
      <div className="w-[400px] h-[400px] rounded-full" style={{
        background: "radial-gradient(circle, rgba(4,225,132,0.15) 0%, rgba(107,169,255,0.08) 40%, transparent 70%)",
        filter: "blur(40px)",
      }} />
    </div>
  );
}

// GSAP horizontal scroll section
export function GSAPHorizontalScroll({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || typeof window === "undefined") return;

    getGsap().then(({ gsap }) => {
      const getScrollAmount = () => -(track.scrollWidth - section.offsetWidth);

      gsap.to(track, {
        x: getScrollAmount,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top 20%",
          end: () => `+=${Math.abs(getScrollAmount())}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }).catch((e) => {
      console.warn("GSAPHorizontalScroll: failed to init", e);
    });

    return () => {
      if (section) killTriggersFor(section);
    };
  }, []);

  return (
    <div ref={sectionRef} className={`overflow-hidden ${className}`}>
      <div ref={trackRef} className="flex gap-8" style={{ width: "max-content" }}>
        {children}
      </div>
    </div>
  );
}

// GSAP scroll progress indicator for section
export function GSAPScrollProgress({ className = "" }: { className?: string }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar || typeof window === "undefined") return;

    getGsap().then(({ gsap }) => {
      gsap.to(bar, {
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
      console.warn("GSAPScrollProgress: failed to init", e);
    });

    return () => {
      if (bar) killTriggersFor(bar);
    };
  }, []);

  return (
    <div ref={barRef} className={`origin-left scale-x-0 ${className}`} aria-hidden="true" />
  );
}
