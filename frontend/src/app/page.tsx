"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, Shield, Cpu, Activity, ArrowRight, Play, Check, 
  Terminal, Globe, Lock, Code2, Layers, Server, Sparkles, 
  ChevronRight, Command, Database, BarChart3, AlertTriangle, Blocks
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { auth } from "@/lib/auth";

// ─── FEATURES DATA ─────────────────────────────────────────────
const FEATURES = [
  {
    title: "Global Edge WAF",
    desc: "Analyze every request across 200+ edge nodes with zero origin overhead.",
    icon: Shield,
    color: "#2CE8C3",
    size: "large",
  },
  {
    title: "Smart Caching",
    desc: "99.9% hit rate for both static and dynamic API assets using LRU logic.",
    icon: Zap,
    color: "#6BA9FF",
    size: "small",
  },
  {
    title: "Instant Rate Limiting",
    desc: "Precision throttling for brute-force prevention in sub-milliseconds.",
    icon: Activity,
    color: "#A2BDDB",
    size: "medium",
  },
];

// ─── TERMINAL SETUP ANIMATION COMPONENT ──────────────────────────

function TerminalSetupSequence() {
  const [step, setStep] = useState(0);
  const steps = [
    { text: "$ backport pull origin https://api.v4", color: "text-white" },
    { text: "FETCHING_DEPENDENCIES... [OK]", color: "text-[#A2BDDB]" },
    { text: "INITIALIZING_EDGE_WORKER...", color: "text-[#6BA9FF]" },
    { text: "APPLYING_SECURITY_POLICIES...", color: "text-[#6BA9FF]" },
    { text: "DEPLOYMENT_COMPLETE: system.live", color: "text-[#2CE8C3]" },
  ];

  useEffect(() => {
    const iv = setInterval(() => {
      setStep((s) => (s + 1) % (steps.length + 5));
    }, 1500);
    return () => clearInterval(iv);
  }, [steps.length]);

  return (
    <div className="font-mono text-[10px] space-y-1.5 leading-relaxed overflow-hidden py-2 min-h-[140px]">
      {steps.map((s, i) => (
        <motion.div
           key={i}
           initial={{ opacity: 0, x: -10 }}
           animate={{ 
             opacity: step >= i ? 1 : 0, 
             x: step >= i ? 0 : -10 
           }}
           className={`${s.color} flex items-center gap-2`}
        >
          {step >= i && <span className="opacity-40">→</span>}
          {s.text}
          {step === i && <span className="terminal-cursor !h-3 !w-1.5 ml-1" />}
        </motion.div>
      ))}
      {step >= steps.length && (
         <motion.div 
           initial={{ opacity: 0 }} 
           animate={{ opacity: 1 }} 
           className="mt-4 p-2 bg-[#2CE8C3]/5 border border-[#2CE8C3]/20 rounded text-[#2CE8C3] text-[9px] font-bold uppercase tracking-widest text-center"
         >
           System Uplink Confirmed
         </motion.div>
      )}
    </div>
  );
}

// ─── DASHBOARD MOCKUP ──────────────────────────────────────────

