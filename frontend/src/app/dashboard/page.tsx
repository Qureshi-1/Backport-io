"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { fetchApi } from "@/lib/api";
import { useUser } from "@/lib/user-context";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, Circle, X, Download, 
  Clock, BarChart3, ShieldAlert, Zap, ArrowUpRight, Globe, ShieldCheck,
  FileJson, FileSpreadsheet, Radio, TrendingUp, Shield,
  Settings, KeyRound, ArrowRight, LayoutDashboard, Wifi, WifiOff, Timer,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { GATEWAY_URL } from "@/lib/auth";
import TrafficChart from "@/components/TrafficChart";
import AnimatedCounter from "@/components/AnimatedCounter";
import GlowOrb from "@/components/GlowOrb";
import StatusDonut from "@/components/StatusDonut";
import SlowEndpointsPanel from "@/components/SlowEndpointsPanel";
import AlertFeed from "@/components/AlertFeed";
import LatencyHeatmap from "@/components/LatencyHeatmap";

interface SlowEndpoint {
  method: string;
  path: string;
  avg_latency: number;
  max_latency: number;
  count: number;
  severity: string;
}

interface AlertItem {
  id: number;
  type: string;
  message: string;
  severity: string;
  timestamp: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: Record<string, any>;
  is_read: boolean;
}

interface TimelinePoint {
  time: string;
  requests: number;
  errors: number;
}

