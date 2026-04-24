"use client";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield, Zap, Globe, Code } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SetupGuidePage() {
  const steps = [
    {
      step: "01",
      title: "Sign Up",
      desc: "Create your free account at backport.in/auth/signup. Enter your email and choose a password.",
      code: "Visit: backport.in/auth/signup",
      icon: Code,
      color: "#04e184"
    },
    {
      step: "02",
      title: "Verify Your Email",
      desc: "A 6-digit OTP is sent to your email. Enter it to verify your account. Your API key is returned automatically after verification.",
      code: "Check your inbox for the OTP code",
      icon: Shield,
      color: "#6BA9FF"
    },
    {
      step: "03",
      title: "Set Your Backend URL",
      desc: "Go to Dashboard → Settings → Target Backend URL. Enter the URL of your existing API server (e.g. https://my-api.example.com).",
      code: "Dashboard → Settings → Target Backend URL",
      icon: Globe,
      color: "#ffd700"
    },
    {
      step: "04",
      title: "Start Proxying",
      desc: "Send requests through the Backport gateway using your API key. All traffic passes through WAF, rate limiting, caching, and idempotency before reaching your backend.",
      code: 'curl -H "X-API-Key: bk_xxx" https://backport.in/proxy/your-endpoint',
      icon: Zap,
      color: "#ff6b6b"
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#080C10] text-[#e2e2e2]">
      <Header />
      <div className="mx-auto max-w-4xl px-6 py-24 pt-32 relative z-10">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-[#A2BDDB]/30 mb-10">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="text-[#A2BDDB]/15">/</span>
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span className="text-[#A2BDDB]/15">/</span>
          <span className="text-white/60">Setup Guide</span>
        </div>

        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#04e184]/[0.08] border border-[#04e184]/20 text-[#04e184] text-xs font-bold mb-6">
            <span className="h-2 w-2 rounded-full bg-[#04e184] animate-pulse" />
            SETUP GUIDE
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Get Started in <span className="text-[#04e184]">2 Minutes</span>
          </h1>
          <p className="text-xl text-[#A2BDDB]/50 max-w-2xl mx-auto">
            Sign up, point to your backend, and start proxying. No code changes required.
          </p>
        </div>

        {/* Step by Step */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            4-Step <span className="text-[#04e184]">Quick Start</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((s) => (
              <div key={s.step} className="relative p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03] transition-all">
                <div className="absolute top-4 right-4 text-6xl font-bold text-white/[0.03]" style={{ color: s.color }}>
                  {s.step}
                </div>
                <s.icon className="w-10 h-10 mb-4" style={{ color: s.color }} />
                <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                <p className="text-[#A2BDDB]/50 mb-4 text-sm leading-relaxed">{s.desc}</p>
                <div className="bg-black/30 rounded-lg p-3 font-mono text-xs text-[#04e184]/70 overflow-x-auto">
                  {s.code}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Prerequisites */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Prerequisites
          </h2>
          <div className="grid md:grid-cols-1 gap-8">
            <div className="p-8 rounded-2xl border border-[#04e184]/15 bg-[#04e184]/[0.02] max-w-lg mx-auto w-full">
              <h3 className="text-lg font-bold text-white mb-4">What You Need</h3>
              <ul className="space-y-3 text-[#A2BDDB]/50">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#04e184]" /> A web browser</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#04e184]" /> An email account (for verification)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#04e184]" /> An existing API or backend server</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Common Use Cases */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Common <span className="text-[#04e184]">Use Cases</span>
          </h2>
          <div className="space-y-4">
            <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <h3 className="text-lg font-bold text-white mb-2">Protect Public APIs</h3>
              <p className="text-[#A2BDDB]/50 mb-3 text-sm leading-relaxed">Block malicious requests before they hit your server. Enable WAF from dashboard settings.</p>
              <code className="text-xs text-[#04e184]/70 bg-black/30 px-3 py-2 rounded">WAF: ON | Rate Limit: 100 req/min | Cache: OFF</code>
            </div>
            <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <h3 className="text-lg font-bold text-white mb-2">Speed Up Read Operations</h3>
              <p className="text-[#A2BDDB]/50 mb-3 text-sm leading-relaxed">Cache frequently accessed GET data. Ideal for analytics, lists, and dashboard endpoints.</p>
              <code className="text-xs text-[#04e184]/70 bg-black/30 px-3 py-2 rounded">WAF: ON | Rate Limit: 100 req/min | Cache: ON | TTL: 5 min</code>
            </div>
            <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <h3 className="text-lg font-bold text-white mb-2">Prevent Duplicate Payments</h3>
              <p className="text-[#A2BDDB]/50 mb-3 text-sm leading-relaxed">Use idempotency keys on checkout endpoints to prevent double-charging on retry.</p>
              <code className="text-xs text-[#04e184]/70 bg-black/30 px-3 py-2 rounded">WAF: ON | Rate Limit: 100 req/min | Idempotency: ON</code>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to <span className="text-[#04e184]">Get Started</span>?
          </h2>
          <p className="text-[#A2BDDB]/40 mb-8 text-sm">Free plan available. No credit card required.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-[#04e184] text-black px-8 py-4 rounded-xl font-bold hover:bg-white transition-colors">
              Create Free Account <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/docs" className="inline-flex items-center gap-2 border border-white/[0.08] text-[#A2BDDB]/60 px-8 py-4 rounded-xl font-bold hover:bg-white/[0.04] hover:text-white transition-colors">
              Read Full Docs
            </Link>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
