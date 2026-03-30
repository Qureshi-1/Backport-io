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
            </div>
          </div>
        </div>

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
          </div>
        </div>
      </aside>

      {/* Main Content */}
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
                </div>
              </div>
            </div>
          </div>

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
                  { n: "01", color: "text-[#34FF8C]", prefix: "$", text: "npx backport-io init" },
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
                </div>
              ))}
            </div>
          </section>

          {/* WAF Security */}
          <section id="waf" className="mb-20">
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
            </p>
          </section>

          {/* Rate Limiting */}
          <section id="rate-limiting" className="mb-20">
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
          </section>

          {/* LRU Caching */}
          <section id="caching" className="mb-20">
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
              </p>
            </div>
          </section>

          {/* Idempotency */}
          <section id="idempotency" className="mb-20">
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
          </section>

        </div>
      </main>

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
    </div>
  );
}
