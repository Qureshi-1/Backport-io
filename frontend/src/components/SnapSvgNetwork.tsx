"use client";

import { useEffect, useRef } from "react";

interface SnapSvgNetworkProps {
  className?: string;
}

export default function SnapSvgNetwork({ className = "" }: SnapSvgNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
     
    let snap: any = null;
    let rafId: number | null = null;

    async function init() {
      try {
        const SnapModule = await import("snapsvg");
        const SnapConstructor = SnapModule.default || SnapModule;
        if (!svgRef.current) return;
        snap = SnapConstructor(svgRef.current);

        if (!snap) return;

        const w = 600;
        const h = 300;

        // Center server node
        const centerNode = snap.circle(w / 2, h / 2, 28);
        centerNode.attr({
          fill: "rgba(4, 225, 132, 0.15)",
          stroke: "#04e184",
          strokeWidth: 2,
          filter: snap.filter((SnapConstructor as any).filter.shadow(0, 0, 8, "#04e184", 0.5)),
        });

        // Inner shield icon
        const shieldPath = `M ${w / 2} ${h / 2 - 14} L ${w / 2 + 12} ${h / 2 - 8} L ${w / 2 + 12} ${h / 2 + 4} Q ${w / 2 + 12} ${h / 2 + 14} ${w / 2} ${h / 2 + 18} Q ${w / 2 - 12} ${h / 2 + 14} ${w / 2 - 12} ${h / 2 + 4} L ${w / 2 - 12} ${h / 2 - 8} Z`;
        const shield = snap.path(shieldPath);
        shield.attr({ fill: "#04e184", opacity: 0.8 });

        // Check mark
        const check = snap.path(`M ${w / 2 - 5} ${h / 2 + 4} L ${w / 2} ${h / 2 + 9} L ${w / 2 + 8} ${h / 2}`);
        check.attr({ fill: "none", stroke: "#080C10", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" });

        // "Backport" label
        const label = snap.text(w / 2, h / 2 + 38, "BACKPORT");
        label.attr({ fill: "#04e184", fontSize: 9, fontFamily: "monospace", textAnchor: "middle", letterSpacing: "3px" });

        // Orbiting client nodes
        const nodeCount = 6;
         
        const nodes: any[] = [];
        const colors = ["#6BA9FF", "#A2BDDB", "#6BA9FF", "#A2BDDB", "#6BA9FF", "#A2BDDB"];
        const labels = ["Client", "Mobile", "API", "Partner", "Bot", "IoT"];

        for (let i = 0; i < nodeCount; i++) {
          const angle = (i / nodeCount) * Math.PI * 2 - Math.PI / 2;
          const rx = 210;
          const ry = 100;
          const x = w / 2 + rx * Math.cos(angle);
          const y = h / 2 + ry * Math.sin(angle);

          const node = snap.circle(x, y, 12);
          node.attr({
            fill: `${colors[i]}20`,
            stroke: colors[i],
            strokeWidth: 1.5,
          });

          const nodeLabel = snap.text(x, y + 22, labels[i]);
          nodeLabel.attr({ fill: `${colors[i]}80`, fontSize: 8, fontFamily: "monospace", textAnchor: "middle" });

          // Connection line
          const line = snap.line(w / 2, h / 2, x, y);
          line.attr({
            stroke: `${colors[i]}30`,
            strokeWidth: 1,
            strokeDasharray: "4 6",
          });

          // Data packet (animated dot)
          const packet = snap.circle(x, y, 3);
          packet.attr({
            fill: colors[i],
            filter: snap.filter((SnapConstructor as any).filter.shadow(0, 0, 4, colors[i], 0.6)),
          });

          nodes.push({ packet, angle, rx, ry, baseX: x, baseY: y, line });
        }

        // Animated scanning ring
        const scanRing = snap.circle(w / 2, h / 2, 35);
        scanRing.attr({
          fill: "none",
          stroke: "#04e184",
          strokeWidth: 1,
          opacity: 0,
        });

        // Pulse rings from center
        const rings = [1, 2, 3].map(() => {
          const ring = snap.circle(w / 2, h / 2, 28);
          ring.attr({ fill: "none", stroke: "#04e184", strokeWidth: 1, opacity: 0 });
          return ring;
        });

        // Animate with snap
        let frame = 0;
        const animate = () => {
          frame++;

          // Animate data packets
          nodes.forEach((n, i) => {
            const t = ((frame * 0.008 + i * 0.167) % 1);
            const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease in-out
            const px = w / 2 + (n.baseX - w / 2) * eased;
            const py = h / 2 + (n.baseY - h / 2) * eased;
            n.packet.attr({ cx: px, cy: py, opacity: 0.3 + 0.7 * Math.sin(t * Math.PI) });

            // Dash animation
            const dashOffset = frame * 0.5 + i * 20;
            n.line.attr({ strokeDashoffset: dashOffset });
          });

          // Pulse rings
          rings.forEach((ring, i) => {
            const phase = (frame * 0.02 + i * 0.33) % 1;
            const radius = 28 + phase * 60;
            const opacity = Math.max(0, 0.4 * (1 - phase));
            ring.attr({ r: radius, opacity: opacity, strokeWidth: Math.max(0.2, 1 - phase) });
          });

          // Scanning ring
          const scanPhase = (frame * 0.015) % 1;
          const scanRadius = 40 + scanPhase * 180;
          scanRing.attr({
            r: scanRadius,
            opacity: Math.max(0, 0.3 * (1 - scanPhase)),
            strokeWidth: Math.max(0.2, 1.5 - scanPhase * 1.5),
          });

          rafId = requestAnimationFrame(animate);
        };

        animate();
      } catch (e) {
        console.warn("Snap.svg failed to load:", e);
      }
    }

    init();

    return () => {
      // Clean up the animation frame
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 600 300"
      className={`w-full max-w-3xl mx-auto ${className}`}
      aria-hidden="true"
    />
  );
}
