"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
<<<<<<< HEAD
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
=======
import { Check, ChevronDown, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

/* ─── Currency Localization ─────────────────────────────────────────────────── */
type CurrencyCode = "INR" | "USD" | "AED" | "PKR" | "EUR" | "GBP";

interface LocalizedPrice {
  code: CurrencyCode;
  symbol: string;
  plus: number;
  pro: number;
  locale: string;
}

const PRICING: Record<CurrencyCode, LocalizedPrice> = {
  INR: { code: "INR", symbol: "₹", plus: 499, pro: 999, locale: "en-IN" },
  USD: { code: "USD", symbol: "$", plus: 5.99, pro: 11.99, locale: "en-US" },
  AED: { code: "AED", symbol: "AED", plus: 22, pro: 44, locale: "ar-AE" },
  PKR: { code: "PKR", symbol: "Rs", plus: 1670, pro: 3340, locale: "ur-PK" },
  EUR: { code: "EUR", symbol: "€", plus: 5.49, pro: 10.99, locale: "de-DE" },
  GBP: { code: "GBP", symbol: "£", plus: 4.79, pro: 9.59, locale: "en-GB" },
};

function detectUserCurrency(): CurrencyCode {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "INR";
    if (tz === "Asia/Dubai" || tz === "Asia/Muscat") return "AED";
    if (tz === "Asia/Karachi" || tz === "Asia/Lahore") return "PKR";
    // Europe
    if (tz.startsWith("Europe/")) return "EUR";
    // UK specifically
    if (tz === "Europe/London") return "GBP";
  } catch {}
  return "USD";
}

function formatPrice(amount: number, currency: LocalizedPrice): string {
  if (currency.code === "INR") {
    return `${currency.symbol}${Math.round(amount)}`;
  }
  return `${currency.symbol}${amount.toFixed(2)}`;
}

/* ─── PRICING ────────────────────────────────────────────────────────────────── */

