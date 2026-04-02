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

// ─── REAL BACKPORT FEATURES ─────────────────────────────────────
const FEATURES = [
  {
    title: "Global Edge WAF",
    desc: "Analyze and block malicious traffic at the edge before it ever reaches your origin server.",
    icon: Shield,
    color: "#2CE8C3",
    size: "large",
  },
  {
    title: "Instant Rate Limiting",
    desc: "Prevent API abuse and brute-force attacks with sub-millisecond global precision.",
    icon: Activity,
    color: "#6BA9FF",
    size: "medium",
  },
  {
    title: "Global API Cache",
    desc: "Serve dynamic responses from the edge with smart invalidation and 99.9% hit rates.",
    icon: Zap,
    color: "#A2BDDB",
    size: "small",
  },
  {
    title: "DDoS Protection",
    desc: "Automatically mitigate Layer 7 attacks in real-time across our distributed network layer.",
    icon: Lock,
    color: "#2CE8C3",
    size: "medium",
  },
  {
    title: "Idempotency Engine",
    desc: "Ensure safe retry logic for critical API actions with our built-in idempotency layer.",
    icon: Database,
    color: "#6BA9FF",
    size: "small",
  },
];

// ─── TERMINAL SETUP ANIMATION (BACKPORT LOGIC) ──────────────────

