<<<<<<< HEAD
import Link from "next/link";
import { ArrowRight, Shield, Zap, RefreshCw, Key, Code } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="relative min-h-screen bg-[#0e0e0e] text-[#e2e2e2] selection:bg-[#00F0FF]/20 overflow-x-hidden font-body">

      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 scanline-bg opacity-30" />

      {/* Top Nav Bar — V7 Monolith */}
      <nav className="fixed top-0 w-full z-50 bg-[#0e0e0e]/85 backdrop-blur-xl border-b border-[#00F0FF]/15 flex justify-between items-center px-8 py-4 shadow-[0_0_30px_rgba(0,240,255,0.08)]">
        <Link href="/" className="text-lg font-bold tracking-tighter text-[#00F0FF] font-headline uppercase glitch-hover">
          BACKPORT-IO
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {[
            { href: "/#features", label: "Features" },
            { href: "/#pricing", label: "Pricing" },
            { href: "/#compare", label: "Compare" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="font-headline tracking-tighter uppercase text-[12px] text-white/50 hover:text-[#00F0FF] transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/docs"
            className="font-headline tracking-tighter uppercase text-[12px] text-[#00F0FF] border-b-2 border-[#00F0FF] pb-0.5"
          >
            Docs
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="https://github.com/Qureshi-1/Backport-io"
            target="_blank"
            className="font-headline uppercase text-[10px] tracking-widest text-[#34FF8C] border border-[#34FF8C]/30 px-4 py-2 hover:bg-[#34FF8C]/10 transition-colors"
          >
            ★ GitHub
          </Link>
          <Link
            href="/dashboard"
            className="bg-[#00F0FF] text-[#003338] px-5 py-2 font-headline font-bold uppercase tracking-widest text-[11px] hover:bg-[#34FF8C] transition-all active:scale-95"
          >
            Deploy Node
          </Link>
        </div>
      </nav>

      {/* Side Nav */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#0a0a0a] border-r border-[#353535]/20 flex-col pt-24 pb-12 z-40 hidden lg:flex">
        <div className="px-8 mb-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-[#1f1f1f] flex items-center justify-center border border-[#00F0FF]/20">
              <Code className="w-4 h-4 text-[#00F0FF]" />
            </div>
            <div>
              <div className="font-headline font-medium uppercase tracking-[0.1rem] text-[10px] text-[#e2e2e2]">SYSTEM_CORE</div>
              <div className="font-mono text-[9px] text-[#849495]">v4.0.2-stable</div>
=======
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Shield, Zap, RefreshCw, Key, Code, Code2, ChevronRight, Copy, CheckCircle2, Lock, Server, Database, Activity } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const NAV_SECTIONS = [
  { group: "Getting Started", items: [
    { href: "#introduction", label: "Overview" },
    { href: "#quickstart", label: "Quickstart" },
    { href: "#authentication", label: "API Keys" },
  ]},
  { group: "API Reference", items: [
    { href: "#proxy-endpoint", label: "Proxy Endpoint" },
    { href: "#response-headers", label: "Response Headers" },
    { href: "#dashboard-api", label: "Dashboard API" },
  ]},
  { group: "Core Features", items: [
    { href: "#rate-limiting", label: "Rate Limiting" },
    { href: "#caching", label: "LRU Caching" },
    { href: "#idempotency", label: "Idempotency" },
    { href: "#waf", label: "WAF Security" },
  ]},
  { group: "Advanced Features", items: [
    { href: "#response-transformation", label: "Response Transform" },
    { href: "#api-mocking", label: "API Mocking" },
    { href: "#webhooks", label: "Webhooks" },
    { href: "#deployment", label: "Deployment" },
  ]},
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#A2BDDB]/40 hover:text-[#04e184] hover:border-[#04e184]/20 transition-all opacity-0 group-hover:opacity-100"
      title="Copy"
    >
      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#04e184]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CodeBlockRaw({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`relative group bg-[#0A0E14] border border-white/[0.04] p-6 font-mono text-sm rounded-xl overflow-x-auto ${className}`}>
      <CopyButton text={children} />
      <pre className="text-[#A2BDDB]/80 whitespace-pre-wrap leading-relaxed">{children}</pre>
    </div>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#080C10] text-[#e2e2e2] overflow-x-hidden">
      <Header />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
      )}

      {/* Side Nav - Desktop */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-[#0A0E14] border-r border-white/[0.04] flex-col pt-20 pb-12 z-50 hidden lg:flex transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-5 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-white/[0.04] flex items-center justify-center border border-white/[0.06] rounded-lg">
              <Code className="w-3.5 h-3.5 text-[#04e184]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Documentation</div>
              <div className="text-[10px] text-[#A2BDDB]/40 font-mono">Latest</div>
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
            </div>
          </div>
        </div>

<<<<<<< HEAD
        <nav className="flex flex-col gap-0.5 px-2">
          {[
            { href: "#introduction", label: "Overview", icon: "⊕", active: true },
            { href: "#quickstart", label: "Quickstart", icon: "▷", active: false },
            { href: "#installation", label: "Installation", icon: "⚙", active: false },
            { href: "#authentication", label: "API Keys", icon: "◈", active: false },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 font-headline uppercase text-[10px] tracking-[0.1rem] transition-all ${
                item.active
                  ? "text-[#00F0FF] bg-[#00F0FF]/5 shadow-[inset_4px_0_0_0_#00F0FF]"
                  : "text-[#353535] hover:text-white hover:bg-[#1b1b1b]"
              }`}
            >
              <span className="font-mono text-[11px]">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <div className="my-3 mx-6 h-px bg-[#353535]/30" />
          <div className="px-8 py-2">
            <div className="font-headline uppercase text-[9px] tracking-[0.2em] text-[#849495] mb-2">Core Features</div>
          </div>

          {[
            { href: "#rate-limiting", label: "Rate Limiting", icon: "⚡" },
            { href: "#caching", label: "LRU Caching", icon: "◎" },
            { href: "#idempotency", label: "Idempotency", icon: "∞" },
            { href: "#waf", label: "WAF Security", icon: "◉" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-6 py-3 font-headline uppercase text-[10px] tracking-[0.1rem] text-[#353535] hover:text-white hover:bg-[#1b1b1b] transition-all"
            >
              <span className="font-mono text-[11px] text-[#849495]">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* System status footer */}
        <div className="mt-auto px-8">
          <div className="border-t border-[#353535]/20 pt-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#34FF8C] pulse-glow" />
              <span className="font-headline uppercase text-[9px] tracking-widest text-white/30">System Core Active</span>
            </div>
=======
        <nav className="flex-1 overflow-y-auto px-3 space-y-6 no-scrollbar">
          {NAV_SECTIONS.map((section) => (
            <div key={section.group}>
              <div className="px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-[#A2BDDB]/25 font-semibold">
                  {section.group}
                </div>
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => { setActiveSection(item.href.slice(1)); setSidebarOpen(false); }}
                    className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                      activeSection === item.href.slice(1)
                        ? "text-[#04e184] bg-[#04e184]/[0.06]"
                        : "text-[#A2BDDB]/40 hover:text-white hover:bg-white/[0.03]"
                    }`}
                  >
                    <ChevronRight className={`w-3 h-3 transition-transform ${activeSection === item.href.slice(1) ? 'rotate-90 text-[#04e184]/60' : 'opacity-0'}`} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-5 pt-6 border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#04e184] animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider text-white/20">
              Generally Available
            </span>
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
          </div>
        </div>
      </aside>

      {/* Main Content */}
<<<<<<< HEAD
      <main className="lg:pl-64 pt-24 min-h-screen relative z-10">
        <div className="max-w-4xl mx-auto px-8 md:px-12 py-12">

          {/* Page Header */}
          <header id="introduction" className="mb-20">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[#34FF8C] font-headline text-[10px] tracking-[0.3em] uppercase">SYSTEM_CORE // HUB</span>
              <div className="h-px w-24 bg-[#3b494b]/50" />
            </div>
            <h1 className="font-headline text-6xl md:text-7xl font-bold tracking-tighter uppercase leading-none mb-6 text-[#e2e2e2]">
              Developer <br />
              <span className="text-[#00F0FF] text-glow-cyan">Documentation</span>
            </h1>
            <p className="max-w-2xl text-[#b9cacb] leading-relaxed text-lg">
              Backport is an open-source API gateway that adds enterprise features — rate limiting, WAF, caching &amp; idempotency — to any backend. No code changes. No SDK.
            </p>
          </header>

          {/* Bento Quick Actions Grid */}
          <div className="grid grid-cols-12 gap-4 mb-20">
            {/* Quickstart — large */}
            <div id="quickstart" className="col-span-12 md:col-span-8 group relative overflow-hidden bg-[#1b1b1b] p-10 border-l-4 border-[#00F0FF] hover:bg-[#1f1f1f] transition-colors scanline-anim">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-24 h-24 text-[#00F0FF]" />
              </div>
              <div className="relative z-10">
                <div className="text-[10px] text-[#00F0FF] font-headline tracking-[0.2em] uppercase mb-4">Module 01</div>
                <h2 className="font-headline text-3xl font-bold uppercase mb-4 text-[#e2e2e2]">Quickstart Guide</h2>
                <p className="text-[#b9cacb] mb-8 max-w-md">
                  Sign up, connect your backend URL to the dashboard, and get a secure gateway endpoint instantly. No code changes required.
                </p>
                <div className="flex gap-4">
                  <Link href="/auth/signup" className="bg-[#00F0FF] text-[#003338] px-6 py-2.5 text-xs font-headline font-bold uppercase tracking-wider hover:bg-[#34FF8C] transition-colors flex items-center gap-2">
                    Start Tutorial <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link href="https://github.com/Qureshi-1/Backport-io" target="_blank" className="border border-[#3b494b]/50 text-[#e2e2e2] px-6 py-2.5 text-xs font-headline font-bold uppercase tracking-wider hover:bg-[#1f1f1f] transition-colors">
                    Copy SDK
                  </Link>
                </div>
              </div>
            </div>

            {/* CLI Reference */}
            <div className="col-span-12 md:col-span-4 bg-[#353535] p-10 flex flex-col justify-between border-t-4 border-[#34FF8C]">
              <div>
                <div className="text-[10px] text-[#34FF8C] font-headline tracking-[0.2em] uppercase mb-4">Module 02</div>
                <h2 className="font-headline text-2xl font-bold uppercase mb-2 text-[#e2e2e2]">CLI Reference</h2>
                <p className="text-[#b9cacb] text-sm">Full command-line docs for node management and self-hosting.</p>
              </div>
              <Code className="w-10 h-10 text-[#34FF8C] mt-6" />
            </div>

            {/* Architecture */}
            <div className="col-span-12 md:col-span-4 bg-[#1b1b1b] p-10 border-b-4 border-[#3b494b] hover:border-[#00F0FF]/40 transition-colors">
              <div className="text-[10px] text-[#849495] font-headline tracking-[0.2em] uppercase mb-4">Module 03</div>
              <h3 className="font-headline text-xl font-bold uppercase mb-2 text-[#e2e2e2]">Architecture</h3>
              <p className="text-[#b9cacb] text-sm mb-6">Deep dive into the gateway routing engine and proxy cluster.</p>
              <Link href="#installation" className="text-[#00F0FF] text-[10px] font-headline font-bold uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                Explore Diagrams <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Protocol Schemas */}
            <div className="col-span-12 md:col-span-8 bg-[#0e0e0e] border border-[#00F0FF]/10 p-10 relative hover:border-[#00F0FF]/20 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] text-[#00dbe9] font-headline tracking-[0.2em] uppercase mb-4">Module 04</div>
                  <h3 className="font-headline text-3xl font-bold uppercase mb-4 text-[#e2e2e2]">Protocol Schemas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/30 p-4 border-l border-[#00F0FF]/20">
                      <div className="text-[9px] text-[#849495] uppercase mb-1">Endpoints</div>
                      <div className="text-2xl font-headline font-bold text-[#e2e2e2]">142</div>
                    </div>
                    <div className="bg-black/30 p-4 border-l border-[#34FF8C]/20">
                      <div className="text-[9px] text-[#849495] uppercase mb-1">Latency (Avg)</div>
                      <div className="text-2xl font-headline font-bold text-[#34FF8C]">12ms</div>
                    </div>
                  </div>
=======
      <main className="lg:pl-64 pt-20 min-h-screen relative z-10">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden ml-6 mb-4 p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#A2BDDB]/50 hover:text-white transition-colors"
          aria-label="Open navigation"
        >
          <Code className="w-4 h-4" />
        </button>

        <div className="max-w-4xl mx-auto px-6 sm:px-10 py-10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-[#A2BDDB]/30 mb-10">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/60">Documentation</span>
          </div>

          {/* Page Header */}
          <header id="introduction" className="mb-16">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[#04e184] text-xs font-semibold uppercase tracking-wider">
                Documentation
              </span>
              <div className="h-px w-12 bg-[#04e184]/20" />
              <span className="text-[10px] uppercase tracking-wider text-[#04e184] bg-[#04e184]/[0.08] px-2 py-0.5 rounded font-semibold">
                GA
              </span>
            </div>
            <h1
              className="text-3xl sm:text-5xl font-bold tracking-tight mb-5 text-white"
              style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
            >
              Developer{" "}
              <span className="text-[#04e184]">Documentation</span>
            </h1>
            <p className="max-w-2xl text-[#A2BDDB]/60 leading-relaxed text-base sm:text-lg">
              Backport is an API gateway that adds WAF, rate limiting,
              caching &amp; idempotency to any backend. Sign up, set your target URL,
              and start proxying — no code changes needed.
            </p>
          </header>

          {/* Quickstart Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-20">
            <div
              id="quickstart"
              className="md:col-span-8 group relative bg-white/[0.02] p-8 sm:p-10 border border-white/[0.06] border-l-2 border-l-[#04e184] hover:bg-white/[0.03] transition-colors rounded-xl"
            >
              <div className="text-xs text-[#04e184] font-semibold uppercase tracking-wider mb-4">
                Getting Started
              </div>
              <h2
                className="text-xl sm:text-2xl font-bold mb-3 text-white"
                style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
              >
                Quickstart Guide
              </h2>
              <p className="text-[#A2BDDB]/50 mb-6 max-w-md text-sm leading-relaxed">
                Sign up, set your backend URL in the dashboard, and start sending
                requests through the gateway. Takes under 2 minutes.
              </p>
              <ol className="space-y-3 mb-8">
                {[
                  { step: "1", text: "Create a free account" },
                  { step: "2", text: "Verify your email" },
                  { step: "3", text: "Go to Dashboard → Settings → Set your target backend URL" },
                  { step: "4", text: "Copy your API key from Dashboard → API Keys" },
                  { step: "5", text: "Start sending requests through the proxy" },
                ].map((item) => (
                  <li key={item.step} className="flex items-start gap-3 text-sm text-[#A2BDDB]/60">
                    <span className="w-5 h-5 rounded-full bg-[#04e184]/10 text-[#04e184] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {item.step}
                    </span>
                    {item.text}
                  </li>
                ))}
              </ol>
              <div className="flex gap-3">
                <Link
                  href="/auth/signup"
                  className="bg-[#04e184] text-black px-5 py-2.5 text-sm font-semibold hover:bg-white transition-colors flex items-center gap-2 rounded-lg"
                >
                  Get Started <ArrowRight className="w-3 h-3" />
                </Link>
                <Link
                  href="https://github.com/Qureshi-1/Backport-io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-white/[0.08] text-[#A2BDDB]/60 px-5 py-2.5 text-sm font-semibold hover:bg-white/[0.04] hover:text-white transition-colors rounded-lg"
                >
                  View Source
                </Link>
              </div>
            </div>

            <div className="md:col-span-4 bg-white/[0.02] p-8 sm:p-10 flex flex-col justify-between border border-white/[0.06] rounded-xl">
              <div>
                <div className="text-xs text-[#6BA9FF] font-semibold uppercase tracking-wider mb-4">
                  How It Works
                </div>
                <h2
                  className="text-lg font-bold mb-2 text-white"
                  style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
                >
                  Request Flow
                </h2>
                <p className="text-[#A2BDDB]/50 text-sm leading-relaxed mb-4">
                  Every request passes through the gateway pipeline before reaching your backend.
                </p>
                <div className="space-y-2 text-xs">
                  {[
                    { label: "Auth", desc: "Validate API key" },
                    { label: "WAF", desc: "Scan for threats" },
                    { label: "Rate Limit", desc: "Enforce quotas" },
                    { label: "Cache", desc: "Serve from memory" },
                    { label: "Proxy", desc: "Forward to backend" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-[#A2BDDB]/40">
                      <Server className="w-3 h-3 text-[#04e184]/40" />
                      <span className="font-semibold text-[#A2BDDB]/60 w-20">{item.label}</span>
                      <span>{item.desc}</span>
                    </div>
                  ))}
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
                </div>
              </div>
            </div>
          </div>

<<<<<<< HEAD
          {/* Installation Terminal */}
          <section id="installation" className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tighter">
                Installation <span className="text-[#849495]">Terminal</span>
              </h2>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-[#ffb4ab]/40" />
                <div className="w-2 h-2 rounded-full bg-[#00F0FF]/40" />
                <div className="w-2 h-2 rounded-full bg-[#34FF8C]/40" />
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#3b494b]/20 p-8 font-mono text-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00F0FF]/20 to-transparent" />
              <div className="space-y-2 text-[#e2e2e2]/80">
                {[
                  { n: "01", color: "text-[#34FF8C]", prefix: "$", text: "curl -sSL https://backport-io.vercel.app/install.sh | bash" },
                  { n: "02", color: "text-[#3b494b]", prefix: "#", text: "[SYSTEM] Fetching backport-cli binary..." },
                  { n: "03", color: "text-[#3b494b]", prefix: "#", text: "[SYSTEM] Integrity check: OK" },
                  { n: "04", color: "text-[#34FF8C]", prefix: "$", text: 'backport init --node-name "CORE_PROX_01"' },
                  { n: "05", color: "text-[#00F0FF]", prefix: ">", text: "Initializing secure gateway protocol..." },
                  { n: "06", color: "text-[#e2e2e2]", prefix: ">", text: "Gateway active — WAF · Rate Limit · Cache" },
                ].map((line) => (
                  <div key={line.n} className="flex gap-4">
                    <span className="text-[#849495] select-none w-6">{line.n}</span>
                    <span className={line.color}>{line.prefix}</span>
                    <span>{line.text}</span>
                  </div>
                ))}
                <div className="flex gap-4">
                  <span className="text-[#849495] select-none w-6">07</span>
                  <span className="text-[#e2e2e2]">Ready<span className="terminal-cursor" /></span>
                </div>
              </div>
            </div>

            {/* Option 2: Docker */}
            <div className="mt-8 p-1">
              <h3 className="font-headline text-lg font-bold uppercase tracking-tight text-[#e2e2e2] mb-4">Option 2: Docker</h3>
              <div className="bg-[#0a0a0a] border border-[#3b494b]/20 p-6 font-mono text-sm">
                <div className="text-[#3b494b] mb-2"># Pull and run Backport gateway</div>
                <div className="text-[#34FF8C]">docker run -p 8080:8080 \</div>
                <div className="text-[#34FF8C]">&nbsp;&nbsp;-e BACKEND_URL=http://your-api.com \</div>
                <div className="text-[#34FF8C]">&nbsp;&nbsp;qureshi/backport</div>
              </div>
              <p className="mt-4 text-[#b9cacb] text-sm border-l-2 border-[#00F0FF] pl-4 py-1 bg-[#00F0FF]/5">
                <strong className="text-[#00F0FF]">Note:</strong> For managed Cloud hosting, sign up at{" "}
                <Link href="/auth/signup" className="text-[#00F0FF] underline underline-offset-2">backport-io.vercel.app</Link>{" "}
                — zero config required.
              </p>
            </div>
          </section>

          {/* Authentication */}
          <section id="authentication" className="mb-20">
            <div className="flex items-center gap-4 mb-8">
              <Key className="w-6 h-6 text-[#00F0FF]" />
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tighter text-[#e2e2e2]">Authentication &amp; API Keys</h2>
            </div>
            <p className="text-[#b9cacb] mb-6 leading-relaxed">
              Every request through the Backport gateway must include a valid API key in the <code className="text-[#00F0FF] bg-[#00F0FF]/10 px-1.5 py-0.5 font-mono text-xs">X-API-Key</code> header. Keys are provisioned from the Dashboard.
            </p>
            <div className="bg-[#0a0a0a] border border-[#3b494b]/20 p-6 font-mono text-sm mb-6">
              <div className="text-[#849495] mb-2"># Authenticated GET request</div>
              <div className="text-[#34FF8C]">curl <span className="text-[#e2e2e2]">-X GET https://backport-io.onrender.com/proxy/users \</span></div>
              <div className="text-[#e2e2e2]">&nbsp;&nbsp;-H <span className="text-[#ffd700]">&quot;X-API-Key: bk_live_your_key_here&quot;</span></div>
            </div>
            <div className="bg-[#0a0a0a] border border-[#3b494b]/20 p-6 font-mono text-sm mb-6">
              <div className="text-[#849495] mb-2"># POST with Idempotency Key</div>
              <div className="text-[#34FF8C]">curl <span className="text-[#e2e2e2]">-X POST https://backport-io.onrender.com/proxy/checkout \</span></div>
              <div className="text-[#e2e2e2]">&nbsp;&nbsp;-H <span className="text-[#ffd700]">&quot;X-API-Key: bk_live_your_key_here&quot;</span> \</div>
              <div className="text-[#e2e2e2]">&nbsp;&nbsp;-H <span className="text-[#ffd700]">&quot;Idempotency-Key: txn_unique_12345&quot;</span></div>
            </div>

            {/* Response code table */}
            <div className="border border-[#3b494b]/20 overflow-hidden">
              <div className="bg-[#1b1b1b] border-b border-[#3b494b]/20 px-6 py-3 flex gap-8">
                <span className="font-headline text-[10px] uppercase tracking-widest text-[#849495]">Code</span>
                <span className="font-headline text-[10px] uppercase tracking-widest text-[#849495]">Meaning</span>
              </div>
              {[
                { code: "200 OK", color: "text-[#34FF8C]", bg: "bg-[#34FF8C]/10", desc: "Request passed through successfully" },
                { code: "304 Not Modified", color: "text-[#00dbe9]", bg: "bg-[#00dbe9]/10", desc: "Served from cache" },
                { code: "403 Forbidden", color: "text-[#ffb4ab]", bg: "bg-[#ffb4ab]/10", desc: "WAF blocked malicious payload" },
                { code: "429 Too Many Requests", color: "text-[#ffb4ab]", bg: "bg-[#ffb4ab]/10", desc: "Rate limit exceeded" },
                { code: "401 Unauthorized", color: "text-[#ffb4ab]", bg: "bg-[#ffb4ab]/10", desc: "Invalid or missing API key" },
              ].map((row) => (
                <div key={row.code} className="flex gap-8 items-center px-6 py-4 border-b border-[#3b494b]/10 hover:bg-white/5 transition-colors">
                  <code className={`${row.color} ${row.bg} px-2 py-0.5 font-mono text-xs w-48 flex-shrink-0`}>{row.code}</code>
                  <span className="text-[#b9cacb] text-sm">{row.desc}</span>
=======
          {/* Feature Overview */}
          <div className="bg-white/[0.02] border border-white/[0.06] p-8 sm:p-10 rounded-xl mb-20">
            <div className="text-xs text-[#6BA9FF] font-semibold uppercase tracking-wider mb-4">
              Overview
            </div>
            <h3
              className="text-xl font-bold mb-5 text-white"
              style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
            >
              Gateway Features
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/20 p-4 rounded-lg border-l-2 border-[#04e184]/20">
                <div className="text-[10px] text-[#A2BDDB]/30 uppercase mb-1">WAF Rules</div>
                <div className="text-2xl font-bold text-white">17</div>
                <div className="text-[10px] text-[#A2BDDB]/30 mt-1">Regex patterns</div>
              </div>
              <div className="bg-black/20 p-4 rounded-lg border-l-2 border-[#6BA9FF]/20">
                <div className="text-[10px] text-[#A2BDDB]/30 uppercase mb-1">Core Modules</div>
                <div className="text-2xl font-bold text-[#6BA9FF]">4</div>
                <div className="text-[10px] text-[#A2BDDB]/30 mt-1">WAF, Rate, Cache, Idem</div>
              </div>
              <div className="bg-black/20 p-4 rounded-lg border-l-2 border-[#FBBF24]/20">
                <div className="text-[10px] text-[#A2BDDB]/30 uppercase mb-1">Attack Types</div>
                <div className="text-2xl font-bold text-[#FBBF24]">6</div>
                <div className="text-[10px] text-[#A2BDDB]/30 mt-1">SQLi, XSS, Path, CMD, LDAP, XXE</div>
              </div>
              <div className="bg-black/20 p-4 rounded-lg border-l-2 border-[#A2BDDB]/20">
                <div className="text-[10px] text-[#A2BDDB]/30 uppercase mb-1">Cache TTL</div>
                <div className="text-2xl font-bold text-[#A2BDDB]">5 min</div>
                <div className="text-[10px] text-[#A2BDDB]/30 mt-1">Default for GET requests</div>
              </div>
            </div>
          </div>

          {/* Authentication & API Keys */}
          <section id="authentication" className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <Lock className="w-5 h-5 text-[#04e184]" />
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
              >
                Authentication &amp; API Keys
              </h2>
            </div>
            <p className="text-[#A2BDDB]/60 mb-6 leading-relaxed">
              Every request through the Backport gateway must include a valid API
              key in the{" "}
              <code className="text-[#04e184] bg-[#04e184]/[0.08] px-1.5 py-0.5 font-mono text-xs rounded">
                X-API-Key
              </code>{" "}
              header. Keys are automatically created when you sign up and can be
              managed from the Dashboard.
            </p>

            <h3 className="text-lg font-semibold text-white mb-4">How to get your API key</h3>
            <ol className="space-y-2 mb-8 text-sm text-[#A2BDDB]/60">
              <li className="flex items-start gap-2">
                <span className="text-[#04e184] font-bold">1.</span>
                Sign up at{" "}
                <Link href="/auth/signup" className="text-[#04e184] underline underline-offset-2">
                  backport.in/auth/signup
                </Link>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#04e184] font-bold">2.</span>
                Verify your email (a 6-digit OTP is sent to your inbox)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#04e184] font-bold">3.</span>
                After verification, your API key is returned automatically. You can also find it in Dashboard → API Keys.
              </li>
            </ol>

            <h3 className="text-lg font-semibold text-white mb-4">Using your API key</h3>
            <CodeBlockRaw className="mb-6">{`# GET request through the gateway
curl -X GET https://backport.in/proxy/users \\
  -H "X-API-Key: bk_your_key_here"`}</CodeBlockRaw>
            <CodeBlockRaw className="mb-6">{`# POST request with idempotency (e.g. payments)
curl -X POST https://backport.in/proxy/checkout \\
  -H "X-API-Key: bk_your_key_here" \\
  -H "Idempotency-Key: txn_unique_12345" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 5000}'`}</CodeBlockRaw>

            <div className="bg-[#0A0E14] border border-white/[0.04] p-6 rounded-xl mb-8">
              <div className="text-xs text-[#FBBF24] mb-3 font-semibold uppercase tracking-wider">Response Example</div>
              <pre className="text-[#A2BDDB]/80 text-sm leading-relaxed whitespace-pre-wrap">{`{
  "id": "usr_a1b2c3d4",
  "email": "you@example.com",
  "plan": "free",
  "is_verified": true,
  "api_key": "bk_live_xxxxxxxxxxxx",
  "created_at": "2026-04-20T10:30:00Z"
}`}</pre>
            </div>

            <div className="bg-white/[0.02] border-l-2 border-[#FBBF24]/20 p-4 rounded-r-lg mb-8">
              <p className="text-[#A2BDDB]/50 text-sm">
                <strong className="text-[#FBBF24]">Note:</strong> The{" "}
                <code className="text-[#04e184] bg-[#04e184]/[0.08] px-1 py-0.5 font-mono text-xs rounded">/proxy/</code>{" "}
                prefix routes traffic through the gateway. The path after{" "}
                <code className="text-[#04e184] bg-[#04e184]/[0.08] px-1 py-0.5 font-mono text-xs rounded">/proxy/</code>{" "}
                is forwarded to your configured target backend URL.
              </p>
            </div>

            <h3 className="text-lg font-semibold text-white mb-4">API Key limits by plan</h3>
            <div className="border border-white/[0.06] overflow-hidden rounded-xl">
              <div className="bg-white/[0.02] border-b border-white/[0.04] px-6 py-3 flex gap-8">
                <span className="text-xs uppercase tracking-wider text-[#A2BDDB]/30 font-semibold">Plan</span>
                <span className="text-xs uppercase tracking-wider text-[#A2BDDB]/30 font-semibold">Max API Keys</span>
              </div>
              {[
                { plan: "Free", keys: "1", color: "text-[#A2BDDB]" },
                { plan: "Plus", keys: "3", color: "text-[#6BA9FF]" },
                { plan: "Pro", keys: "10", color: "text-[#04e184]" },
              ].map((row) => (
                <div key={row.plan} className="flex gap-8 items-center px-6 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <code className={`${row.color} bg-white/[0.04] px-2.5 py-1 font-mono text-xs w-48 flex-shrink-0 rounded-lg`}>{row.plan}</code>
                  <span className="text-[#A2BDDB]/60 text-sm">{row.keys}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Proxy Endpoint */}
          <section id="proxy-endpoint" className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <Server className="w-5 h-5 text-[#04e184]" />
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
              >
                Proxy Endpoint
              </h2>
            </div>
            <p className="text-[#A2BDDB]/60 mb-6 leading-relaxed">
              All traffic flows through a single proxy endpoint. The gateway authenticates
              your request, applies WAF rules, checks rate limits, serves from cache if
              available, and forwards to your configured backend.
            </p>

            <div className="bg-[#0A0E14] border border-white/[0.04] p-6 rounded-xl mb-8">
              <div className="text-xs text-[#A2BDDB]/30 uppercase mb-3 font-semibold">Base URL</div>
              <code className="text-[#04e184] font-mono text-sm">{"https://backport.in/proxy/{path}"}</code>
              <div className="mt-3 text-xs text-[#A2BDDB]/30">
                Supports all HTTP methods: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white mb-4">Request Headers</h3>
            <div className="border border-white/[0.06] overflow-hidden rounded-xl mb-8">
              <div className="bg-white/[0.02] border-b border-white/[0.04] px-6 py-3 flex gap-8">
                <span className="text-xs uppercase tracking-wider text-[#A2BDDB]/30 font-semibold">Header</span>
                <span className="text-xs uppercase tracking-wider text-[#A2BDDB]/30 font-semibold">Required</span>
                <span className="text-xs uppercase tracking-wider text-[#A2BDDB]/30 font-semibold">Description</span>
              </div>
              {[
                { header: "X-API-Key", req: "Yes", desc: "Your Backport API key (starts with bk_)", color: "text-[#04e184]" },
                { header: "Content-Type", req: "No", desc: "Standard content type for POST/PUT requests", color: "text-[#A2BDDB]" },
                { header: "Idempotency-Key", req: "No", desc: "Unique key to prevent duplicate POST/PUT/PATCH requests", color: "text-[#A2BDDB]" },
                { header: "X-Target-Url", req: "No", desc: "Override target backend URL (useful for playground/SDK)", color: "text-[#A2BDDB]" },
              ].map((row) => (
                <div key={row.header} className="flex gap-8 items-center px-6 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <code className={`${row.color} bg-white/[0.04] px-2.5 py-1 font-mono text-xs w-36 flex-shrink-0 rounded-lg`}>{row.header}</code>
                  <span className="text-[#A2BDDB]/40 text-sm w-16">{row.req}</span>
                  <span className="text-[#A2BDDB]/60 text-sm">{row.desc}</span>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold text-white mb-4">Example: Proxy a Request</h3>
            <CodeBlockRaw className="mb-4">{`# Your backend: https://api.yourservice.com/users
# Through Backport: https://backport.in/proxy/users

curl -X GET https://backport.in/proxy/users \\
  -H "X-API-Key: bk_your_key_here"

# Response (with gateway headers)
HTTP/1.1 200 OK
X-Backport-Cache: MISS
X-Backport-Latency: 142ms
X-Backport-Idempotent: -
Content-Type: application/json

[
  {"id": 1, "name": "Alice", "role": "admin"},
  {"id": 2, "name": "Bob", "role": "user"}
]`}</CodeBlockRaw>

            {/* Response codes */}
            <h3 className="text-lg font-semibold text-white mb-4">Response Codes</h3>
            <div className="border border-white/[0.06] overflow-hidden rounded-xl">
              <div className="bg-white/[0.02] border-b border-white/[0.04] px-6 py-3 flex gap-8">
                <span className="text-xs uppercase tracking-wider text-[#A2BDDB]/30 font-semibold">Code</span>
                <span className="text-xs uppercase tracking-wider text-[#A2BDDB]/30 font-semibold">Meaning</span>
              </div>
              {[
                { code: "200 OK", color: "text-[#04e184]", bg: "bg-[#04e184]/[0.08]", desc: "Request passed through gateway successfully" },
                { code: "304 Not Modified", color: "text-[#6BA9FF]", bg: "bg-[#6BA9FF]/[0.08]", desc: "Response served from LRU cache (if caching is enabled)" },
                { code: "401 Unauthorized", color: "text-red-400", bg: "bg-red-400/[0.08]", desc: "Invalid or missing API key" },
                { code: "403 Forbidden", color: "text-red-400", bg: "bg-red-400/[0.08]", desc: "WAF blocked a malicious payload" },
                { code: "413 Payload Too Large", color: "text-red-400", bg: "bg-red-400/[0.08]", desc: "Request body exceeds maximum size (10 MB)" },
                { code: "429 Too Many Requests", color: "text-red-400", bg: "bg-red-400/[0.08]", desc: "Rate limit exceeded for your plan" },
                { code: "502 Bad Gateway", color: "text-yellow-400", bg: "bg-yellow-400/[0.08]", desc: "Backend returned an invalid response" },
                { code: "503 Service Unavailable", color: "text-yellow-400", bg: "bg-yellow-400/[0.08]", desc: "Circuit breaker open — backend is unreachable" },
                { code: "504 Gateway Timeout", color: "text-yellow-400", bg: "bg-yellow-400/[0.08]", desc: "Backend did not respond within 30 seconds" },
              ].map((row) => (
                <div key={row.code} className="flex gap-8 items-center px-6 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <code className={`${row.color} ${row.bg} px-2.5 py-1 font-mono text-xs w-48 flex-shrink-0 rounded-lg`}>{row.code}</code>
                  <span className="text-[#A2BDDB]/60 text-sm">{row.desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Response Headers */}
          <section id="response-headers" className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <Zap className="w-5 h-5 text-[#6BA9FF]" />
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
              >
                Response Headers
              </h2>
            </div>
            <p className="text-[#A2BDDB]/60 mb-6 leading-relaxed">
              Backport adds the following headers to every proxied response, so you can
              monitor gateway behavior in your application.
            </p>
            <div className="border border-white/[0.06] overflow-hidden rounded-xl">
              <div className="bg-white/[0.02] border-b border-white/[0.04] px-6 py-3 flex gap-8">
                <span className="text-xs uppercase tracking-wider text-[#A2BDDB]/30 font-semibold">Header</span>
                <span className="text-xs uppercase tracking-wider text-[#A2BDDB]/30 font-semibold">Description</span>
              </div>
              {[
                { header: "X-Backport-Cache", desc: "HIT or MISS — whether the response was served from cache" },
                { header: "X-Backport-Idempotent", desc: "REPLAY — if the idempotency key was already processed" },
                { header: "X-Backport-Latency", desc: "Total gateway processing time in milliseconds" },
              ].map((row) => (
                <div key={row.header} className="flex gap-8 items-center px-6 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <code className="text-[#6BA9FF] bg-[#6BA9FF]/[0.08] px-2.5 py-1 font-mono text-xs w-52 flex-shrink-0 rounded-lg">{row.header}</code>
                  <span className="text-[#A2BDDB]/60 text-sm">{row.desc}</span>
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
                </div>
              ))}
            </div>
          </section>

          {/* WAF Security */}
          <section id="waf" className="mb-20">
<<<<<<< HEAD
            <div className="flex items-center gap-4 mb-8">
              <Shield className="w-6 h-6 text-[#00F0FF]" />
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tighter text-[#e2e2e2]">WAF Security</h2>
            </div>
            <p className="text-[#b9cacb] mb-6 leading-relaxed">
              Backport includes a Web Application Firewall (WAF) that inspects every request at the gateway level before it reaches your backend. It automatically detects and blocks:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {[
                { label: "SQL Injection", desc: "Blocks UNION SELECT, DROP TABLE and similar patterns", icon: "◉" },
                { label: "XSS Attacks", desc: "Blocks <script> injection and event handler abuse", icon: "◉" },
                { label: "Path Traversal", desc: "Blocks ../ directory escape attempts", icon: "◉" },
                { label: "Command Injection", desc: "Blocks shell metacharacters and OS command patterns", icon: "◉" },
              ].map((item) => (
                <div key={item.label} className="bg-[#1b1b1b] border border-[#3b494b]/20 p-6 hover:border-[#00F0FF]/20 transition-colors monolith-card">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[#00F0FF] text-lg">{item.icon}</span>
                    <span className="font-headline font-bold uppercase text-sm text-[#e2e2e2]">{item.label}</span>
                  </div>
                  <p className="text-[#b9cacb] text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-[#b9cacb] text-sm border-l-2 border-[#ffd700]/50 pl-4 py-1 bg-[#ffd700]/5">
              <strong className="text-[#ffd700]">Important:</strong> Backport provides gateway-level protection. Always validate and sanitize inputs at your application layer as defense-in-depth.
=======
            <div className="flex items-center gap-3 mb-8">
              <Shield className="w-5 h-5 text-[#04e184]" />
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
              >
                WAF Security
              </h2>
            </div>
            <p className="text-[#A2BDDB]/60 mb-6 leading-relaxed">
              Backport includes a Web Application Firewall (WAF) with 17 pre-compiled
              regex patterns that inspect every request at the gateway level before it
              reaches your backend. WAF can be toggled on/off from your dashboard settings.
              <strong className="text-white"> By default, WAF is OFF.</strong> Enable it when you&apos;re ready.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {[
                { label: "SQL Injection", desc: "5 patterns — UNION SELECT, DROP TABLE, OR 1=1, xp_cmdshell, sp_executesql" },
                { label: "XSS Attacks", desc: "4 patterns — <script> tags, onerror handlers, javascript: URIs, <iframe>/<embed>" },
                { label: "Path Traversal", desc: "2 patterns — ../ directory escapes, /etc/passwd, /proc/self access" },
                { label: "Command Injection", desc: "3 patterns — shell metacharacters, subshell execution, backtick injection" },
                { label: "LDAP Injection", desc: "1 pattern — detects LDAP filter manipulation syntax" },
                { label: "XML/XXE", desc: "1 pattern — blocks <!DOCTYPE SYSTEM and <!ENTITY declarations" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white/[0.02] border border-white/[0.06] p-6 hover:border-[#04e184]/15 transition-colors rounded-xl"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#04e184]" />
                    <span className="font-semibold text-sm text-white">{item.label}</span>
                  </div>
                  <p className="text-[#A2BDDB]/50 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-[#A2BDDB]/50 text-sm border-l-2 border-[#FBBF24]/20 pl-4 py-2 bg-[#FBBF24]/[0.03] rounded-r-lg">
              <strong className="text-[#FBBF24]">Important:</strong> The WAF uses regex-based
              pattern matching. While it covers common attack vectors, always validate and
              sanitize inputs at your application layer as defense-in-depth. WAF is a first
              line of defense, not a replacement for secure coding practices.
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
            </p>
          </section>

          {/* Rate Limiting */}
          <section id="rate-limiting" className="mb-20">
<<<<<<< HEAD
            <div className="flex items-center gap-4 mb-8">
              <Zap className="w-6 h-6 text-[#34FF8C]" />
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tighter text-[#e2e2e2]">Rate Limiting</h2>
            </div>
            <p className="text-[#b9cacb] mb-6 leading-relaxed">
              Backport automatically applies a Sliding Window Rate Limit to protect your databases from DDoS bursts and accidental script loops.
            </p>
            <ul className="space-y-3 mb-6">
              {[
                "Free-tier limits traffic strictly",
                "Exceeding limits instantly drops the request with HTTP 429",
                "Your backend is strictly spared from executing abusive logic",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-[#b9cacb]">
                  <span className="w-1.5 h-1.5 bg-[#34FF8C] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
=======
            <div className="flex items-center gap-3 mb-8">
              <Zap className="w-5 h-5 text-[#6BA9FF]" />
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
              >
                Rate Limiting
              </h2>
            </div>
            <p className="text-[#A2BDDB]/60 mb-6 leading-relaxed">
              Backport applies a sliding-window rate limiter to protect your backend
              from traffic spikes and abuse. Rate limiting is <strong className="text-white">enabled by default</strong>.
              When the limit is exceeded, requests get an HTTP 429 response and your backend
              is never hit.
            </p>

            <h3 className="text-lg font-semibold text-white mb-4">Rate limits by plan</h3>
            <div className="border border-white/[0.06] overflow-hidden rounded-xl mb-6">
              <div className="bg-white/[0.02] border-b border-white/[0.04] px-6 py-3 flex gap-8">
                <span className="text-xs uppercase tracking-wider text-[#A2BDDB]/30 font-semibold">Plan</span>
                <span className="text-xs uppercase tracking-wider text-[#A2BDDB]/30 font-semibold">Requests / min</span>
                <span className="text-xs uppercase tracking-wider text-[#A2BDDB]/30 font-semibold">Window</span>
              </div>
              {[
                { plan: "Free", limit: "100", window: "60s sliding", color: "text-[#A2BDDB]" },
                { plan: "Plus", limit: "500", window: "60s sliding", color: "text-[#6BA9FF]" },
                { plan: "Pro", limit: "5,000", window: "60s sliding", color: "text-[#04e184]" },
              ].map((row) => (
                <div key={row.plan} className="flex gap-8 items-center px-6 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <code className={`${row.color} bg-white/[0.04] px-2.5 py-1 font-mono text-xs w-32 flex-shrink-0 rounded-lg`}>{row.plan}</code>
                  <span className="text-[#A2BDDB]/60 text-sm w-40">{row.limit}</span>
                  <span className="text-[#A2BDDB]/40 text-sm">{row.window}</span>
                </div>
              ))}
            </div>

            <div className="bg-white/[0.02] border-l-2 border-[#6BA9FF]/20 p-4 rounded-r-lg">
              <p className="text-[#A2BDDB]/50 text-sm">
                <strong className="text-[#6BA9FF]">How it works:</strong> Rate limits are tracked
                in-memory using a sliding window algorithm. Each request timestamp is stored per user.
                Timestamps older than 60 seconds are pruned. If the count exceeds your plan limit,
                the request is immediately rejected with HTTP 429.
              </p>
            </div>
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
          </section>

          {/* LRU Caching */}
          <section id="caching" className="mb-20">
<<<<<<< HEAD
            <div className="flex items-center gap-4 mb-8">
              <RefreshCw className="w-6 h-6 text-[#00dbe9]" />
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tighter text-[#e2e2e2]">LRU Caching</h2>
            </div>
            <p className="text-[#b9cacb] mb-6 leading-relaxed">
              Heavy GET endpoints like analytics, reports, or lists often thrash databases unnecessarily. If enabled in settings, Backport intercepts GET responses and caches them in a dynamic LRU cache.
            </p>
            <div className="bg-[#1b1b1b] border-l-4 border-[#00F0FF] p-6">
              <p className="text-[#e2e2e2]">
                Subsequent repeated hits to the same route will be served directly from Backport&apos;s memory in <strong className="text-[#00F0FF]">under 2 milliseconds</strong>.
=======
            <div className="flex items-center gap-3 mb-8">
              <RefreshCw className="w-5 h-5 text-[#04e184]" />
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
              >
                LRU Caching
              </h2>
            </div>
            <p className="text-[#A2BDDB]/60 mb-6 leading-relaxed">
              Heavy GET endpoints like analytics, reports, or lists often hit your database
              on every request. If you enable caching in your dashboard settings, Backport
              intercepts GET responses with status 200 and stores them in an in-memory LRU cache.
              <strong className="text-white"> By default, caching is OFF.</strong> Enable it from settings.
            </p>
            <ul className="space-y-3 mb-6">
              {[
                "Only GET requests with 200 status are cached",
                "Default TTL: 5 minutes — expired entries are evicted automatically",
                "Maximum 1,000 cached entries — oldest entries are evicted when the limit is reached",
                "Cached responses return with X-Backport-Cache: HIT header",
                "Subsequent cache hits are served in under 2ms without touching your backend",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[#A2BDDB]/60 text-sm">
                  <span className="w-1.5 h-1.5 bg-[#04e184] flex-shrink-0 rounded-full mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="bg-white/[0.02] border-l-2 border-[#FBBF24]/20 p-4 rounded-r-lg">
              <p className="text-[#A2BDDB]/50 text-sm">
                <strong className="text-[#FBBF24]">Note:</strong> Cache is stored in-memory and resets
                on server restart. This is suitable for reducing repeated database queries for
                frequently accessed read endpoints.
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
              </p>
            </div>
          </section>

          {/* Idempotency */}
          <section id="idempotency" className="mb-20">
<<<<<<< HEAD
            <div className="flex items-center gap-4 mb-8">
              <Key className="w-6 h-6 text-[#34FF8C]" />
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tighter text-[#e2e2e2]">Idempotency Keys</h2>
            </div>
            <p className="text-[#b9cacb] mb-6 leading-relaxed">
              Double-posting payments is a nightmare. Backport makes all POST requests completely safe. Pass an <code className="text-[#00F0FF] bg-[#00F0FF]/10 px-1.5 py-0.5 font-mono text-xs">Idempotency-Key</code> header to tell the gateway this action must only happen once.
            </p>
            <div className="bg-[#0a0a0a] border border-[#3b494b]/20 p-6 font-mono text-sm mb-6">
              <div className="text-[#34FF8C]">curl <span className="text-[#e2e2e2]">-X POST https://backport-io.onrender.com/proxy/checkout \</span></div>
              <div className="text-[#e2e2e2]">&nbsp;&nbsp;-H <span className="text-[#ffd700]">&quot;X-API-Key: bk_12345&quot;</span> \</div>
              <div className="text-[#e2e2e2]">&nbsp;&nbsp;-H <span className="text-[#ffd700]">&quot;Idempotency-Key: txn_88910&quot;</span> \</div>
              <div className="text-[#e2e2e2]">&nbsp;&nbsp;-d <span className="text-blue-300">&apos;{"{"}\"amount\": 5000{"}"}&apos;</span></div>
            </div>
            <p className="text-[#b9cacb] text-sm border-l-4 border-[#34FF8C] pl-4 py-2 bg-[#34FF8C]/5">
              If the user loses connection and clicks &quot;Pay&quot; again, Backport intercepts the duplicate key and returns the original success result — without hitting your backend.
            </p>
=======
            <div className="flex items-center gap-3 mb-8">
              <Key className="w-5 h-5 text-[#6BA9FF]" />
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
              >
                Idempotency Keys
              </h2>
            </div>
            <p className="text-[#A2BDDB]/60 mb-6 leading-relaxed">
              Duplicate POST requests are a common problem — especially for payments, orders,
              and form submissions. When a user loses connection and retries, your backend
              might process the same action twice. Backport solves this by storing the first
              response and replaying it for duplicate keys.
              <strong className="text-white"> Idempotency is enabled by default.</strong>
            </p>
            <CodeBlockRaw className="mb-6">{`# First request — processed normally and cached
curl -X POST https://backport.in/proxy/checkout \\
  -H "X-API-Key: bk_your_key" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: txn_88910" \\
  -d '{"amount": 5000, "currency": "INR"}'

# Retry with same Idempotency-Key — returns original response
# without hitting your backend
curl -X POST https://backport.in/proxy/checkout \\
  -H "X-API-Key: bk_your_key" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: txn_88910" \\
  -d '{"amount": 5000, "currency": "INR"}`}</CodeBlockRaw>
            <ul className="space-y-3 mb-6">
              {[
                "Works with POST, PUT, and PATCH methods",
                "Triggered by the Idempotency-Key request header",
                "Maximum 5,000 stored idempotency results per server",
                "Duplicate requests return with X-Backport-Idempotent: REPLAY header",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[#A2BDDB]/60 text-sm">
                  <span className="w-1.5 h-1.5 bg-[#6BA9FF] flex-shrink-0 rounded-full mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Dashboard API Reference */}
          <section id="dashboard-api" className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <Code className="w-5 h-5 text-[#A2BDDB]" />
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
              >
                Dashboard API
              </h2>
            </div>
            <p className="text-[#A2BDDB]/60 mb-6 leading-relaxed">
              The dashboard uses JWT-based authentication. After login, a token is returned
              that you can use to access your account data programmatically. All dashboard
              endpoints require an{" "}
              <code className="text-[#04e184] bg-[#04e184]/[0.08] px-1.5 py-0.5 font-mono text-xs rounded">
                Authorization: Bearer &lt;token&gt;
              </code>{" "}
              header.
            </p>
            <div className="border border-white/[0.06] overflow-hidden rounded-xl mb-8">
              <div className="bg-white/[0.02] border-b border-white/[0.04] px-6 py-3">
                <span className="text-xs uppercase tracking-wider text-[#A2BDDB]/30 font-semibold">Common Dashboard Endpoints</span>
              </div>
              {[
                { method: "GET", path: "/api/user/me", desc: "Your profile, API keys, and analytics summary" },
                { method: "GET", path: "/api/user/keys", desc: "List all your API keys" },
                { method: "POST", path: "/api/user/keys", desc: "Create a new API key (body: {name})" },
                { method: "DELETE", path: "/api/user/keys/{key_id}", desc: "Delete an API key (cannot delete last one)" },
                { method: "GET", path: "/api/user/settings", desc: "Get current gateway settings" },
                { method: "PUT", path: "/api/user/settings", desc: "Update settings (target URL, toggles)" },
                { method: "GET", path: "/api/user/logs", desc: "Last 20 proxy request logs" },
                { method: "GET", path: "/api/user/traffic", desc: "15-minute traffic chart data" },
                { method: "GET", path: "/api/user/analytics/stats", desc: "Full analytics dashboard data" },
                { method: "GET", path: "/api/billing/plan", desc: "Current plan details" },
              ].map((row) => (
                <div key={row.method + row.path} className="flex gap-6 items-center px-6 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <code className={`font-mono text-xs px-2 py-1 rounded flex-shrink-0 w-14 text-center ${row.method === "GET" ? "text-[#04e184] bg-[#04e184]/[0.08]" : row.method === "POST" ? "text-[#6BA9FF] bg-[#6BA9FF]/[0.08]" : row.method === "PUT" ? "text-[#FBBF24] bg-[#FBBF24]/[0.08]" : "text-red-400 bg-red-400/[0.08]"}`}>{row.method}</code>
                  <code className="text-[#A2BDDB]/80 font-mono text-xs flex-shrink-0 w-56 truncate">{row.path}</code>
                  <span className="text-[#A2BDDB]/40 text-sm hidden md:block">{row.desc}</span>
                </div>
              ))}
            </div>

            <CodeBlockRaw className="mb-6">{`# Login to get JWT token
curl -X POST https://backport.in/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "you@example.com", "password": "your_password"}'

# Use the token to access dashboard API
curl -X GET https://backport.in/api/user/me \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."`}</CodeBlockRaw>
          </section>

          {/* Response Transformation */}
          <section id="response-transformation" className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <Code2 className="w-5 h-5 text-[#04e184]" />
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
              >
                Response Transformation
              </h2>
            </div>
            <p className="text-[#A2BDDB]/60 mb-6 leading-relaxed">
              Response transformation allows you to modify API responses at the gateway
              layer before they reach the client. This is useful for stripping sensitive
              fields, reshaping payloads to match a frontend contract, or adding computed
              metadata — all without changing your backend code. You can configure
              transformation rules from the Dashboard under Settings, and they apply
              globally to all proxied responses for your account.
            </p>

            <h3 className="text-lg font-semibold text-white mb-4">Supported transformations</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {[
                { label: "Add Fields", desc: "Inject new key-value pairs into the response body, such as timestamps, gateway metadata, or computed fields" },
                { label: "Remove Fields", desc: "Strip sensitive or unnecessary fields like internal IDs, passwords, or debug information from responses" },
                { label: "Rename Keys", desc: "Map existing keys to new names — useful when your backend uses snake_case but clients expect camelCase" },
                { label: "Filter Response Body", desc: "Apply include/exclude rules to return only the fields you specify, effectively whitelisting the response schema" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white/[0.02] border border-white/[0.06] p-6 hover:border-[#04e184]/15 transition-colors rounded-xl"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#04e184]" />
                    <span className="font-semibold text-sm text-white">{item.label}</span>
                  </div>
                  <p className="text-[#A2BDDB]/50 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold text-white mb-4">Create or update transform rules</h3>
            <CodeBlockRaw className="mb-6">{`# Set transformation rules via the dashboard API
curl -X PUT https://backport.in/api/user/settings \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "transformations": {
      "remove_fields": ["internal_id", "debug_trace"],
      "add_fields": { "gateway": "backport", "status": "active" },
      "rename_keys": { "user_name": "name", "user_email": "email" },
      "filter_mode": "whitelist",
      "filter_fields": ["id", "name", "email", "created_at"]
    }
  }'`}</CodeBlockRaw>

            <div className="bg-white/[0.02] border-l-2 border-[#FBBF24]/20 p-4 rounded-r-lg">
              <p className="text-[#A2BDDB]/50 text-sm">
                <strong className="text-[#FBBF24]">Note:</strong> Transformations are applied
                in the order: remove → rename → add → filter. This ensures that renamed keys
                are available when add or filter operations run. Changes take effect immediately
                across all proxied endpoints for your account.
              </p>
            </div>
          </section>

          {/* API Mocking */}
          <section id="api-mocking" className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <Database className="w-5 h-5 text-[#6BA9FF]" />
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
              >
                API Mocking
              </h2>
            </div>
            <p className="text-[#A2BDDB]/60 mb-6 leading-relaxed">
              API Mocking lets you define fake endpoint responses in the Backport dashboard.
              When your backend is unreachable, down, or still under development, the gateway
              automatically serves the mocked response instead of returning a 502 error. This
              is invaluable for frontend development, integration testing, and creating demo
              environments without needing a live backend. Mock endpoints match by path and
              HTTP method, and you can set custom status codes, headers, and response bodies.
            </p>

            <h3 className="text-lg font-semibold text-white mb-4">Creating a mock endpoint</h3>
            <CodeBlockRaw className="mb-6">{`# Create a mock for GET /api/users
curl -X POST https://backport.in/api/user/mocks \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "method": "GET",
    "path": "/api/users",
    "status": 200,
    "headers": { "Content-Type": "application/json" },
    "body": [
      { "id": 1, "name": "Alice", "role": "admin" },
      { "id": 2, "name": "Bob", "role": "viewer" }
    ]
  }'`}</CodeBlockRaw>

            <h3 className="text-lg font-semibold text-white mb-4">How mock responses work</h3>
            <ul className="space-y-3 mb-6">
              {[
                "Mock endpoints are matched by HTTP method and path — exact match only",
                "When your backend is healthy, real responses are served and mocks are ignored",
                "When your backend returns an error or times out, the gateway falls back to the mock",
                "Each mock can define a custom status code, response headers, and JSON body",
                "Mocks can be enabled or disabled individually from the dashboard",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[#A2BDDB]/60 text-sm">
                  <span className="w-1.5 h-1.5 bg-[#6BA9FF] flex-shrink-0 rounded-full mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="bg-white/[0.02] border-l-2 border-[#6BA9FF]/20 p-4 rounded-r-lg">
              <p className="text-[#A2BDDB]/50 text-sm">
                <strong className="text-[#6BA9FF]">Example:</strong> If your backend at{" "}
                <code className="text-[#04e184] bg-[#04e184]/[0.08] px-1 py-0.5 font-mono text-xs rounded">api.example.com</code>{" "}
                is down and you have a mock for{" "}
                <code className="text-[#04e184] bg-[#04e184]/[0.08] px-1 py-0.5 font-mono text-xs rounded">GET /api/users</code>,
                a request to{" "}
                <code className="text-[#04e184] bg-[#04e184]/[0.08] px-1 py-0.5 font-mono text-xs rounded">/proxy/api/users</code>{" "}
                will return the mocked JSON with HTTP 200 — your frontend never sees a 502.
              </p>
            </div>
          </section>

          {/* Webhook Notifications */}
          <section id="webhooks" className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <Activity className="w-5 h-5 text-[#04e184]" />
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
              >
                Webhook Notifications
              </h2>
            </div>
            <p className="text-[#A2BDDB]/60 mb-6 leading-relaxed">
              Webhooks let you receive real-time HTTP callbacks when important events occur
              on your gateway. Instead of polling the dashboard for logs or alerts, configure
              a webhook URL and Backport will POST a JSON payload to your endpoint
              automatically. This is essential for integrating with Slack, PagerDuty,
              custom monitoring dashboards, or any system that accepts incoming HTTP requests.
              You can set up webhook URLs from the Dashboard under Settings.
            </p>

            <h3 className="text-lg font-semibold text-white mb-4">Supported events</h3>
            <div className="border border-white/[0.06] overflow-hidden rounded-xl mb-6">
              <div className="bg-white/[0.02] border-b border-white/[0.04] px-6 py-3 flex gap-8">
                <span className="text-xs uppercase tracking-wider text-[#A2BDDB]/30 font-semibold">Event</span>
                <span className="text-xs uppercase tracking-wider text-[#A2BDDB]/30 font-semibold">Description</span>
              </div>
              {[
                { event: "waf_block", desc: "A request was blocked by the WAF rule engine", color: "text-red-400" },
                { event: "rate_limit_hit", desc: "A client exceeded their rate limit and received HTTP 429", color: "text-[#FBBF24]" },
                { event: "backend_error", desc: "The target backend returned a 5xx error or timed out", color: "text-[#6BA9FF]" },
                { event: "slow_endpoint", desc: "A proxied request took longer than 5 seconds to complete", color: "text-[#A2BDDB]" },
              ].map((row) => (
                <div key={row.event} className="flex gap-8 items-center px-6 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <code className={`${row.color} bg-white/[0.04] px-2.5 py-1 font-mono text-xs w-44 flex-shrink-0 rounded-lg`}>{row.event}</code>
                  <span className="text-[#A2BDDB]/60 text-sm">{row.desc}</span>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold text-white mb-4">Example webhook payload</h3>
            <CodeBlockRaw className="mb-6">{`// POST to your webhook URL
{
  "event": "waf_block",
  "timestamp": "2026-04-15T10:32:00Z",
  "gateway": "backport",
  "data": {
    "ip": "203.0.113.42",
    "method": "POST",
    "path": "/proxy/login",
    "blocked_reason": "SQL injection pattern detected",
    "request_headers": {
      "user-agent": "Mozilla/5.0 ...",
      "x-api-key": "bk_****redacted"
    }
  }
}`}</CodeBlockRaw>

            <ul className="space-y-3 mb-6">
              {[
                "Webhook payloads are sent as JSON with Content-Type: application/json",
                "Failed deliveries are retried up to 3 times with exponential backoff",
                "You can configure multiple webhook URLs for different event types",
                "All payloads include a timestamp and the gateway event type at the top level",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[#A2BDDB]/60 text-sm">
                  <span className="w-1.5 h-1.5 bg-[#04e184] flex-shrink-0 rounded-full mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Deployment with Docker */}
          <section id="deployment" className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <Server className="w-5 h-5 text-[#6BA9FF]" />
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
              >
                Getting Started
              </h2>
            </div>
            <p className="text-[#A2BDDB]/60 mb-6 leading-relaxed">
              Backport is a managed cloud service — sign up, get your API key, and start protecting your backend in under 30 seconds. No infrastructure setup required.
              The cloud handles everything — deployment, scaling, and monitoring — so you can focus on building your API.
            </p>

            <h3 className="text-lg font-semibold text-white mb-4">Quick Setup</h3>
            <CodeBlockRaw className="mb-6">{`# 1. Sign up at backport.in and create an account

# 2. Generate your API key from the dashboard
# Your key will look like: bk_live_xxxxxxxxxxxx

# 3. Point your traffic to Backport
curl https://backport.in/proxy/your-endpoint \\
  -H "X-API-Key: bk_live_xxxxxxxxxxxx"

# That's it — your API is now protected by WAF, rate limiting, and more!`}</CodeBlockRaw>

            <h3 className="text-lg font-semibold text-white mb-4">Dashboard Configuration</h3>
            <div className="border border-white/[0.06] overflow-hidden rounded-xl mb-6">
              <div className="bg-white/[0.02] border-b border-white/[0.04] px-6 py-3 flex gap-8">
                <span className="text-xs uppercase tracking-wider text-[#A2BDDB]/30 font-semibold">Setting</span>
                <span className="text-xs uppercase tracking-wider text-[#A2BDDB]/30 font-semibold">Description</span>
              </div>
              {[
                { env: "Backend URL", desc: "Your upstream API URL that Backport proxies requests to", color: "text-[#04e184]" },
                { env: "API Key", desc: "Generated from dashboard — authenticate all requests through Backport", color: "text-[#04e184]" },
                { env: "WAF", desc: "Enable/disable Web Application Firewall (SQLi, XSS, path traversal protection)", color: "text-[#A2BDDB]" },
                { env: "Rate Limiting", desc: "Set requests per minute based on your plan (100/500/5,000+)", color: "text-[#A2BDDB]" },
                { env: "Caching", desc: "Enable LRU caching for GET requests to reduce backend load", color: "text-[#A2BDDB]" },
              ].map((row) => (
                <div key={row.env} className="flex gap-8 items-center px-6 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <code className={`${row.color} bg-white/[0.04] px-2.5 py-1 font-mono text-xs w-44 flex-shrink-0 rounded-lg`}>{row.env}</code>
                  <span className="text-[#A2BDDB]/60 text-sm">{row.desc}</span>
                </div>
              ))}
            </div>

            <div className="bg-white/[0.02] border-l-2 border-[#FBBF24]/20 p-4 rounded-r-lg">
              <p className="text-[#A2BDDB]/50 text-sm">
                <strong className="text-[#FBBF24]">License:</strong> Backport is open-source under the{" "}
                <strong className="text-white">MIT License</strong>. View the full license on{" "}
                <a href="https://github.com/Qureshi-1/Backport-io/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-[#04e184] underline underline-offset-2">
                  GitHub
                </a>.
              </p>
            </div>
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
          </section>

        </div>
      </main>

<<<<<<< HEAD
      {/* Footer V7 */}
      <footer className="lg:pl-64 w-full bg-black border-t border-[#353535]/20 flex flex-col md:flex-row justify-between items-center px-12 py-6 relative z-10">
        <div className="flex items-center gap-6">
          <span className="font-headline uppercase text-[9px] tracking-widest text-[#353535]">©2025 BACKPORT-IO // SYSTEM_STABLE</span>
        </div>
        <div className="flex gap-8 mt-4 md:mt-0">
          <span className="font-headline text-[9px] uppercase tracking-widest text-[#34FF8C]">Uptime: 99.99%</span>
          <span className="font-headline text-[9px] uppercase tracking-widest text-[#849495]">Latency: 12ms</span>
          <span className="font-headline text-[9px] uppercase tracking-widest text-[#849495]">IND_ENG_NODE_01</span>
        </div>
      </footer>
=======
      <div className="lg:pl-64 relative z-10">
        <Footer />
      </div>
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
    </div>
  );
}
