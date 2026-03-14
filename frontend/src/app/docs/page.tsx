import Link from "next/link";
import { ArrowRight, Book, Shield, Zap, RefreshCw, Key, Code } from "lucide-react";
import MatrixBackground from "@/components/MatrixBackground";

export default function DocsPage() {
  return (
    <div className="relative min-h-screen bg-black text-zinc-300 selection:bg-emerald-500/30">
      <MatrixBackground />
      
      {/* Navbar Minimal */}
      <nav className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur-md">
        <Link href="/" className="font-mono text-xl font-bold tracking-tighter text-white">
          Backport<span className="text-emerald-500">.</span>
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="https://github.com/Qureshi-1/Backport-io" target="_blank" className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
            ★ Star on GitHub
          </Link>
        </div>
      </nav>

      <div className="mx-auto flex max-w-7xl flex-col md:flex-row relative z-10 pt-8 pb-20">
        
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 flex-shrink-0 px-6 md:sticky md:top-24 md:h-[calc(100vh-8rem)] md:overflow-y-auto hidden md:block border-r border-zinc-800/50">
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">Getting Started</h4>
          <ul className="space-y-3 mb-8">
            <li><Link href="#introduction" className="text-emerald-400 text-sm font-medium">Introduction</Link></li>
            <li><Link href="#quickstart" className="text-zinc-400 hover:text-white text-sm transition-colors">Quickstart Guide</Link></li>
            <li><Link href="#authentication" className="text-zinc-400 hover:text-white text-sm transition-colors">Authentication</Link></li>
          </ul>

          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">Core Features</h4>
          <ul className="space-y-3 mb-8">
            <li><Link href="#rate-limiting" className="text-zinc-400 hover:text-white text-sm transition-colors flex items-center gap-2"><Zap className="w-3 h-3"/> Rate Limiting</Link></li>
            <li><Link href="#caching" className="text-zinc-400 hover:text-white text-sm transition-colors flex items-center gap-2"><RefreshCw className="w-3 h-3"/> LRU Caching</Link></li>
            <li><Link href="#idempotency" className="text-zinc-400 hover:text-white text-sm transition-colors flex items-center gap-2"><Key className="w-3 h-3"/> Idempotency</Link></li>
            <li><Link href="#waf" className="text-zinc-400 hover:text-white text-sm transition-colors flex items-center gap-2"><Shield className="w-3 h-3"/> WAF Security</Link></li>
          </ul>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 px-6 md:px-12 prose prose-invert prose-emerald max-w-3xl">
          <div id="introduction">
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Documentation</h1>
            <p className="text-lg text-zinc-400 leading-relaxed mb-8">
              Backport is an open-source, ultra-fast API gateway designed to sit in front of your raw backend. It transparently adds enterprise features—like rate limiting, WAF security, caching, and idempotency—without requiring you to write a single line of code in your backend logic.
            </p>
          </div>

          <div id="quickstart" className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-zinc-800 pb-2">Quickstart Guide</h2>
            <p className="mb-4 text-zinc-300">
              The easiest way to get started is by signing up for the managed Cloud platform. Simply register, paste your current vulnerable backend URL into the dashboard, and instantly receive a secure Gateway endpoint.
            </p>
            <div className="bg-black border border-zinc-800 rounded-xl p-4 my-6 font-mono text-sm">
              <div className="text-zinc-500 mb-2">// 1. Instead of calling your API directly:</div>
              <div className="text-rose-400 mb-4 line-through">fetch('https://api.yourdomain.com/users')</div>
              
              <div className="text-zinc-500 mb-2">// 2. Call your Backport Proxy with your provisioned API Key:</div>
              <div className="text-emerald-400">
                fetch('https://backpack-backend-wldo.onrender.com/proxy/users', {'{'} <br/>
                &nbsp;&nbsp;headers: {'{'} 'X-API-Key': 'bk_live_abcdef123456' {'}'} <br/>
                {'}'})
              </div>
            </div>
          </div>

          <div id="rate-limiting" className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-zinc-800 pb-2 flex items-center gap-3">
              <Zap className="text-emerald-500 w-6 h-6" /> Rate Limiting
            </h2>
            <p className="mb-4 text-zinc-300">
              Backport automatically applies a Sliding Window Rate Limit to protect your databases from DDOS bursts and accidental script loops.
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-zinc-400">
              <li>Free-tier limits traffic strictly.</li>
              <li>Exceeding limits instantly drops the request, returning <code className="text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded">HTTP 429 Too Many Requests</code>.</li>
              <li>The target backend is strictly spared from executing the logic.</li>
            </ul>
          </div>

          <div id="caching" className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-zinc-800 pb-2 flex items-center gap-3">
              <RefreshCw className="text-emerald-500 w-6 h-6" /> LRU Caching
            </h2>
            <p className="mb-4 text-zinc-300">
              Heavy <code>GET</code> endpoints like analytics, reports, or lists often thrash databases unnecessarily. If enabled in your settings, Backport intercepts <code>GET</code> responses and caches them in a dynamic LRU (Least Recently Used) cache tree.
            </p>
            <p className="text-zinc-300 mb-4 border-l-2 border-emerald-500 pl-4 py-1 bg-emerald-500/5">
              Subsequent repeated hits to the exact same route will be served directly from Backport's memory in <strong>under 2 milliseconds</strong>.
            </p>
          </div>

          <div id="idempotency" className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-zinc-800 pb-2 flex items-center gap-3">
              <Key className="text-emerald-500 w-6 h-6" /> Idempotency Keys
            </h2>
            <p className="mb-4 text-zinc-300">
              Double-posting payments is a nightmare. Backport makes all <code>POST</code> requests completely safe. Pass an <code>Idempotency-Key</code> header to tell the gateway this action must only happen once.
            </p>
            <div className="bg-black border border-zinc-800 rounded-xl p-4 my-6 font-mono text-sm text-zinc-300">
              <span className="text-emerald-400">curl</span> -X POST https://backpack-backend-wldo.onrender.com/proxy/checkout \<br/>
              &nbsp;&nbsp;-H <span className="text-amber-300">"X-API-Key: bk_12345"</span> \<br/>
              &nbsp;&nbsp;-H <span className="text-amber-300">"Idempotency-Key: transaction_88910"</span> \<br/>
              &nbsp;&nbsp;-d <span className="text-blue-300">'{"{"}"amount": 5000{"}"}'</span>
            </div>
            <p className="text-zinc-400 text-sm">
              If the user loses connection and clicks "Pay" again, Backport simply intercepts the duplicate key and returns the original success result without hitting your backend.
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}
