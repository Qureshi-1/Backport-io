"use client";

import { useEffect, useRef } from "react";
import { getGsap, killTriggersFor } from "@/lib/gsap-safe";

interface DataFlowDiagramProps {
  className?: string;
}

export default function DataFlowDiagram({ className = "" }: DataFlowDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof window === "undefined") return;

    getGsap().then(({ gsap }) => {
      const nodes = svg.querySelectorAll(".flow-node");
      nodes.forEach((node, i) => {
        gsap.fromTo(
          node,
          { attr: { r: 6 } },
          {
            attr: { r: 10 },
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: i * 0.3,
            scrollTrigger: {
              trigger: svg,
              start: "top 80%",
              toggleActions: "play pause resume pause",
            },
          }
        );
      });
    }).catch((e) => {
      console.warn("DataFlowDiagram: failed to init", e);
    });

    return () => {
      if (svg) killTriggersFor(svg);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 600 80"
      fill="none"
      className={`w-full max-w-xl mx-auto ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#04e184" />
          <stop offset="50%" stopColor="#6BA9FF" />
          <stop offset="100%" stopColor="#04e184" />
        </linearGradient>
        <filter id="glow-sm">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Client Node */}
      <circle className="flow-node" cx="50" cy="40" r="6" fill="#A2BDDB" filter="url(#glow-sm)" />
      <text x="50" y="65" textAnchor="middle" fill="#A2BDDB" fontSize="10" fontFamily="monospace">Client</text>

      {/* Path: Client → WAF */}
      <path d="M 60 40 Q 100 20, 140 40" stroke="#A2BDDB" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
      <circle className="data-packet" r="3" fill="#04e184" filter="url(#glow-sm)">
        <animateMotion dur="2s" repeatCount="indefinite" begin="0s">
          <mpath href="#path-1" />
        </animateMotion>
      </circle>
      <path id="path-1" d="M 60 40 Q 100 20, 140 40" fill="none" stroke="none" />

      {/* WAF Node */}
      <circle className="flow-node" cx="150" cy="40" r="6" fill="#EF4444" filter="url(#glow-sm)" />
      <text x="150" y="65" textAnchor="middle" fill="#EF4444" fontSize="10" fontFamily="monospace">WAF</text>

      {/* Path: WAF → Rate Limiter */}
      <path d="M 160 40 Q 200 60, 240 40" stroke="#A2BDDB" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
      <circle className="data-packet" r="3" fill="#FBBF24" filter="url(#glow-sm)">
        <animateMotion dur="2s" repeatCount="indefinite" begin="0.5s">
          <mpath href="#path-2" />
        </animateMotion>
      </circle>
      <path id="path-2" d="M 160 40 Q 200 60, 240 40" fill="none" stroke="none" />

      {/* Rate Limiter Node */}
      <circle className="flow-node" cx="250" cy="40" r="6" fill="#FBBF24" filter="url(#glow-sm)" />
      <text x="250" y="65" textAnchor="middle" fill="#FBBF24" fontSize="10" fontFamily="monospace">Rate</text>

      {/* Path: Rate → Cache */}
      <path d="M 260 40 Q 300 20, 340 40" stroke="#A2BDDB" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
      <circle className="data-packet" r="3" fill="#6BA9FF" filter="url(#glow-sm)">
        <animateMotion dur="2s" repeatCount="indefinite" begin="1s">
          <mpath href="#path-3" />
        </animateMotion>
      </circle>
      <path id="path-3" d="M 260 40 Q 300 20, 340 40" fill="none" stroke="none" />

      {/* Cache Node */}
      <circle className="flow-node" cx="350" cy="40" r="6" fill="#6BA9FF" filter="url(#glow-sm)" />
      <text x="350" y="65" textAnchor="middle" fill="#6BA9FF" fontSize="10" fontFamily="monospace">Cache</text>

      {/* Path: Cache → Backend */}
      <path d="M 360 40 Q 420 60, 480 40" stroke="#A2BDDB" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
      <circle className="data-packet" r="3" fill="#04e184" filter="url(#glow-sm)">
        <animateMotion dur="2s" repeatCount="indefinite" begin="1.5s">
          <mpath href="#path-4" />
        </animateMotion>
      </circle>
      <path id="path-4" d="M 360 40 Q 420 60, 480 40" fill="none" stroke="none" />

      {/* Backend Node */}
      <circle className="flow-node" cx="490" cy="40" r="6" fill="#04e184" filter="url(#glow-sm)" />
      <text x="490" y="65" textAnchor="middle" fill="#04e184" fontSize="10" fontFamily="monospace">Backend</text>

      {/* Response path (below) */}
      <path d="M 485 48 Q 420 72, 355 48" stroke="#04e184" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />
      <path d="M 345 48 Q 280 72, 255 48" stroke="#04e184" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />
      <path d="M 245 48 Q 200 72, 155 48" stroke="#04e184" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />
      <path d="M 145 48 Q 100 72, 55 48" stroke="#04e184" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />
    </svg>
  );
}
