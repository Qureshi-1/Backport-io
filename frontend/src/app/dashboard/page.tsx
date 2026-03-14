"use client";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { CheckCircle2, Circle, X, Download, Server, Key, Activity, Clock, BarChart3, ShieldAlert, Zap } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import TrafficChart from "@/components/TrafficChart";

const MOCK_LOGS = [
  { id: 1, method: "GET", path: "/api/products", status: 200, time: "23ms", action: "Passed", badge: "bg-zinc-800 text-zinc-300", date: "Just now" },
  { id: 2, method: "POST", path: "/api/login", status: 429, time: "2ms", action: "Rate Limited", badge: "bg-rose-500/10 text-rose-500 border border-rose-500/20", date: "1m ago" },
  { id: 3, method: "GET", path: "/wp-login.php", status: 403, time: "1ms", action: "WAF Block", badge: "bg-rose-500/10 text-rose-500 border border-rose-500/20", date: "5m ago" },
  { id: 4, method: "GET", path: "/api/users", status: 200, time: "0ms", action: "Cached", badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", date: "12m ago" },
  { id: 5, method: "POST", path: "/api/checkout", status: 200, time: "28ms", action: "Idempotency Hit", badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20", date: "15m ago" },
  { id: 6, method: "PUT", path: "/api/profile", status: 200, time: "45ms", action: "Passed", badge: "bg-zinc-800 text-zinc-300", date: "1h ago" },
];

export default function DashboardOverview() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChecklist, setShowChecklist] = useState(true);

  useEffect(() => {
    fetchApi("/api/user/me")
      .then((res) => {
        setUser(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  const hasConfiguredBackend = !!user?.target_backend_url;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
          Dashboard
        </h1>
        {user?.plan === "pro" && (
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg">
            PRO
          </span>
        )}
      </div>

      {showChecklist && (
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-500/20 rounded-2xl p-6 relative shadow-[0_0_15px_rgba(16,185,129,0.05)]">
          <button 
            onClick={() => setShowChecklist(false)}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            🚀 Getting Started Checklist
          </h2>
          <p className="text-sm text-zinc-400 mb-6 max-w-2xl">
            Complete these steps to start shielding your API traffic. It usually takes less than 3 minutes.
          </p>
          
          <div className="grid sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border ${true ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-800/50 border-zinc-700'}`}>
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h3 className="font-semibold text-zinc-200">Create Account</h3>
              </div>
              <p className="text-xs text-zinc-400 ml-8">You are logged in.</p>
            </div>
            
            <Link href="/dashboard/settings" className={`block p-4 rounded-xl border transition-colors ${hasConfiguredBackend ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-500 cursor-pointer'}`}>
              <div className="flex items-center gap-3 mb-2">
                {hasConfiguredBackend ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-zinc-500" />}
                <h3 className="font-semibold text-zinc-200">Set Target URL</h3>
              </div>
              <p className="text-xs text-zinc-400 ml-8">Tell us where to forward your traffic.</p>
            </Link>
            
            <Link href="/dashboard/api-keys" className={`block p-4 rounded-xl border transition-colors ${false ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-500 cursor-pointer'}`}>
              <div className="flex items-center gap-3 mb-2">
                <Circle className="h-5 w-5 text-zinc-500" />
                <h3 className="font-semibold text-zinc-200">Make First Request</h3>
              </div>
              <p className="text-xs text-zinc-400 ml-8">Send a request using your API key.</p>
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-zinc-400 text-sm font-medium mb-1 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" /> Account Status
            </h3>
            <p className="text-2xl font-bold text-white capitalize mt-2">
              {user?.plan} Plan
            </p>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between md:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -z-10 rounded-full" />
          <div>
            <h3 className="text-zinc-400 text-sm font-medium mb-1 flex items-center gap-2">
              <Server className="h-4 w-4 text-cyan-400" /> Active Backend Target
            </h3>
            <p className="text-lg font-mono text-zinc-300 truncate mt-2">
              {user?.target_backend_url || "Not Configured"}
            </p>
          </div>
          {!user?.target_backend_url && (
            <Link href="/dashboard/settings" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors hover:underline mt-2 inline-block">
              Configure target URL →
            </Link>
          )}
        </div>
      </div>

      {/* Analytics Overview Section */}
      <h2 className="text-xl font-bold text-white pt-4">Analytics Overview</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400 text-sm font-medium">Total Requests</span>
            <BarChart3 className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{user?.analytics?.total_requests?.toLocaleString() || "0"}</p>
          <p className="text-xs text-zinc-500 font-medium mt-1">Processed today</p>
        </div>
        
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400 text-sm font-medium">Threats / Errors</span>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-3xl font-bold text-white">{user?.analytics?.threats_blocked?.toLocaleString() || "0"}</p>
          <p className="text-xs text-zinc-500 font-medium mt-1">Status 400+ blocked</p>
        </div>
        
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400 text-sm font-medium">Cache Hits</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-white">{user?.analytics?.cache_hits?.toLocaleString() || "0"}</p>
          <p className="text-xs text-zinc-500 font-medium mt-1">Served directly from memory</p>
        </div>
        
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400 text-sm font-medium">Avg Latency</span>
            <Clock className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white">{user?.analytics?.avg_latency || 0}<span className="text-lg text-zinc-500 font-normal">ms</span></p>
          <p className="text-xs text-zinc-500 font-medium mt-1">Across all gateway traffic</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 bg-emerald-500/5 w-64 h-64 blur-[100px] rounded-full pointer-events-none" />
        <h3 className="text-zinc-200 text-lg font-bold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-500" /> Live Traffic Graph
        </h3>
        <TrafficChart />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mt-8">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-500" /> Recent Requests
            </h2>
            <p className="text-sm text-zinc-400 mt-1">Live traffic hitting your gateway (Sample logs)</p>
          </div>
          <button 
            onClick={() => toast("Export features are restricted on Free plan.")}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-300 bg-zinc-800 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-950 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-6 py-3 font-medium">Method</th>
                <th className="px-6 py-3 font-medium">Path</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Response Time</th>
                <th className="px-6 py-3 font-medium">Action</th>
                <th className="px-6 py-3 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-sm">
              {MOCK_LOGS.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      log.method === 'GET' ? 'bg-blue-500/10 text-blue-400' :
                      log.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {log.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-300">{log.path}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 ${
                      log.status >= 400 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${log.status >= 400 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{log.time}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[11px] font-semibold tracking-wide ${log.badge}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-500 text-xs whitespace-nowrap">{log.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