interface AnalyticsStats {
  total_requests: number;
  threats_blocked: number;
  cache_hits: number;
  avg_latency: number;
  status_distribution: Record<string, number>;
  latency_distribution: Record<string, number>;
  slow_endpoints: SlowEndpoint[];
  alerts: AlertItem[];
  timeline: TimelinePoint[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function DashboardOverview() {
  const { user: contextUser } = useUser();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChecklist, setShowChecklist] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>("");
  const [wsConnected, setWsConnected] = useState(false);
  const [requestsLastMinute, setRequestsLastMinute] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      const [logsData, statsData] = await Promise.all([
        fetchApi("/api/user/logs").catch(() => []),
        fetchApi("/api/user/analytics/stats").catch(() => null),
      ]);
      // Use context user data (no extra fetch!)
      setUser(contextUser || null);
      setLogs((logsData || []) as LogEntry[]);
      if (statsData) {
        setStats(statsData);
      }
      setLastRefresh(new Date().toLocaleTimeString());
      setLoading(false);
    } catch {
      setUser(contextUser || null);
      setLoading(false);
    }
  }, [contextUser]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    let wsToken: string | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_DELAY = 30000;

    const connect = () => {
      if (!wsToken) return;
      try {
        const wsProtocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${wsProtocol}//${GATEWAY_URL.replace(/^https?:\/\//, "")}/ws/dashboard?token=${wsToken}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        const onOpen = () => {
          setWsConnected(true);
          reconnectAttempts = 0;
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          fetchAllData();
        };

        const onMessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "stats_update" && data.payload) {
              setStats((prev) => ({ ...prev, ...data.payload }));
              setLastRefresh(new Date().toLocaleTimeString());
            }
            if (data.type === "requests_last_minute") {
              setRequestsLastMinute(data.value ?? 0);
            }
            if (data.type === "new_log" && data.payload) {
              setLogs((prev) => [data.payload, ...prev].slice(0, 50));
            }
          } catch {
            // ignore parse errors
          }
        };

        const onClose = () => {
          setWsConnected(false);
          wsRef.current = null;
          if (!pollingRef.current) {
            pollingRef.current = setInterval(fetchAllData, 5000);
          }
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
          reconnectAttempts++;
          reconnectTimeout = setTimeout(connect, delay);
        };

        ws.addEventListener("open", onOpen);
        ws.addEventListener("message", onMessage);
        ws.addEventListener("close", onClose);
        ws.addEventListener("error", onClose);
      } catch {
        if (!pollingRef.current) {
          pollingRef.current = setInterval(fetchAllData, 5000);
        }
      }
    };

    fetchApi("/api/auth/ws-token")
      .then((data) => {
        wsToken = data.ws_token;
        pollingRef.current = setInterval(fetchAllData, 5000);
        connect();
      })
      .catch(() => {
        if (!pollingRef.current) {
          pollingRef.current = setInterval(fetchAllData, 5000);
        }
      });

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [fetchAllData]);

  if (loading) return (
    <div className="min-h-screen bg-[#080C10] p-6 pt-28 max-w-7xl mx-auto">
      {/* Header skeleton */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-40 h-6 bg-white/[0.04] rounded-lg animate-pulse" />
        <div className="w-24 h-5 bg-white/[0.03] rounded-full animate-pulse" />
      </div>
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 animate-pulse">
            <div className="w-8 h-8 bg-white/[0.04] rounded-lg mb-4" />
            <div className="w-16 h-3 bg-white/[0.04] rounded mb-2" />
            <div className="w-28 h-7 bg-white/[0.06] rounded-lg" />
          </div>
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 h-64 animate-pulse" />
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 h-64 animate-pulse" />
      </div>
      {/* Table skeleton */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 animate-pulse">
        <div className="w-32 h-4 bg-white/[0.04] rounded mb-6" />
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex gap-4 mb-3">
            <div className="w-20 h-3 bg-white/[0.03] rounded" />
            <div className="flex-1 h-3 bg-white/[0.03] rounded" />
            <div className="w-16 h-3 bg-white/[0.03] rounded" />
            <div className="w-12 h-3 bg-white/[0.03] rounded" />
          </div>
        ))}
      </div>
      {/* Loading indicator */}
      <div className="flex items-center justify-center mt-8 gap-3">
        <div className="w-5 h-5 border-2 border-[#04e184]/20 border-t-[#04e184] rounded-full animate-spin" />
        <span className="text-xs text-[#A2BDDB]/40">Loading dashboard data...</span>
      </div>
    </div>
  );

  const hasConfiguredBackend = !!user?.target_backend_url;
  const userEmail = typeof user?.email === 'string' ? user.email : '';
  const userName = (typeof user?.name === 'string' ? user.name : '') || userEmail.split("@")[0] || "Developer";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userAnalytics = (user as any)?.analytics || {};
  const totalRequests = stats?.total_requests || userAnalytics.total_requests || 0;
  const threatsBlocked = stats?.threats_blocked || userAnalytics.threats_blocked || 0;
  const cacheHits = stats?.cache_hits || userAnalytics.cache_hits || 0;
  const avgLatency = stats?.avg_latency || userAnalytics.avg_latency || 0;
  const cacheHitRate = totalRequests > 0 ? Math.round((cacheHits / Math.max(totalRequests, 1)) * 100) : 0;

  const handleExportJSON = async () => {
    try {
      const res = await fetchApi("/api/user/export/json");
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "backport-analytics.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("JSON export downloaded");
    } catch {
      toast.error("Export failed");
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetchApi("/api/user/export/csv");
      const blob = new Blob([res], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "backport-logs.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV export downloaded");
    } catch {
      toast.error("Export failed");
    }
  };

  const hasData = totalRequests > 0;

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 relative overflow-hidden">
      {/* Glow orbs background */}
      <GlowOrb color="#04e184" size={500} x="20%" y="10%" delay={0} opacity={0.04} />
      <GlowOrb color="#6BA9FF" size={400} x="80%" y="30%" delay={2} opacity={0.03} />

      {/* ═══ Plan Expiry Warning Banner ═══ */}
      {(() => {
        const plan = contextUser?.plan;
        const planExpiresAt = contextUser?.plan_expires_at;
        if (!plan || plan === "free" || !planExpiresAt) return null;
        const expiryDate = new Date(planExpiresAt);
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        if (expiryDate > threeDaysFromNow) return null;
        const formattedDate = expiryDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        const isExpired = expiryDate <= now;
        return (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 border ${
              isExpired
                ? "bg-red-500/10 border-red-500/30"
                : "bg-amber-500/10 border-amber-500/30"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isExpired ? "bg-red-500/15" : "bg-amber-500/15"
            }`}>
              <AlertTriangle className={`w-5 h-5 ${isExpired ? "text-red-400" : "text-amber-400"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${isExpired ? "text-red-400" : "text-amber-400"}`}>
                {isExpired
                  ? `Your ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan expired on ${formattedDate}.`
                  : `Your ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan expires on ${formattedDate}.`
                }
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isExpired
                  ? "Renew now to restore your features."
                  : "Renew now to keep your features."
                }
              </p>
            </div>
            <Link
              href="/dashboard/billing"
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors min-h-[44px] ${
                isExpired
                  ? "bg-red-500 hover:bg-red-400 text-white"
                  : "bg-amber-500 hover:bg-amber-400 text-black"
              }`}
            >
              Renew Plan
            </Link>
          </motion.div>
        );
      })()}

      <motion.div variants={container} initial="hidden" animate="show">
        {/* ═══ Welcome Header ═══ */}
        <motion.div variants={item} className="relative glass-card rounded-2xl p-4 sm:p-6 lg:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-radial-mint opacity-10 -z-10" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <LayoutDashboard className="w-5 h-5 text-[#04e184] flex-shrink-0" />
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>
                  Welcome back, <span className="text-[#04e184]">{userName}</span>
                </h1>
                {user?.plan === "pro" && (
                  <span className="px-2.5 py-0.5 rounded-md bg-[#04e184]/10 text-[#04e184] text-[10px] font-bold uppercase tracking-wider border border-[#04e184]/20 flex-shrink-0">
                    Pro
                  </span>
                )}
              </div>
              <p className="text-[#A2BDDB]/40 text-sm">
                {hasData ? "Here's your API gateway overview." : "Get started by configuring your backend URL."}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap flex-shrink-0">
              {/* WebSocket / Connection indicator */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border min-h-[44px] ${
                  wsConnected
                    ? "bg-[#04e184]/5 border-[#04e184]/15"
                    : "bg-yellow-500/5 border-yellow-500/15"
                }`}
              >
                {wsConnected ? (
                  <Wifi className="w-3 h-3 text-[#04e184]" />
                ) : (
                  <WifiOff className="w-3 h-3 text-yellow-400" />
                )}
                <span className={`text-[10px] font-bold uppercase tracking-wider ${wsConnected ? "text-[#04e184]" : "text-yellow-400"}`}>
                  {wsConnected ? "Live" : "Polling"}
                </span>
              </motion.div>

              {/* Requests in last minute - hide on very small screens */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#6BA9FF]/5 border border-[#6BA9FF]/15 min-h-[44px]">
                <Timer className="w-3 h-3 text-[#6BA9FF]" />
                <span className="text-[10px] font-bold text-[#6BA9FF] uppercase tracking-wider tabular-nums">
                  {requestsLastMinute} req/min
                </span>
              </div>

              {hasConfiguredBackend ? (
                <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#04e184]/5 border border-[#04e184]/15 min-h-[44px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#04e184] animate-pulse" />
                  <span className="text-[10px] font-bold text-[#04e184] uppercase tracking-wider">Online</span>
                </div>
              ) : (
                <Link href="/dashboard/settings" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#04e184] text-black text-xs font-bold hover:bg-white transition-colors min-h-[44px]">
                  <Settings className="w-3.5 h-3.5" />
                  Configure
                </Link>
              )}
              {lastRefresh && (
                <span className="hidden sm:inline text-[10px] text-[#A2BDDB]/20 font-mono tabular-nums">
                  {lastRefresh}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══ Getting Started Checklist ═══ */}
        <AnimatePresence>
          {showChecklist && !hasConfiguredBackend && (
            <motion.div 
              variants={item}
              exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
              className="glass-card rounded-2xl p-4 sm:p-6 lg:p-8 relative overflow-hidden"
            >
              <button 
                onClick={() => setShowChecklist(false)}
                className="absolute top-4 right-4 text-[#A2BDDB]/20 hover:text-white transition-colors w-10 h-10 flex items-center justify-center min-h-[44px] min-w-[44px]"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="h-5 w-5 text-[#04e184]" />
                <h2 className="text-sm font-bold text-white tracking-wider uppercase">Getting Started</h2>
              </div>
              <p className="text-sm text-[#A2BDDB]/50 mb-6 sm:mb-8">
                Complete these steps to start protecting your API.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <StepCard
                  label="Account Created"
                  status="DONE"
                  desc="You're all set"
                  active={true}
                />
                <StepCard
                  label="Configure Backend"
                  status={hasConfiguredBackend ? "DONE" : "NOT SET"}
                  desc="Set your API's URL in Settings"
                  active={hasConfiguredBackend}
                  href="/dashboard/settings"
                />
                <StepCard
                  label="Generate API Key"
                  status="PENDING"
                  desc="Create your first key"
                  active={false}
                  href="/dashboard/api-keys"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ Quick Stats Cards ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total Requests", value: totalRequests, icon: BarChart3, color: "#6BA9FF", decimals: 0 },
            { label: "Avg Latency", value: avgLatency, icon: Clock, color: "#A2BDDB", decimals: 1, suffix: "ms" },
            { label: "Cache Hit Rate", value: cacheHitRate, icon: Zap, color: "#04e184", decimals: 0, suffix: "%" },
            { label: "Threats Blocked", value: threatsBlocked, icon: ShieldAlert, color: "#EF4444", decimals: 0 },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              variants={item}
              whileHover={{ y: -2 }}
              className="glass-card glass-card-hover rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 group cursor-default relative"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/[0.04] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#A2BDDB]/15 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight mb-0.5" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>
                <AnimatedCounter
                  value={stat.value}
                  duration={2 + idx * 0.15}
                  color={stat.color}
                  decimals={stat.decimals}
                  suffix={stat.suffix}
                />
              </div>
              <div className="text-[9px] sm:text-[10px] font-semibold text-[#A2BDDB]/30 uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ═══ Empty State ═══ */}
        {!hasData && (
          <motion.div variants={item} className="glass-card rounded-2xl p-8 sm:p-12 lg:p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#04e184]/[0.06] border border-[#04e184]/15 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-[#04e184]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>
              No traffic yet
            </h2>
            <p className="text-[#A2BDDB]/40 text-sm max-w-md mx-auto mb-8">
              Start sending requests through your Backport proxy endpoint. Analytics will appear here in real time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard/api-keys"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#04e184] text-black px-6 py-3 rounded-xl text-sm font-semibold hover:bg-white transition-colors min-h-[44px]"
              >
                <KeyRound className="w-4 h-4" />
                Get API Key
              </Link>
              <Link
                href="/docs"
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-[#A2BDDB]/50 hover:text-white px-6 py-3 rounded-xl text-sm border border-white/[0.06] hover:border-white/[0.12] transition-colors min-h-[44px]"
              >
                Read Docs
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        )}

        {/* ═══ Main Analytics Grid ═══ */}
        {hasData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Left Column */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-6">
              {/* Traffic Chart */}
              <motion.div variants={item} className="glass-card rounded-2xl p-4 sm:p-6 lg:p-8 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 sm:mb-8">
                  <div>
                    <h3 className="text-white text-base sm:text-lg font-bold" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>
                      API Traffic
                    </h3>
                    <p className="text-[#A2BDDB]/30 text-[10px] uppercase tracking-wider mt-1">Requests over the last 15 minutes</p>
                  </div>
                  <div className="flex gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border min-h-[36px] ${
                      wsConnected
                        ? "bg-[#04e184]/5 border-[#04e184]/15"
                        : "bg-yellow-500/5 border-yellow-500/15"
                    }`}>
                      <Radio className={`w-3 h-3 ${wsConnected ? "text-[#04e184] animate-pulse" : "text-yellow-400"}`} />
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${wsConnected ? "text-[#04e184]" : "text-yellow-400"}`}>
                        {wsConnected ? "Live" : "5s Poll"}
                      </span>
                    </div>
                  </div>
                </div>
                <TrafficChart data={stats?.timeline} />
              </motion.div>

              {/* Status Distribution + Latency Heatmap */}
              <motion.div variants={item} className="glass-card rounded-2xl p-4 sm:p-6 lg:p-8">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-white text-base sm:text-lg font-bold" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>
                    Response Analysis
                  </h3>
                  <p className="text-[#A2BDDB]/30 text-[10px] uppercase tracking-wider mt-1">Status codes &amp; latency distribution</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  <StatusDonut data={stats?.status_distribution || {}} />
                  <div>
                    <h4 className="text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider mb-5">Latency Distribution</h4>
                    <LatencyHeatmap data={stats?.latency_distribution || {}} />
                  </div>
                </div>
              </motion.div>

              {/* Slow Endpoints */}
              <motion.div variants={item} className="glass-card rounded-2xl p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div>
                    <h3 className="text-white text-base sm:text-lg font-bold" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>
                      Slow Endpoints
                    </h3>
                    <p className="text-[#A2BDDB]/30 text-[10px] uppercase tracking-wider mt-1">Latency anomaly detection</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-[#A2BDDB]/15" />
                </div>
                <div className="max-h-[350px] overflow-y-auto no-scrollbar">
                  <SlowEndpointsPanel endpoints={stats?.slow_endpoints || []} />
                </div>
              </motion.div>

              {/* Log Terminal */}
              <motion.div variants={item} className="glass-card rounded-2xl overflow-hidden">
                <div className="p-4 sm:p-6 lg:p-8 border-b border-white/[0.04]">
                  <h2 className="text-white text-base sm:text-lg font-bold" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>
                    Recent Requests
                  </h2>
                  <p className="text-[#A2BDDB]/30 text-[10px] uppercase tracking-wider mt-1">Your latest API requests</p>
                </div>
                <div className="overflow-x-auto p-2 sm:p-4">
                  <LogTable logs={logs} />
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-6">
              {/* Backend URL */}
              <motion.div
                variants={item}
                whileHover={{ borderColor: "rgba(107, 169, 255, 0.2)" }}
                className="glass-card glass-card-hover rounded-2xl p-4 sm:p-6 lg:p-8 group overflow-hidden"
              >
                <div className="w-10 h-10 rounded-xl bg-[#6BA9FF]/[0.08] border border-[#6BA9FF]/15 flex items-center justify-center mb-4 sm:mb-5">
                  <Globe className="w-5 h-5 text-[#6BA9FF]" />
                </div>
                <h3 className="text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider mb-2">Backend URL</h3>
                <p className="font-mono text-[#A2BDDB]/60 break-all text-xs leading-relaxed mb-4 sm:mb-5">
                  {String(user?.target_backend_url || "Not configured")}
                </p>
                {!user?.target_backend_url && (
                  <Link href="/dashboard/settings" className="block bg-[#6BA9FF] p-3 rounded-xl text-[#080C10] text-[10px] font-bold uppercase tracking-wider text-center hover:bg-white transition-colors min-h-[44px]">
                    Configure
                  </Link>
                )}
              </motion.div>

              {/* Alert Feed */}
              <motion.div variants={item} className="glass-card rounded-2xl overflow-hidden">
                <div className="p-4 sm:p-6 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider">Security Alerts</h3>
                      <p className="text-[#A2BDDB]/20 text-[10px] uppercase tracking-wider mt-1">Threat detection</p>
                    </div>
                    <Shield className="w-4 h-4 text-[#A2BDDB]/15" />
                  </div>
                </div>
                <div className="px-4 pb-4 max-h-[350px] overflow-y-auto no-scrollbar">
                  <AlertFeed alerts={stats?.alerts || []} />
                </div>
              </motion.div>

              {/* Protection Status */}
              <motion.div
                variants={item}
                whileHover={{ scale: 1.005 }}
                className="bg-[#04e184] p-4 sm:p-6 lg:p-8 rounded-2xl space-y-4 text-[#080C10] relative overflow-hidden cursor-default"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear", repeatDelay: 5 }}
                />
                <div className="relative">
                  <ShieldCheck className="w-8 h-8 mb-3" />
                  <h4 className="text-base font-bold uppercase tracking-tight mb-1.5" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>
                    API Protection Active
                  </h4>
                  <p className="text-xs font-medium opacity-70 leading-relaxed">
                    WAF, rate limiting, and caching are protecting your API.
                  </p>
                  <div className="w-full h-px bg-black/10 mt-4" />
                  <div className="flex items-center gap-2 mt-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em]">All systems operational</span>
                  </div>
                </div>
              </motion.div>

              {/* Export Panel */}
              <motion.div variants={item} className="glass-card rounded-2xl p-4 sm:p-6">
                <h3 className="text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider mb-4">Export Data</h3>
                <div className="space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleExportJSON}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all group min-h-[44px]"
                  >
                    <FileJson className="w-4 h-4 text-[#6BA9FF] flex-shrink-0" />
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-xs font-medium text-white">JSON Format</div>
                      <div className="text-[10px] text-[#A2BDDB]/25">Structured analytics</div>
                    </div>
                    <Download className="w-3.5 h-3.5 text-[#A2BDDB]/15 group-hover:text-[#A2BDDB]/40 transition-colors flex-shrink-0" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all group min-h-[44px]"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#04e184] flex-shrink-0" />
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-xs font-medium text-white">CSV Format</div>
                      <div className="text-[10px] text-[#A2BDDB]/25">Spreadsheet compatible</div>
                    </div>
                    <Download className="w-3.5 h-3.5 text-[#A2BDDB]/15 group-hover:text-[#A2BDDB]/40 transition-colors flex-shrink-0" />
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StepCard({ label, status, desc, active, href }: { label: string; status: string; desc: string; active: boolean; href?: string }) {
  const content = (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className={`p-4 sm:p-5 rounded-xl border transition-all duration-300 group cursor-default ${
        active 
          ? 'bg-[#04e184]/[0.04] border-[#04e184]/15' 
          : 'bg-white/[0.01] border-white/[0.04] hover:border-white/[0.08]'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        {active ? <CheckCircle2 className="h-5 w-5 text-[#04e184]" /> : <Circle className="h-5 w-5 text-[#A2BDDB]/15" />}
        <h3 className={`text-xs font-bold tracking-wider uppercase ${active ? 'text-white' : 'text-[#A2BDDB]/30'}`}>{label}</h3>
      </div>
      <p className={`text-[11px] mb-2 ml-8 ${active ? 'text-[#A2BDDB]/50' : 'text-[#A2BDDB]/20'}`}>{desc}</p>
      <div className={`ml-8 text-[9px] font-bold uppercase tracking-wider ${active ? 'text-[#04e184]' : 'text-[#A2BDDB]/15'}`}>{status}</div>
    </motion.div>
  );

  if (href && !active) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
}

