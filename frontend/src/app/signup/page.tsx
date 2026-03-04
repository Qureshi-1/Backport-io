"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { auth, GATEWAY_URL } from "@/lib/auth";

const PERKS = [
  "1 free gateway forever",
  "WAF, Rate Limiting & Caching included",
  "Real-time dashboard",
  "No credit card required",
];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${GATEWAY_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Signup failed");
      auth.setToken(data.access_token);
      if (data.default_key) auth.setSelectedKey(data.default_key);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f18_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f18_1px,transparent_1px)] bg-[size:14px_24px]" />

      <div className="relative w-full max-w-4xl grid md:grid-cols-2 gap-10 items-center">
        {/* Left — Perks */}
        <div className="hidden md:block">
          <Link href="/" className="flex items-center gap-2 mb-10">
            <ShieldCheck
              suppressHydrationWarning
              className="h-7 w-7 text-emerald-500"
            />
            <span className="text-xl font-semibold text-white">Backport</span>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
            Ship with a production-ready
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              API gateway in 30 seconds.
            </span>
          </h2>
          <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
            Backport sits between your users and your backend — protecting,
            caching, and rate limiting every request automatically.
          </p>
          <ul className="space-y-3">
            {PERKS.map((p) => (
              <li
                key={p}
                className="flex items-center gap-3 text-sm text-zinc-300"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — Form */}
        <div>
          {/* Mobile logo */}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 mb-8 md:hidden"
          >
            <ShieldCheck className="h-7 w-7 text-emerald-500" />
            <span className="text-xl font-semibold text-white">Backport</span>
          </Link>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 backdrop-blur-md shadow-2xl">
            <h1 className="text-2xl font-bold text-white mb-1">
              Create your account
            </h1>
            <p className="text-sm text-zinc-400 mb-8">
              Free forever. No card required.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min. 6 characters"
                  minLength={6}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              {error && (
                <div className="text-sm space-y-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  <p>{error}</p>
                  <p className="text-[10px] opacity-70">
                    Target: {GATEWAY_URL}/auth/signup
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-60 mt-2"
              >
                {loading && (
                  <Loader2
                    suppressHydrationWarning
                    className="h-4 w-4 animate-spin"
                  />
                )}
                {loading ? "Creating account..." : "Create Free Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
