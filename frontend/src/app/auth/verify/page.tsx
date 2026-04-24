"use client";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { auth } from "@/lib/auth";
import Link from "next/link";
import toast from "react-hot-toast";
import { Shield, Copy, Check, ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [providedToken, setProvidedToken] = useState(searchParams.get("token") || "");
  const email = searchParams.get("email") || "";
  const [coldStartMsg, setColdStartMsg] = useState("");

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const hasToken = !!providedToken;

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
    if (email && !providedToken) {
      const timer = setTimeout(() => {
        setColdStartMsg("Requesting verification code...");
        handleResend();
      }, 500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const code = digits.join("");
    if (code.length === 6 && !digits.some(d => d === "")) {
      if (status === "loading" || status === "success") return;
      setStatus("loading");
      setMessage("");
      fetchApi(`/api/auth/verify-email?token=${encodeURIComponent(code)}`, {
        method: "GET",
      })
        .then((data: Record<string, unknown>) => {
          auth._markLoggedIn();
          if (data.api_key) auth.setApiKey(data.api_key as string);
          setStatus("success");
          setMessage((data.message as string) || "Email verified!");
          setTimeout(() => router.push("/dashboard"), 2500);
        })
        .catch((err: Error) => {
          setStatus("error");
          setShake(true);
          setTimeout(() => setShake(false), 600);
          let msg = err.message || "Verification failed. The code may be invalid or expired.";
          if (msg.includes("fetch") || msg.includes("network") || msg.includes("failed to fetch") || msg.includes("aborted")) {
            msg = "Server is waking up. Please wait a moment and try again.";
          }
          setMessage(msg);
          setDigits(["", "", "", "", "", ""]);
          setTimeout(() => {
            if (inputRefs.current[0]) inputRefs.current[0].focus();
          }, 100);
        });
    }
  }, [digits, status, router]);

  const verifyCode = useCallback((code: string) => {
    if (status === "loading" || status === "success") return;
    setStatus("loading");
    setMessage("");

    fetchApi(`/api/auth/verify-email?token=${encodeURIComponent(code)}`, {
      method: "GET",
    })
      .then((data: Record<string, unknown>) => {
        auth._markLoggedIn();
        if (data.api_key) auth.setApiKey(data.api_key as string);
        setStatus("success");
        setMessage((data.message as string) || "Email verified!");
        setTimeout(() => router.push("/dashboard"), 2500);
      })
      .catch((err: Error) => {
        setStatus("error");
        setShake(true);
        setTimeout(() => setShake(false), 600);
        let msg = err.message || "Verification failed. The code may be invalid or expired.";
        if (msg.includes("fetch") || msg.includes("network") || msg.includes("failed to fetch")) {
          msg = "Could not reach the server. Please check your internet and try again.";
        }
        setMessage(msg);
        setDigits(["", "", "", "", "", ""]);
        setTimeout(() => {
          if (inputRefs.current[0]) inputRefs.current[0].focus();
        }, 100);
      });
  }, [status, router]);

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, "");
    if (digit.length > 1) return;

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setMessage("");
    if (status === "error") setStatus("idle");

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newDigits = pasted.split("");
      setDigits(newDigits);
      inputRefs.current[5]?.focus();
    } else if (pasted.length > 0) {
      const newDigits = [...digits];
      pasted.split("").forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setDigits(newDigits);
      const focusIdx = Math.min(pasted.length, 5);
      inputRefs.current[focusIdx]?.focus();
    }
  };

  const handleCopy = async () => {
    if (providedToken) {
      try {
        await navigator.clipboard.writeText(providedToken);
        setCopied(true);
        toast.success("OTP copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Failed to copy. Please copy manually.");
      }
    }
  };

  const handleResend = async () => {
    if (!email || resending || resent) return;
    setResending(true);
    setColdStartMsg("");
    const timeout = setTimeout(() => {
      setColdStartMsg("Backend is waking up, please wait ~30 seconds...");
    }, 4000);
    try {
      const data = await fetchApi("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      clearTimeout(timeout);
      setResent(true);
      if (data.verification_token) {
        setProvidedToken(data.verification_token);
        toast.success("New verification code generated!");
      } else {
        toast.success("Verification code sent! Check your email.");
      }
    } catch (err: unknown) {
      clearTimeout(timeout);
      let msg = "Too many attempts. Please wait before retrying.";
      if (err instanceof Error) {
        msg = err.message || msg;
        if (msg.includes("fetch") || msg.includes("network") || msg.includes("failed to fetch")) {
          msg = "Could not reach the server. Please check your internet and try the Resend button again.";
        }
      } else if (typeof err === "string") {
        msg = err;
      }
      if (msg.includes("[object Object]")) msg = "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setResending(false);
      setColdStartMsg("");
    }
  };

  return (
    <main className="min-h-screen bg-[#080C10] text-[#f3f7f7] selection:bg-[#04e184] selection:text-black relative">
      {/* Background Elements */}
      <div className="fixed inset-0 bg-dot-grid opacity-[0.2] z-0 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-radial-blue opacity-15 z-0 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-radial-mint opacity-10 z-0 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group min-h-[44px]">
            <div className="bg-[#04e184] p-1.5 rounded-lg transition-transform duration-300 group-hover:scale-105">
              <Shield className="w-4 h-4 text-black" fill="currentColor" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">Backport</span>
          </Link>
          <Link
            href="/auth/login"
            className="text-sm text-[#A2BDDB]/60 hover:text-white transition-colors px-4 py-2 rounded-lg min-h-[44px] flex items-center"
          >
            Log In
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center px-4 pt-4 sm:pt-8 pb-16" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md"
            >
              <div className="glass-card rounded-2xl p-6 sm:p-10 text-center">
                <div className="flex justify-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-[#04e184]/10 border border-[#04e184]/30 flex items-center justify-center"
                  >
                    <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-[#04e184]" />
                  </motion.div>
                </div>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl sm:text-2xl font-bold text-white mb-3"
                >
                  Account Verified!
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-[#A2BDDB] text-sm mb-2"
                >
                  {message}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="mt-6 flex items-center justify-center gap-2 text-[#04e184] text-sm animate-pulse">
                    <div className="h-2 w-2 rounded-full bg-[#04e184]" />
                    Redirecting to dashboard...
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-md"
            >
              <div className="glass-card rounded-2xl p-6 sm:p-10">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
                  <div className="h-8 w-8 rounded-lg bg-[#04e184] flex items-center justify-center font-bold text-black text-sm">B</div>
                  <span className="text-white font-bold text-lg">Backport</span>
                </div>

                {/* Title */}
                <div className="text-center mb-6 sm:mb-8">
                  <h1 className="text-xl sm:text-2xl sm:text-3xl font-bold text-white mb-2">
                    Verify your account
                  </h1>
                  <p className="text-[#A2BDDB]/70 text-sm leading-relaxed">
                    {hasToken
                      ? "Your verification code is shown below. Enter it to activate your account."
                      : "Enter the 6-digit code sent to your email."}
                  </p>
                </div>

                {/* OTP Display (only if token provided via URL) */}
                {hasToken && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6 sm:mb-8"
                  >
                    <div className="text-center mb-3">
                      <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#A2BDDB]/50">
                        Your verification code
                      </span>
                    </div>
                    <div className="relative group">
                      <div className="flex items-center justify-center gap-1 sm:gap-3 p-3 sm:p-6 rounded-xl bg-[#0D131A] border border-[#04e184]/20 glow-mint">
                        {providedToken.split("").map((char, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.08 }}
                            className="inline-flex items-center justify-center w-8 h-12 sm:w-14 sm:h-16 rounded-lg bg-[#080C10] border border-[#04e184]/15 text-xl sm:text-3xl font-mono font-bold text-[#04e184] text-glow-mint"
                          >
                            {char}
                          </motion.span>
                        ))}
                      </div>
                      {/* Copy button */}
                      <button
                        onClick={handleCopy}
                        className="absolute top-2 right-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 group/btn w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Copy OTP"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-[#04e184]" />
                        ) : (
                          <Copy className="w-4 h-4 text-[#A2BDDB]/60 group-hover/btn:text-white transition-colors" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#04e184]/20" />
                      <span className="text-[10px] uppercase tracking-[0.3em] text-[#A2BDDB]/40 font-medium whitespace-nowrap">
                        Enter the code below
                      </span>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#04e184]/20" />
                    </div>
                  </motion.div>
                )}

                {/* Email display */}
                {email && (
                  <div className="mb-6 text-center">
                    <p className="text-[#A2BDDB]/50 text-xs mb-1">Account</p>
                    <p className="text-[#04e184] font-medium text-sm break-all">{email}</p>
                  </div>
                )}

                {/* Cold Start / Loading Message */}
                <AnimatePresence>
                  {(coldStartMsg || resending) && !hasToken && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6"
                    >
                      <div className="rounded-xl bg-amber-500/[0.06] border border-amber-500/15 p-3 text-sm text-amber-400 text-center flex items-center justify-center gap-2">
                        <div className="h-3.5 w-3.5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                        {coldStartMsg || "Sending verification code..."}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* OTP Input Boxes */}
                <motion.div
                  animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
                    {digits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        onPaste={i === 0 ? handlePaste : undefined}
                        disabled={status === "loading"}
                        className={`
                          w-10 h-14 sm:w-14 sm:h-16 text-center text-lg sm:text-2xl font-mono font-bold rounded-xl
                          bg-[#0D131A] border transition-all duration-200
                          outline-none
                          ${digit
                            ? "border-[#04e184]/40 text-[#04e184] text-glow-mint"
                            : status === "error"
                              ? "border-red-500/40 text-white placeholder:text-red-500/30"
                              : "border-white/10 text-white placeholder:text-white/20"
                          }
                          focus:border-[#04e184] focus:ring-2 focus:ring-[#04e184]/20
                          hover:border-[#04e184]/30
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                        aria-label={`Digit ${i + 1}`}
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Error Message */}
                <AnimatePresence>
                  {status === "error" && message && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4"
                    >
                      <div className="rounded-xl bg-red-500/[0.06] border border-red-500/15 p-3 text-sm text-red-400 text-center">
                        {message}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Verify Button */}
                <button
                  onClick={() => {
                    const code = digits.join("");
                    if (code.length === 6) verifyCode(code);
                  }}
                  disabled={digits.join("").length < 6 || status === "loading"}
                  className="w-full btn-mint rounded-xl py-3.5 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2 mb-6 min-h-[44px]"
                >
                  {status === "loading" ? (
                    <>
                      <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Account"
                  )}
                </button>

                {/* Divider */}
                <div className="divider-gradient mb-6" />

                {/* Resend Section */}
                <div className="text-center">
                  {!resent ? (
                    <button
                      onClick={handleResend}
                      disabled={resending || !email}
                      className="inline-flex items-center gap-2 text-sm text-[#A2BDDB]/50 hover:text-[#A2BDDB] transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] px-3"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                      {resending ? "Sending..." : "Resend verification code"}
                    </button>
                  ) : (
                    <p className="text-sm text-[#04e184]/70 inline-flex items-center gap-2">
                      <Check className="w-3.5 h-3.5" />
                      {providedToken ? "New code generated! See above." : "New code sent! Check your email."}
                    </p>
                  )}
                </div>

                {/* Back to login */}
                <div className="text-center mt-6">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-1.5 text-sm text-[#A2BDDB]/40 hover:text-[#A2BDDB] transition-colors min-h-[44px] px-3"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to login
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080C10] flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-[#04e184]/30 border-t-[#04e184] rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
