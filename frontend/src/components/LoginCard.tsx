"use client";

import { useState } from "react";
import Link from "next/link";
<<<<<<< HEAD
import { Loader2, AlertCircle } from "lucide-react";

interface LoginCardProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  error: string;
  coldStartMsg: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function LoginCard({
  email,
  setEmail,
  password,
  setPassword,
  error,
  coldStartMsg,
  loading,
  onSubmit,
}: LoginCardProps) {
  return (
    <div className="w-full max-w-md bg-[#0e0e0e]/90 backdrop-blur-md p-10 border border-[#3b494b]/50 shadow-[0_0_40px_rgba(0,240,255,0.15)] relative">
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="text-[#849495] hover:text-[#00F0FF] font-headline uppercase tracking-widest text-[10px] pb-1 border-b border-transparent hover:border-[#00F0FF]/30 transition-all font-bold"
=======
import { Loader2, Cloud, Server } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backport-io.onrender.com";

export default function LoginCard() {
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [warmingUp, setWarmingUp] = useState(false);
  const [warmMessage, setWarmMessage] = useState("");

  const handleSocialLogin = async (provider: "google" | "github") => {
    setOauthLoading(provider);
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 5000);
      await fetch(`${API_URL}/health`, { signal: ctrl.signal, cache: "no-store" });
      clearTimeout(tid);
      window.location.href = `${API_URL}/api/auth/${provider}/login`;
    } catch {
      setWarmingUp(true);
      setWarmMessage("Server is waking up, redirecting...");
      setTimeout(() => {
        window.location.href = `${API_URL}/api/auth/${provider}/login`;
      }, 3000);
    }
  };

  return (
    <div className="w-full max-w-md glass-card rounded-2xl p-6 sm:p-10 relative">
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="text-[#849495] hover:text-[#6BA9FF] text-xs pb-1 border-b border-transparent hover:border-[#6BA9FF]/30 transition-all flex items-center gap-1 min-h-[44px] min-w-[44px]"
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
        >
          &larr; Back
        </Link>
      </div>
<<<<<<< HEAD
      <div className="text-center mb-8 mt-6">
        <h1 className="text-3xl font-bold text-[#00F0FF] font-headline tracking-widest drop-shadow-[0_0_8px_rgba(0,240,255,0.4)] uppercase">
          Portal
        </h1>
        <p className="text-[#849495] font-headline text-[10px] mt-3 uppercase tracking-[0.2rem]">
          Authentication Required
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-[11px] font-headline text-[#34FF8C] mb-2 uppercase tracking-widest font-bold">
            &gt; Identity [Email]
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#111111] border border-[#3b494b]/50 px-4 py-3 text-[#e2e2e2] font-mono text-sm focus:border-[#00F0FF] focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] outline-none transition-all placeholder:text-[#849495]/50"
            placeholder="user@system.init"
          />
        </div>
        <div>
          <label className="block text-[11px] font-headline text-[#34FF8C] mb-2 uppercase tracking-widest font-bold">
            &gt; Passphrase [Password]
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#111111] border border-[#3b494b]/50 px-4 py-3 text-[#e2e2e2] font-mono text-sm focus:border-[#00F0FF] focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] outline-none transition-all placeholder:text-[#849495]/50"
            placeholder="********"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 text-xs font-mono text-red-400 bg-red-950/40 p-4 border border-red-500/30">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>ERR: {error}</span>
          </div>
        )}

        {coldStartMsg && !error && (
          <div className="flex items-start gap-2 text-xs font-mono text-amber-400 bg-amber-950/40 p-4 border border-amber-500/30">
            <Loader2 className="h-4 w-4 mt-0.5 flex-shrink-0 animate-spin" />
            <span>WAIT: {coldStartMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#00F0FF] hover:bg-[#34FF8C] text-[#003338] font-bold font-headline py-4 uppercase tracking-[0.2rem] flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_30px_rgba(52,255,140,0.3)] disabled:opacity-50 disabled:hover:shadow-none"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "INITIALIZING..." : "ACCESS_PORTAL"}
        </button>

        <div className="flex justify-between items-center text-[10px] font-headline uppercase tracking-widest">
          <Link
            href="/auth/forgot-password"
            className="text-[#849495] hover:text-[#00F0FF] transition-colors pb-0.5 border-b border-[#3b494b]/30 hover:border-[#00F0FF]/30"
          >
            Forgot Passphrase?
          </Link>
          <div className="text-[#849495]">
            NO UPLINK?{" "}
            <Link
              href="/auth/signup"
              className="text-[#00F0FF] font-bold hover:text-[#34FF8C] hover:drop-shadow-[0_0_5px_rgba(52,255,140,0.5)] transition-all ml-1"
            >
              INITIALIZE
            </Link>
          </div>
        </div>
      </form>
=======
      <AnimatePresence>
        {warmingUp && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg"
          >
            <Server className="h-3.5 w-3.5 text-[#F59E0B] animate-pulse" />
            <span className="text-[#F59E0B] text-xs font-medium">{warmMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="text-center mb-8 mt-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
          Sign in to Backport
        </h1>
        <p className="text-[#A2BDDB]/50 text-xs sm:text-sm mt-2">
          Welcome back. Continue with your account.
        </p>
      </div>

      {/* Social Login Buttons — Google + GitHub Only */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleSocialLogin("google")}
          disabled={oauthLoading !== null}
          className="w-full flex items-center justify-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-white font-medium py-3.5 min-h-[44px] rounded-lg text-sm transition-all disabled:opacity-50"
        >
          {oauthLoading === "google" ? (
            warmingUp ? (
              <Cloud className="h-4 w-4 text-[#F59E0B] animate-pulse" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin" />
            )
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => handleSocialLogin("github")}
          disabled={oauthLoading !== null}
          className="w-full flex items-center justify-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-white font-medium py-3.5 min-h-[44px] rounded-lg text-sm transition-all disabled:opacity-50"
        >
          {oauthLoading === "github" ? (
            warmingUp ? (
              <Cloud className="h-4 w-4 text-[#F59E0B] animate-pulse" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin" />
            )
          ) : (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          )}
          Continue with GitHub
        </button>
      </div>

      <div className="mt-8 text-center text-sm text-[#A2BDDB]/50">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="text-[#04e184] font-medium hover:text-white transition-all ml-1"
        >
          Sign up
        </Link>
      </div>
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
    </div>
  );
}
