"use client";
import Link from "next/link";
<<<<<<< HEAD
import { ArrowRight, CheckCircle2, Film, Users, Briefcase, Building2, Zap, Shield, Database, Clock, Phone, Mail, Globe, Server } from "lucide-react";
import MatrixBackground from "@/components/MatrixBackground";

export default function TiersPage() {
  const tiers = [
    {
      icon: Film,
      name: "VIDEO",
      subtitle: "Content Creators & Streaming",
      price: "Free",
      period: "forever",
      color: "#00F0FF",
      description: "Perfect for video APIs, streaming services, and CDN protection.",
      features: [
        { text: "50,000 requests/month", included: true },
        { text: "Basic WAF protection", included: true },
        { text: "Rate limiting (60 req/min)", included: true },
        { text: "1 API Gateway", included: true },
        { text: "In-memory cache", included: true },
        { text: "Email support", included: true },
        { text: "AI-enhanced WAF", included: false },
        { text: "Multi-gateway", included: false },
        { text: "Dedicated VPC", included: false },
      ],
      cta: "Start Free",
      href: "/auth/signup?plan=video"
    },
    {
      icon: Users,
      name: "INDIE",
      subtitle: "Solo Developers & Hobbyists",
      price: "$0",
      period: "forever",
      color: "#34FF8C",
      description: "Built for individual developers building side projects.",
      features: [
        { text: "50,000 requests/month", included: true },
        { text: "Full WAF protection", included: true },
        { text: "Rate limiting (60 req/min)", included: true },
        { text: "1 API Gateway", included: true },
        { text: "LRU Cache", included: true },
        { text: "Idempotency keys", included: true },
        { text: "Community support", included: true },
        { text: "Basic analytics", included: true },
        { text: "API key management", included: true },
      ],
      cta: "Get Started",
      href: "/auth/signup?plan=indie",
      popular: true
    },
    {
      icon: Briefcase,
      name: "STARTUP",
      subtitle: "Growing Teams & MVPs",
      price: "$39",
      period: "/month",
      color: "#ffd700",
      description: "For teams scaling from prototype to production.",
      features: [
        { text: "1,000,000 requests/month", included: true },
        { text: "AI-enhanced WAF", included: true },
        { text: "Rate limiting (1000 req/min)", included: true },
        { text: "Up to 10 Gateways", included: true },
        { text: "Distributed Redis cache", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Priority support", included: true },
        { text: "Custom domain SSL", included: true },
        { text: "Webhook alerts", included: true },
      ],
      cta: "Start Trial",
      href: "/auth/signup?plan=startup"
    },
    {
      icon: Building2,
      name: "ENTERPRISE",
      subtitle: "Large Scale & Mission Critical",
      price: "Custom",
      period: "",
      color: "#ff6b6b",
      description: "Dedicated infrastructure with SLA guarantees.",
      features: [
        { text: "Unlimited requests", included: true },
        { text: "Custom WAF rules", included: true },
        { text: "Custom rate limits", included: true },
        { text: "Unlimited Gateways", included: true },
        { text: "Dedicated VPC", included: true },
        { text: "24/7 Phone support", included: true },
        { text: "SLA guarantee", included: true },
        { text: "White-label option", included: true },
        { text: "Custom integrations", included: true },
      ],
      cta: "Contact Sales",
      href: "mailto:enterprise@backportio.com"
    }
  ];

  const comparisons = [
    { feature: "Requests/month", video: "50,000", indie: "50,000", startup: "1,000,000", enterprise: "Unlimited" },
    { feature: "API Gateways", video: "1", indie: "1", startup: "10", enterprise: "Unlimited" },
    { feature: "WAF Protection", video: "Basic", indie: "Full", startup: "AI-Enhanced", enterprise: "Custom" },
    { feature: "Rate Limit", video: "60/min", indie: "60/min", startup: "1000/min", enterprise: "Custom" },
    { feature: "Cache", video: "In-memory", indie: "LRU Cache", startup: "Distributed Redis", enterprise: "Custom" },
    { feature: "Analytics", video: "Basic", indie: "Basic", startup: "Advanced", enterprise: "Custom" },
    { feature: "Support", video: "Email", indie: "Community", startup: "Priority", enterprise: "24/7 Phone" },
    { feature: "SSL Certificates", video: "✓", indie: "✓", startup: "✓", enterprise: "Custom" },
    { feature: "Custom Domain", video: "✗", indie: "✗", startup: "✓", enterprise: "✓" },
    { feature: "VPC Deployment", video: "✗", indie: "✗", startup: "✗", enterprise: "✓" },
    { feature: "SLA", video: "✗", indie: "✗", startup: "99.9%", enterprise: "99.99%" },
  ];

  return (
    <div className="relative min-h-screen bg-[#0e0e0e] text-[#e2e2e2]">
      
      <div className="mx-auto max-w-7xl px-6 py-24 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-[10px] uppercase font-headline tracking-widest font-bold mb-6">
            <span className="h-2 w-2 rounded-full bg-[#00F0FF] animate-pulse" />
            PRICING TIERS
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-headline uppercase tracking-widest text-white mb-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
            Choose Your <span className="text-[#00F0FF] drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]">Plan</span>
          </h1>
          <p className="text-xl text-[#849495] font-mono max-w-2xl mx-auto uppercase tracking-widest text-[14px]">
            From individual developers to enterprise teams. Scale as you grow.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {tiers.map((tier) => (
            <div 
              key={tier.name} 
              className={`relative p-8 rounded-none border transition-all ${
                tier.popular 
                  ? 'border-[#00F0FF]/50 bg-[#00F0FF]/5 shadow-[0_0_40px_rgba(0,240,255,0.15)]' 
                  : 'border-[#3b494b]/50 bg-[#111111]/80 hover:border-[#00F0FF]/30'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#00F0FF] text-[#003338] text-[10px] font-headline tracking-widest uppercase font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                  MOST POPULAR
                </div>
              )}
              
              <tier.icon className="w-10 h-10 mb-4" style={{ color: tier.color }} />
              <span className="text-[10px] font-headline font-bold text-[#849495] uppercase tracking-[0.2em]">{tier.name}</span>
              <h3 className="text-xl font-headline font-bold text-[#e2e2e2] uppercase tracking-widest mt-1 mb-2">{tier.subtitle}</h3>
              <p className="text-sm text-[#849495] font-mono mb-6">{tier.description}</p>
              
              <div className="mb-6">
                <span className="text-4xl font-headline font-bold text-[#00F0FF]">{tier.price}</span>
                {tier.period && <span className="text-[#849495] font-mono text-sm ml-1 uppercase">{tier.period}</span>}
              </div>

              <Link 
                href={tier.href}
                className={`block w-full py-4 text-center rounded-none font-headline font-bold text-[11px] uppercase tracking-widest transition-all mb-8 ${
                  tier.popular 
                    ? 'bg-[#00F0FF] text-[#003338] hover:bg-[#34FF8C] hover:shadow-[0_0_20px_rgba(52,255,140,0.3)]' 
                    : 'border border-[#3b494b] text-[#b9cacb] hover:text-[#00F0FF] hover:border-[#00F0FF] hover:shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                }`}
              >
                {tier.cta}
              </Link>

              <ul className="space-y-3">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs font-mono">
                    {f.included ? (
                      <CheckCircle2 className="w-4 h-4 text-[#34FF8C] flex-shrink-0" />
                    ) : (
                      <span className="w-4 h-4 text-[#3b494b] flex-shrink-0">✗</span>
                    )}
                    <span className={f.included ? 'text-[#b9cacb]' : 'text-[#849495]'}>{f.text}</span>
=======
import { useState, useEffect } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, X, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { PRICING, detectUserCurrency, formatPrice, ALL_CURRENCIES, type CurrencyCode } from "@/lib/currency";

export default function TiersPage() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", company: "", message: "" });
  const [contactStatus, setContactStatus] = useState<{ state: "idle" | "submitting" | "success" | "error"; text: string }>({ state: "idle", text: "" });

  useEffect(() => {
    setCurrency(detectUserCurrency());
  }, []);

  const p = PRICING[currency];
  const yearlyDiscount = billing === "yearly" ? 0.8 : 1;
  const plusPriceStr = formatPrice(p.plus * yearlyDiscount, p);
  const proPriceStr = formatPrice(p.pro * yearlyDiscount, p);
  // Enterprise is contract-based — no fixed price
  const enterprisePriceLabel = "Custom";

  const tiers = [
    {
      name: "FREE",
      subtitle: "Get Started",
      price: "$0",
      period: "3 months",
      color: "#2CE8C3",
      description: "Try every feature free for 3 months. No credit card required.",
      features: [
        { text: "100 requests/minute", included: true },
        { text: "1 API key", included: true },
        { text: "Rate limiting (sliding window)", included: true },
        { text: "WAF security (17 patterns)", included: true },
        { text: "LRU caching", included: true },
        { text: "Idempotency keys", included: true },
        { text: "Dashboard analytics", included: true },
        { text: "Request logs", included: true },
        { text: "Email support", included: true },
      ],
      cta: "Start Free",
      href: "/auth/signup",
    },
    {
      name: "PLUS",
      subtitle: "For Growing Projects",
      price: plusPriceStr,
      period: billing === "yearly" ? "/mo (billed yearly)" : "/month",
      color: "#6BA9FF",
      description: "Response transformation, API mocking, and higher throughput for growing APIs.",
      features: [
        { text: "500 requests/minute", included: true },
        { text: "3 API keys", included: true },
        { text: "Response transformation", included: true },
        { text: "API mocking", included: true },
        { text: "WAF security (17 patterns)", included: true },
        { text: "Rate limiting (sliding window)", included: true },
        { text: "Dashboard analytics", included: true },
        { text: "Request logs with export", included: true },
        { text: "Priority support", included: true },
      ],
      cta: "Upgrade to Plus",
      href: "/dashboard/billing",
      popular: true,
    },
    {
      name: "PRO",
      subtitle: "For Production APIs",
      price: proPriceStr,
      period: billing === "yearly" ? "/mo (billed yearly)" : "/month",
      color: "#ffd700",
      description: "For production APIs with custom WAF rules, webhooks, and high throughput.",
      features: [
        { text: "5,000 requests/minute", included: true },
        { text: "10 API keys", included: true },
        { text: "Custom WAF rules", included: true },
        { text: "Webhook notifications", included: true },
        { text: "Response transformation", included: true },
        { text: "API mocking", included: true },
        { text: "Full dashboard analytics", included: true },
        { text: "JSON + CSV log export", included: true },
        { text: "Priority support", included: true },
      ],
      cta: "Upgrade to Pro",
      href: "/dashboard/billing",
    },
    {
      name: "ENTERPRISE",
      subtitle: "For Teams at Scale",
      price: enterprisePriceLabel,
      period: "Contract-based",
      color: "#f97316",
      description: "Unlimited scale for enterprise teams, critical workloads, and custom integrations.",
      features: [
        { text: "Unlimited requests/minute", included: true },
        { text: "50 API keys", included: true },
        { text: "Custom WAF + rate rules", included: true },
        { text: "Team collaboration", included: true },
        { text: "Webhook + Slack/Discord", included: true },
        { text: "Dedicated support & SLA", included: true },
        { text: "Custom integrations", included: true },
        { text: "Full dashboard analytics", included: true },
        { text: "On-call engineering", included: true },
      ],
      cta: "Contact Sales",
      href: "#contact-enterprise",
      enterprise: true,
    },
  ];

  const comparisons = [
    { feature: "Requests / min", free: "100", plus: "500", pro: "5,000", enterprise: "Unlimited" },
    { feature: "Max API Keys", free: "1", plus: "3", pro: "10", enterprise: "50" },
    { feature: "Response Transform", free: "-", plus: "Yes", pro: "Yes", enterprise: "Yes" },
    { feature: "API Mocking", free: "-", plus: "Yes", pro: "Yes", enterprise: "Yes" },
    { feature: "Custom WAF Rules", free: "-", plus: "-", pro: "Yes", enterprise: "Yes + Custom" },
    { feature: "Webhooks", free: "-", plus: "-", pro: "Yes", enterprise: "Yes + Slack" },
    { feature: "Team Collaboration", free: "-", plus: "-", pro: "-", enterprise: "Yes" },
    { feature: "WAF Protection", free: "17 patterns", plus: "17 patterns", pro: "17 + Custom", enterprise: "17 + Custom" },
    { feature: "Dashboard Analytics", free: "Basic", plus: "Full", pro: "Full", enterprise: "Full + Exports" },
    { feature: "Log Export", free: "-", plus: "JSON + CSV", pro: "JSON + CSV", enterprise: "All Formats" },
    { feature: "Support", free: "Email", plus: "Priority", pro: "Priority", enterprise: "Dedicated + SLA" },
    { feature: "Price", free: "$0 (3 months)", plus: `${plusPriceStr}/mo`, pro: `${proPriceStr}/mo`, enterprise: "Custom" },
  ];

  return (
    <div className="relative min-h-screen bg-[#080C10] text-[#e2e2e2]">
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-24 pt-32 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="text-[#2CE8C3] text-xs font-semibold uppercase tracking-wider">
              Pricing
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Simple, Honest <span className="text-[#2CE8C3]">Pricing</span>
          </h1>
          <p className="text-xl text-[#A2BDDB]/50 max-w-2xl mx-auto">
            Pay only for what exists. No hidden fees, no fake features. Every feature listed below is live and working right now.
          </p>

          {/* Billing toggle + Currency picker */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <div className="flex items-center gap-3">
              <span className={`text-sm ${billing === "monthly" ? "text-white" : "text-[#A2BDDB]/40"}`}>Monthly</span>
              <button
                onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
                className="relative w-11 h-6 rounded-full transition-colors duration-300"
                style={{ backgroundColor: billing === "yearly" ? "#2CE8C3" : "rgba(255,255,255,0.08)" }}
                aria-label="Toggle billing period"
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-300"
                  style={{ left: billing === "yearly" ? "22px" : "2px" }}
                />
              </button>
              <span className={`text-sm ${billing === "yearly" ? "text-white" : "text-[#A2BDDB]/40"}`}>Yearly</span>
              {billing === "yearly" && (
                <span className="text-xs text-[#2CE8C3] font-medium bg-[#2CE8C3]/10 px-2.5 py-0.5 rounded-full border border-[#2CE8C3]/20">
                  Save 20%
                </span>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-[#A2BDDB] hover:text-white hover:border-white/20 transition-all"
              >
                {p.symbol} {p.code}
                <ChevronDown className={`w-3 h-3 transition-transform ${showCurrencyPicker ? "rotate-180" : ""}`} />
              </button>
              {showCurrencyPicker && (
                <div className="absolute top-full mt-2 right-0 bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50 min-w-[140px]">
                  {ALL_CURRENCIES.map((c) => (
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

        {/* Tier Cards */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-20 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative p-8 rounded-2xl border transition-all ${
                tier.popular
                  ? 'border-[#2CE8C3]/40 bg-[#2CE8C3]/[0.04] shadow-lg shadow-[#2CE8C3]/5'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-[#2CE8C3]/20'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#2CE8C3] text-[#080C10] text-[10px] uppercase tracking-wider font-bold rounded-full">
                  Most Popular
                </div>
              )}

              <span className="text-[10px] font-medium text-[#A2BDDB]/30 uppercase tracking-[0.2em]">{tier.name}</span>
              <h3 className="text-xl font-bold text-white mt-1 mb-2">{tier.subtitle}</h3>
              <p className="text-sm text-[#A2BDDB]/40 mb-6 leading-relaxed">{tier.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                {tier.period && <span className="text-[#A2BDDB]/30 text-sm ml-1">{tier.period}</span>}
              </div>

              {tier.enterprise ? (
                <button
                  onClick={() => setShowContactModal(true)}
                  className="block w-full py-4 text-center rounded-xl font-semibold text-sm transition-all mb-8 bg-[#f97316] text-[#080C10] hover:bg-[#fbbf24]"
                >
                  {tier.cta}
                </button>
              ) : (
                <Link
                  href={tier.href}
                  className={`block w-full py-4 text-center rounded-xl font-semibold text-sm transition-all mb-8 ${
                    tier.popular
                      ? 'bg-[#2CE8C3] text-[#080C10] hover:bg-white'
                      : 'border border-white/[0.08] text-[#A2BDDB]/60 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {tier.cta}
                </Link>
              )}

              <ul className="space-y-3">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${f.included ? 'text-[#2CE8C3]' : 'text-white/10'}`} />
                    <span className={f.included ? 'text-[#A2BDDB]/60' : 'text-[#A2BDDB]/20'}>{f.text}</span>
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <section className="mb-20">
<<<<<<< HEAD
          <h2 className="text-3xl font-bold font-headline uppercase tracking-widest text-white mb-8 text-center drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
            Detailed <span className="text-[#00F0FF] drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]">Comparison</span>
          </h2>
          <div className="overflow-x-auto rounded-none border border-[#3b494b]/50 bg-[#111111]/80 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#3b494b]/50">
                  <th className="p-4 text-[#849495] font-headline uppercase tracking-widest text-[11px]">Feature</th>
                  <th className="p-4 text-center text-[#00F0FF] font-headline uppercase tracking-widest text-[11px]">Video</th>
                  <th className="p-4 text-center text-[#34FF8C] font-headline uppercase tracking-widest text-[11px]">Indie</th>
                  <th className="p-4 text-center text-yellow-400 font-headline uppercase tracking-widest text-[11px]">Startup</th>
                  <th className="p-4 text-center text-rose-400 font-headline uppercase tracking-widest text-[11px]">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3b494b]/30">
                {comparisons.map((row) => (
                  <tr key={row.feature} className="hover:bg-[#00F0FF]/5 transition-colors font-mono text-sm">
                    <td className="p-4 text-[#e2e2e2] font-medium">{row.feature}</td>
                    <td className="p-4 text-center text-[#849495]">{row.video}</td>
                    <td className="p-4 text-center text-[#849495]">{row.indie}</td>
                    <td className="p-4 text-center text-[#849495]">{row.startup}</td>
                    <td className="p-4 text-center text-[#849495]">{row.enterprise}</td>
=======
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Detailed <span className="text-[#2CE8C3]">Comparison</span>
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="p-4 text-[#A2BDDB]/30 uppercase tracking-wider text-sm font-medium">Feature</th>
                  <th className="p-4 text-center text-[#2CE8C3] uppercase tracking-wider text-sm font-medium">Free</th>
                  <th className="p-4 text-center text-[#6BA9FF] uppercase tracking-wider text-sm font-medium">Plus</th>
                  <th className="p-4 text-center text-[#FBBF24] uppercase tracking-wider text-sm font-medium">Pro</th>
                  <th className="p-4 text-center text-[#f97316] uppercase tracking-wider text-sm font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {comparisons.map((row) => (
                  <tr key={row.feature} className="hover:bg-white/[0.02] transition-colors text-sm">
                    <td className="p-4 text-white/80 font-medium">{row.feature}</td>
                    <td className="p-4 text-center text-[#A2BDDB]/50">{row.free}</td>
                    <td className="p-4 text-center text-[#A2BDDB]/50">{row.plus}</td>
                    <td className="p-4 text-center text-[#A2BDDB]/50">{row.pro}</td>
                    <td className="p-4 text-center text-[#A2BDDB]/50">{row.enterprise || "-"}</td>
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

<<<<<<< HEAD
        {/* Use Case Breakdown */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold font-headline uppercase tracking-widest text-[#e2e2e2] mb-8 text-center drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
            Which Tier is <span className="text-[#00F0FF] drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]">Right for You</span>?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-none border border-[#00F0FF]/20 bg-[#00F0FF]/5 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
              <Film className="w-10 h-10 text-[#00F0FF] mb-4" />
              <h3 className="text-xl font-headline tracking-widest uppercase font-bold text-[#e2e2e2] mb-2">Video / Streaming</h3>
              <p className="text-[#849495] font-mono text-[11px] mb-4">
                Building a video platform, streaming service, or CDN? Start with our free Video tier and get basic rate limiting, WAF protection, and caching.
              </p>
              <ul className="space-y-2 text-[#849495] font-mono text-[11px]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#00F0FF]" /> Handle traffic spikes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#00F0FF]" /> Protect against scraping</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#00F0FF]" /> Cache popular content</li>
              </ul>
            </div>
            
            <div className="p-8 rounded-none border border-[#34FF8C]/20 bg-[#34FF8C]/5 shadow-[0_0_20px_rgba(52,255,140,0.1)]">
              <Users className="w-10 h-10 text-[#34FF8C] mb-4" />
              <h3 className="text-xl font-headline tracking-widest uppercase font-bold text-[#e2e2e2] mb-2">Indie / Hobby</h3>
              <p className="text-[#849495] font-mono text-[11px] mb-4">
                Building a side project or personal API? Our free Indie tier gives you everything you need to ship without worrying about infrastructure.
              </p>
              <ul className="space-y-2 text-[#849495] font-mono text-[11px]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#34FF8C]" /> No credit card required</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#34FF8C]" /> Full WAF protection</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#34FF8C]" /> Focus on building</li>
              </ul>
            </div>
            
            <div className="p-8 rounded-none border border-yellow-500/20 bg-yellow-500/5 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
              <Briefcase className="w-10 h-10 text-yellow-400 mb-4" />
              <h3 className="text-xl font-headline tracking-widest uppercase font-bold text-[#e2e2e2] mb-2">Startup / MVP</h3>
              <p className="text-[#849495] font-mono text-[11px] mb-4">
                Scaling your team and product? The Startup tier gives you enterprise features at a fraction of the cost.
              </p>
              <ul className="space-y-2 text-[#849495] font-mono text-[11px]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-400" /> Scale with traffic</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-400" /> Advanced analytics</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-400" /> Priority support</li>
              </ul>
            </div>
            
            <div className="p-8 rounded-none border border-rose-500/20 bg-rose-500/5 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
              <Building2 className="w-10 h-10 text-rose-400 mb-4" />
              <h3 className="text-xl font-headline tracking-widest uppercase font-bold text-[#e2e2e2] mb-2">Enterprise</h3>
              <p className="text-[#849495] font-mono text-[11px] mb-4">
                Mission-critical infrastructure? Get dedicated resources, custom SLAs, and 24/7 support.
              </p>
              <ul className="space-y-2 text-[#849495] font-mono text-[11px]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-400" /> Dedicated VPC</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-400" /> Custom integrations</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-400" /> 24/7 phone support</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ROI Calculator Preview */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold font-headline uppercase tracking-widest text-white mb-8 text-center drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
            Calculate Your <span className="text-[#00F0FF] drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]">Savings</span>
          </h2>
          <div className="p-8 rounded-none border border-[#00F0FF]/20 bg-[#00F0FF]/5">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <Zap className="w-10 h-10 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                <h3 className="text-4xl font-headline tracking-widest font-bold text-white mb-2">90%</h3>
                <p className="text-[#849495] font-mono text-[11px] uppercase tracking-widest">Database cost reduction with caching</p>
              </div>
              <div>
                <Shield className="w-10 h-10 text-[#34FF8C] mx-auto mb-4 drop-shadow-[0_0_8px_rgba(52,255,140,0.5)]" />
                <h3 className="text-4xl font-headline tracking-widest font-bold text-white mb-2">94%</h3>
                <p className="text-[#849495] font-mono text-[11px] uppercase tracking-widest">Less API abuse with rate limiting</p>
              </div>
              <div>
                <Database className="w-10 h-10 text-[#00F0FF] mx-auto mb-4 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
                <h3 className="text-4xl font-headline tracking-widest font-bold text-white mb-2">60%</h3>
                <p className="text-[#849495] font-mono text-[11px] uppercase tracking-widest">Cheaper than AWS API Gateway</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold font-headline uppercase tracking-widest text-[#e2e2e2] mb-8 text-center drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
            Frequently Asked <span className="text-[#00F0FF] drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]">Questions</span>
          </h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              { q: "Can I change plans later?", a: "Yes! You can upgrade instantly and downgrade at the end of your billing cycle." },
              { q: "What happens if I exceed my limit?", a: "Requests will return HTTP 429. You can upgrade anytime to get more requests." },
              { q: "Is there a free trial for paid plans?", a: "Yes! The Startup plan comes with a 14-day free trial. No credit card required." },
              { q: "Can I self-host Backport?", a: "Yes! All plans support self-hosting with the same features." },
              { q: "Do you offer refunds?", a: "Yes, we offer a 30-day money-back guarantee on all paid plans." },
            ].map((faq, i) => (
              <div key={i} className="p-6 rounded-none border border-[#3b494b]/50 bg-[#111111]/80 backdrop-blur-sm">
                <h3 className="text-lg font-headline tracking-widest uppercase font-bold text-[#00F0FF] mb-2">{faq.q}</h3>
                <p className="text-[#849495] font-mono text-sm">{faq.a}</p>
=======
        {/* FAQ */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Frequently Asked <span className="text-[#2CE8C3]">Questions</span>
          </h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              { q: "Can I change plans later?", a: "Yes. You can upgrade from your billing page at any time. Downgrades take effect at the next billing cycle." },
              { q: "What happens if I exceed my rate limit?", a: "Requests that exceed your plan's rate limit get HTTP 429 (Too Many Requests). Your backend is never hit. Upgrade to get a higher limit." },
              { q: "How does payment work?", a: "Payments are processed through Razorpay (INR). Your card details are handled by Razorpay — we never store them. International users see prices in their local currency for reference." },
              { q: "Is the free plan actually free?", a: "Yes. You get full access to all features for 3 months, free. No credit card required. After 3 months, you can upgrade to a paid plan to continue using the service." },
              { q: "What features are planned?", a: "We're working on automatic log retention, team usage analytics, and more. Check the changelog for the latest updates." },
            ].map((faq, i) => (
              <div key={i} className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <h3 className="text-lg font-bold text-[#2CE8C3] mb-2">{faq.q}</h3>
                <p className="text-[#A2BDDB]/50 text-sm leading-relaxed">{faq.a}</p>
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
<<<<<<< HEAD
          <h2 className="text-4xl font-bold font-headline uppercase tracking-widest text-white mb-4 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
            Start <span className="text-[#34FF8C] drop-shadow-[0_0_15px_rgba(52,255,140,0.6)]">Protecting</span> Your APIs
          </h2>
          <p className="text-[#849495] font-mono uppercase tracking-[0.2em] mb-8 text-[11px]">No credit card required. Free forever for indie developers.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 bg-[#00F0FF] text-[#003338] px-8 py-4 font-headline uppercase tracking-widest font-bold hover:bg-[#34FF8C] hover:shadow-[0_0_20px_rgba(52,255,140,0.4)] transition-all">
              Initialize Uplink <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/setup-guide" className="inline-flex items-center justify-center gap-2 border border-[#3b494b] text-[#b9cacb] px-8 py-4 font-headline uppercase tracking-widest font-bold hover:border-[#00F0FF] hover:text-[#00F0FF] hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all">
              View Specs
=======
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to <span className="text-[#2CE8C3]">Get Started</span>?
          </h2>
          <p className="text-[#A2BDDB]/30 mb-8 text-sm">Free plan available. No credit card required.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 bg-[#2CE8C3] text-[#080C10] px-8 py-4 font-semibold rounded-xl hover:bg-white transition-colors">
              Create Free Account <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/docs" className="inline-flex items-center justify-center gap-2 border border-white/[0.08] text-[#A2BDDB]/60 px-8 py-4 font-semibold rounded-xl hover:bg-white/[0.04] hover:text-white transition-colors">
              Read Docs
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
            </Link>
          </div>
        </section>
      </div>
<<<<<<< HEAD
=======

      {/* ═══ Contact Sales Modal ═══ */}
      {showContactModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => contactStatus.state !== "submitting" && setShowContactModal(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setShowContactModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>

            {contactStatus.state === "success" ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Inquiry Sent!</h3>
                <p className="text-zinc-400 text-sm mb-6">Thanks for your interest. We&apos;ll get back to you within 24 hours.</p>
                <button
                  onClick={() => { setShowContactModal(false); setContactStatus({ state: "idle", text: "" }); setContactForm({ name: "", email: "", company: "", message: "" }); }}
                  className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-colors"
                >Close</button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-1">Enterprise Inquiry</h3>
                  <p className="text-zinc-500 text-sm">Tell us about your needs. We&apos;ll reach out within 24 hours.</p>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!contactForm.name.trim() || !contactForm.email.trim() || contactForm.message.trim().length < 10) return;
                  setContactStatus({ state: "submitting", text: "" });
                  try {
                    const res = await fetch("/api/proxy/contact-sales", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(contactForm),
                    });
                    if (res.ok) setContactStatus({ state: "success", text: "" });
                    else setContactStatus({ state: "error", text: "Something went wrong." });
                  } catch { setContactStatus({ state: "error", text: "Could not connect." }); }
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Name *</label>
                    <input required type="text" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#f97316] outline-none" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email *</label>
                    <input required type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#f97316] outline-none" placeholder="you@company.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Company</label>
                    <input type="text" value={contactForm.company} onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#f97316] outline-none" placeholder="Your company (optional)" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Message *</label>
                    <textarea required minLength={10} value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} rows={3} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#f97316] outline-none resize-none" placeholder="Tell us about your requirements..." />
                  </div>
                  {contactStatus.state === "error" && <div className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{contactStatus.text}</div>}
                  <button type="submit" disabled={contactStatus.state === "submitting"} className="w-full py-3.5 rounded-xl bg-[#f97316] hover:bg-[#fbbf24] text-black font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {contactStatus.state === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
                    Send Inquiry
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
    </div>
  );
}
