"use client";

import {
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  CartesianGrid,
} from "recharts";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface TrafficDataPoint {
  time: string;
  requests: number;
  errors: number;
}

interface TrafficChartProps {
  data?: TrafficDataPoint[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-[#0D131A]/95 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 shadow-2xl shadow-black/50"
    >
      <div className="text-[9px] font-headline font-black text-zinc-600 uppercase tracking-widest mb-3">{label}</div>
      {payload.map((entry: { color: string; name: string; value: number }, idx: number) => (
        <div key={idx} className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{entry.name}</span>
          </div>
          <span className="text-sm font-black tabular-nums" style={{ color: entry.color }}>{entry.value}</span>
        </div>
      ))}
    </motion.div>
  );
}

function generateMockData(): TrafficDataPoint[] {
  const now = new Date();
  return Array.from({ length: 15 }).map((_, i) => {
    const time = new Date(now.getTime() - (14 - i) * 60000);
    const reqs = Math.floor(Math.random() * 40) + 15 + (i % 3 === 0 ? 30 : 0);
    const errors = Math.floor(Math.random() * 5);
    return {
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      requests: reqs,
      errors,
    };
  });
}

export default function TrafficChart({ data: externalData }: TrafficChartProps) {
  const initialized = useRef(false);
  const [internalData, setInternalData] = useState<TrafficDataPoint[]>(() => {
    // Initialize with mock data via useState initializer (avoids setState in effect)
    if (typeof window !== 'undefined') {
      return generateMockData();
    }
    return [];
  });

  const chartData = externalData && externalData.length > 0 ? externalData : internalData;

  useEffect(() => {
    if (externalData && externalData.length > 0) return;
    if (initialized.current) return;
    initialized.current = true;

    const interval = setInterval(() => {
      setInternalData(prev => {
        if (prev.length === 0) return prev;
        const newTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newReqs = Math.floor(Math.random() * 40) + 15 + (Math.random() > 0.8 ? 50 : 0);
        const newErrors = Math.floor(Math.random() * 5);
        return [...prev.slice(1), { time: newTime, requests: newReqs, errors: newErrors }];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [externalData]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="h-[320px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.03)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            stroke="#3f3f46"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#52525b', fontFamily: 'ui-monospace', fontSize: 10 }}
          />
          <YAxis
            stroke="#3f3f46"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#52525b', fontFamily: 'ui-monospace', fontSize: 10 }}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />

          <defs>
            <linearGradient id="mintGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2CE8C3" stopOpacity={0.3} />
              <stop offset="50%" stopColor="#2CE8C3" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#2CE8C3" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>

          <Area
            type="monotone"
            dataKey="errors"
            stroke="#EF4444"
            strokeWidth={1.5}
            fill="url(#errorGradient)"
            dot={false}
            activeDot={{
              r: 5,
              fill: "#EF4444",
              stroke: "#080C10",
              strokeWidth: 2,
            }}
            name="Errors"
            animationDuration={800}
          />

          <Area
            type="monotone"
            dataKey="requests"
            stroke="#2CE8C3"
            strokeWidth={2.5}
            fill="url(#mintGradient)"
            dot={false}
            activeDot={{
              r: 6,
              fill: "#2CE8C3",
              stroke: "#080C10",
              strokeWidth: 2,
              style: { filter: 'drop-shadow(0 0 8px rgba(44, 232, 195, 0.5))' },
            }}
            name="Requests"
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
