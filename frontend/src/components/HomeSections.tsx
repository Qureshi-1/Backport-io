"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CheckCircle2,
  ArrowRight,
  Gift,
  TerminalSquare,
  ChevronDown,
  LayoutGrid,
  Zap,
  Shield,
  ZapOff
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/auth";

/* ─── Shared Component: Live Metrics Telemetry ────────────────────────────── */
const PATHS = [
  "/api/products",
  "/api/orders",
  "/api/users",
  "/api/auth",
  "/api/cache",
];
const METHODS = ["GET", "GET", "GET", "POST", "POST"];

export const LiveMetricsCard = () => {
  const [reqs, setReqs] = useState(14282);
  const [hits, setHits] = useState(11340);
  const [blocked, setBlocked] = useState(412);
  const [log, setLog] = useState([
    { method: "GET", path: "/api/products", ms: 0.4, type: "cache", id: 1 },
    { method: "POST", path: "/api/orders", ms: 12, type: "forward", id: 2 },
    { method: "GET", path: "/api/users", ms: 0.3, type: "cache", id: 3 },
    { method: "POST", path: "/api/auth", ms: 0.1, type: "waf", id: 4 },
  ]);

  useEffect(() => {
    const iv = setInterval(() => {
      const burst = Math.floor(Math.random() * 8) + 1;
      const isWaf = Math.random() < 0.1;
      const isCached = !isWaf && Math.random() < 0.7;
      const method = METHODS[Math.floor(Math.random() * METHODS.length)];
      const path = PATHS[Math.floor(Math.random() * PATHS.length)];
      const ms = isWaf ? 0.1 : isCached ? +(Math.random() * 0.5 + 0.1).toFixed(1) : +(Math.random() * 18 + 4).toFixed(0);
      
      const entry = { method, path, ms, type: isWaf ? "waf" : isCached ? "cache" : "forward", id: Math.random() };
      
      setReqs((r) => r + burst);
      setHits((h) => h + (isCached ? burst : 0));
      setBlocked((b) => b + (isWaf ? 1 : 0));
      setLog((prev) => [entry, ...prev].slice(0, 4));
    }, 800);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="glass-card rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.03] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 bg-[#D9FF00] rounded-full pulse-glow" />
          <span className="font-headline text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">
            Backport_Node_v4
          </span>
        </div>
        <div className="bg-[#D9FF00]/10 text-[#D9FF00] text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Live</div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
        {[
          { label: "Requests", value: reqs.toLocaleString(), color: "text-white" },
          { label: "Cache Hits", value: hits.toLocaleString(), color: "text-[#D9FF00]" },
          { label: "WAF Blocks", value: String(blocked), color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="px-4 py-6 text-center">
            <p className={`text-lg font-headline font-black tabular-nums ${s.color}`}>
              {s.value}
            </p>
            <p className="text-[10px] font-body text-zinc-500 font-medium uppercase tracking-widest mt-1 opacity-60">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="p-6 space-y-3 bg-[#050505]/50 min-h-[180px]">
        {log.map((entry, i) => (
          <div
            key={entry.id}
            className="flex items-center gap-4 border border-white/5 bg-white/[0.01] px-4 py-3 rounded-xl transition-all hover:bg-white/[0.03] group/log"
          >
            <span className={`text-[10px] font-mono font-black w-10 ${entry.method === "GET" ? "text-[#00F0FF]" : "text-[#D9FF00]"}`}>
              {entry.method}
            </span>
            <span className="flex-1 truncate text-[10px] font-mono text-zinc-400 font-medium group-hover/log:text-white transition-colors">
              {entry.path}
            </span>
            <span className={`text-[10px] font-mono font-black ${entry.type === "waf" ? "text-red-500" : entry.type === "cache" ? "text-[#D9FF00]" : "text-zinc-500"}`}>
              {entry.type === "waf" ? "BLOCK" : `${entry.ms}ms`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Pricing ─────────────────────────────────────────────────────────────── */

export const Pricing = () => {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => { 
    setIsLogged(!!localStorage.getItem("vcreds")); 
  }, []);

  const plans = [
    { 
      name: "Developer", 
      desc: "For open source & solo projects", 
      price: billing === "monthly" ? "$0" : "$0",
      features: ["1k Requests / Month", "Global Edge Cache", "Basic WAF Engine", "CLI Deployment"],
      cta: "Get Started Free",
      href: "/auth/signup"
    },
    { 
      name: "Pro", 
      desc: "For small-medium size products", 
      price: billing === "monthly" ? "$18" : "$14",
      features: ["100k Requests / Month", "Premium WAF Rules", "Custom Rate Limits", "99.9% Latency SLA", "Team Support"],
      cta: "Upgrade to Pro",
      href: "/auth/signup?plan=plus",
      highlight: true
    },
    { 
      name: "Enterprise", 
      desc: "For mission-critical production", 
      price: billing === "monthly" ? "$49" : "$39",
      features: ["Unlimited Requests", "Dedicated Edge Node", "SSO & Audit Logs", "Custom Security Rules", "Priority Engineering"],
      cta: "Contact Sales",
      href: "/auth/signup?plan=pro"
    }
  ];

  return (
    <section id="pricing" className="py-40 bg-[#000000] relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center mb-20">
          <h2 className="font-headline text-5xl sm:text-6xl font-black mb-10 tracking-tight">Simple monthly <br /> <span className="text-[#D9FF00]">paying process</span></h2>
          
          {/* Billing Toggle (Boldere Style) */}
          <div className="flex items-center gap-4 bg-white/5 p-1 rounded-full border border-white/10 mb-12">
            <button 
              onClick={() => setBilling("monthly")}
              className={`px-8 py-2.5 rounded-full text-sm font-headline font-bold transition-premium ${billing === "monthly" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
            >
              MONTHLY
            </button>
            <button 
              onClick={() => setBilling("yearly")}
              className={`px-8 py-2.5 rounded-full text-sm font-headline font-bold transition-premium ${billing === "yearly" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
            >
              YEARLY <span className="ml-1 text-[10px] text-[#D9FF00] font-black tracking-tighter">SAVE 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-10 rounded-[2.5rem] flex flex-col transition-premium group ${
                plan.highlight 
                  ? "bg-[#6D28D9] text-white shadow-2xl shadow-purple-900/20 scale-105" 
                  : "bg-white/3 border border-white/5 text-white hover:border-white/10"
              }`}
            >
              <div className="mb-10">
                <h3 className="font-headline text-2xl font-black mb-2">{plan.name}</h3>
                <p className={`font-body text-sm ${plan.highlight ? "text-white/70" : "text-zinc-500"}`}>{plan.desc}</p>
              </div>

              <div className="mb-10 flex items-baseline gap-2">
                <span className="text-6xl font-black tracking-tighter">{plan.price}</span>
                <span className={`text-sm font-headline font-bold uppercase tracking-widest ${plan.highlight ? "text-white/60" : "text-zinc-500"}`}>
                  / month
                </span>
              </div>

              <div className="space-y-6 mb-12 flex-1">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-4 text-sm font-medium font-body opacity-90">
                    <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${plan.highlight ? "text-white" : "text-[#D9FF00]"}`} />
                    {f}
                  </div>
                ))}
              </div>

              <Link 
                href={plan.href}
                className={`w-full py-5 rounded-2xl font-headline font-black text-center transition-premium ${
                  plan.highlight 
                    ? "bg-white text-[#6D28D9] hover:bg-[#D9FF00] hover:text-black hover:scale-[1.02]" 
                    : "bg-[#D9FF00] text-black hover:bg-white"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Final CTA ───────────────────────────────────────────────────────────── */
export const FinalCTA = () => {
  return (
    <section className="py-40 bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-purple opacity-20" />
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h2 className="font-headline text-5xl sm:text-7xl font-black mb-8 leading-tight tracking-tight">Ready to go live? <br /> <span className="text-[#D9FF00]">Just hit publish.</span></h2>
        <p className="font-body text-zinc-500 text-xl mb-12 max-w-2xl mx-auto">Join thousands of developers deploying secure, lightning-fast backends with zero maintenance.</p>
        
        <Link 
          href="/auth/signup"
          className="inline-flex items-center gap-4 bg-[#6366F1] hover:bg-[#D9FF00] hover:text-black text-white px-12 py-6 rounded-full font-headline font-black text-lg transition-premium shadow-2xl shadow-indigo-500/20"
        >
          Publish Now
          <ArrowRight className="w-6 h-6" />
        </Link>
        
        <div className="mt-12 flex items-center justify-center gap-12 text-zinc-600 font-headline text-[10px] tracking-[0.3em] font-black">
           <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> NO REBUILDS</div>
           <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> NO CODE</div>
           <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> MAX SPEED</div>
        </div>
      </div>
    </section>
  );
};

/* ─── FAQ ─────────────────────────────────────────────────────────────────── */

export const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "What is Backport Exactly?", a: "Backport is a headless security and performance layer that sits between your users and your backend, applying enterprise-grade rules in milliseconds." },
    { q: "Do I need to install anything?", a: "No. It's a CNAME-based edge tool. No libraries, no server-side installs, no maintenance headaches." },
    { q: "Can I use it with any framework?", a: "Yes, it works by proxying HTTP traffic. Express, FastAPI, Actix, Rails, or custom Go backends are all supported." },
    { q: "How much speed does it add?", a: "By caching at the edge (Tier 1 nodes), many requests resolve in <10ms, bypassing your backend entirely." }
  ];

  return (
    <section className="py-40 border-t border-white/5 bg-[#000000]">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="font-headline text-4xl font-black mb-16 text-center uppercase tracking-tight">Protocol Queries</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white/2 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors">
              <button 
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-8 text-left"
              >
                <span className="font-headline text-sm font-black uppercase tracking-widest text-zinc-300">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-zinc-600 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-8 pb-8 font-body text-zinc-500 leading-relaxed text-sm italic">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
