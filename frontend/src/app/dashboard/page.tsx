"use client";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { 
  CheckCircle2, Circle, X, Download, Server, Activity, 
  Clock, BarChart3, ShieldAlert, Zap, ArrowUpRight, Globe, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import TrafficChart from "@/components/TrafficChart";

export default function DashboardOverview() {
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChecklist, setShowChecklist] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchApi("/api/user/me"),
      fetchApi("/api/user/logs").catch(() => [])
    ])
    .then(([userData, logsData]) => {
      setUser(userData);
      setLogs(logsData || []);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
       <div className="w-12 h-12 border-4 border-[#2CE8C3]/20 border-t-[#2CE8C3] rounded-full animate-spin" />
       <div className="text-[10px] font-headline font-black uppercase tracking-widest text-[#A2BDDB]">Initializing Terminal...</div>
    </div>
  );

  const hasConfiguredBackend = !!user?.target_backend_url;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex items-end justify-between bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-radial-mint opacity-10 -z-10 group-hover:opacity-20 transition-opacity" />
        <div className="space-y-2">
           <div className="flex items-center gap-3">
              <h1 className="text-4xl font-headline font-black text-white tracking-tight">Mainframe</h1>
              {user?.plan === "pro" && (
                <span className="px-3 py-1 rounded-lg bg-[#2CE8C3] text-black text-[9px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(44,232,195,0.4)]">
                   PRO_UPLINK
                </span>
              )}
           </div>
           <p className="text-[#A2BDDB] text-xs font-semibold uppercase tracking-[0.3em] opacity-60">System Operational // All Clusters Syncing</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-black/40 border border-white/5 px-6 py-3 rounded-2xl flex flex-col items-end">
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Protocol Version</span>
              <span className="text-white font-mono text-sm">v0.4.1_ESTABLISHED</span>
           </div>
        </div>
      </div>

      {showChecklist && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#0D131A] to-[#080C10] border border-[#2CE8C3]/10 rounded-[2.5rem] p-10 relative overflow-hidden"
        >
          <button 
            onClick={() => setShowChecklist(false)}
            className="absolute top-8 right-8 text-zinc-600 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="flex items-center gap-4 mb-3">
             <ShieldCheck className="h-5 w-5 text-[#2CE8C3]" />
             <h2 className="text-lg font-headline font-black text-white tracking-widest uppercase">Launch Protocol</h2>
          </div>
          <p className="text-sm text-[#A2BDDB] mb-10 max-w-2xl font-medium tracking-tight">
            Perform these steps to finalize your edge-native security artifacts. 
            All connections are currently operating in default bypass mode.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 1, label: "Identity Verified", status: "COMPLETE", desc: "User authenticated", active: true },
              { id: 2, label: "Set Target URL", status: hasConfiguredBackend ? "ESTABLISHED" : "PENDING", desc: "Origin topology detection", active: hasConfiguredBackend, href: "/dashboard/settings" },
              { id: 3, label: "First Handshake", status: "LOCKED", desc: "Sample 443 telemetry", active: false, href: "/dashboard/api-keys" }
            ].map(step => (
              <StepCard key={step.id} {...step} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats Cluster */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: "Throughput", val: user?.analytics?.total_requests?.toLocaleString() || "0", icon: BarChart3, color: "#6BA9FF", sub: "Processed Requests" },
           { label: "Threat Mitigation", val: user?.analytics?.threats_blocked?.toLocaleString() || "0", icon: ShieldAlert, color: "#2CE8C3", sub: "L7 Anomalies Blocked" },
           { label: "Cache Efficiency", val: user?.analytics?.cache_hits?.toLocaleString() || "0", icon: Zap, color: "#A2BDDB", sub: "Edge Delivery Rate" },
           { label: "Network Latency", val: `${user?.analytics?.avg_latency || 0}ms`, icon: Clock, color: "#6BA9FF", sub: "P99 Global Average" }
         ].map(stat => (
           <div key={stat.label} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 group hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-6">
                 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                 </div>
                 <ArrowUpRight className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-4xl font-black text-white tracking-tighter mb-1">{stat.val}</div>
              <div className="text-[10px] font-headline font-black text-zinc-600 uppercase tracking-widest">{stat.label}</div>
              <p className="text-[9px] font-bold text-zinc-500 mt-4 opacity-40">{stat.sub}</p>
           </div>
         ))}
      </div>

      {/* Main Analytics Region */}
      <div className="grid grid-cols-12 gap-8">
         <div className="col-span-12 lg:col-span-8 space-y-8">
            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-radial-blue opacity-5 -z-10" />
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-white text-xl font-headline font-black uppercase tracking-tight">Active Telemetry</h3>
                    <p className="text-[#A2BDDB] text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">Real-time throughput samples</p>
                  </div>
                  <div className="flex gap-2">
                     <div className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-white/50 uppercase tracking-widest">Live</div>
                  </div>
               </div>
               <TrafficChart />
            </div>

            {/* Log Terminal */}
            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                   <div>
                      <h2 className="text-white text-xl font-headline font-black uppercase tracking-tight">Access Protocol Logs</h2>
                      <p className="text-[#A2BDDB] text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">Sampling last 100 requests</p>
                   </div>
                   <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2.5 rounded-xl text-[9px] font-black text-white uppercase tracking-widest transition-colors flex items-center gap-3">
                      <Download className="h-4 w-4 text-[#A2BDDB]" />
                      Forensics CSV
                   </button>
                </div>
                <div className="overflow-x-auto p-4">
                   <LogTable logs={logs} />
                </div>
            </div>
         </div>

         {/* Sidebar: System Info */}
         <div className="col-span-12 lg:col-span-4 space-y-6">
             <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-between group overflow-hidden relative">
                <div className="absolute inset-0 bg-[#A2BDDB]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-black border border-white/5 flex items-center justify-center mb-8">
                     <Globe className="w-6 h-6 text-[#6BA9FF]" />
                  </div>
                  <h3 className="text-white text-[10px] font-headline font-black uppercase tracking-widest mb-2">Primary Uplink Target</h3>
                  <p className="font-mono text-zinc-400 break-all text-sm leading-relaxed mb-6">
                    {user?.target_backend_url || "NONE_DETECTED_SYNC_PENDING"}
                  </p>
                </div>
                {!user?.target_backend_url && (
                  <Link href="/dashboard/settings" className="relative group/link bg-[#6BA9FF] p-4 rounded-2xl text-[#080C10] font-headline text-[10px] font-black uppercase tracking-widest text-center hover:bg-white transition-colors">
                    Re-route Protocol
                  </Link>
                )}
             </div>

             <div className="bg-[#2CE8C3] p-10 rounded-[2.5rem] space-y-6 text-[#080C10]">
                <ShieldCheck className="w-10 h-10" />
                <div>
                   <h4 className="font-headline text-xl font-black uppercase tracking-tight mb-2">Edge Defense</h4>
                   <p className="text-sm font-bold opacity-80 leading-relaxed">Your API is currently shielded across 212 globally distributed edge clusters. WAF rules are propagating in real-time.</p>
                </div>
                <div className="w-full h-px bg-black/10" />
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em]">Mitigation Active</span>
                </div>
             </div>
         </div>
      </div>
    </div>
  );
}

