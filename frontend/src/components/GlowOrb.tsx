"use client";
import { motion } from "framer-motion";

interface GlowOrbProps {
  color?: string;
  size?: number;
  x?: string;
  y?: string;
  delay?: number;
  opacity?: number;
}

export default function GlowOrb({ color = "#2CE8C3", size = 400, x = "50%", y = "50%", delay = 0, opacity = 0.15 }: GlowOrbProps) {
  return (
    <motion.div
      className="absolute pointer-events-none rounded-full blur-[120px]"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background: color,
        opacity: 0,
        transform: "translate(-50%, -50%)",
      }}
      animate={{
        opacity: [0, opacity, opacity * 0.5, opacity],
        scale: [0.8, 1, 1.1, 0.9],
        x: [0, 30, -20, 10, 0],
        y: [0, -20, 30, -10, 0],
      }}
      transition={{
        duration: 15,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
