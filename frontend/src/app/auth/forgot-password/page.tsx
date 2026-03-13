"use client";
import { useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import MatrixBackground from "@/components/MatrixBackground";
import TypingEffect from "@/components/TypingEffect";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    
    // Simulate API request
    try {
      await new Promise((r) => setTimeout(r, 1500));
      setSuccess(true);
      toast.success("Password reset link sent!");
    } catch (err: any) {
      setError("Failed to send reset link. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center p-4 overflow-hidden">
      <MatrixBackground />
      
      <div className="absolute top-16 md:top-24 w-full text-center px-4 z-10">
        <TypingEffect />
      </div>

      <div className="z-10 w-full flex justify-center mt-12">
        <div className="w-full max-w-md bg-black/80 backdrop-blur-md p-8 rounded-none border border-green-500/50 shadow-[0_0_30px_rgba(0,255,135,0.2)] relative">
          <div className="absolute top-4 left-4">
            <Link
              href="/auth/login"
              className="text-green-400 hover:text-green-300 font-mono text-sm transition-colors"
            >
              &larr; Back to Login
            </Link>
          </div>
          <div className="text-center mb-8 mt-6">
            <h1 className="text-2xl font-bold text-green-400 font-mono tracking-wider drop-shadow-[0_0_8px_rgba(0,255,135,0.8)]">
              // RECOVER_PORTAL
            </h1>
            <p className="text-green-500/60 font-mono text-xs mt-2 uppercase tracking-widest">
              Reset Security Clearance
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                {loading ? "TRANSMITTING..." : "SEND_RESET_LINK"}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center text-green-400 mb-4">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>
              <p className="font-mono text-green-300 text-sm">
                Instructions dispatched to {email}
              </p>
              <p className="font-mono text-green-500/60 text-xs mt-2">
                Please check your inbox (and spam folder) to proceed with identity regeneration.
              </p>
            </div>
          )}

          <div className="mt-8 text-center text-xs font-mono text-green-600/60">
            NO ACCOUNT FOUND?{" "}
            <Link
              href="/auth/signup"
              className="text-green-400 hover:text-green-300 hover:underline hover:drop-shadow-[0_0_5px_rgba(0,255,135,0.8)] transition-all"
            >
              INITIALIZE_ACCOUNT
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
