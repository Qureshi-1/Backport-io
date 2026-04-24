"use client";

import { useEffect, useRef } from "react";

interface AnimatedShieldProps {
  size?: number;
  className?: string;
}

export default function AnimatedShield({ size = 80, className = "" }: AnimatedShieldProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const allAnimations: Animation[] = [];

    // Animate the outer ring pulse — collect all animation instances properly
    const rings = svg.querySelectorAll(".shield-ring");
    rings.forEach((ring, i) => {
      const anim = ring.animate(
        [
          { opacity: 0, transform: `scale(0.8)`, strokeWidth: "2" },
          { opacity: 0.6, transform: `scale(1.1)`, strokeWidth: "0.5" },
          { opacity: 0, transform: `scale(1.4)`, strokeWidth: "0.2" },
        ],
        {
          duration: 3000,
          delay: i * 1000,
          iterations: Infinity,
          easing: "ease-out",
        }
      );
      allAnimations.push(anim);
    });

    // Animate the shield body
    const body = svg.querySelector(".shield-body");
    if (body) {
      const bodyAnim = body.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.05)" }, { transform: "scale(1)" }],
        {
          duration: 2000,
          iterations: Infinity,
          easing: "ease-in-out",
        }
      );
      allAnimations.push(bodyAnim);
    }

    return () => {
      // Cancel ALL animations on unmount
      allAnimations.forEach((anim) => anim.cancel());
    };
  }, []);

  const half = size / 2;
  const shieldPath = `M ${half} ${size * 0.12} L ${size * 0.88} ${size * 0.25} L ${size * 0.88} ${size * 0.52} Q ${size * 0.88} ${size * 0.85} ${half} ${size * 0.92} Q ${size * 0.12} ${size * 0.85} ${size * 0.12} ${size * 0.52} L ${size * 0.12} ${size * 0.25} Z`;

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {/* Pulse rings */}
      <path
        className="shield-ring"
        d={shieldPath}
        stroke="#04e184"
        strokeWidth="1"
        fill="none"
        style={{ transformOrigin: "center" }}
      />
      <path
        className="shield-ring"
        d={shieldPath}
        stroke="#04e184"
        strokeWidth="1"
        fill="none"
        style={{ transformOrigin: "center" }}
      />
      <path
        className="shield-ring"
        d={shieldPath}
        stroke="#04e184"
        strokeWidth="1"
        fill="none"
        style={{ transformOrigin: "center" }}
      />

      {/* Glow filter */}
      <defs>
        <filter id="shield-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="shield-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#04e184" />
          <stop offset="100%" stopColor="#6BA9FF" />
        </linearGradient>
      </defs>

      {/* Shield body */}
      <g className="shield-body" style={{ transformOrigin: "center" }}>
        <path
          d={shieldPath}
          fill="url(#shield-gradient)"
          opacity="0.15"
          stroke="url(#shield-gradient)"
          strokeWidth="1.5"
          filter="url(#shield-glow)"
        />
      </g>

      {/* Inner shield icon */}
      <g filter="url(#shield-glow)">
        <path
          d={`M ${half} ${size * 0.32} L ${size * 0.7} ${size * 0.4} L ${size * 0.7} ${size * 0.58} Q ${size * 0.7} ${size * 0.75} ${half} ${size * 0.78} Q ${size * 0.3} ${size * 0.75} ${size * 0.3} ${size * 0.58} L ${size * 0.3} ${size * 0.4} Z`}
          fill="#04e184"
          opacity="0.9"
        />
        {/* Checkmark */}
        <path
          d={`M ${size * 0.4} ${size * 0.57} L ${size * 0.47} ${size * 0.65} L ${size * 0.62} ${size * 0.47}`}
          stroke="#080C10"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}