export const Pricing = () => {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  useEffect(() => {
    setCurrency(detectUserCurrency());
  }, []);

  const pricing = PRICING[currency];
  const yearlyDiscount = billing === "yearly" ? 0.8 : 1; // 20% off yearly
  const plusPrice = formatPrice(pricing.plus * yearlyDiscount, pricing);
  const proPrice = formatPrice(pricing.pro * yearlyDiscount, pricing);

  const plans = [
    {
      name: "Free",
      desc: "For prototypes and side projects",
      price: "$0",
      period: "3 months",
      features: [
        "100 requests / minute",
        "Basic WAF protection (17 patterns)",
        "Rate limiting",
        "1 API key",
        "LRU caching & idempotency",
        "Dashboard analytics",
      ],
      cta: "Get Started",
      href: "/auth/signup",
    },
    {
      name: "Plus",
      desc: "For growing APIs",
      price: plusPrice,
      period: billing === "yearly" ? "/month (billed yearly)" : "/month",
      features: [
        "500 requests / minute",
        "Response transformation",
        "API mocking",
        "3 API keys",
        "Full analytics dashboard",
        "Export data (JSON/CSV)",
      ],
      cta: "Get Started",
      href: "/auth/signup",
      highlight: true,
    },
    {
      name: "Pro",
      desc: "For production APIs",
      price: proPrice,
      period: billing === "yearly" ? "/month (billed yearly)" : "/month",
      features: [
        "5,000 requests / minute",
        "Custom WAF rules",
        "10 API keys",
        "Webhook notifications",
        "Full analytics + auto docs",
        "Priority support",
      ],
      cta: "Get Started",
      href: "/auth/signup",
    },
  ];

  const currencies: CurrencyCode[] = ["INR", "USD", "AED", "PKR", "EUR", "GBP"];

  return (
    <section id="pricing" className="py-24 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[#2CE8C3] text-sm font-semibold uppercase tracking-widest mb-4 block">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
            Simple, transparent pricing
          </h2>
          <p className="max-w-xl mx-auto text-[#A2BDDB] text-lg">
            Start free. Upgrade when you need more.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            {/* Billing toggle */}
            <div className="flex items-center gap-3">
              <span
                className={`text-sm ${billing === "monthly" ? "text-white" : "text-[#A2BDDB]/50"}`}
              >
                Monthly
              </span>
              <button
                onClick={() =>
                  setBilling(billing === "monthly" ? "yearly" : "monthly")
                }
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  billing === "yearly" ? "bg-[#2CE8C3]" : "bg-white/10"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    billing === "yearly" ? "translate-x-6.5 left-0.5" : "left-0.5"
                  }`}
                />
              </button>
              <span
                className={`text-sm ${billing === "yearly" ? "text-white" : "text-[#A2BDDB]/50"}`}
              >
                Yearly
              </span>
              {billing === "yearly" && (
                <span className="text-xs text-[#2CE8C3] font-medium bg-[#2CE8C3]/10 px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              )}
            </div>

            {/* Currency picker */}
            <div className="relative">
              <button
                onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-[#A2BDDB] hover:text-white hover:border-white/20 transition-all"
              >
                {pricing.symbol} {pricing.code}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showCurrencyPicker && (
                <div className="absolute top-full mt-2 right-0 bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50 min-w-[140px]">
                  {currencies.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setCurrency(c); setShowCurrencyPicker(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-all ${
                        c === currency
                          ? "bg-[#2CE8C3]/10 text-[#2CE8C3]"
                          : "text-[#A2BDDB] hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {PRICING[c].symbol} {PRICING[c].code}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-8 rounded-2xl flex flex-col ${
                plan.highlight
                  ? "bg-[#2CE8C3]/5 border-2 border-[#2CE8C3]/30"
                  : "bg-white/[0.02] border border-white/5"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2CE8C3] text-black text-xs font-semibold px-3 py-1 rounded-full">
                  Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-[#A2BDDB]/60">{plan.desc}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white tracking-tight">{plan.price}</span>
                <span className="text-sm text-[#A2BDDB]/40">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-[#A2BDDB]">
                    <Check className="w-4 h-4 text-[#2CE8C3] mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`w-full py-3 rounded-xl text-sm font-semibold text-center transition-all flex items-center justify-center gap-2 ${
                  plan.highlight
                    ? "bg-[#2CE8C3] text-black hover:bg-white"
                    : "bg-white/5 text-white border border-white/10 hover:border-white/20"
                }`}
              >
                {plan.cta} <ArrowRight className="w-3.5 h-3.5" />
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

<<<<<<< HEAD
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
=======
/* ─── FAQ ────────────────────────────────────────────────────────────────────── */

export const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: "Do I need to change my backend code?",
      a: "No. Backport is a reverse proxy that sits in front of your API. You only need to change the base URL your clients use and add the X-API-Key header. Your backend code stays exactly the same.",
    },
    {
      q: "What languages and frameworks are supported?",
      a: "All of them. Since Backport operates at the HTTP layer, it works with any backend that speaks HTTP/HTTPS — Node.js, Python, Go, Rust, Ruby, Java, PHP, or anything else. No SDK required.",
    },
    {
      q: "How does the WAF work?",
      a: "Backport's WAF uses regex-based pattern matching to inspect incoming requests. It blocks common attack patterns including SQL injection, XSS, path traversal, and command injection before they reach your backend.",
    },
    {
      q: "How does the idempotency feature work?",
      a: "Pass an Idempotency-Key header with your POST requests. If the same key is sent again (e.g., due to a network retry), Backport returns the original response without forwarding the request to your backend. Perfect for payment processing.",
    },
    {
      q: "Is this production-ready?",
      a: "Backport is built for production from day one — enterprise-grade with full API protection. Start with the free 3-month trial to evaluate it for your use case.",
    },
  ];

  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[#6BA9FF] text-sm font-semibold uppercase tracking-widest mb-4 block">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="text-sm font-medium text-white pr-4">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#A2BDDB]/40 flex-shrink-0 transition-transform ${
                    open === i ? "rotate-180 text-[#2CE8C3]" : ""
                  }`}
                />
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
<<<<<<< HEAD
                    <p className="px-10 pb-10 font-body text-[#A2BDDB] leading-relaxed text-base italic opacity-80 border-t border-white/5 pt-8">
                       // RESPONSE: {faq.a}
=======
                    <p className="px-5 pb-5 text-sm text-[#A2BDDB]/80 leading-relaxed border-t border-white/5 pt-4">
                      {faq.a}
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
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

<<<<<<< HEAD
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
=======
/* ─── FINAL CTA ─────────────────────────────────────────────────────────────── */

export const FinalCTA = () => {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#080C10] via-[#080C10] to-black pointer-events-none" />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
          Ready to protect your API?
        </h2>
        <p className="text-[#A2BDDB] text-lg max-w-xl mx-auto mb-10">
          Get started in 30 seconds. No credit card required. Your API gets
          WAF protection, rate limiting, and caching instantly.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/signup"
            className="bg-[#2CE8C3] hover:bg-white text-black px-8 py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-[#2CE8C3]/10 flex items-center gap-2"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/docs"
            className="text-[#A2BDDB] hover:text-white px-8 py-3.5 rounded-xl font-medium border border-white/10 hover:border-white/20 transition-all"
          >
            Read the Docs
          </Link>
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
        </div>
      </div>
    </section>
  );
};
