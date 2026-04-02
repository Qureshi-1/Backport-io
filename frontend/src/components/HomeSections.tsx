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
  Activity,
  Terminal,
  Database
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

/* ─── REAL PRICING (API-FOCUSED) ────────────────────────────────────────── */

export const Pricing = () => {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    { 
      name: "Standard", 
      desc: "For prototypes and early-stage APIs", 
      price: billing === "monthly" ? "$0" : "$0",
      features: ["50k Requests / Month", "Global Edge Cache", "Standard WAF Engine", "CLI / DNS Deployment"],
      cta: "Initialize Node",
      href: "/auth/signup"
    },
    { 
      name: "Professional", 
      desc: "For high-traffic production APIs", 
      price: billing === "monthly" ? "$18" : "$14",
      features: [
        "1M Requests / Month", 
        "Advanced WAF Policies", 
        "Global Throttling", 
        "P99 Latency SLA", 
        "Idempotency Support"
      ],
      cta: "Establish Pro Link",
      href: "/auth/signup?plan=plus",
      highlight: true
    },
    { 
      name: "Enterprise", 
      desc: "Mission-critical security & scale", 
      price: billing === "monthly" ? "$49" : "$39",
      features: [
        "Unlimited API Traffic", 
        "Dedicated Edge Cluster", 
        "Custom Security Artifacts", 
        "Full Audit Logs", 
        "24/7 Ops Support"
      ],
      cta: "Request Cluster",
      href: "/auth/signup?plan=pro"
    }
  ];

  return (
    <section id="pricing" className="py-40 bg-[#080C10] relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center mb-24">
          <span className="text-[#2CE8C3] font-headline text-[10px] font-black uppercase tracking-[0.4em] mb-4">Resource Allocation</span>
          <h2 className="font-headline text-5xl sm:text-6xl font-black mb-10 tracking-tight">Simple monthly <br /> <span className="text-[#6BA9FF]">paying process</span></h2>
          
          <div className="flex items-center gap-4 bg-white/5 p-1 rounded-full border border-white/10 mb-12">
            <button 
              onClick={() => setBilling("monthly")}
              className={`px-8 py-2.5 rounded-full text-[10px] font-headline font-black transition-premium ${billing === "monthly" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
            >
              MONTHLY
            </button>
            <button 
              onClick={() => setBilling("yearly")}
              className={`px-8 py-2.5 rounded-full text-[10px] font-headline font-black transition-premium ${billing === "yearly" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
            >
              YEARLY <span className="ml-2 text-[#2CE8C3] font-black tracking-widest text-[9px]">SAVE 20%</span>
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
              className={`p-12 rounded-[3.5rem] flex flex-col transition-premium group ${
                plan.highlight 
                  ? "bg-[#6BA9FF] text-[#080C10] shadow-2xl shadow-blue-500/20 scale-105" 
                  : "bg-white/3 border border-white/5 text-white hover:border-white/10"
              }`}
            >
              <div className="mb-10">
                <h3 className="font-headline text-2xl font-black mb-3">{plan.name}</h3>
                <p className={`font-body text-sm leading-relaxed ${plan.highlight ? "text-[#080C10]/70" : "text-[#A2BDDB]"}`}>{plan.desc}</p>
              </div>

              <div className="mb-10 flex items-baseline gap-2">
                <span className="text-7xl font-black tracking-tighter leading-none">{plan.price}</span>
                <span className={`text-[10px] font-headline font-black uppercase tracking-widest ${plan.highlight ? "text-[#080C10]/50" : "text-zinc-600"}`}>
                  / month
                </span>
              </div>

              <div className="space-y-6 mb-16 flex-1">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-4 text-[13px] font-semibold font-body">
                    <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${plan.highlight ? "text-[#080C10]" : "text-[#2CE8C3]"}`} />
                    {f}
                  </div>
                ))}
              </div>

              <Link 
                href={plan.href}
                className={`w-full py-6 rounded-3xl font-headline font-black text-[12px] uppercase tracking-widest text-center transition-premium ${
                  plan.highlight 
                    ? "bg-[#080C10] text-[#2CE8C3] hover:bg-white hover:text-black hover:scale-[1.02]" 
                    : "bg-[#2CE8C3] text-black hover:bg-white"
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

/* ─── REAL FAQ (API-FOCUSED) ──────────────────────────────────────────────── */

export const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "Is any SDK integration required?", a: "No. Backport operates at the network layer. You simply point your primary DNS or CNAME to our edge clusters. No code changes, no middleware." },
    { q: "Which backends are supported?", a: "Everything that speaks HTTP/S. Whether you're running Express, FastAPI, Actix, Rails, or a custom Go binary - Backport shields it." },
    { q: "How much latency does it add?", a: "In many cases, it reduces latency. Our Tier-1 edge caching resolves requests in <12ms, bypassing your origin entirely." },
    { q: "What's the difference between this and a standard WAF?", a: "Backport is built for APIs. We handle smart idempotency, nested rate limiting, and deep packet inspection tailored for JSON payloads." }
  ];

  return (
    <section className="py-40 border-t border-white/5 bg-[#080C10]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-20 space-y-4">
           <span className="text-[#A2BDDB] font-headline text-[10px] uppercase font-black tracking-[0.4em]">Protocol Queries</span>
           <h2 className="font-headline text-4xl sm:text-5xl font-black uppercase tracking-tight">System FAQ</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white/2 border border-white/5 rounded-3xl overflow-hidden hover:border-[#2CE8C3]/30 transition-colors">
              <button 
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-10 text-left"
              >
                <span className="font-headline text-sm font-black uppercase tracking-widest text-zinc-300 pr-12 leading-relaxed">{faq.q}</span>
                <ChevronDown className={`w-6 h-6 text-[#A2BDDB]/40 transition-transform ${open === i ? "rotate-180 text-[#2CE8C3]" : ""}`} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-10 pb-10 font-body text-[#A2BDDB] leading-relaxed text-base italic opacity-80 border-t border-white/5 pt-8">
                       // RESPONSE: {faq.a}
                    </p>
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

/* ─── FINAL CTA ───────────────────────────────────────────────────────────── */

export const FinalCTA = () => {
  return (
    <section className="py-48 bg-black relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2CE8C3]/20 to-transparent" />
      <div className="max-w-5xl mx-auto px-6 text-center relative z-10 space-y-12">
        <span className="text-[#A2BDDB] font-headline text-[10px] font-black uppercase tracking-[0.4em]">Ready to establish connection?</span>
        <h2 className="font-headline text-5xl sm:text-7xl lg:text-[100px] font-black leading-none tracking-tighter">Your API. <br /> <span className="text-[#2CE8C3] text-glow-mint">Production Gear.</span></h2>
        <p className="font-body text-[#A2BDDB] text-xl max-w-2xl mx-auto opacity-70">Experience 10x faster response times and 100% protection from API abuse with the final layer of your infrastructure.</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-6">
           <Link 
            href="/auth/signup"
            className="bg-[#2CE8C3] hover:bg-white text-black px-16 py-7 rounded-3xl font-headline font-black uppercase text-xl transition-premium shadow-2xl shadow-[#2CE8C3]/10"
           >
            Initialize Now
           </Link>
           <button className="flex items-center gap-4 text-[#A2BDDB] font-headline text-[12px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors">
              <TerminalSquare className="w-6 h-6" /> View Documentation
           </button>
        </div>
      </div>
    </section>
  );
};
