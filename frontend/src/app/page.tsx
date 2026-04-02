"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  Zap, Shield, Cpu, Activity, ArrowRight, Play, Check, 
  Terminal, Globe, Lock, Code2, Layers, Server, Sparkles, 
  ChevronRight, Command, Database, BarChart3, AlertTriangle, Blocks
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ─── FEATURES DATA ─────────────────────────────────────────────
const FEATURES = [
  {
    title: "Global Edge WAF",
    desc: "Every request is analyzed across 200+ edge nodes before hitting your origin.",
    icon: Shield,
    color: "#D9FF00",
    size: "large",
  },
  {
    title: "Smart Caching",
    desc: "Deduplicated cache with 99.9% hit rate for static & dynamic assets.",
    icon: Zap,
    color: "#8B5CF6",
    size: "small",
  },
  {
    title: "Instant Rate Limiting",
    desc: "Stop brute-force attacks with sub-millisecond precision.",
    icon: Activity,
    color: "#34FF8C",
    size: "medium",
  },
  {
    title: "DDoS Mitigation",
    desc: "Layer 7 protection built into the network fabric.",
    icon: Lock,
    color: "#D9FF00",
    size: "medium",
  },
  {
    title: "Edge Database Proxy",
    desc: "Connect to any DB with zero latency connection pooling.",
    icon: Database,
    color: "#8B5CF6",
    size: "small",
  },
];

const TRUSTED_BY = [
  "Incentive", "Vesta", "Litter", "Symphon", "Alchemist", "Hyperion", "Quantum"
];

// ─── COMPONENTS ──────────────────────────────────────────────────

function FeatureCard({ feature, index }: { feature: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.8 }}
      className={`glass-card p-8 group relative overflow-hidden glass-card-hover ${
        feature.size === "large" ? "md:col-span-2 lg:col-span-2" : 
        feature.size === "medium" ? "md:col-span-1 lg:col-span-1" : ""
      }`}
    >
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 group-hover:rotate-12 transition-all transition-premium">
        <feature.icon className="w-24 h-24" style={{ color: feature.color }} />
      </div>
      
      <div 
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-premium group-hover:scale-110"
        style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
      >
        <feature.icon className="w-6 h-6" />
      </div>

      <h3 className="font-headline text-2xl font-bold mb-3 group-hover:text-[#D9FF00] transition-colors">{feature.title}</h3>
      <p className="font-body text-zinc-500 leading-relaxed max-w-sm">{feature.desc}</p>
      
      <div className="mt-8 flex items-center gap-2 text-[#D9FF00] font-headline text-xs font-bold tracking-widest opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
        LEARN_PROTOCOL <ArrowRight className="w-3 h-3" />
      </div>
    </motion.div>
  );
}

