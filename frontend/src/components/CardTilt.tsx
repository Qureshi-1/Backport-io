"use client";

import { useRef, useState, useCallback } from "react";
import React from "react";

interface CardTiltProps {
  children: React.ReactNode;
  className?: string;
  tiltStrength?: number;
  glare?: boolean;
}

export default function CardTilt({
  children,
  className = "",
  tiltStrength = 10,
  glare = true,
}: CardTiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg)");
  const [glareBg, setGlareBg] = useState("radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0%, transparent 60%)");
  const [borderColor, setBorderColor] = useState("rgba(255, 255, 255, 0.06)");

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const tiltX = (0.5 - y) * tiltStrength;
      const tiltY = (x - 0.5) * tiltStrength;
      setTransform(`perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`);
      setGlareBg(
        `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.15) 0%, transparent 60%)`
      );
      setBorderColor("rgba(4, 225, 132, 0.2)");
    },
    [tiltStrength]
  );

  const handleMouseLeave = useCallback(() => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg)");
    setGlareBg("radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0%, transparent 60%)");
    setBorderColor("rgba(255, 255, 255, 0.06)");
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
      style={{
        transform,
        transformStyle: "preserve-3d",
        transition: "transform 0.15s ease-out",
      }}
    >
      {children}
      {glare && (
        <div
          className="absolute inset-0 pointer-events-none z-10 rounded-[inherit]"
          style={{
            background: glareBg,
            transition: "background 0.15s ease-out",
          }}
        />
      )}
      <div
        className="absolute inset-0 pointer-events-none z-10 rounded-[inherit]"
        style={{
          border: `1px solid ${borderColor}`,
          transition: "border-color 0.3s ease",
        }}
      />
    </div>
  );
}
