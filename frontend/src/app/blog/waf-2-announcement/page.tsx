import Link from "next/link";
import { ArrowLeft, Calendar, User, Clock, ArrowRight, Shield, Zap, Database, Key } from "lucide-react";

export default function WAF2Post() {
  return (
    <div className="max-w-4xl mx-auto px-6">
      <Link href="/blog" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to Blog
      </Link>

      <header className="mb-12">
        <div className="flex items-center gap-4 mb-6">
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

      <div className="aspect-video rounded-2xl bg-zinc-900 mb-12 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200" 
          alt="Security shield" 
          className="w-full h-full object-cover opacity-80"
        />
      </div>

      <div className="prose prose-invert prose-lg max-w-none mb-16">
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

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-zinc-400 font-medium">Attack Type</th>
                <th className="p-4 text-zinc-400 font-medium">Example Payload</th>
                <th className="p-4 text-zinc-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="p-4 text-white">SQL Injection</td>
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
              </tr>
            </tbody>
          </table>
        </div>

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
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mt-12 mb-6">How to Enable</h2>

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
    </div>
  );
}
