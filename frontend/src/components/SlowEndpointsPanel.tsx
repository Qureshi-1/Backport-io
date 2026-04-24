"use client";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface SlowEndpoint {
  method: string;
  path: string;
  avg_latency: number;
  max_latency: number;
  count: number;
  severity: string;
}

interface SlowEndpointsPanelProps {
  endpoints: SlowEndpoint[];
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  critical: { color: '#EF4444', bg: 'bg-red-500/5', border: 'border-red-500/20', glow: 'shadow-red-500/10' },
  high: { color: '#F97316', bg: 'bg-orange-500/5', border: 'border-orange-500/20', glow: 'shadow-orange-500/10' },
  warning: { color: '#FBBF24', bg: 'bg-yellow-500/5', border: 'border-yellow-500/20', glow: 'shadow-yellow-500/10' },
  normal: { color: '#2CE8C3', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10' },
};

export default function SlowEndpointsPanel({ endpoints }: SlowEndpointsPanelProps) {
  if (endpoints.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-600 text-xs font-headline uppercase font-black tracking-widest">
        All endpoints performing within thresholds
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {endpoints.map((ep, index) => {
        const severity = SEVERITY_CONFIG[ep.severity] || SEVERITY_CONFIG.normal;
        const latencyPercent = Math.min((ep.avg_latency / 5000) * 100, 100);
        return (
          <motion.div
            key={`${ep.method}-${ep.path}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className={`relative p-4 rounded-2xl border ${severity.border} ${severity.bg} group hover:shadow-lg ${severity.glow} transition-all duration-300 cursor-pointer overflow-hidden`}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase ${
                  ep.method === 'GET' ? 'bg-[#6BA9FF]/10 text-[#6BA9FF]' :
                  ep.method === 'POST' ? 'bg-[#2CE8C3]/10 text-[#2CE8C3]' :
                  ep.method === 'PUT' ? 'bg-[#FBBF24]/10 text-[#FBBF24]' :
                  ep.method === 'DELETE' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                  'bg-zinc-800 text-zinc-400'
                }`}>
                  {ep.method}
                </span>
                <span className="font-mono text-xs text-[#A2BDDB] truncate max-w-[200px]">{ep.path}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-black tabular-nums" style={{ color: severity.color }}>
                    {ep.avg_latency}ms
                  </div>
                  <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">
                    avg of {ep.count} reqs
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            {/* Latency bar */}
            <motion.div 
              className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden"
              initial={{ opacity: 0.5 }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${latencyPercent}%` }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ background: severity.color }}
              />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