function StepCard({ label, status, desc, active, href }: any) {
  const content = (
    <div className={`p-6 rounded-2xl border transition-premium relative overflow-hidden group/card ${active ? 'bg-[#2CE8C3]/5 border-[#2CE8C3]/20 shadow-[0_0_40px_rgba(44,232,195,0.05)]' : 'bg-black/40 border-white/5'}`}>
      <div className="flex items-center gap-4 mb-4 relative">
        {active ? <CheckCircle2 className="h-6 w-6 text-[#2CE8C3]" /> : <Circle className="h-6 w-6 text-zinc-700" />}
        <h3 className={`font-headline text-[10px] font-black tracking-widest uppercase transition-colors ${active ? 'text-white' : 'text-zinc-600'}`}>{label}</h3>
      </div>
      <p className={`text-[9px] font-bold tracking-tight mb-4 ml-10 transition-opacity ${active ? 'text-[#A2BDDB]' : 'text-zinc-800'}`}>{desc}</p>
      <div className={`ml-10 font-black text-[9px] uppercase tracking-widest ${active ? 'text-[#2CE8C3]' : 'text-zinc-700'}`}>{status}</div>
    </div>
  );

  if (href && !active) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
}

function LogTable({ logs }: { logs: any[] }) {
  if (logs.length === 0) return <div className="text-center py-20 text-zinc-700 text-[10px] font-headline uppercase font-black tracking-widest">No API Handshakes Logged</div>;

  return (
    <table className="w-full text-left">
      <thead className="text-[9px] uppercase tracking-[0.3em] font-black text-zinc-600">
        <tr>
          <th className="px-6 py-5">METHOD</th>
          <th className="px-6 py-5">PATH</th>
          <th className="px-6 py-5 text-center">STATUS</th>
          <th className="px-6 py-5">LATENCY</th>
          <th className="px-6 py-5 text-right">TIMESTAMP</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {logs.map((log) => (
          <tr key={log.id} className="hover:bg-white/[0.01] transition-colors group">
            <td className="px-6 py-6 transition-transform group-hover:translate-x-1">
              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest ${
                log.method === 'GET' ? 'bg-[#6BA9FF]/10 text-[#6BA9FF]' :
                log.method === 'POST' ? 'bg-[#2CE8C3]/10 text-[#2CE8C3]' :
                'bg-zinc-800 text-zinc-500'
              }`}>
                {log.method}
              </span>
            </td>
            <td className="px-6 py-6 font-mono text-xs text-[#A2BDDB]">{log.path}</td>
            <td className="px-6 py-6 text-center">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                log.status >= 400 ? 'text-red-400 bg-red-400/5' : 'text-[#2CE8C3] bg-[#2CE8C3]/5'
              }`}>
                {log.status}
              </span>
            </td>
            <td className="px-6 py-6 text-xs text-zinc-600 font-mono tracking-tighter">{log.time}</td>
            <td className="px-6 py-6 text-right text-[10px] font-black text-zinc-400 font-headline uppercase opacity-40">{log.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function motion(props: any) { return <div {...props} />; } // Simplified refactoring for speed