function StatItem({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-headline">{label}</span>
      <span className="text-xl font-bold tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

function FloatingDashboardMockup() {
  return (
    <div className="relative w-full max-w-5xl mx-auto mt-20 animate-float">
      {/* Glow Effects */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-radial-purple opacity-40 pointer-events-none" />
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-radial-lime opacity-20 pointer-events-none" />
      
      {/* The Dashboard Shell (Boldere/Hypocode inspiration) */}
      <div className="glass-card rounded-2xl overflow-hidden border-white/10 shadow-2xl shadow-black/50 perspective-2000">
        <div className="bg-white/5 border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="flex gap-1.5">
               <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
               <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
               <div className="w-2.5 h-2.5 rounded-full bg-[#D9FF00]/20 border border-[#D9FF00]/40" />
             </div>
             <div className="h-4 w-px bg-white/10 mx-2" />
             <div className="flex items-center gap-2 text-zinc-500 font-mono text-[11px] uppercase tracking-widest">
               <Terminal className="w-3 h-3" /> system.backport.io / <span className="text-white">v4.0.1</span>
             </div>
          </div>
          <div className="flex gap-6">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#34FF8C] pulse-glow" />
                <span className="text-[10px] font-bold text-[#34FF8C] tracking-tighter uppercase">Cluster.Live</span>
             </div>
             <div className="h-4 w-px bg-white/10" />
             <Activity className="w-4 h-4 text-zinc-600" />
          </div>
        </div>

        <div className="p-8 grid grid-cols-12 gap-6 bg-[#050505]/50 overflow-hidden">
          {/* Main Visual - Chart Area */}
          <div className="col-span-8 flex flex-col gap-6">
             <div className="bg-white/3 border border-white/5 rounded-xl p-6 h-[260px] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                   <div>
                      <h4 className="text-zinc-400 text-xs font-headline uppercase tracking-widest mb-1">Global Traffic</h4>
                      <div className="text-3xl font-black tracking-tight text-white">482.9k <span className="text-[#34FF8C] text-sm">+12%</span></div>
                   </div>
                   <div className="flex gap-2">
                       {['H', 'D', 'W', 'M'].map(t => (
                         <button key={t} className={`w-6 h-6 rounded-md text-[10px] flex items-center justify-center border ${t === 'H' ? 'bg-[#D9FF00] border-[#D9FF00] text-black' : 'border-white/5 text-zinc-500'}`}>{t}</button>
                       ))}
                   </div>
                </div>
                {/* Fake Chart bars */}
                <div className="flex items-end gap-1 h-32 px-2">
                   {Array.from({length: 40}).map((_, i) => (
                     <div 
                      key={i} 
                      className="flex-1 bg-[#D9FF00]/40 rounded-t-sm hover:bg-[#D9FF00] transition-all" 
                      style={{ height: `${Math.random() * 80 + 20}%`, opacity: i < 30 ? 1 : 0.3 }} 
                    />
                   ))}
                </div>
             </div>
             
             <div className="grid grid-cols-3 gap-6">
                 <div className="bg-white/3 border border-white/5 rounded-xl p-4">
                    <StatItem label="Response Time" value="12ms" color="#34FF8C" />
                 </div>
                 <div className="bg-white/3 border border-white/5 rounded-xl p-4">
                    <StatItem label="WAF Blocks" value="4,281" color="#F87171" />
                 </div>
                 <div className="bg-white/3 border border-white/5 rounded-xl p-4">
                    <StatItem label="Cache Efficiency" value="99.4%" color="#8B5CF6" />
                 </div>
             </div>
          </div>

          {/* Right Panel - Terminal/Logs */}
          <div className="col-span-4 flex flex-col gap-4 h-full">
             <div className="bg-black border border-white/5 rounded-xl p-4 flex-1 font-mono text-[10px] text-zinc-500 overflow-hidden leading-relaxed">
               <div className="text-[#D9FF00] mb-2 font-bold opacity-80">-- BACKPORT_REALTIME_LOGS --</div>
               <div className="flex gap-2 mb-1">
                 <span className="text-blue-400">GET</span> <span className="text-white">/api/v1/user/auth</span> <span className="text-green-400">200</span>
               </div>
               <div className="flex gap-2 mb-1">
                 <span className="text-blue-400">POST</span> <span className="text-white">/edge/cache/purge</span> <span className="text-green-400">204</span>
               </div>
               <div className="flex gap-2 mb-1">
                 <span className="text-red-400">DROP</span> <span className="text-white">82.1.92.128</span> <span className="text-[#D9FF00]">WAF_SCAN</span>
               </div>
               <div className="flex gap-2 mb-1 opacity-60">
                 <span className="text-blue-400">GET</span> <span className="text-white">/static/assets/logo.svg</span> <span className="text-purple-400">HIT</span>
               </div>
               <div className="flex gap-2 mb-1 opacity-50">
                 <span className="text-blue-400">GET</span> <span className="text-white">/api/v1/metrics</span> <span className="text-green-400">200</span>
               </div>
               <div className="flex gap-2 mb-1 opacity-40">
                 <span className="text-blue-400">POST</span> <span className="text-white">/edge/sync</span> <span className="text-green-400">200</span>
               </div>
               <div className="mt-4 flex items-center gap-1">
                 <span className="text-white">$</span> <span className="terminal-cursor" />
               </div>
             </div>
             <div className="bg-gradient-to-br from-[#8B5CF6] to-[#4F46E5] rounded-xl p-5 text-white">
                <div className="flex items-center gap-3 mb-3">
                   <div className="p-2 bg-white/20 rounded-lg"><Blocks className="w-5 h-5" /></div>
                   <div className="text-[10px] font-headline font-bold uppercase tracking-widest opacity-80">Infrastructure Status</div>
                </div>
                <div className="text-sm font-body font-medium leading-tight">All 22 Edge clusters fully operational. No latency spikes detected.</div>
             </div>
          </div>
        </div>
      </div>

      {/* Floating UI Badges */}
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-12 top-1/3 bg-white border border-white/10 shadow-xl px-4 py-3 rounded-2xl flex items-center gap-3 glass-card"
      >
        <div className="w-8 h-8 rounded-full bg-[#D9FF00] flex items-center justify-center"><Zap className="w-4 h-4 text-black" /></div>
        <div className="flex flex-col">
          <span className="text-xs font-headline font-bold text-white tracking-widest uppercase">98ms Saver</span>
          <span className="text-[10px] text-zinc-500 font-body">Average latency reduction</span>
        </div>
      </motion.div>
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <main ref={containerRef} className="bg-black selection:bg-[#D9FF00] selection:text-black min-h-screen relative no-scrollbar">
      <Header />
      
      {/* Background Layer */}
      <div className="fixed inset-0 z-0 bg-dot-grid opacity-[0.15] pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-radial-purple opacity-20 pointer-events-none" />
      
      {/* Hero Section */}
      <section className="relative pt-44 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-8"
          >
            <span className="bg-[#D9FF00] text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">NEW</span>
            <span className="text-zinc-400 text-xs font-body font-medium tracking-wide">Backport v4.0 is now live: 50% faster edge clusters</span>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="font-headline text-[3.5rem] sm:text-[5rem] lg:text-[6.5rem] font-black leading-[0.95] tracking-[-0.04em] text-white max-w-5xl mb-8"
          >
             Build your dream backend <br className="hidden md:block" /> 
             with <span className="text-[#D9FF00] text-glow-lime">Edge Intelligence.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="max-w-2xl font-body text-zinc-500 text-lg sm:text-xl leading-relaxed mb-12"
          >
            Deploy enterprise-grade rate limiting, caching, and WAF protection in minutes. 
            Zero code, zero infrastructure management, maximum global speed.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <Link 
              href="/auth/signup"
              className="btn-lime px-10 py-5 rounded-full text-lg flex items-center gap-3 transition-premium ring-4 ring-[#D9FF00]/10"
            >
              Start Building Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="flex items-center gap-3 text-white font-headline text-sm font-bold uppercase tracking-widest hover:text-[#D9FF00] transition-colors py-4 px-6 group">
               <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:border-[#D9FF00] transition-colors"><Play className="w-4 h-4 fill-white group-hover:fill-[#D9FF00]" /></div>
               Watch Demo Video
            </button>
          </motion.div>

          <FloatingDashboardMockup />
        </div>
      </section>

      {/* Trusted By (Logo Cloud) */}
      <section className="py-20 bg-gradient-to-b from-transparent to-white/[0.02]">
         <div className="max-w-7xl mx-auto px-6 text-center">
            <h3 className="text-zinc-600 font-headline text-[10px] tracking-[0.4em] uppercase mb-12">Trusted by several industry leads</h3>
            <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-10 opacity-30 invert">
               {TRUSTED_BY.map(brand => (
                 <span key={brand} className="text-2xl font-black font-headline tracking-tighter grayscale hover:grayscale-0 transition-all">{brand}</span>
               ))}
            </div>
         </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="py-32 px-6 relative">
         <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center mb-20">
               <h2 className="font-headline text-4xl sm:text-5xl font-black mb-6">Built for speed. <br /> Perfected for <span className="text-[#D9FF00]">Stability.</span></h2>
               <p className="font-body text-zinc-500 text-lg max-w-xl">Every tool you need to ship production-ready backends to a global audience in record time.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {FEATURES.map((f, i) => (
                 <FeatureCard key={f.title} feature={f} index={i} />
               ))}
            </div>
         </div>
      </section>

      {/* How It Works (Steps) - Boldere Vibe */}
      <section id="how-it-works" className="py-32 px-6 bg-[#050505]">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
             <div className="flex-1">
                <h2 className="font-headline text-4xl sm:text-6xl font-black mb-8">Ship your API in <br /> <span className="text-[#D9FF00]">3 simple steps</span></h2>
                <div className="space-y-12">
                   {[
                     { step: "01", title: "Connect your Endpoint", desc: "Simply paste your backend origin URL into nuestra console. No plugins required." },
                     { step: "02", title: "Apply Security Policies", desc: "Activate rate limiting, WAF, and caching with a single toggle switch." },
                     { step: "03", title: "Switch your CNAME", desc: "Change your DNS to point to Backport and watch your API fly globally." }
                   ].map((s, i) => (
                     <div key={s.step} className="flex gap-8 group">
                        <div className="text-4xl font-black font-headline text-zinc-800 group-hover:text-[#D9FF00] transition-colors">{s.step}</div>
                        <div>
                           <h4 className="text-xl font-bold mb-2 text-white">{s.title}</h4>
                           <p className="text-zinc-500 leading-relaxed">{s.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
             <div className="flex-1 relative w-full aspect-square lg:aspect-video bg-white/2 rounded-3xl border border-white/5 overflow-hidden flex items-center justify-center p-12">
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
                {/* Visual Representation of Network */}
                <div className="relative w-full h-full flex items-center justify-center">
                   <div className="w-24 h-24 rounded-full bg-[#D9FF00]/10 border border-[#D9FF00]/20 flex items-center justify-center z-10">
                      <Globe className="w-10 h-10 text-[#D9FF00]" />
                   </div>
                   {/* Expanding pulse circles */}
                   <div className="absolute w-40 h-40 rounded-full border border-[#D9FF00]/20 animate-ping opacity-20" />
                   <div className="absolute w-80 h-80 rounded-full border border-white/10" />
                   {/* Orbiting nodes */}
                   {[0, 72, 144, 216, 288].map(d => (
                     <motion.div
                       key={d}
                       animate={{ rotate: 360 }}
                       transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                       className="absolute"
                       style={{ transform: `rotate(${d}deg) translateY(-140px)` }}
                     >
                       <div className="bg-white/10 p-3 rounded-xl border border-white/10 hover:border-[#D9FF00] transition-colors rotate-[-360deg]">
                          <Server className="w-5 h-5 text-zinc-400" />
                       </div>
                     </motion.div>
                   ))}
                </div>
             </div>
          </div>
      </section>

      <Footer />
    </main>
  );
}

// ─── HELPERS ────────────────────────────────────────────────────

function TypewriterText() {
  const words = ["Shield", "Network", "Protocol", "Gateway"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={words[index]}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {words[index]}
      </motion.span>
    </AnimatePresence>
  );
}
