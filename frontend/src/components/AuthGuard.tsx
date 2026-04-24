"use client";
import { useRouter } from "next/navigation";
import { useUser, LOADING_MESSAGES } from "@/lib/user-context";
import { motion } from "framer-motion";
import { RefreshCw, WifiOff, Zap, Server, Activity } from "lucide-react";
import { useState, useEffect } from "react";

// ─── Dashboard Skeleton ─────────────────────────────────────────────────
// Shows the full dashboard shell (sidebar-like + stat cards + chart)
// while the backend is cold starting. User sees a "real" page loading.
function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
      {/* Title row */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-zinc-800 rounded-lg" />
        <div className="h-4 w-72 bg-zinc-800/50 rounded" />
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Activity className="h-5 w-5" />, color: "text-[#04e184]", bg: "bg-[#04e184]/10" },
          { icon: <Zap className="h-5 w-5" />, color: "text-[#6BA9FF]", bg: "bg-[#6BA9FF]/10" },
          { icon: <Server className="h-5 w-5" />, color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10" },
          { icon: <Activity className="h-5 w-5" />, color: "text-[#EC4899]", bg: "bg-[#EC4899]/10" },
        ].map((s, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>
                {s.icon}
              </div>
              <div className="h-4 w-24 bg-zinc-800 rounded" />
            </div>
            <div className="h-8 w-20 bg-zinc-800 rounded" />
            <div className="h-3 w-32 bg-zinc-800/40 rounded mt-2" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 w-32 bg-zinc-800 rounded" />
          <div className="h-6 w-24 bg-zinc-800 rounded" />
        </div>
        <div className="h-[280px] w-full bg-zinc-800/30 rounded-lg" />
      </div>

      {/* Table area */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800">
          <div className="h-6 w-40 bg-zinc-800 rounded" />
        </div>
        <div className="divide-y divide-zinc-800/50">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-5 py-3.5 flex items-center gap-4">
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
              <div className="h-4 w-20 bg-zinc-800 rounded" />
              <div className="h-4 w-32 bg-zinc-800/60 rounded flex-1" />
              <div className="h-4 w-16 bg-zinc-800/40 rounded" />
              <div className="h-4 w-12 bg-zinc-800/40 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, error, retry, warming, coldStart, waitSeconds } = useUser();
  const [tick, setTick] = useState(0);
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Not authenticated → redirect to login (via useEffect to avoid calling router.push during render)
  const needsRedirect = !loading && !redirected && (error === "not_authenticated" || error === "fetch_failed");
  useEffect(() => {
    if (needsRedirect) {
      setRedirected(true);
      router.push("/auth/login");
    }
  }, [needsRedirect, router]);

  // Not authenticated → render nothing while redirect happens
  if (!loading && (error === "not_authenticated" || error === "fetch_failed")) {
    return null;
  }

  // Loading state → ALWAYS show dashboard skeleton (no matter if cold start or not)
  // User always sees a realistic dashboard loading, never a blank page or spinner
  if (loading) {
    return (
      <div className="space-y-4">
        {/* Subtle top status bar — only appears after a brief moment or during cold starts */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: coldStart ? 0 : 0.8 }}
          className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl w-fit"
        >
          <div className="relative">
            <div className={`w-2 h-2 rounded-full ${coldStart ? 'bg-[#F59E0B]' : 'bg-[#04e184]'}`} />
            {!coldStart && (
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#04e184] animate-ping" />
            )}
            {coldStart && (
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
            )}
          </div>
          <span className="text-[#A2BDDB]/60 text-xs font-medium">
            {!coldStart && "Loading your dashboard..."}
            {coldStart && waitSeconds < 10 && "Warming up server..."}
            {coldStart && waitSeconds >= 10 && waitSeconds < 25 && "Server is starting up..."}
            {coldStart && waitSeconds >= 25 && waitSeconds < 40 && "Almost ready..."}
            {coldStart && waitSeconds >= 40 && "This is taking longer than usual"}
          </span>
          {coldStart && (
            <span className="text-[#A2BDDB]/30 text-xs tabular-nums">{waitSeconds}s</span>
          )}
        </motion.div>

        {/* Full dashboard skeleton — always visible during loading */}
        <DashboardSkeleton />
      </div>
    );
  }

  // Error state with retry button
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <WifiOff className="h-6 w-6 text-red-400" />
          </div>
          <div className="text-center">
            <p className="text-white text-sm font-medium mb-1">Connection failed</p>
            <p className="text-[#A2BDDB]/40 text-xs">Server might be waking up. Try again?</p>
          </div>
          <button
            onClick={retry}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#04e184] text-black text-sm font-semibold hover:bg-white transition-colors min-h-[44px]"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Authenticated — show children
  if (user) {
    return <>{children}</>;
  }

  return null;
}
