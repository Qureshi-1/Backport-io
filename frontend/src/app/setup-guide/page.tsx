"use client";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Terminal, Server, Shield, Zap, Database, Code, Globe, Package, Users, Briefcase, Film } from "lucide-react";
import MatrixBackground from "@/components/MatrixBackground";

export default function SetupGuidePage() {
  const platforms = [
    { icon: Film, name: "Video/Streaming", desc: "Protect video APIs, streaming endpoints, and CDN origins", tier: "Video" },
    { icon: Users, name: "Indie/Hobby", desc: "Free tier for side projects and personal APIs", tier: "Indie" },
    { icon: Briefcase, name: "Startup/MVP", desc: "Scale with your growing team and traffic", tier: "Startup" },
    { icon: Server, name: "Enterprise", desc: "Dedicated infrastructure with SLA guarantees", tier: "Enterprise" },
  ];

  const steps = [
    {
      step: "01",
      title: "Sign Up",
      desc: "Create your free account at backport-io.vercel.app",
      code: "Visit https://backport-io.vercel.app/auth/signup",
      icon: Users,
      color: "#00F0FF"
    },
    {
      step: "02",
      title: "Get API Key",
      desc: "Generate your API key from the dashboard",
      code: "Dashboard → API Keys → Create New Key",
      icon: Shield,
      color: "#34FF8C"
    },
    {
      step: "03",
      title: "Set Target URL",
      desc: "Point to your existing backend URL",
      code: "Dashboard → Settings → Target Backend URL",
      icon: Globe,
      color: "#ffd700"
    },
    {
      step: "04",
      title: "Start Proxying",
      desc: "Route traffic through Backport gateway",
      code: 'curl -H "X-API-Key: bk_xxx" https://backport-io.vercel.app/proxy/endpoint',
      icon: Zap,
      color: "#ff6b6b"
    }
  ];

  const deployments = [
    { name: "Docker", desc: "Run locally or on any server", code: "docker run -p 8080:8080 qureshi/backport" },
    { name: "Render", desc: "One-click deploy to Render", code: "render.yaml included in repo" },
    { name: "Railway", desc: "Deploy to Railway", code: "railway.json included in repo" },
    { name: "Fly.io", desc: "Deploy globally with Fly", code: "fly.toml included in repo" },
    { name: "VPS/Server", desc: "Run on your own server", code: "python main.py or gunicorn" },
  ];

  return (
    <div className="relative min-h-screen bg-black text-zinc-300">
      <MatrixBackground />
      
      <div className="mx-auto max-w-6xl px-6 py-24 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            STEP-BY-STEP SETUP GUIDE
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Get Started in <span className="text-emerald-400">3 Minutes</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Follow this guide to set up Backport for your use case. No credit card required.
          </p>
        </div>

        {/* Platform Selection */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Choose Your <span className="text-emerald-400">Use Case</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {platforms.map((p) => (
              <div key={p.tier} className="group p-6 rounded-2xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-900 hover:border-emerald-500/30 transition-all cursor-pointer">
                <p.icon className="w-8 h-8 text-emerald-400 mb-4" />
                <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold mb-2">
                  {p.tier}
                </span>
                <h3 className="text-lg font-bold text-white mb-2">{p.name}</h3>
                <p className="text-sm text-zinc-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Step by Step */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            4-Step <span className="text-emerald-400">Quick Start</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((s) => (
              <div key={s.step} className="relative p-8 rounded-2xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-900 transition-all">
                <div className="absolute top-4 right-4 text-6xl font-bold text-white/5" style={{ color: s.color }}>
                  {s.step}
                </div>
                <s.icon className="w-10 h-10 mb-4" style={{ color: s.color }} />
                <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                <p className="text-zinc-400 mb-4">{s.desc}</p>
                <div className="bg-black/50 rounded-lg p-3 font-mono text-xs text-emerald-400 overflow-x-auto">
                  {s.code}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Deployment Options */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Deployment <span className="text-emerald-400">Options</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deployments.map((d) => (
              <div key={d.name} className="p-6 rounded-xl border border-white/5 bg-zinc-900/30">
                <h3 className="text-lg font-bold text-white mb-2">{d.name}</h3>
                <p className="text-sm text-zinc-400 mb-3">{d.desc}</p>
                <div className="bg-black/50 rounded-lg p-2 font-mono text-xs text-emerald-400 overflow-x-auto">
                  {d.code}
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
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
              <Code className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-4">For Managed Cloud</h3>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Web browser</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Email account</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Existing API/backend</li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
              <Terminal className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-4">For Self-Hosted</h3>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Python 3.10+</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Docker (optional)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> pip or pipenv</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Common Use Cases */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Common <span className="text-emerald-400">Use Cases</span>
          </h2>
          <div className="space-y-4">
            <div className="p-6 rounded-xl border border-white/5 bg-zinc-900/30">
              <h3 className="text-lg font-bold text-white mb-2">🛡️ Protect Public APIs</h3>
              <p className="text-zinc-400 mb-4">Block malicious requests before they hit your server. Enable WAF in settings.</p>
              <code className="text-xs text-emerald-400 bg-black/50 px-3 py-2 rounded">WAF: ON | Rate Limit: 60 req/min | Cache: OFF</code>
            </div>
            <div className="p-6 rounded-xl border border-white/5 bg-zinc-900/30">
              <h3 className="text-lg font-bold text-white mb-2">⚡ Speed Up Read Operations</h3>
              <p className="text-zinc-400 mb-4">Cache frequently accessed data. Perfect for analytics and listing endpoints.</p>
              <code className="text-xs text-emerald-400 bg-black/50 px-3 py-2 rounded">WAF: ON | Rate Limit: 60 req/min | Cache: ON | TTL: 5 min</code>
            </div>
            <div className="p-6 rounded-xl border border-white/5 bg-zinc-900/30">
              <h3 className="text-lg font-bold text-white mb-2">💳 Secure Payments</h3>
              <p className="text-zinc-400 mb-4">Use idempotency keys to prevent duplicate transactions.</p>
              <code className="text-xs text-emerald-400 bg-black/50 px-3 py-2 rounded">WAF: ON | Rate Limit: 30 req/min | Idempotency: ON</code>
            </div>
            <div className="p-6 rounded-xl border border-white/5 bg-zinc-900/30">
              <h3 className="text-lg font-bold text-white mb-2">🎬 Video/Streaming</h3>
              <p className="text-zinc-400 mb-4">Handle high traffic with aggressive caching and rate limiting.</p>
              <code className="text-xs text-emerald-400 bg-black/50 px-3 py-2 rounded">WAF: ON | Rate Limit: 300 req/min | Cache: ON | TTL: 15 min</code>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to <span className="text-emerald-400">Get Started</span>?
          </h2>
          <p className="text-zinc-400 mb-8">Join thousands of developers protecting their APIs with Backport.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-emerald-500 text-black px-8 py-4 rounded-xl font-bold hover:bg-emerald-400 transition-colors">
              Start Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/docs" className="inline-flex items-center gap-2 border border-white/20 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/5 transition-colors">
              Read Docs
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