function TerminalSetupSequence() {
  const [step, setStep] = useState(0);
  const steps = [
    { text: "$ backport up --origin https://api.prod", color: "text-white" },
    { text: "ANALYZING_ORIGIN_TOPOLOGY... [OK]", color: "text-[#A2BDDB]" },
    { text: "INJECTING_EDGE_WORKERS (212 Nodes)...", color: "text-[#6BA9FF]" },
    { text: "WAF_POLICIES: ACTIVE // RULES: 142", color: "text-[#6BA9FF]" },
    { text: "UPLINK_ESTABLISHED: backport.proxy.live", color: "text-[#2CE8C3]" },
  ];

  useEffect(() => {
    const iv = setInterval(() => {
      setStep((s) => (s + 1) % (steps.length + 5));
    }, 1200);
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
    </div>
  );
}

// ─── DASHBOARD MOCKUP (BACKPORT REALITY) ───────────────────────

function FloatingDashboardMockup() {
  return (
    <div className="relative w-full max-w-5xl mx-auto mt-20 animate-float">
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-radial-blue opacity-40 pointer-events-none" />
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-radial-mint opacity-20 pointer-events-none" />
      
      <div className="glass-card rounded-[2.5rem] overflow-hidden border-[#A2BDDB]/10 shadow-2xl perspective-2000">
        <div className="bg-[#0D131A] border-b border-white/5 px-8 py-5 flex items-center justify-between">
          <div className="flex gap-2.5">
             <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/40" />
             <div className="w-3 h-3 rounded-full bg-yellow-400/20 border border-yellow-400/40" />
             <div className="w-3 h-3 rounded-full bg-[#2CE8C3]/20 border border-[#2CE8C3]/40" />
          </div>
          <div className="text-[10px] font-headline font-black text-zinc-500 uppercase tracking-[0.4em]">API Infrastructure Management Console</div>
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-[#2CE8C3] pulse-glow" />
             <span className="text-[9px] font-bold text-[#2CE8C3] uppercase tracking-tighter">Cluster_Live</span>
          </div>
        </div>

        <div className="p-8 grid grid-cols-12 gap-8 bg-[#080C10]/80">
          <div className="col-span-8 space-y-8">
             <div className="bg-[#0D131A] border border-white/5 rounded-3xl p-8 min-h-[320px] flex flex-col justify-between group">
                <div className="flex justify-between items-start">
                   <div>
                      <h4 className="text-[#A2BDDB] text-[10px] font-headline font-black tracking-widest uppercase mb-2">Global API Traffic</h4>
                      <div className="text-5xl font-black text-white tracking-tighter">1.28m <span className="text-[#2CE8C3] text-sm">+18.5%</span></div>
                   </div>
                </div>
                <div className="flex items-end gap-1 h-32 px-2 mt-8">
                   {Array.from({length: 44}).map((_, i) => (
                     <div 
                      key={i} 
                      className="flex-1 bg-gradient-to-t from-[#6BA9FF]/10 to-[#6BA9FF]/60 rounded-full hover:to-[#2CE8C3] transition-all" 
                      style={{ height: `${Math.random() * 80 + 20}%`, opacity: i < 34 ? 1 : 0.2 }} 
                    />
                   ))}
                </div>
             </div>
             
             <div className="grid grid-cols-3 gap-6">
                 {[
                   { label: "P99 Latency", val: "14ms", color: "#2CE8C3" },
                   { label: "WAF Blocks", val: "4.2k", color: "#6BA9FF" },
                   { label: "Cache Hit", val: "99.4%", color: "#A2BDDB" }
                 ].map(s => (
                  <div key={s.label} className="bg-[#0D131A] border border-white/5 rounded-2xl p-6">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-headline font-black mb-1 block">{s.label}</span>
                    <span className="text-2xl font-black tabular-nums" style={{ color: s.color }}>{s.val}</span>
                  </div>
                 ))}
             </div>
          </div>

          <div className="col-span-4 space-y-6">
             <div className="bg-black border border-white/10 rounded-2xl p-6 flex-1 min-h-[240px]">
                <div className="text-[#2CE8C3] text-[10px] font-headline font-black uppercase tracking-widest mb-4 opacity-70">Security_Events</div>
                <TerminalSetupSequence />
             </div>
             <div className="bg-[#6BA9FF] p-8 rounded-3xl text-[#080C10]">
                <Blocks className="w-8 h-8 mb-6" />
                <h5 className="font-headline font-black text-xs uppercase tracking-widest mb-2 leading-none">Cluster_Uplink</h5>
                <p className="text-sm font-bold leading-tight">All 212 edge clusters synchronized. Zero latency overhead detected.</p>
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
    <main className="bg-[#080C10] selection:bg-[#2CE8C3] selection:text-black min-h-screen relative no-scrollbar">
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
            <div className="w-2 h-2 rounded-full bg-[#2CE8C3] animate-pulse shadow-[0_0_10px_#2CE8C3]" />
            <span className="text-[#A2BDDB] text-[10px] font-headline font-black uppercase tracking-[0.3em]">Status: Production Protocol Verified</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-headline text-[3.5rem] sm:text-[5rem] lg:text-[7rem] font-black leading-[0.9] tracking-[-0.04em] text-white max-w-6xl mb-10"
          >
             The final layer of your <br /> <span className="text-[#2CE8C3] text-glow-mint"><TypewriterText />.</span>
          </motion.h1>

          <motion.p
            className="max-w-2xl font-body text-[#A2BDDB] text-lg sm:text-xl leading-relaxed mb-14 opacity-80"
          >
            Scale your backend to 212 edge clusters in 30 seconds. Enterprise-grade 
            WAF, global caching, and rate limiting—zero code changes required.
          </motion.p>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            <Link 
              href="/auth/signup"
              className="btn-mint px-12 py-6 rounded-3xl text-[12px] font-headline font-black uppercase tracking-[0.2em] shadow-2xl shadow-[#2CE8C3]/10"
            >
              Initialize Node
            </Link>
            <button className="flex items-center gap-4 text-[#A2BDDB] font-headline text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors group">
               <div className="w-12 h-12 rounded-2xl border border-[#A2BDDB]/20 flex items-center justify-center transition-premium group-hover:border-[#2CE8C3] group-hover:text-[#2CE8C3]">
                  <Play className="w-4 h-4 fill-current" />
               </div>
               Watch Protocol.mov
            </button>
          </div>

          <FloatingDashboardMockup />
        </div>
      </section>

      {/* Bento Grid Features - RE-ALIGNED TO BACKPORT */}
      <section id="features" className="py-40 px-6 relative">
         <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center mb-24">
               <span className="text-[#2CE8C3] font-headline font-black text-[10px] uppercase tracking-[0.6em] mb-4">Infrastructure Stack</span>
               <h2 className="font-headline text-5xl sm:text-6xl font-black mb-6 tracking-tight">Built for speed. <br /> <span className="text-[#6BA9FF]">Hardened for production.</span></h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {FEATURES.map((f, i) => (
                 <FeatureCard key={f.title} feature={f} index={i} />
               ))}
               
               {/* Large Call-out Card */}
               <motion.div 
                 className="lg:col-span-3 bg-gradient-to-br from-[#6BA9FF]/10 to-[#2CE8C3]/10 border border-white/5 p-16 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-12 group hover:border-[#2CE8C3]/30 transition-premium"
               >
                  <div className="space-y-6">
                     <h3 className="font-headline text-4xl font-black">Zero SDK Integration</h3>
                     <p className="text-[#A2BDDB] text-lg max-w-xl">We sit at the network layer. Whether you're running Node, Python, Go, or Rails—just point your DNS to our clusters and gain instant observability and protection.</p>
                  </div>
                  <Link href="/auth/signup" className="bg-white text-black px-12 py-6 rounded-2xl font-headline font-black text-sm uppercase tracking-widest hover:bg-[#2CE8C3] transition-premium whitespace-nowrap">
                    Establish Uplink
                  </Link>
               </motion.div>
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
      <p className="font-body text-[#A2BDDB] text-base leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">{feature.desc}</p>
      
      <div className="mt-12 flex items-center gap-3 text-[#2CE8C3] font-headline text-[9px] font-black tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0 uppercase">
        View Specs <ArrowRight className="w-4 h-4" />
      </div>
    </motion.div>
  );
}

function TypewriterText() {
  const words = ["API Infrastructure", "Security Stack", "Edge Network", "Backend Gateway"];
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
