"use client";
import { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  color?: string;
  decimals?: number;
}

export default function AnimatedCounter({ 
  value, duration = 2, suffix = "", prefix = "", className = "", color = "#fff", decimals = 0 
}: AnimatedCounterProps) {
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (current) => {
    const val = current.toFixed(decimals);
    const formatted = decimals === 0 
      ? Number(val).toLocaleString() 
      : Number(val).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return (
    <motion.span className={className} style={{ color }}>
      {display}
    </motion.span>
  );
}
