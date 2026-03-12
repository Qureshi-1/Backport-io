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
    <div className="w-full max-w-md bg-black/80 backdrop-blur-md p-8 rounded-none border border-green-500/50 shadow-[0_0_30px_rgba(0,255,135,0.2)] relative">
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="text-green-400 hover:text-green-300 font-mono text-sm transition-colors"
        >
          &larr; Back to Home
        </Link>
      </div>
      <div className="text-center mb-8 mt-6">
        <h1 className="text-2xl font-bold text-green-400 font-mono tracking-wider drop-shadow-[0_0_8px_rgba(0,255,135,0.8)]">
          // REGISTRATION_PORTAL
        </h1>
        <p className="text-green-500/60 font-mono text-xs mt-2 uppercase tracking-widest">
          Establish New Uplink
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-mono text-green-500 mb-2 uppercase tracking-wider">
            &gt; Identity [Email]
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black border border-green-500/50 px-4 py-3 text-green-300 font-mono focus:border-green-400 focus:shadow-[0_0_15px_#00ff87] outline-none transition-all placeholder:text-green-900/50"
            placeholder="user@system.init"
          />
        </div>
        <div>
          <label className="block text-xs font-mono text-green-500 mb-2 uppercase tracking-wider">
            &gt; Passphrase [Password]
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black border border-green-500/50 px-4 py-3 text-green-300 font-mono focus:border-green-400 focus:shadow-[0_0_15px_#00ff87] outline-none transition-all placeholder:text-green-900/50"
            placeholder="********"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 text-xs font-mono text-red-400 bg-red-950/40 p-3 border border-red-500/30">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>ERR: {error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-400 text-black font-bold font-mono py-3 uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_#00ff87] disabled:opacity-50 disabled:hover:shadow-none"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "INITIALIZING..." : "INITIALIZE_ACCOUNT"}
        </button>
      </form>

      <div className="mt-8 text-center text-xs font-mono text-green-600/60">
        ALREADY CONNECTED?{" "}
        <Link
          href="/auth/login"
          className="text-green-400 hover:text-green-300 hover:underline hover:drop-shadow-[0_0_5px_rgba(0,255,135,0.8)] transition-all"
        >
          ACCESS_PORTAL
        </Link>
      </div>
    </div>
  );
}