function FloatingDashboardMockup() {
  return (
    <div className="relative w-full max-w-5xl mx-auto mt-20 animate-float">
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-radial-blue opacity-40 pointer-events-none" />
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-radial-mint opacity-20 pointer-events-none" />
      
      <div className="glass-card rounded-[2rem] overflow-hidden border-[#A2BDDB]/10 shadow-2xl perspective-2000">
        <div className="bg-[#0D131A] border-b border-white/5 px-8 py-5 flex items-center justify-between">
          <div className="flex gap-2.5">
             <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/40" />
             <div className="w-3 h-3 rounded-full bg-yellow-400/20 border border-yellow-400/40" />
             <div className="w-3 h-3 rounded-full bg-[#2CE8C3]/20 border border-[#2CE8C3]/40" />
          </div>
          <div className="text-[10px] font-headline font-black text-zinc-500 uppercase tracking-[0.4em]">Infrastructure Control Panel</div>
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-[#2CE8C3] pulse-glow" />
             <span className="text-[9px] font-bold text-[#2CE8C3] uppercase">Live</span>
          </div>
        </div>

        <div className="p-8 grid grid-cols-12 gap-8 bg-[#080C10]/80">
          <div className="col-span-8 flex flex-col gap-8">
             <div className="bg-[#0D131A] border border-white/5 rounded-2xl p-8 min-h-[300px] flex flex-col justify-between group">
                <div className="flex justify-between items-start">
                   <div>
                      <h4 className="text-[#A2BDDB] text-[10px] font-headline font-black tracking-widest uppercase mb-2">Network Throughput</h4>
                      <div className="text-4xl font-black text-white tracking-tighter">842.1k <span className="text-[#2CE8C3] text-sm">+21%</span></div>
                   </div>
                   <Activity className="w-6 h-6 text-[#2CE8C3] opacity-40 group-hover:rotate-12 transition-transform" />
                </div>
                <div className="flex items-end gap-1.5 h-32 px-2 mt-8">
                   {Array.from({length: 32}).map((_, i) => (
                     <div 
                      key={i} 
                      className="flex-1 bg-gradient-to-t from-[#6BA9FF]/20 to-[#6BA9FF]/60 rounded-full hover:to-[#2CE8C3] transition-all" 
                      style={{ height: `${Math.random() * 80 + 20}%`, opacity: i < 24 ? 1 : 0.2 }} 
                    />
                   ))}
                </div>
             </div>
             
             <div className="grid grid-cols-3 gap-6">
                 {[
                   { label: "Latency", val: "8ms", color: "#2CE8C3" },
                   { label: "Threats", val: "0", color: "#6BA9FF" },
                   { label: "Cache", val: "99.8%", color: "#A2BDDB" }
                 ].map(s => (
                  <div key={s.label} className="bg-[#0D131A] border border-white/5 rounded-2xl p-6">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-headline font-black mb-1 block">{s.label}</span>
                    <span className="text-2xl font-black tabular-nums" style={{ color: s.color }}>{s.val}</span>
                  </div>
                 ))}
             </div>
          </div>

          <div className="col-span-4 space-y-6">
             <div className="bg-black border border-white/10 rounded-2xl p-6 flex-1 min-h-[220px]">
                <div className="text-[#2CE8C3] text-[10px] font-headline font-black uppercase tracking-widest mb-4 opacity-70">Setup_Console</div>
                <TerminalSetupSequence />
             </div>
             <div className="bg-[#6BA9FF] p-6 rounded-2xl text-[#080C10]">
                <Blocks className="w-6 h-6 mb-4" />
                <h5 className="font-headline font-black text-[10px] uppercase tracking-widest mb-2">Protocol Sync</h5>
                <p className="text-xs font-bold leading-tight">All clusters synchronized. Edge mitigation active on 212 nodes.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function Home() {
  return (
    <main className="bg-[#080C10] selection:bg-[#2CE8C3] selection:text-[#000] min-h-screen relative no-scrollbar">
      <Header />
      
      <div className="fixed inset-0 z-0 bg-dot-grid opacity-[0.2] pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-radial-blue opacity-20 pointer-events-none" />
      
      <section className="relative pt-44 pb-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full mb-10"
          >
            <div className="w-2 h-2 rounded-full bg-[#2CE8C3] animate-pulse" />
            <span className="text-[#A2BDDB] text-xs font-headline font-black uppercase tracking-[0.2em]">Protocol v0.4.1 Deploying...</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-headline text-[3rem] sm:text-[5rem] lg:text-[7rem] font-black leading-[0.9] tracking-[-0.04em] text-white max-w-6xl mb-10"
          >
             Build your dream site with <span className="text-[#2CE8C3] text-glow-mint"><TypewriterText />.</span> <br /> 
             <span className="text-[#6BA9FF]">Zero code, max speed.</span>
          </motion.h1>

          <motion.p
            className="max-w-2xl font-body text-[#A2BDDB] text-lg sm:text-xl leading-relaxed mb-14"
          >
            Deploy enterprise-grade API shielding, global caching, and instant rate limiting 
            faster than you can ship a single code update.
          </motion.p>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            <Link 
              href="/auth/signup"
              className="btn-mint px-12 py-6 rounded-3xl text-sm font-headline font-black uppercase tracking-widest shadow-2xl shadow-[#2CE8C3]/10"
            >
              Initialize Node
            </Link>
            <button className="flex items-center gap-4 text-[#A2BDDB] font-headline text-[11px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors py-4">
               <div className="w-12 h-12 rounded-2xl border border-[#A2BDDB]/20 flex items-center justify-center transition-premium hover:border-[#2CE8C3] hover:text-[#2CE8C3]">
                  <Play className="w-4 h-4 fill-current" />
               </div>
               Watch Protocol.mov
            </button>
          </div>

          <FloatingDashboardMockup />
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="py-40 px-6 relative">
         <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center mb-24">
               <span className="text-[#2CE8C3] font-headline font-black text-[12px] uppercase tracking-[0.6em] mb-4">Core Components</span>
               <h2 className="font-headline text-5xl sm:text-6xl font-black mb-6">Simple steps for <span className="text-[#6BA9FF]">setup</span></h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {FEATURES.map((f, i) => (
                 <FeatureCard key={f.title} feature={f} index={i} />
               ))}
            </div>
         </div>
      </section>

      <Footer />
    </main>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────

function FeatureCard({ feature, index }: { feature: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`glass-card p-12 rounded-[2.5rem] group relative overflow-hidden glass-card-hover ${
        feature.size === "large" ? "md:col-span-2" : ""
      }`}
    >
      <div 
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 bg-white/5 transition-premium group-hover:bg-[#2CE8C3] group-hover:text-black"
        style={{ color: feature.color }}
      >
        <feature.icon className="w-8 h-8" />
      </div>

      <h3 className="font-headline text-2xl font-black mb-4 transition-colors group-hover:text-[#2CE8C3]">{feature.title}</h3>
      <p className="font-body text-[#A2BDDB] text-base leading-relaxed">{feature.desc}</p>
      
      <div className="mt-12 flex items-center gap-3 text-[#2CE8C3] font-headline text-[10px] font-black tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0 uppercase">
        Explore Protocol <ArrowRight className="w-4 h-4" />
      </div>
    </motion.div>
  );
}

function TypewriterText() {
  const words = ["AI", "Maximum speed", "Zero Code", "Global Scaling"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={words[index]}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: "circOut" }}
      >
        {words[index]}
      </motion.span>
    </AnimatePresence>
  );
}
