"use client";

import { useEffect, useRef, useCallback } from "react";

interface AnimeRippleButtonProps {
  children: React.ReactNode;
  className?: string;
  rippleColor?: string;
  onClick?: () => void;
}

export default function AnimeRippleButton({
  children,
  className = "",
  rippleColor = "rgba(4, 225, 132, 0.35)",
  onClick,
}: AnimeRippleButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = buttonRef.current;
      if (!button) return;

      // Dynamic import to avoid SSR issues
      const anime = (await import("animejs")).default;

      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement("span");
      ripple.style.cssText = `
        position: absolute;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: ${rippleColor};
        transform: translate(-50%, -50%);
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        z-index: 10;
      `;
      button.appendChild(ripple);

      anime({
        targets: ripple,
        width: Math.max(rect.width, rect.height) * 2.5,
        height: Math.max(rect.width, rect.height) * 2.5,
        opacity: [1, 0],
        duration: 600,
        easing: "easeOutQuad",
        complete: () => ripple.remove(),
      });

      onClick?.();
    },
    [rippleColor, onClick]
  );

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
    </button>
  );
}

// Anime.js stagger reveal for list items
export function AnimeStaggerReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    const container = containerRef.current;
    if (!container) return;

    const items = container.children;

    // Dynamic import to avoid SSR issues
    import("animejs").then(({ default: anime }) => {
      if (!mounted) return;
      animRef.current = anime({
        targets: items,
        opacity: [0, 1],
        translateY: [30, 0],
        scale: [0.95, 1],
        delay: anime.stagger(80, { start: delay }),
        duration: 800,
        easing: "easeOutExpo",
      });
    });

    return () => {
      mounted = false;
      if (animRef.current) {
        animRef.current.pause();
      }
    };
  }, [delay]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// Anime.js typing effect
export function AnimeTyping({
  texts,
  className = "",
}: {
  texts: string[];
  className?: string;
}) {
  const textRef = useRef<HTMLSpanElement>(null);
   
  const cleanupRef = useRef<any[]>([]);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    let mounted = true;
    let currentIndex = 0;

    function animateText() {
      if (!mounted) return;

      const text = texts[currentIndex];

      import("animejs").then(({ default: anime }) => {
        if (!mounted || !el) return;

        const typeAnim = anime({
          targets: el,
          innerHTML: [0, text.length],
          round: 1,
          easing: "steps(1)",
          duration: text.length * 60,
          update: function (anim: any) {
            if (!el) return;
            const progress = Math.floor(Number(anim.animations[0].currentValue));
            el.textContent = text.substring(0, progress);
          },
          complete: () => {
            if (!mounted) return;
            const timeout = setTimeout(() => {
              if (!mounted || !el) return;

              const deleteAnim = anime({
                targets: el,
                innerHTML: [text.length, 0],
                round: 1,
                easing: "steps(1)",
                duration: 500,
                update: function (anim2: any) {
                  if (!el) return;
                  const progress = Math.floor(Number(anim2.animations[0].currentValue));
                  el.textContent = text.substring(0, progress);
                },
                complete: () => {
                  if (!mounted) return;
                  currentIndex = (currentIndex + 1) % texts.length;
                  animateText();
                },
              });

              cleanupRef.current.push(deleteAnim);
            }, 2000);

            cleanupRef.current.push(timeout);
          },
        });

        cleanupRef.current.push(typeAnim);
      });
    }

    animateText();

    return () => {
      mounted = false;
      // Clean up all anime instances and timeouts
      cleanupRef.current.forEach((item) => {
        if (item && typeof item.pause === "function") item.pause();
        else if (typeof item === "number") clearTimeout(item);
      });
      cleanupRef.current = [];
    };
  }, [texts]);

  return (
    <span ref={textRef} className={className} />
  );
}
