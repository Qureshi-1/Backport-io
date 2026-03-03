"use client";

import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import Link from "next/link";
import { 
  ShieldCheck, 
  Zap, 
  Layers, 
  Lock, 
  Activity, 
  Server, 
  ChevronRight, 
  CheckCircle2,
  TerminalSquare,
  Globe,
  Database,
  ArrowRight
} from "lucide-react";
import { useEffect, useState } from "react";

// --- Components ---

const MouseGlow = () => {
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // MUST call useTransform unconditionally before any early returns (Rules of Hooks)
  const background = useTransform(
    [mouseX, mouseY],
    ([x, y]: number[]) =>
      `radial-gradient(600px circle at ${x}px ${y}px, rgba(16, 185, 129, 0.05), transparent 80%)`
  );

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  if (!mounted) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50"
      style={{ background }}
    />
  );
};

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-black/50 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-emerald-500" />
          <span className="text-lg font-semibold tracking-tight text-white">Backpack</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-4">
          <a href="#" className="hidden md:block text-sm font-medium text-white hover:text-emerald-400 transition-colors">Documentation</a>
          <Link 
            href="/dashboard"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95"
          >
            Start Free
          </Link>
        </div>
      </div>
    </header>
  );
}

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
      <div className="mx-auto max-w-7xl px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-400 mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Backpack 1.0 is now live
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-white md:text-7xl lg:text-8xl"
        >
          Security & Speed for <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            Every Backend
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 md:text-xl leading-relaxed"
        >
          Add rate limiting, intelligent caching, idempotency, and WAF to any backend in 30 seconds. No code changes required.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link 
            href="/dashboard"
            className="group flex h-12 items-center justify-center gap-2 rounded-full bg-white px-8 text-sm font-semibold text-black transition-all hover:scale-105 active:scale-95"
          >
            Start Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <button className="flex h-12 items-center justify-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/50 px-8 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-zinc-800 hover:border-zinc-600">
            <TerminalSquare className="h-4 w-4" />
            Watch 1-min Demo
          </button>
        </motion.div>
      </div>

      {/* Floating 3D Elements Mockup */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10 flex justify-center items-center">
        <motion.div
           animate={{
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute opacity-20 blur-[100px] bg-emerald-500 w-[600px] h-[600px] rounded-full"
        />
      </div>
    </section>
  );
}

const Logos = () => {
  return (
    <div className="border-y border-white/5 bg-black/30 py-10">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-sm font-medium text-zinc-500 mb-2">POWERED BY OPEN SOURCE</p>
        <p className="text-center text-xs text-zinc-600 mb-8">100% open source MIT licensed, no vendor lock-in</p>
        <div className="flex flex-wrap justify-center gap-10 opacity-70 sm:gap-20">
          <div className="flex items-center gap-3 text-lg font-medium text-zinc-400 hover:text-white transition-colors">
            <Server className="h-6 w-6" /> FastAPI
          </div>
          <div className="flex items-center gap-3 text-lg font-medium text-zinc-400 hover:text-white transition-colors">
            <Layers className="h-6 w-6" /> Next.js
          </div>
          <div className="flex items-center gap-3 text-lg font-medium text-zinc-400 hover:text-white transition-colors">
            <TerminalSquare className="h-6 w-6" /> Python
          </div>
          <div className="flex items-center gap-3 text-lg font-medium text-zinc-400 hover:text-white transition-colors">
            <Database className="h-6 w-6" /> Docker
          </div>
        </div>
      </div>
    </div>
  );
}

const Features = () => {
  const feats = [
    {
      title: "Zero-Knowledge Proxying",
      description: "Routes traffic reliably without stripping headers or modifying your payloads. Highly transparent.",
      icon: Activity
    },
    {
      title: "Intelligent WAF",
      description: "Intercepts and blocks malicious payloads like SQLi and XSS before they even touch your backend.",
      icon: ShieldCheck
    },
    {
      title: "Distributed Rate Limiting",
      description: "Prevent API abuse effectively using sliding window distributed memory counters.",
      icon: Lock
    },
    {
      title: "LRU Caching",
      description: "Sub-millisecond in-memory caching for GET requests to drastically reduce backend database load.",
      icon: Zap
    },
    {
      title: "POST Idempotency",
      description: "Safely handles duplicate mutations, guaranteeing endpoints execute only once per unique request.",
      icon: Layers
    },
    {
      title: "Real-time Dashboard",
      description: "A gorgeous real-time UI to monitor traffic, cache hits, and thwarted threats instantly.",
      icon: Server
    }
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">Everything you need. <br />Nothing you don't.</h2>
          <p className="mt-4 text-lg text-zinc-400">Backpack is an all-in-one infrastructure layer that sits directly in front of your API.</p>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {feats.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40 p-8 hover:bg-zinc-900/80 transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-emerald-400 border border-white/5 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 transition-colors">
                  <feat.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">{feat.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{feat.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const Flow = () => {
  return (
    <section id="how-it-works" className="py-24 border-y border-white/5 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-16">How Backpack Works</h2>
        
        <div className="grid gap-8 md:grid-cols-3">
          <div className="relative flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 mb-6 font-bold text-xl">1</div>
            <h3 className="text-lg font-semibold text-white mb-2">Deploy Backpack</h3>
            <p className="text-sm text-zinc-400 text-center">Spin up the Docker container or deploy to a cloud provider in one click.</p>
          </div>
          
          <div className="relative flex flex-col items-center">
            <div className="hidden md:block absolute top-8 left-0 right-0 h-[1px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 -z-10" />
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 mb-6 font-bold text-xl">2</div>
            <h3 className="text-lg font-semibold text-white mb-2">Point your DNS</h3>
            <p className="text-sm text-zinc-400 text-center">Route your public traffic to Backpack instead of your raw backend.</p>
          </div>

          <div className="relative flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 mb-6 font-bold text-xl">3</div>
            <h3 className="text-lg font-semibold text-white mb-2">Configure Target</h3>
            <p className="text-sm text-zinc-400 text-center">Enter your internal backend URL in the dashboard. You're fully secured.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const Pricing = () => {
  return (
    <section id="pricing" className="py-32 relative">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">Simple pricing</h2>
          <p className="mt-4 text-lg text-zinc-400">Start free for hobby projects, upgrade when you need scale.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="rounded-3xl border border-white/10 bg-zinc-900/30 p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold text-white mb-2">Self-Hosted</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-zinc-500 font-medium">/forever</span>
            </div>
            <p className="text-sm text-zinc-400 mb-8 border-b border-white/10 pb-8">Perfect for hobbyists and local development.</p>
            <ul className="space-y-4 mb-8">
              {["Unlimited Requests", "Basic WAF Rules", "Memory Caching", "Community Support"].map(f => (
                <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" /> {f}
                </li>
              ))}
            </ul>
            <a href="https://github.com/Qureshi-1/Backpack-io" target="_blank" className="block w-full text-center rounded-lg bg-white/10 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors">
              View on GitHub
            </a>
          </div>

          {/* Pro Tier */}
          <div className="relative rounded-3xl border border-emerald-500/50 bg-black p-8 shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]">
            <div className="absolute top-0 right-8 -translate-y-1/2">
              <span className="inline-block rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-black">Recommended</span>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">Cloud Pro</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold text-white">$9</span>
              <span className="text-zinc-500 font-medium">/month</span>
            </div>
            <p className="text-sm text-zinc-400 mb-8 border-b border-white/10 pb-8">Fully managed globally distributed gateway.</p>
            <ul className="space-y-4 mb-8">
              {["Everything in Free", "Redis Distributed Cache", "Advanced AI WAF", "99.99% Uptime SLA", "Email Support"].map(f => (
                <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/dashboard" className="block w-full text-center rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-black pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6 flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          <span className="text-base font-semibold text-white">Backpack</span>
        </div>
        <p className="text-sm text-zinc-500">&copy; {new Date().getFullYear()} Backpack.io. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="text-zinc-500 hover:text-white transition-colors">Twitter</a>
          <a href="#" className="text-zinc-500 hover:text-white transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}

const Badge = () => (
  <a 
    href="https://antigravity.google" 
    target="_blank" 
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-zinc-800 bg-black/80 px-4 py-2 text-xs font-medium text-zinc-400 backdrop-blur-md transition-all hover:border-zinc-600 hover:text-white"
  >
    <div className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-emerald-500 animate-pulse" />
    Made with Antigravity
  </a>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
      <MouseGlow />
      <Header />
      
      <main>
        <Hero />
        <Logos />
        <Features />
        <Flow />
        <Pricing />
      </main>

      <Footer />
      <Badge />
    </div>
  );
}
