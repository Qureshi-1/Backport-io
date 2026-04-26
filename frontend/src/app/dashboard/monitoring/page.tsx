"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { fetchApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  Wifi,
  WifiOff,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  CartesianGrid,
} from "recharts";
import AnimatedCounter from "@/components/AnimatedCounter";
import GlowOrb from "@/components/GlowOrb";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface HealthStatus {
  is_up: boolean;
  status_code: number;
  response_time_ms: number;
  last_checked: string;
  uptime_percent: number;
  total_checks: number;
  successful_checks: number;
  failed_checks: number;
}

interface HealthHistoryEntry {
  timestamp: string;
  is_up: boolean;
  status_code: number;
  response_time_ms: number;
}

 
function ResponseTimeTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#0D131A]/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl"
    >
      <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#2CE8C3]" />
        <span className="text-xs text-zinc-400">Response Time</span>
        <span className="text-sm font-bold text-[#2CE8C3] ml-auto tabular-nums">
          {payload[0]?.value}ms
        </span>
      </div>
    </motion.div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function MonitoringPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [history, setHistory] = useState<HealthHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [healthData, historyData] = await Promise.all([
        fetchApi("/api/user/health").catch(() => null),
        fetchApi("/api/user/health/history").catch(() => ({ checks: [] })),
      ]);
      if (healthData) setHealth(healthData);
      const historyArr = Array.isArray(historyData) ? historyData : (historyData as any)?.checks || [];
      // Map backend field names to frontend interface
      const mapped = historyArr.map((c: any) => ({
        timestamp: c.checked_at || c.timestamp || "",
        is_up: c.status === "up" || c.is_up || false,
        status_code: c.status_code || 0,
        response_time_ms: c.response_time_ms || 0,
      }));
      setHistory(mapped as HealthHistoryEntry[]);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch {
      // fallback to mock data for demo
      setHealth({
        is_up: true,
        status_code: 200,
        response_time_ms: 142,
        last_checked: new Date().toISOString(),
        uptime_percent: 99.97,
        total_checks: 1440,
        successful_checks: 1439,
        failed_checks: 1,
      });
      setHistory(generateMockHistory());
      setLastRefresh(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(() => fetchData(), 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const chartData = history.map((entry) => ({
    time: new Date(entry.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    responseTime: entry.response_time_ms,
    isUp: entry.is_up,
  }));

  const recentEvents = history
    .filter((h) => !h.is_up)
    .slice(0, 10)
    .reverse();

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-[3px] border-[#2CE8C3]/20 border-t-[#2CE8C3] rounded-full animate-spin" />
        <div className="text-xs font-semibold uppercase tracking-widest text-[#A2BDDB]/40">
          Loading monitoring data...
        </div>
      </div>
    );
  }

  const isUp = health?.is_up ?? true;
  const uptime = health?.uptime_percent ?? 99.97;
  const responseTime = health?.response_time_ms ?? 142;
  const statusCode = health?.status_code ?? 200;

  return (
    <div className="space-y-6 pb-12 relative overflow-hidden">
      <GlowOrb color="#2CE8C3" size={500} x="15%" y="5%" delay={0} opacity={0.04} />
      <GlowOrb color="#EF4444" size={300} x="85%" y="20%" delay={3} opacity={0.02} />

      <motion.div variants={container} initial="hidden" animate="show">
        {/* ═══ Header ═══ */}
        <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2CE8C3]/[0.08] border border-[#2CE8C3]/15 flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#2CE8C3]" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold text-white tracking-tight"
                style={{
                  fontFamily:
                    'var(--font-space-grotesk), "Space Grotesk", sans-serif',
                }}
              >
                Health Monitoring
              </h1>
              <p className="text-[#A2BDDB]/40 text-sm">
                Real-time backend health and uptime tracking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-[10px] text-[#A2BDDB]/20 font-mono tabular-nums">
                Updated {lastRefresh}
              </span>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchData(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#A2BDDB]/60 text-xs font-semibold hover:text-white hover:border-white/[0.15] transition-colors min-h-[44px]"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </motion.button>
          </div>
        </motion.div>

        {/* ═══ Status Hero ═══ */}
        <motion.div
          variants={item}
          className="glass-card rounded-2xl p-8 sm:p-10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-radial-mint opacity-10 -z-10" />
          <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-10">
            {/* Big status indicator */}
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={
                  isUp
                    ? { scale: [1, 1.05, 1], boxShadow: ["0 0 20px rgba(44,232,195,0.3)", "0 0 40px rgba(44,232,195,0.6)", "0 0 20px rgba(44,232,195,0.3)"] }
                    : { scale: [1, 1.05, 1] }
                }
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-20 h-20 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center ${
                  isUp
                    ? "bg-[#2CE8C3]/[0.08] border-2 border-[#2CE8C3]/30"
                    : "bg-red-500/[0.08] border-2 border-red-500/30"
                }`}
              >
                <AnimatePresence mode="wait">
                  {isUp ? (
                    <motion.div
                      key="up"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                    >
                      <CheckCircle2 className="w-10 h-10 sm:w-14 sm:h-14 text-[#2CE8C3]" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="down"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                    >
                      <XCircle className="w-10 h-10 sm:w-14 sm:h-14 text-red-400" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={`w-2 h-2 rounded-full ${isUp ? "bg-[#2CE8C3]" : "bg-red-400"}`}
                />
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${isUp ? "text-[#2CE8C3]" : "text-red-400"}`}
                >
                  {isUp ? "System Operational" : "System Down"}
                </span>
              </div>
            </div>

            {/* Uptime & Stats */}
            <div className="flex-1 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center sm:text-left">
                  <div className="text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider mb-2">
                    Uptime (30d)
                  </div>
                  <div
                    className="text-4xl sm:text-5xl font-bold tracking-tight"
                    style={{
                      fontFamily:
                        'var(--font-space-grotesk), "Space Grotesk", sans-serif',
                    }}
                  >
                    <AnimatedCounter
                      value={uptime}
                      duration={2.5}
                      color={uptime >= 99.9 ? "#2CE8C3" : uptime >= 99 ? "#6BA9FF" : "#EF4444"}
                      decimals={2}
                      suffix="%"
                    />
                  </div>
                  <div className="text-[10px] text-[#A2BDDB]/20 mt-1">
                    {health?.successful_checks ?? 1439} / {health?.total_checks ?? 1440} checks
                  </div>
                </div>

                <div className="text-center sm:text-left">
                  <div className="text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider mb-2">
                    Response Time
                  </div>
                  <div
                    className="text-4xl sm:text-5xl font-bold tracking-tight"
                    style={{
                      fontFamily:
                        'var(--font-space-grotesk), "Space Grotesk", sans-serif',
                    }}
                  >
                    <AnimatedCounter
                      value={responseTime}
                      duration={2}
                      color="#6BA9FF"
                      decimals={0}
                      suffix="ms"
                    />
                  </div>
                  <div className="text-[10px] text-[#A2BDDB]/20 mt-1">
                    Status code: {statusCode}
                  </div>
                </div>

                <div className="text-center sm:text-left">
                  <div className="text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider mb-2">
                    Last Check
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {isUp ? (
                      <Wifi className="w-4 h-4 text-[#2CE8C3]" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-sm text-white font-medium">
                      {health?.last_checked
                        ? new Date(health.last_checked).toLocaleTimeString()
                        : new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#A2BDDB]/20 mt-2">
                    Auto-refreshes every 30s
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ Response Time Chart ═══ */}
        <motion.div
          variants={item}
          className="glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3
                className="text-white text-lg font-bold"
                style={{
                  fontFamily:
                    'var(--font-space-grotesk), "Space Grotesk", sans-serif',
                }}
              >
                Response Time
              </h3>
              <p className="text-[#A2BDDB]/30 text-[10px] uppercase tracking-wider mt-1">
                Last 24 hours
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#6BA9FF]/5 border border-[#6BA9FF]/15">
              <TrendingUp className="w-3 h-3 text-[#6BA9FF]" />
              <span className="text-[9px] font-bold text-[#6BA9FF] uppercase tracking-wider">
                Avg: {chartData.length > 0 ? Math.round(chartData.reduce((s, c) => s + c.responseTime, 0) / chartData.length) : 0}ms
              </span>
            </div>
          </div>
          <div className="h-[250px] sm:h-[300px] w-full">
            {chartData.length > 0 ? (
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
                    tick={{ fill: "#52525b", fontFamily: "ui-monospace", fontSize: 10 }}
                  />
                  <YAxis
                    stroke="#3f3f46"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#52525b", fontFamily: "ui-monospace", fontSize: 10 }}
                    tickFormatter={(v) => `${v}ms`}
                  />
                  <Tooltip content={<ResponseTimeTooltip />} cursor={false} />
                  <defs>
                    <linearGradient id="responseTimeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6BA9FF" stopOpacity={0.3} />
                      <stop offset="50%" stopColor="#6BA9FF" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#6BA9FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="responseTime"
                    stroke="#6BA9FF"
                    strokeWidth={2}
                    fill="url(#responseTimeGrad)"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "#6BA9FF",
                      stroke: "#080C10",
                      strokeWidth: 2,
                    }}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#A2BDDB]/20 text-sm">
                No response time data available
              </div>
            )}
          </div>
        </motion.div>

        {/* ═══ Bottom Grid ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Uptime Timeline */}
          <motion.div variants={item} className="glass-card rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className="text-white text-lg font-bold"
                  style={{
                    fontFamily:
                      'var(--font-space-grotesk), "Space Grotesk", sans-serif',
                  }}
                >
                  Status Timeline
                </h3>
                <p className="text-[#A2BDDB]/30 text-[10px] uppercase tracking-wider mt-1">
                  Up/down events
                </p>
              </div>
              <Clock className="w-4 h-4 text-[#A2BDDB]/15" />
            </div>

            {/* Uptime bar */}
            <div className="flex gap-[2px] mb-6 h-8 rounded-lg overflow-hidden">
              {history.length > 0
                ? history.slice(-144).map((entry, i) => (
                    <motion.div
                      key={i}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: i * 0.005 }}
                      className={`flex-1 ${entry.is_up ? "bg-[#2CE8C3]/70" : "bg-red-400/70"}`}
                      title={`${new Date(entry.timestamp).toLocaleTimeString()} - ${entry.is_up ? "UP" : "DOWN"} (${entry.response_time_ms}ms)`}
                    />
                  ))
                : Array.from({ length: 144 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-[#2CE8C3]/50"
                    />
                  ))}
            </div>

            <div className="flex items-center gap-4 text-[10px] text-[#A2BDDB]/25 uppercase tracking-wider mb-6">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#2CE8C3]/70" />
                Operational
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-red-400/70" />
                Down
              </div>
            </div>

            {/* Incident list */}
            <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-2">
              {recentEvents.length > 0 ? (
                recentEvents.map((event, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-red-500/[0.03] border border-red-500/[0.08]"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-red-300">
                        Service Down
                      </div>
                      <div className="text-[10px] text-[#A2BDDB]/25 font-mono">
                        Status {event.status_code} &middot; {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#A2BDDB]/15 font-mono tabular-nums">
                      {event.response_time_ms}ms
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#A2BDDB]/15 text-xs uppercase font-semibold tracking-wider">
                  No incidents recorded
                </div>
              )}
            </div>
          </motion.div>

          {/* Check Stats */}
          <motion.div variants={item} className="glass-card rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className="text-white text-lg font-bold"
                  style={{
                    fontFamily:
                      'var(--font-space-grotesk), "Space Grotesk", sans-serif',
                  }}
                >
                  Check Summary
                </h3>
                <p className="text-[#A2BDDB]/30 text-[10px] uppercase tracking-wider mt-1">
                  Health check statistics
                </p>
              </div>
              <Activity className="w-4 h-4 text-[#A2BDDB]/15" />
            </div>

            <div className="space-y-5">
              <StatRow
                label="Total Checks"
                value={(health?.total_checks ?? 1440).toLocaleString()}
                icon={<Activity className="w-4 h-4 text-[#A2BDDB]/40" />}
              />
              <StatRow
                label="Successful"
                value={(health?.successful_checks ?? 1439).toLocaleString()}
                color="#2CE8C3"
                icon={<CheckCircle2 className="w-4 h-4 text-[#2CE8C3]" />}
              />
              <StatRow
                label="Failed"
                value={(health?.failed_checks ?? 1).toString()}
                color="#EF4444"
                icon={<XCircle className="w-4 h-4 text-red-400" />}
              />

              <div className="pt-4 border-t border-white/[0.04]">
                <div className="text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider mb-3">
                  Uptime Progress
                </div>
                <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uptime}%` }}
                    transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-[#2CE8C3] to-[#6BA9FF]"
                    style={{ boxShadow: "0 0 12px rgba(44, 232, 195, 0.3)" }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-[#A2BDDB]/15 font-mono">
                    0%
                  </span>
                  <span className="text-[10px] text-[#A2BDDB]/15 font-mono">
                    100%
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.04]">
                <div className="text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider mb-3">
                  Response Time Distribution
                </div>
                <ResponseTimeBars history={history} />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function StatRow({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm text-[#A2BDDB]/50">{label}</span>
      </div>
      <span
        className="text-sm font-bold tabular-nums"
        style={{ color: color || "#fff" }}
      >
        {value}
      </span>
    </div>
  );
}

function ResponseTimeBars({ history }: { history: HealthHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="space-y-2">
        {[
          { label: "< 100ms", pct: 60, color: "#2CE8C3" },
          { label: "100-300ms", pct: 30, color: "#6BA9FF" },
          { label: "300-500ms", pct: 8, color: "#F59E0B" },
          { label: "> 500ms", pct: 2, color: "#EF4444" },
        ].map((b) => (
          <div key={b.label} className="flex items-center gap-3">
            <span className="text-[10px] text-[#A2BDDB]/20 w-16 text-right font-mono">
              {b.label}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${b.pct}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: b.color }}
              />
            </div>
            <span className="text-[10px] text-[#A2BDDB]/15 w-8 font-mono tabular-nums">
              {b.pct}%
            </span>
          </div>
        ))}
      </div>
    );
  }

  const buckets = [0, 0, 0, 0];
  history.forEach((h) => {
    if (h.response_time_ms < 100) buckets[0]++;
    else if (h.response_time_ms < 300) buckets[1]++;
    else if (h.response_time_ms < 500) buckets[2]++;
    else buckets[3]++;
  });
  const total = history.length;

  return (
    <div className="space-y-2">
      {[
        { label: "< 100ms", count: buckets[0], color: "#2CE8C3" },
        { label: "100-300ms", count: buckets[1], color: "#6BA9FF" },
        { label: "300-500ms", count: buckets[2], color: "#F59E0B" },
        { label: "> 500ms", count: buckets[3], color: "#EF4444" },
      ].map((b) => {
        const pct = Math.round((b.count / total) * 100);
        return (
          <div key={b.label} className="flex items-center gap-3">
            <span className="text-[10px] text-[#A2BDDB]/20 w-16 text-right font-mono">
              {b.label}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: b.color }}
              />
            </div>
            <span className="text-[10px] text-[#A2BDDB]/15 w-8 font-mono tabular-nums">
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function generateMockHistory(): HealthHistoryEntry[] {
  const now = Date.now();
  return Array.from({ length: 144 }).map((_, i) => ({
    timestamp: new Date(now - (143 - i) * 600000).toISOString(),
    is_up: i !== 72 && i !== 73,
    status_code: i === 72 || i === 73 ? 503 : 200,
    response_time_ms: i === 72 || i === 73 ? 5000 : Math.floor(Math.random() * 200) + 50,
  }));
}
