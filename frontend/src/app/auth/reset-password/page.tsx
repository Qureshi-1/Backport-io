"use client";
import { useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import MatrixBackground from "@/components/MatrixBackground";
import TypingEffect from "@/components/TypingEffect";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");
    
    // Simulate API request
    try {
      await new Promise((r) => setTimeout(r, 1500));
      setSuccess(true);
      toast.success("Security clearance restored!");
    } catch (err: any) {
      setError("Failed to reset password. Link may be expired.");
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
          <div className="text-center mb-8 mt-6">
            <h1 className="text-2xl font-bold text-green-400 font-mono tracking-wider drop-shadow-[0_0_8px_rgba(0,255,135,0.8)]">
              // RECOVER_PORTAL
            </h1>
            <p className="text-green-500/60 font-mono text-xs mt-2 uppercase tracking-widest">
              Set New Passphrase
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-mono text-green-500 mb-2 uppercase tracking-wider">
                  &gt; New Passphrase [Password]
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-green-500/50 px-4 py-3 text-green-300 font-mono focus:border-green-400 focus:shadow-[0_0_15px_#00ff87] outline-none transition-all placeholder:text-green-900/50"
                  placeholder="********"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-green-500 mb-2 uppercase tracking-wider">
                  &gt; Confirm Passphrase
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {loading ? "UPDATING..." : "COMMIT_CHANGES"}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center text-green-400 mb-4">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-mono text-green-300 text-sm">
                Passphrase updated successfully.
              </p>
              <Link
                href="/auth/login"
                className="mt-6 block w-full bg-green-500 hover:bg-green-400 text-black font-bold font-mono py-3 flex items-center justify-center uppercase tracking-widest transition-all hover:shadow-[0_0_20px_#00ff87]"
              >
                ACCESS_PORTAL
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
