"use client";
<<<<<<< HEAD
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import toast from "react-hot-toast";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await fetchApi("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResent(true);
      toast.success("Verification email sent! Check your inbox.");
    } catch (err: any) {
      toast.error(err.message || "Too many attempts. Please wait before retrying.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f18_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f18_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-8 text-center shadow-2xl backdrop-blur">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-black text-sm">B</div>
            <span className="text-white font-bold text-lg">Backport</span>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-4xl">
              📧
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">Check your email</h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-2">
            We sent a verification link to
          </p>
          {email && (
            <p className="text-emerald-400 font-medium text-sm mb-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 inline-block">
              {email}
            </p>
          )}
          <p className="text-zinc-500 text-xs mb-8">
            Click the link in the email to activate your account. The link expires in 24 hours.
          </p>

          {/* Tips */}
          <div className="text-left rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 mb-6 space-y-2">
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-3">Didn't receive it?</p>
            <p className="text-zinc-400 text-xs">• Check your spam or junk folder</p>
            <p className="text-zinc-400 text-xs">• Make sure you entered the correct email</p>
            <p className="text-zinc-400 text-xs">• Wait a minute — emails can sometimes be delayed</p>
          </div>

          {/* Resend */}
          {!resent ? (
            <button
              onClick={handleResend}
              disabled={resending || !email}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 mb-4"
            >
              {resending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : "Resend verification email"}
            </button>
          ) : (
            <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-sm font-medium text-emerald-400 mb-4">
              ✓ Email sent! Check your inbox.
            </div>
          )}

          <Link
            href="/auth/login"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Back to login
          </Link>
        </div>
      </div>
=======
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * DEPRECATED: This page redirects to the new /auth/verify page.
 * The check-email flow has been replaced with in-app OTP verification.
 */
function CheckEmailRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  useEffect(() => {
    // Redirect to the new verify page (without a token — user needs to use resend)
    router.replace(`/auth/verify${email ? `?email=${encodeURIComponent(email)}` : ""}`);
  }, [email, router]);

  return (
    <div className="min-h-screen bg-[#080C10] flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-[#2CE8C3]/30 border-t-[#2CE8C3] rounded-full animate-spin" />
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
    </div>
  );
}

export default function CheckEmailPage() {
  return (
<<<<<<< HEAD
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    }>
      <CheckEmailContent />
=======
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080C10] flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-[#2CE8C3]/30 border-t-[#2CE8C3] rounded-full animate-spin" />
        </div>
      }
    >
      <CheckEmailRedirect />
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
    </Suspense>
  );
}
