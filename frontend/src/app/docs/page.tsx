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
            <li><Link href="#installation" className="text-zinc-400 hover:text-white text-sm transition-colors flex items-center gap-2"><Code className="w-3 h-3"/> Installation Guide</Link></li>
            <li><Link href="#authentication" className="text-zinc-400 hover:text-white text-sm transition-colors flex items-center gap-2"><Key className="w-3 h-3"/> Authentication & API Keys</Link></li>
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
                fetch('https://backport-io.onrender.com/proxy/users', {'{'} <br/>
                &nbsp;&nbsp;headers: {'{'} 'X-API-Key': 'bk_live_abcdef123456' {'}'} <br/>
                {'}'})
              </div>
            </div>
          </div>

          <div id="installation" className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-zinc-800 pb-2 flex items-center gap-3">
              <Code className="text-emerald-500 w-6 h-6" /> Installation Guide
            </h2>

            <h3 className="text-lg font-semibold text-white mt-8 mb-3">Option 1: Quick Install (npx)</h3>
            <p className="mb-4 text-zinc-300">
              The fastest way to scaffold and connect Backport to your project locally:
            </p>
            <div className="bg-black border border-zinc-800 rounded-xl p-4 my-4 font-mono text-sm">
              <div className="text-zinc-500 mb-2"># Initialize Backport in your project</div>
              <div className="text-emerald-400">npx backport init</div>
              <div className="text-zinc-500 mt-4 mb-2"># This will:</div>
              <div className="text-zinc-400"># 1. Create a backport.config.json in your project root</div>
              <div className="text-zinc-400"># 2. Prompt you for your API key</div>
              <div className="text-zinc-400"># 3. Auto-detect your backend port</div>
              <div className="text-zinc-400"># 4. Set up the gateway proxy URL</div>
            </div>
            <p className="text-zinc-400 text-sm border-l-2 border-emerald-500 pl-4 py-1 bg-emerald-500/5 mb-6">
              <strong className="text-emerald-400">Note:</strong> The <code className="text-emerald-300 bg-emerald-500/10 px-1 py-0.5 rounded">npx backport init</code> command is available for projects that want to self-host Backport. For managed Cloud hosting, simply sign up at <a href="/auth/signup" className="text-emerald-400 underline">backport-io.vercel.app</a> and use the dashboard.
            </p>

            <h3 className="text-lg font-semibold text-white mt-8 mb-3">Option 2: Docker</h3>
            <p className="mb-4 text-zinc-300">
              Run Backport as a Docker container in front of your existing backend:
            </p>
            <div className="bg-black border border-zinc-800 rounded-xl p-4 my-4 font-mono text-sm">
              <div className="text-zinc-500 mb-2"># Pull and run the Backport gateway</div>
              <div className="text-emerald-400">docker run -p 8080:8080 \</div>
              <div className="text-emerald-400">&nbsp;&nbsp;-e BACKEND_URL=http://host.docker.internal:3000 \</div>
              <div className="text-emerald-400">&nbsp;&nbsp;qureshi/backport</div>
              <div className="text-zinc-500 mt-4 mb-2"># Or use docker-compose</div>
              <div className="text-emerald-400">docker-compose up -d</div>
            </div>

            <h3 className="text-lg font-semibold text-white mt-8 mb-3">Option 3: Managed Cloud (Recommended)</h3>
            <p className="mb-4 text-zinc-300">
              Zero setup. Just sign up, add your backend URL, and get a protected gateway endpoint instantly.
            </p>
            <ol className="list-decimal pl-6 mb-6 space-y-2 text-zinc-300">
              <li>Create an account at <a href="/auth/signup" className="text-emerald-400 underline">backport-io.vercel.app/auth/signup</a></li>
              <li>Go to <strong>Dashboard → Settings</strong> and paste your backend URL</li>
              <li>Go to <strong>Dashboard → API Keys</strong> and generate your API key</li>
              <li>Route your frontend traffic through the Backport gateway URL with the <code className="text-emerald-300 bg-emerald-500/10 px-1 py-0.5 rounded">X-API-Key</code> header</li>
            </ol>
          </div>

          <div id="authentication" className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-zinc-800 pb-2 flex items-center gap-3">
              <Key className="text-emerald-500 w-6 h-6" /> Authentication & API Keys
            </h2>
            <p className="mb-4 text-zinc-300">
              Every request through the Backport gateway must include a valid API key. Keys are provisioned from the Dashboard.
            </p>
            <div className="bg-black border border-zinc-800 rounded-xl p-4 my-6 font-mono text-sm">
              <div className="text-zinc-500 mb-2"># Authenticated GET request</div>
              <div className="text-emerald-400">curl</div><span className="text-zinc-300"> -X GET https://backport-io.onrender.com/proxy/users \</span><br/>
              <span className="text-zinc-300">&nbsp;&nbsp;-H </span><span className="text-amber-300">"X-API-Key: bk_live_your_key_here"</span>
            </div>
            <div className="bg-black border border-zinc-800 rounded-xl p-4 my-6 font-mono text-sm">
              <div className="text-zinc-500 mb-2"># Authenticated POST request with Idempotency</div>
              <div className="text-emerald-400">curl</div><span className="text-zinc-300"> -X POST https://backport-io.onrender.com/proxy/checkout \</span><br/>
              <span className="text-zinc-300">&nbsp;&nbsp;-H </span><span className="text-amber-300">"X-API-Key: bk_live_your_key_here"</span><span className="text-zinc-300"> \</span><br/>
              <span className="text-zinc-300">&nbsp;&nbsp;-H </span><span className="text-amber-300">"Idempotency-Key: txn_unique_12345"</span><span className="text-zinc-300"> \</span><br/>
              <span className="text-zinc-300">&nbsp;&nbsp;-H </span><span className="text-amber-300">"Content-Type: application/json"</span><span className="text-zinc-300"> \</span><br/>
              <span className="text-zinc-300">&nbsp;&nbsp;-d </span><span className="text-blue-300">{"'{\"amount\": 5000}'"}</span>
            </div>
            <h3 className="text-lg font-semibold text-white mt-6 mb-3">Response Codes</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-zinc-400">
              <li><code className="text-emerald-300 bg-emerald-500/10 px-1 py-0.5 rounded">200 OK</code> — Request passed through successfully</li>
              <li><code className="text-amber-300 bg-amber-500/10 px-1 py-0.5 rounded">304 Not Modified</code> — Served from cache</li>
              <li><code className="text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded">403 Forbidden</code> — WAF blocked malicious payload</li>
              <li><code className="text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded">429 Too Many Requests</code> — Rate limit exceeded</li>
              <li><code className="text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded">401 Unauthorized</code> — Invalid or missing API key</li>
            </ul>
          </div>

          <div id="waf" className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-zinc-800 pb-2 flex items-center gap-3">
              <Shield className="text-emerald-500 w-6 h-6" /> WAF Security
            </h2>
            <p className="mb-4 text-zinc-300">
              Backport includes a Web Application Firewall (WAF) that inspects every request at the gateway level before it reaches your backend. It automatically detects and blocks:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-zinc-400">
              <li><strong className="text-zinc-200">SQL Injection</strong> — Blocks payloads containing <code className="text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded">UNION SELECT</code>, <code className="text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded">DROP TABLE</code>, etc.</li>
              <li><strong className="text-zinc-200">XSS Attacks</strong> — Blocks <code className="text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded">{"<script>"}</code> injection and event handler abuse</li>
              <li><strong className="text-zinc-200">Path Traversal</strong> — Blocks <code className="text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded">../</code> directory traversal attempts</li>
              <li><strong className="text-zinc-200">Command Injection</strong> — Blocks shell metacharacters and OS command patterns</li>
            </ul>
            <p className="text-zinc-400 text-sm border-l-2 border-amber-500 pl-4 py-1 bg-amber-500/5">
              <strong className="text-amber-400">Important:</strong> Backport provides gateway-level protection. Always validate and sanitize inputs at your application layer as defense-in-depth.
            </p>
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
              <span className="text-emerald-400">curl</span> -X POST https://backport-io.onrender.com/proxy/checkout \<br/>
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
