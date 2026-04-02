"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
// @ts-ignore
import { animate, stagger } from "animejs";
import {
  CheckCircle2,
  ArrowRight,
  Gift,
  TerminalSquare,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/auth";

/* ─── Shared Component: Live Metrics Telemetry ────────────────────────────── */
const PATHS = [
  "/api/products",
  "/api/orders",
  "/api/users/me",
  "/api/auth",
  "/api/cart",
];
const METHODS = ["GET", "GET", "GET", "POST", "POST"];

export const LiveMetricsCard = () => {
  const [reqs, setReqs] = useState(14282);
  const [hits, setHits] = useState(11340);
  const [blocked, setBlocked] = useState(412);
  const cardRef = useRef<HTMLDivElement>(null);
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
      
      const entryIdx = Math.floor(Math.random() * 1000); 
      const entry = { method, path, ms, type: isWaf ? "waf" : isCached ? "cache" : "forward", id: entryIdx };
      
      setReqs((r) => r + burst);
      setHits((h) => h + (isCached ? burst : 0));
      setBlocked((b) => b + (isWaf ? 1 : 0));
      setLog((prev) => [entry, ...prev].slice(0, 4));
    }, 400);
    return () => clearInterval(iv);
  }, []);

  return (
    <div ref={cardRef} className="relative w-full max-w-sm mx-auto monolith-card perspective-1000">
      <div className="border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-3xl shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.03] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-[#00F0FF] animate-pulse shadow-[0_0_10px_#00F0FF]" />
            <span className="font-headline text-[10px] font-black text-white/70 uppercase tracking-[0.3em]">
              EDGE_NODE_ALPHA
            </span>
          </div>
          <span className="font-headline text-[9px] text-[#00F0FF] uppercase tracking-widest animate-pulse font-black">STREAMING</span>
        </div>
        <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
          {[
            { label: "REQS", value: reqs.toLocaleString(), color: "text-white" },
            { label: "HIT", value: hits.toLocaleString(), color: "text-[#34FF8C]" },
            { label: "WAF", value: String(blocked), color: "text-rose-500" },
          ].map((s) => (
            <div key={s.label} className="px-2 py-4 text-center bg-transparent">
              <p className={`text-sm font-headline font-black tabular-nums ${s.color}`}>
                {s.value}
              </p>
              <p className="text-[8px] font-headline text-[#849495] tracking-[0.4em] mt-1 font-black">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="p-4 space-y-2 min-h-[160px] bg-black/40">
          {log.map((entry, i) => (
            <div
              key={`${entry.path}-${i}`}
              className="flex items-center gap-3 border border-white/5 bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.05]"
            >
              <span className={`text-[9px] font-mono font-black w-8 ${entry.method === "GET" ? "text-[#00F0FF]" : "text-[#34FF8C]"}`}>
                {entry.method}
              </span>
              <span className="flex-1 truncate text-[9px] font-mono text-[#849495] font-medium">
                {entry.path}
              </span>
              <span className={`text-[9px] font-mono font-black ${entry.type === "waf" ? "text-rose-500" : entry.type === "cache" ? "text-[#34FF8C]" : "text-white/60"}`}>
                {entry.type === "waf" ? "BLOCKED" : `${entry.ms}ms`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Pricing ─────────────────────────────────────────────────────────────── */
export const Pricing = () => {
  const [isLogged, setIsLogged] = useState(false);
  useEffect(() => { setIsLogged(auth.isLoggedIn()); }, []);

  const plans = [
    { name: "DEVELOPER", sub: "Cloud-Scale Shielding", price: "$0", period: "/forever", desc: "For solo devs and side-project pioneers. No card required.", features: ["1,000 requests/day", "Basic WAF Rules", "Edge Rate Limiting", "Global Caching", "Idempotency (Standard)"], cta: "GET_INITIAL_UPLINK", href: isLogged ? "/dashboard" : "/auth/signup", accent: "#e2e2e2" },
    { name: "PRO", sub: "Production Protocol", price: "$18", period: "/month", desc: "Unlimited power for growing apps. High frequency protection.", features: ["1,000,000 requests/day", "Advanced WAF Core", "Custom Throttling", "Private Cache Engine", "Priority Edge Ops"], cta: "ESTABLISH_PRO_LINK", href: isLogged ? "/dashboard/billing?plan=plus" : "/auth/signup?plan=plus", hot: true, accent: "#00F0FF" },
    { name: "ENTERPRISE", sub: "Empire Architecture", price: "$39", period: "/month", desc: "Total isolation for mission-critical monoliths and clusters.", features: ["Unlimited requests", "Full WAF Customization", "SLA: 99.99% Guaranteed", "Dedicated Data Plane", "White-Glove Integration"], cta: "REQUEST_DEDICATED_NODE", href: isLogged ? "/dashboard/billing?plan=pro" : "/auth/signup?plan=pro", accent: "#34FF8C" }
  ];

  return (
    <section id="pricing" className="py-40 relative bg-[#0e0e0e] border-y border-white/5 overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none" />
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        
        {/* Header Layer */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-32">
          <div className="max-w-xl space-y-4">
            <span className="text-[#34FF8C] font-headline text-[10px] uppercase tracking-[0.8em] font-black drop-shadow-[0_0_15px_#34FF8C]">RESOURCE_ALLOCATION</span>
            <h2 className="font-headline text-6xl md:text-8xl font-black tracking-tighter uppercase text-white leading-none">
              Control your <span className="text-[#00F0FF] text-glow-cyan">Defenses</span>
            </h2>
          </div>
          <p className="text-[#849495] font-headline text-[10px] uppercase tracking-[0.4em] mb-4 font-bold opacity-60">COMMIT_TO_STABILITY // EDGE_V4</p>
        </div>

        {/* Monolith Cards Layer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              className={`relative flex flex-col p-14 lg:p-16 border border-white/5 transition-all duration-500 overflow-hidden min-h-[780px] ${
                plan.hot ? "bg-[#111111]/95 z-20 shadow-[0_0_120px_rgba(0,0,0,0.95)] monolith-card" : "bg-[#0e0e0e]"
              }`}
            >
              {plan.hot && (
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent shadow-[0_0_40px_#00F0FF] z-30" />
              )}
              
              <div className="mb-14">
                <div
                  className="font-headline text-[11px] font-black uppercase tracking-[0.8em] mb-4"
                  style={{ color: plan.accent }}
                >
                  {plan.name}
                </div>
                <div className="text-[10px] font-headline font-black uppercase tracking-[0.3em] text-[#849495] opacity-50">
                  {plan.sub}
                </div>
              </div>

              <div className="mb-12">
                <span className="font-headline text-8xl md:text-9xl font-black text-white tracking-tighter leading-none">
                  {plan.price}
                </span>
                <span className="font-headline text-[10px] font-black text-[#849495] uppercase tracking-[0.4em] ml-4 opacity-40">
                  {plan.period}
                </span>
              </div>

              <p className="font-body text-[#849495] mb-14 border-b border-white/5 pb-14 leading-relaxed text-sm font-medium">
                {plan.desc}
              </p>

              <ul className="space-y-6 mb-16 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-4 text-[10px] font-headline uppercase tracking-[0.2em] text-[#b9cacb] font-black group/item">
                    <CheckCircle2
                      suppressHydrationWarning
                      className="h-4 w-4 flex-shrink-0 transition-transform group-hover/item:scale-110"
                      style={{ color: plan.accent }}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block w-full py-6 text-center font-headline text-[11px] font-black uppercase tracking-[0.4em] transition-all relative overflow-hidden group/btn ${
                  plan.hot
                    ? "bg-[#00F0FF] text-[#003338] hover:bg-[#34FF8C] shadow-[0_0_60px_rgba(0,240,255,0.6)]"
                    : "border border-white/10 text-white hover:border-[#00F0FF] hover:text-[#00F0FF] hover:shadow-[0_0_30px_rgba(0,240,255,0.2)]"
                }`}
              >
                <div className="absolute inset-0 bg-white/40 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 opacity-20" />
                <span className="relative z-10">{plan.cta}</span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Global Referral Layer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-20 border border-white/5 bg-[#0a0a0a]/90 backdrop-blur-4xl p-14 flex flex-col xl:flex-row items-center justify-between gap-12 relative overflow-hidden monolith-card shadow-2xl"
        >
          <div className="absolute top-0 right-0 h-px w-1/2 bg-gradient-to-l from-[#34FF8C]/60 to-transparent" />
          <div className="flex items-center gap-12 relative z-10">
            <div className="w-18 h-18 border border-[#34FF8C]/30 flex items-center justify-center bg-[#111111] shadow-[0_0_50px_rgba(52,255,140,0.2)]">
              <Gift suppressHydrationWarning className="w-10 h-10 text-[#34FF8C]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-headline font-black text-4xl text-white uppercase tracking-tighter leading-none">
                Amplify the network
              </h3>
              <p className="text-[10px] font-headline uppercase tracking-[0.5em] text-[#849495] font-black">
                RECRUIT PEERS. EXTRACT 1 MONTH CLOUD_PRO_REWARD PER ACQUISITION.
              </p>
            </div>
          </div>
          <Link
            href="/auth/signup?next=/dashboard/billing"
            className="group flex items-center justify-center gap-5 bg-[#34FF8C] text-[#0e0e0e] px-14 py-6 font-headline uppercase text-xs font-black tracking-[0.4em] hover:bg-[#00F0FF] transition-all hover:shadow-[0_0_60px_rgba(0,240,255,0.6)] hover:-translate-y-1 active:scale-95 z-10"
          >
            GENERATE_RECRUIT_LINK{" "}
            <ArrowRight suppressHydrationWarning className="h-6 w-6 group-hover:translate-x-3 transition-transform duration-300" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

/* ─── Final CTA ───────────────────────────────────────────────────────────── */
export const FinalCTA = ({ onDemo }: { onDemo: () => void }) => {
  const [isLogged, setIsLogged] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsLogged(auth.isLoggedIn());
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animate('.final-cta-anim', {
            translateY: [60, 0],
            opacity: [0, 1],
            ease: "outExpo",
            duration: 1600,
            delay: stagger(150)
          });
          if (sectionRef.current) observer.unobserve(sectionRef.current);
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#0e0e0e] py-48 border-t border-white/5">
      <div className="absolute inset-0 bg-cyber-grid opacity-40 pointer-events-none" />
      <div className="absolute inset-0 scanline-bg opacity-15 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#00F0FF]/10 blur-[140px] pointer-events-none animate-pulse" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
        <div className="space-y-12">
          <span className="final-cta-anim opacity-0 text-[#00F0FF] font-headline text-[10px] uppercase tracking-[0.6em] font-black block">
            INITIATE_SEQUENCE_V4
          </span>
          <h2 className="final-cta-anim opacity-0 font-headline text-7xl md:text-[120px] font-black tracking-tighter leading-[0.8] text-white">
            Your backend. <br />
            <span className="text-[#00F0FF] text-glow-cyan drop-shadow-[0_0_50px_rgba(0,240,255,0.4)]">Production Gear.</span> <br />
            In 30 seconds.
          </h2>
          <p className="final-cta-anim opacity-0 font-body text-[#b9cacb] text-2xl max-w-2xl mx-auto font-medium opacity-80 leading-relaxed">
            Join the collective shipping with absolute confidence. Free to start. No credit
            card required. Edge-native security artifacts included.
          </p>
          <div className="final-cta-anim opacity-0 flex flex-col sm:flex-row items-center justify-center gap-8 mt-16">
            <Link
              href={isLogged ? "/dashboard" : "/auth/signup"}
              className="group inline-flex items-center justify-center gap-4 bg-[#00F0FF] text-[#003338] px-16 py-7 font-headline font-black uppercase tracking-[0.3em] text-xl transition-all duration-500 shadow-[0_0_60px_rgba(0,240,255,0.5)] hover:bg-[#34FF8C] hover:shadow-[0_0_80px_rgba(52,255,140,0.7)] hover:-translate-y-2 active:scale-95"
            >
              {isLogged ? "DASHBOARD" : "DEPLOY_NOW"}
              <ArrowRight suppressHydrationWarning className="h-7 w-7 group-hover:translate-x-3 transition-transform duration-300" />
            </Link>
            <button
              onClick={() => {
                document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
                onDemo();
              }}
              className="inline-flex items-center gap-3 border border-white/10 px-10 py-7 font-headline font-black uppercase text-xs tracking-[0.4em] text-[#849495] hover:text-[#00F0FF] hover:border-[#00F0FF]/40 transition-all hover:bg-white/[0.02]"
            >
              <TerminalSquare suppressHydrationWarning className="h-5 w-5" />{" "}
              WATCH_DEMO
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── FAQ ─────────────────────────────────────────────────────────────────── */
const faqs = [
  { q: "Does Backport require code changes?", a: "Zero. Our gateway acts as a high-performance proxy. Point your traffic through Backport's DNS or edge IP and you're armed. No SDKs, no middleware, no maintenance." },
  { q: "How is it different from Cloudflare?", a: "Cloudflare is a generic CDN. Backport is a specialized Security Monolith. We provide deep idempotency, LRU Redis caching, and protocol-aware WAF rules specialized for modern APIs — at a 10x cost advantage." },
  { q: "Can I self-host it?", a: "Yes. Backport is container-native. Deploy on Docker, K8s, Railway, or any Linux box. Our free tier is local-first, ensuring you own your security artifacts." },
  { q: "What frameworks does it support?", a: "Everything. Express.js, FastAPI, Django, Rails, Laravel, Go, Rust (Axum/Actix), .NET. If it speaks HTTP, Backport shields it." },
  { q: "Is there a free plan?", a: "The STEALTH plan is permanently free for up to 50k requests/month. Designed for indie hackers, students, and early-stage prototypes." }
];

export const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-40 bg-[#0e0e0e] border-t border-white/5 relative">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00F0FF]/30 to-transparent" />
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-24">
          <span className="text-[#34FF8C] font-headline text-[10px] uppercase tracking-[0.8em] font-black block mb-4">
            SYSTEM_QUERIES
          </span>
          <h2 className="font-headline text-5xl md:text-7xl font-black tracking-tighter uppercase text-white leading-none">
            Protocol <span className="text-[#00F0FF]">FAQ</span>
          </h2>
        </div>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#0a0a0a] border border-white/5 hover:border-[#00F0FF]/30 transition-all duration-300"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-10 text-left group"
              >
                <span className="font-headline font-black text-white uppercase tracking-[0.1em] text-lg pr-12 transition-colors group-hover:text-[#00F0FF]">
                  {faq.q}
                </span>
                <ChevronDown
                  suppressHydrationWarning
                  className={`w-6 h-6 text-[#00F0FF] flex-shrink-0 transition-transform duration-500 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-10 pb-10 text-[#849495] text-base leading-relaxed border-t border-white/5 pt-8 font-medium italic">
                      {`// RESPONSE_DATA: ${faq.a}`}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
