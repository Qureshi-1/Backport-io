"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRight, CheckCircle2, Zap, Shield, Database, ChevronDown, X, Loader2 } from "lucide-react";
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
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <section className="mb-20">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

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
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
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
            </Link>
          </div>
        </section>
      </div>

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
    </div>
  );
}
