"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden px-6">
      {/* BG Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[600px] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-lg"
      >
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
          <ShieldCheck className="h-10 w-10 text-emerald-400" />
        </div>

        {/* Error code */}
        <div className="mb-4 font-mono text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600">
          404
        </div>

        <h1 className="mb-3 text-2xl font-bold text-white">
          Request Blocked
        </h1>
        <p className="mb-8 text-zinc-400 leading-relaxed">
          This route doesn't exist — or maybe the gateway blocked it.
          Either way, your backend is safe. 🛡️
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] hover:-translate-y-0.5"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </motion.div>

      {/* Terminal-style footer text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-12 font-mono text-xs text-zinc-700"
      >
        HTTP/1.1 404 Not Found — backport-gateway/1.0
      </motion.div>
    </div>
  );
}