interface LogEntry {
  id: string | number;
  method: string;
  path: string;
  status: number;
  time: string;
  date: string;
}

function LogTable({ logs }: { logs: LogEntry[] }) {
  const router = useRouter();

  if (logs.length === 0) {
    return (
      <div className="text-center py-16 text-[#A2BDDB]/15 text-xs uppercase font-semibold tracking-wider">
        No requests yet
      </div>
    );
  }

  return (
    <>
      {/* Desktop: table view */}
      <div className="hidden sm:block table-scroll-mobile">
        <table className="w-full text-left">
          <thead className="text-[9px] uppercase tracking-wider text-[#A2BDDB]/20">
            <tr>
              <th className="px-5 py-4">Method</th>
              <th className="px-5 py-4">Path</th>
              <th className="px-5 py-4 text-center">Status</th>
              <th className="px-5 py-4">Latency</th>
              <th className="px-5 py-4 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {logs.map((log) => (
              <tr
                key={log.id}
                onClick={() => router.push(`/dashboard/inspector?log_id=${log.id}`)}
                className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
              >
                <td className="px-5 py-4">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider ${
                    log.method === 'GET' ? 'bg-[#6BA9FF]/[0.08] text-[#6BA9FF]' :
                    log.method === 'POST' ? 'bg-[#04e184]/[0.08] text-[#04e184]' :
                    'bg-white/[0.04] text-[#A2BDDB]/40'
                  }`}>
                    {log.method}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono text-xs text-[#A2BDDB]/50 group-hover:text-[#A2BDDB]/70 max-w-[200px] truncate">{log.path}</td>
                <td className="px-5 py-4 text-center">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    log.status >= 400 ? 'text-red-400 bg-red-400/[0.08]' : 'text-[#04e184] bg-[#04e184]/[0.08]'
                  }`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-[#A2BDDB]/25 font-mono">{log.time}</td>
                <td className="px-5 py-4 text-right text-[10px] text-[#A2BDDB]/20 font-medium">{log.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile: card view */}
      <div className="sm:hidden divide-y divide-white/[0.03]">
        {logs.map((log) => (
          <div
            key={log.id}
            onClick={() => router.push(`/dashboard/inspector?log_id=${log.id}`)}
            className="p-3 space-y-2 hover:bg-white/[0.02] transition-colors cursor-pointer min-h-[44px]"
          >
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider flex-shrink-0 ${
                log.method === 'GET' ? 'bg-[#6BA9FF]/[0.08] text-[#6BA9FF]' :
                log.method === 'POST' ? 'bg-[#04e184]/[0.08] text-[#04e184]' :
                'bg-white/[0.04] text-[#A2BDDB]/40'
              }`}>
                {log.method}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                log.status >= 400 ? 'text-red-400 bg-red-400/[0.08]' : 'text-[#04e184] bg-[#04e184]/[0.08]'
              }`}>
                {log.status}
              </span>
              <span className="text-[10px] text-[#A2BDDB]/20 font-mono ml-auto flex-shrink-0">{log.time}</span>
            </div>
            <div className="font-mono text-xs text-[#A2BDDB]/50 truncate">{log.path}</div>
            <div className="text-[10px] text-[#A2BDDB]/15 font-medium">{log.date}</div>
          </div>
        ))}
      </div>
    </>
  );
}
