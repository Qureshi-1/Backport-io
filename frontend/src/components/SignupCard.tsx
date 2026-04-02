"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";

interface SignupCardProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  error: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function SignupCard({
  email,
  setEmail,
  password,
  setPassword,
  error,
  loading,
  onSubmit,
}: SignupCardProps) {
  return (
    <div className="w-full max-w-md bg-[#0e0e0e]/90 backdrop-blur-md p-10 border border-[#3b494b]/50 shadow-[0_0_40px_rgba(0,240,255,0.15)] relative">
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="text-[#849495] hover:text-[#00F0FF] font-headline uppercase tracking-widest text-[10px] pb-1 border-b border-transparent hover:border-[#00F0FF]/30 transition-all font-bold"
        >
          &larr; Back
        </Link>
      </div>
      <div className="text-center mb-8 mt-6">
        <h1 className="text-3xl font-bold text-[#00F0FF] font-headline tracking-widest drop-shadow-[0_0_8px_rgba(0,240,255,0.4)] uppercase">
          Register
        </h1>
        <p className="text-[#849495] font-headline text-[10px] mt-3 uppercase tracking-[0.2rem]">
          Establish New Uplink
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
            minLength={6}
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#00F0FF] hover:bg-[#34FF8C] text-[#003338] font-bold font-headline py-4 uppercase tracking-[0.2rem] flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_30px_rgba(52,255,140,0.3)] disabled:opacity-50 disabled:hover:shadow-none"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "INITIALIZING..." : "INITIALIZE_ACCOUNT"}
        </button>
      </form>

      <div className="mt-8 text-center text-[10px] font-headline uppercase tracking-widest text-[#849495]">
        ALREADY CONNECTED?{" "}
        <Link
          href="/auth/login"
          className="text-[#00F0FF] font-bold hover:text-[#34FF8C] hover:drop-shadow-[0_0_5px_rgba(52,255,140,0.5)] transition-all ml-1"
        >
          ACCESS_PORTAL
        </Link>
      </div>
    </div>
  );
}
