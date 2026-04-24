"use client";

import { useEffect, useRef } from "react";
import { getGsap, killTriggersFor } from "@/lib/gsap-safe";

interface TextRevealProps {
  children: string;
  className?: string;
  delay?: number;
  splitBy?: "word" | "char";
  stagger?: number;
  once?: boolean;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
}

export default function TextReveal({
  children,
  className = "",
  delay = 0,
  splitBy = "word",
  stagger = 0.04,
  once = true,
  as: Tag = "span",
}: TextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return;

    const words = splitBy === "word" ? children.split(" ") : children.split("");

    container.innerHTML = words
      .map((word, i) =>
        splitBy === "word"
          ? `<span class="inline-block overflow-hidden"><span class="inline-block" style="display:inline-block">${word}</span></span>${i < words.length - 1 ? " " : ""}`
          : `<span class="inline-block overflow-hidden"><span class="inline-block" style="display:inline-block">${word === " " ? "&nbsp;" : word}</span></span>`
      )
      .join("");

    const innerSpans = container.querySelectorAll("span > span");

    getGsap().then(({ gsap }) => {
      gsap.set(innerSpans, { y: "100%" });

      const tween = gsap.to(innerSpans, {
        y: "0%",
        duration: 0.7,
        stagger,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: container,
          start: "top 85%",
          toggleActions: once ? "play none none none" : "play reverse play reverse",
        },
      });

      (container as any)._tween = tween; // eslint-disable-line
    }).catch((e) => console.warn("TextReveal: failed to init", e));

    return () => {
      const tween = (container as any)?._tween; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (tween && typeof tween.kill === "function") tween.kill();
      killTriggersFor(container);
    };
  }, [children, delay, splitBy, stagger, once]);

  return (
    <div ref={containerRef} className={className} style={{ display: Tag === "h1" || Tag === "h2" || Tag === "h3" || Tag === "h4" || Tag === "p" ? "block" : "inline" }}>
      {/* Content injected by GSAP */}
    </div>
  );
}
