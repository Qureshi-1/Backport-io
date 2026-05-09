import Link from "next/link";
<<<<<<< HEAD
import { ArrowLeft, Calendar, User, Clock, ArrowRight, Shield, Zap, Database, Key } from "lucide-react";

export default function WAF2Post() {
  return (
    <div className="max-w-4xl mx-auto px-6">
      <Link href="/blog" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8">
=======
import type { Metadata } from "next";
import { ArrowLeft, Calendar, User, Clock, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "How Backport's WAF Blocks Malicious Requests | Backport Blog",
  description: "A look at our 17 regex-based WAF patterns covering SQL injection, XSS, path traversal, command injection, LDAP injection, and XXE. Complete guide to API security.",
  openGraph: {
    title: "How Backport's WAF Blocks Malicious Requests",
    description: "17 regex-based WAF patterns covering SQL injection, XSS, path traversal, command injection, and more.",
    url: "https://backport.in/blog/waf-2-announcement",
    siteName: "Backport",
    type: "article",
    publishedTime: "2026-03-22",
    authors: ["Backport Team"],
    tags: ["WAF", "Security", "SQL Injection", "XSS", "API Security", "Web Application Firewall"],
    images: [{ url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How Backport's WAF Blocks Malicious Requests",
    description: "17 regex-based WAF patterns covering SQL injection, XSS, path traversal, and more.",
    images: ["https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200"],
  },
  alternates: { canonical: "https://backport.in/blog/waf-2-announcement" },
};

export default function WAF2Post() {
  return (
    <div className="min-h-screen bg-[#080C10]">
      <Header />
      <div className="max-w-4xl mx-auto px-6 pt-28 pb-16">
      {/* Back link */}
      <Link href="/blog" className="inline-flex items-center gap-2 text-[#A2BDDB]/40 hover:text-white transition-colors mb-8">
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
        <ArrowLeft className="w-4 h-4" />
        Back to Blog
      </Link>

      <header className="mb-12">
        <div className="flex items-center gap-4 mb-6">
<<<<<<< HEAD
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium">
            Security
          </span>
          <span className="text-zinc-500 flex items-center gap-1">
            <Clock className="w-4 h-4" /> 5 min read
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          Introducing WAF 2.0: Stopping SQLi in 30 Seconds
        </h1>
        
        <div className="flex items-center gap-6 text-zinc-400">
=======
          <span className="px-3 py-1 rounded-full bg-[#2CE8C3]/[0.08] text-[#2CE8C3] text-sm font-medium">
            Security
          </span>
          <span className="text-[#A2BDDB]/30 flex items-center gap-1">
            <Clock className="w-4 h-4" /> 5 min read
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          How Backport&apos;s WAF Blocks Malicious Requests
        </h1>

        <div className="flex items-center gap-6 text-[#A2BDDB]/40">
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <span>Backport Team</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span>March 22, 2026</span>
          </div>
        </div>
      </header>

<<<<<<< HEAD
      <div className="aspect-video rounded-2xl bg-zinc-900 mb-12 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200" 
          alt="Security shield" 
          className="w-full h-full object-cover opacity-80"
=======
      <div className="aspect-video rounded-2xl bg-[#0A0E14] mb-12 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200"
          alt="Security shield"
          className="w-full h-full object-cover opacity-70"
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
        />
      </div>

      <div className="prose prose-invert prose-lg max-w-none mb-16">
<<<<<<< HEAD
        <p className="text-xl text-zinc-300 leading-relaxed mb-8">
          Today we're excited to announce WAF 2.0 — our most powerful Web Application Firewall engine yet. We've completely rewritten our detection logic to catch attacks faster, with fewer false positives.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-6">What's New in WAF 2.0</h2>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-zinc-900/50 rounded-xl p-6 border border-emerald-500/20">
            <Shield className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">50% Fewer False Positives</h3>
            <p className="text-zinc-400 text-sm">Improved pattern matching reduces false positives while maintaining detection rates.</p>
          </div>
          <div className="bg-zinc-900/50 rounded-xl p-6 border border-emerald-500/20">
            <Zap className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">3x Faster Detection</h3>
            <p className="text-zinc-400 text-sm">Optimized regex engine processes requests in under 1ms overhead.</p>
          </div>
          <div className="bg-zinc-900/50 rounded-xl p-6 border border-emerald-500/20">
            <Database className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">New Attack Vectors</h3>
            <p className="text-zinc-400 text-sm">Added detection for LDAP injection, XXE, and command injection patterns.</p>
          </div>
          <div className="bg-zinc-900/50 rounded-xl p-6 border border-emerald-500/20">
            <Key className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Custom Rules</h3>
            <p className="text-zinc-400 text-sm">Define your own patterns and blocking rules from the dashboard.</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mt-12 mb-6">Attack Patterns Detected</h2>

=======
        <p className="text-xl text-[#A2BDDB]/60 leading-relaxed mb-8">
          Backport includes a Web Application Firewall (WAF) that inspects every request before it reaches your backend. Here&apos;s how it works, what it catches, and how to use it.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-6">How It Works</h2>

        <p className="text-[#A2BDDB]/50 leading-relaxed mb-6">
          The WAF uses 17 pre-compiled regex patterns that scan request bodies, paths, and query parameters. When a request matches a known attack pattern, the gateway immediately returns HTTP 403 (Forbidden) and your backend is never touched. The regex-based check adds minimal overhead to each request.
        </p>

        <p className="text-[#A2BDDB]/50 leading-relaxed mb-6">
          <strong className="text-white">By default, WAF is OFF.</strong> You can enable it from Dashboard &rarr; Settings &rarr; Toggle WAF to ON. This gives you control — you can test your traffic first, then enable WAF when ready.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-6">Attack Patterns Detected</h2>

        <p className="text-[#A2BDDB]/50 leading-relaxed mb-6">
          The WAF covers 6 categories of web attacks. Here&apos;s every pattern we check for:
        </p>

>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
<<<<<<< HEAD
                <th className="p-4 text-zinc-400 font-medium">Attack Type</th>
                <th className="p-4 text-zinc-400 font-medium">Example Payload</th>
                <th className="p-4 text-zinc-400 font-medium">Status</th>
=======
                <th className="p-4 text-[#A2BDDB]/30 font-medium">Category</th>
                <th className="p-4 text-[#A2BDDB]/30 font-medium">Patterns</th>
                <th className="p-4 text-[#A2BDDB]/30 font-medium">What It Catches</th>
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="p-4 text-white">SQL Injection</td>
<<<<<<< HEAD
                <td className="p-4 font-mono text-red-400 text-sm">'; DROP TABLE users;--</td>
                <td className="p-4"><span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs">Blocked</span></td>
              </tr>
              <tr>
                <td className="p-4 text-white">XSS</td>
                <td className="p-4 font-mono text-red-400 text-sm">&lt;script&gt;alert(1)&lt;/script&gt;</td>
                <td className="p-4"><span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs">Blocked</span></td>
              </tr>
              <tr>
                <td className="p-4 text-white">Path Traversal</td>
                <td className="p-4 font-mono text-red-400 text-sm">../../../etc/passwd</td>
                <td className="p-4"><span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs">Blocked</span></td>
              </tr>
              <tr>
                <td className="p-4 text-white">Command Injection</td>
                <td className="p-4 font-mono text-red-400 text-sm">; rm -rf /</td>
                <td className="p-4"><span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs">Blocked</span></td>
              </tr>
              <tr>
                <td className="p-4 text-white">LDAP Injection</td>
                <td className="p-4 font-mono text-red-400 text-sm">(uid=*)</td>
                <td className="p-4"><span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs">Blocked</span></td>
              </tr>
              <tr>
                <td className="p-4 text-white">XXE</td>
                <td className="p-4 font-mono text-red-400 text-sm">&lt;!DOCTYPE foo&gt;</td>
                <td className="p-4"><span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs">Blocked</span></td>
=======
                <td className="p-4 text-[#A2BDDB]/50">5 patterns</td>
                <td className="p-4 text-[#A2BDDB]/40 text-sm">UNION SELECT, DROP TABLE, OR 1=1, xp_cmdshell, sp_executesql</td>
              </tr>
              <tr>
                <td className="p-4 text-white">XSS</td>
                <td className="p-4 text-[#A2BDDB]/50">4 patterns</td>
                <td className="p-4 text-[#A2BDDB]/40 text-sm">&lt;script&gt; tags, onerror handlers, javascript: URIs, &lt;iframe&gt;/&lt;embed&gt;</td>
              </tr>
              <tr>
                <td className="p-4 text-white">Path Traversal</td>
                <td className="p-4 text-[#A2BDDB]/50">2 patterns</td>
                <td className="p-4 text-[#A2BDDB]/40 text-sm">../ directory escapes, /etc/passwd, /proc/self access</td>
              </tr>
              <tr>
                <td className="p-4 text-white">Command Injection</td>
                <td className="p-4 text-[#A2BDDB]/50">3 patterns</td>
                <td className="p-4 text-[#A2BDDB]/40 text-sm">Shell metacharacters, subshell execution, backtick injection</td>
              </tr>
              <tr>
                <td className="p-4 text-white">LDAP Injection</td>
                <td className="p-4 text-[#A2BDDB]/50">1 pattern</td>
                <td className="p-4 text-[#A2BDDB]/40 text-sm">LDAP filter manipulation syntax</td>
              </tr>
              <tr>
                <td className="p-4 text-white">XML/XXE</td>
                <td className="p-4 text-[#A2BDDB]/50">1 pattern</td>
                <td className="p-4 text-[#A2BDDB]/40 text-sm">&lt;!DOCTYPE SYSTEM and &lt;!ENTITY declarations</td>
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
              </tr>
            </tbody>
          </table>
        </div>

<<<<<<< HEAD
        <h2 className="text-2xl font-bold text-white mt-12 mb-6">Performance Impact</h2>

        <p className="text-zinc-400 leading-relaxed mb-6">
          Despite the increased detection capabilities, WAF 2.0 has minimal impact on request latency:
        </p>

        <div className="bg-zinc-900/50 rounded-xl p-6 mb-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">WAF 1.0 Overhead</span>
              <span className="text-red-400 font-mono">2.1ms</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: "70%" }} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">WAF 2.0 Overhead</span>
              <span className="text-emerald-400 font-mono">0.3ms</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "10%" }} />
=======
        <h2 className="text-2xl font-bold text-white mt-12 mb-6">Testing It Yourself</h2>

        <p className="text-[#A2BDDB]/50 leading-relaxed mb-6">
          We tested the WAF against common attack payloads. Every request below was sent through the proxy with WAF enabled, and all were blocked with HTTP 403:
        </p>

        <div className="bg-[#0A0E14] border border-white/[0.04] rounded-xl p-6 mb-8">
          <div className="space-y-4 font-mono text-sm">
            <div>
              <span className="text-red-400">SQL Injection:</span>
              <span className="text-[#A2BDDB]/40 ml-2">{`1 OR 1=1 UNION SELECT * FROM users--`}</span>
              <span className="ml-2 px-2 py-0.5 bg-[#2CE8C3]/10 text-[#2CE8C3] text-xs rounded">403 Blocked</span>
            </div>
            <div>
              <span className="text-red-400">XSS:</span>
              <span className="text-[#A2BDDB]/40 ml-2">{`<script>alert(1)</script>`}</span>
              <span className="ml-2 px-2 py-0.5 bg-[#2CE8C3]/10 text-[#2CE8C3] text-xs rounded">403 Blocked</span>
            </div>
            <div>
              <span className="text-red-400">Path Traversal:</span>
              <span className="text-[#A2BDDB]/40 ml-2">../../../etc/passwd</span>
              <span className="ml-2 px-2 py-0.5 bg-[#2CE8C3]/10 text-[#2CE8C3] text-xs rounded">403 Blocked</span>
            </div>
            <div>
              <span className="text-red-400">Command Injection:</span>
              <span className="text-[#A2BDDB]/40 ml-2">; cat /etc/passwd</span>
              <span className="ml-2 px-2 py-0.5 bg-[#2CE8C3]/10 text-[#2CE8C3] text-xs rounded">403 Blocked</span>
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mt-12 mb-6">How to Enable</h2>

<<<<<<< HEAD
        <p className="text-zinc-400 leading-relaxed mb-6">
          WAF 2.0 is enabled by default for all new users. Existing users can enable it from their dashboard:
        </p>

        <ol className="list-decimal list-inside text-zinc-400 space-y-3 mb-8">
          <li>Go to Settings → Security</li>
          <li>Toggle "Enable WAF 2.0"</li>
          <li>Choose your protection level (Normal, Strict, or Custom)</li>
          <li>Save changes</li>
        </ol>
      </div>

      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-8 mb-16">
        <h3 className="text-2xl font-bold text-white mb-4">Get Started with WAF 2.0</h3>
        <p className="text-zinc-400 mb-6">
          Protect your API from attacks today. No configuration required.
        </p>
        <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-emerald-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-emerald-400 transition-colors">
          Start Free <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
=======
        <p className="text-[#A2BDDB]/50 leading-relaxed mb-4">
          WAF is toggled from your dashboard settings. Here&apos;s how to enable it:
        </p>

        <ol className="list-decimal list-inside text-[#A2BDDB]/50 space-y-3 mb-8">
          <li>Sign up and log in to your dashboard</li>
          <li>Go to Dashboard &rarr; Settings</li>
          <li>Toggle &quot;WAF Enabled&quot; to ON</li>
          <li>Save settings</li>
        </ol>

        <p className="text-[#A2BDDB]/50 leading-relaxed mb-6">
          Once enabled, every request through your proxy will be checked against all 17 patterns. Blocked requests return HTTP 403 with the response body <code className="text-[#2CE8C3] bg-[#2CE8C3]/[0.08] px-1.5 py-0.5 font-mono text-xs rounded">{`{"detail":"WAF Blocked: Malicious payload detected"}`}</code>.
        </p>

        <div className="bg-[#FBBF24]/[0.04] border-l-2 border-[#FBBF24]/20 p-4 rounded-r-lg">
          <p className="text-[#A2BDDB]/50 text-sm">
            <strong className="text-[#FBBF24]">Important:</strong> The WAF is a first line of defense. It catches common attack patterns, but it&apos;s not a replacement for secure coding practices. Always validate and sanitize inputs at your application layer.
          </p>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-[#2CE8C3]/15 rounded-2xl p-8 mb-16">
        <h3 className="text-2xl font-bold text-white mb-4">Try It Yourself</h3>
        <p className="text-[#A2BDDB]/50 mb-6">
          Sign up, enable WAF, and test against your own payloads. Free plan includes full WAF protection.
        </p>
        <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-[#2CE8C3] text-[#080C10] px-6 py-3 rounded-xl font-bold hover:bg-white transition-colors">
          Start Free <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <Footer />
      </div>
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
    </div>
  );
}
