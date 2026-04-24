"use client";
import { motion } from "framer-motion";

interface StatusDonutProps {
  data: Record<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  '2xx': '#2CE8C3',
  '3xx': '#6BA9FF',
  '4xx': '#FBBF24',
  '5xx': '#EF4444',
};

export default function StatusDonut({ data }: StatusDonutProps) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-700 text-[10px] font-headline uppercase font-black tracking-widest">
        No data yet
      </div>
    );
  }

  const entries = Object.entries(data).filter(([, v]) => v > 0);
  let cumulativePercentage = 0;
  const segments = entries.map(([label, count]) => {
    const percentage = (count / total) * 100;
    const start = cumulativePercentage;
    cumulativePercentage += percentage;
    return { label, count, percentage, start, color: STATUS_COLORS[label] || '#A2BDDB' };
  });

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 16;

  return (
    <div className="flex items-center gap-8">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 160 160" className="transform -rotate-90">
          {/* Background circle */}
          <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />
          
          {segments.map((seg, i) => {
            const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((seg.start / 100) * circumference);
            
            return (
              <motion.circle
                key={seg.label}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                initial={{ opacity: 0, strokeDasharray: `0 ${circumference}` }}
                animate={{ opacity: 1, strokeDasharray }}
                transition={{ delay: i * 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-center"
          >
            <div className="text-2xl font-black text-white tabular-nums">{total.toLocaleString()}</div>
            <div className="text-[9px] font-headline font-black text-zinc-600 uppercase tracking-widest mt-0.5">Total</div>
          </motion.div>
        </div>
      </div>
      
      <div className="space-y-3">
        {segments.map((seg, i) => (
          <motion.div
            key={seg.label}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 + 0.3, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: seg.color }} />
            <span className="text-xs font-bold text-zinc-400 w-8">{seg.label}</span>
            <span className="text-xs font-mono tabular-nums text-zinc-300">{seg.count.toLocaleString()}</span>
            <span className="text-[9px] text-zinc-600 font-bold">{seg.percentage.toFixed(1)}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
