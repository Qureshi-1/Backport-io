"use client";
import { motion } from "framer-motion";

interface LatencyHeatmapProps {
  data: Record<string, number>;
  maxValue?: number;
}

const BUCKET_COLORS: Record<string, string> = {
  '0-50ms': '#2CE8C3',
  '50-100ms': '#4ADE80',
  '100-250ms': '#6BA9FF',
  '250-500ms': '#FBBF24',
  '500ms-1s': '#F97316',
  '1s-3s': '#EF4444',
  '3s+': '#DC2626',
};

export default function LatencyHeatmap({ data, maxValue }: LatencyHeatmapProps) {
  const maxVal = maxValue || Math.max(...Object.values(data), 1);
  
  return (
    <div className="space-y-3">
      {Object.entries(data).map(([label, value], index) => {
        const percentage = (value / maxVal) * 100;
        const color = BUCKET_COLORS[label] || '#6BA9FF';
        return (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.5 }}
            className="flex items-center gap-4 group"
          >
            <span className="text-[10px] font-mono font-bold text-zinc-500 w-20 text-right uppercase tracking-wider group-hover:text-zinc-300 transition-colors">
              {label}
            </span>
            <div className="flex-1 h-6 bg-white/[0.03] rounded-lg overflow-hidden relative">
              <motion.div
                className="h-full rounded-lg relative overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(percentage, 2)}%` }}
                transition={{ delay: index * 0.08 + 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: `linear-gradient(90deg, ${color}20, ${color}60, ${color})`,
                }}
              >
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)`,
                    backgroundSize: '200% 100%',
                  }}
                  animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.08 + 0.5 }}
              className="text-xs font-mono font-bold w-12 text-right tabular-nums"
              style={{ color }}
            >
              {value}
            </motion.span>
          </motion.div>
        );
      })}
    </div>
  );
}
