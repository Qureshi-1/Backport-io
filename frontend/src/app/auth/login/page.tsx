"use client";
<<<<<<< HEAD
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { auth } from "@/lib/auth";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
=======
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
import LoginCard from "@/components/LoginCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

<<<<<<< HEAD
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [coldStartMsg, setColdStartMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setColdStartMsg("");

    if (!email.match(/^\S+@\S+\.\S+$/)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    let timeout = setTimeout(() => {
      setColdStartMsg("Backend is waking up, please wait ~30 seconds...");
    }, 4000);
    try {
      const data = await fetchApi("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      auth.setToken(data.token);
      auth.setApiKey(data.api_key);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: any) {
      let msg = err.message || "Login failed";
      
      if (msg === "EMAIL_NOT_VERIFIED" || msg.includes("EMAIL_NOT_VERIFIED")) {
        toast.error("Please verify your email first.");
        router.push(`/auth/check-email?email=${encodeURIComponent(email)}`);
        return;
      }

      const lowerMsg = msg.toLowerCase();
      if (lowerMsg.includes("credentials") || lowerMsg.includes("unauthorized") || lowerMsg.includes("password") || lowerMsg.includes("incorrect")) {
        msg = "Invalid email or password. Please try again.";
      } else if (lowerMsg.includes("not found") || lowerMsg.includes("no account")) {
        msg = "Account not found. Consider signing up.";
      }
      
      setError(msg);
      toast.error(msg);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080C10] text-[#f3f7f7] selection:bg-[#2CE8C3] selection:text-black relative overflow-hidden">
      {/* Zen-Pro Background Elements */}
      <div className="fixed inset-0 bg-dot-grid opacity-[0.2] z-0 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-radial-blue opacity-20 z-0 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-radial-mint opacity-10 z-0 pointer-events-none" />

      <Header />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 min-h-screen flex items-center justify-center pt-24 pb-12">
        <div className="grid lg:grid-cols-2 items-center gap-16 lg:gap-32 w-full">
          
          {/* Left Side: Brand Narrative */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex flex-col space-y-10"
          >
            <div className="space-y-6">
              <span className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 text-[#2CE8C3] text-[10px] font-headline tracking-[0.4em] font-black uppercase rounded-full shadow-2xl shadow-[#2CE8C3]/10">
                <div className="h-2 w-2 rounded-full bg-[#2CE8C3] animate-pulse" />
                Establish_Secure_Uplink
              </span>
              <h1 className="font-headline text-7xl font-black tracking-tight leading-[0.85] text-white">
                Access your <br />
                <span className="text-[#2CE8C3] text-glow-mint">Infrastructure.</span>
              </h1>
              <p className="font-body text-[#A2BDDB] max-w-md text-lg leading-relaxed opacity-80">
                Uplink to your global API network. Manage edge clusters, analyze security telemetry, and deploy sub-millisecond WAF rules.
              </p>
            </div>

            {/* Visual Artifacts */}
            <div className="flex gap-12 pt-8">
               {[
                 { label: "Active Nodes", val: "212", color: "#2CE8C3" },
                 { label: "Network Health", val: "100%", color: "#6BA9FF" }
               ].map(stat => (
                 <div key={stat.label} className="space-y-1">
                    <div className="font-headline text-[10px] uppercase tracking-widest text-zinc-600 font-black">{stat.label}</div>
                    <div className="text-3xl font-black" style={{ color: stat.color }}>{stat.val}</div>
                 </div>
               ))}
            </div>
          </motion.div>

          {/* Right Side: Auth Component */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="flex justify-center lg:justify-end"
          >
            <LoginCard
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              error={error}
              coldStartMsg={coldStartMsg}
              loading={loading}
              onSubmit={handleSubmit}
            />
          </motion.div>
        </div>
      </div>

      {/* Forensic Metadata footer */}
      <div className="fixed bottom-12 left-12 z-10 font-mono text-[8px] text-[#A2BDDB]/20 tracking-[0.6em] uppercase hidden xl:block">
        TERMINAL_LOCK: 443 | AES_256_GCM | SYSTEM_STABLE
      </div>
      
      <Footer />
    </main>
=======
function LoginContent() {
  const searchParams = useSearchParams();
  const [oauthError, setOauthError] = useState("");

  // Handle OAuth error redirect
  useEffect(() => {
    const oauthErr = searchParams.get("oauth_error");
    if (oauthErr) {
      const messages: Record<string, string> = {
        invalid_state: "OAuth session expired. Please try again.",
        token_exchange_failed: "Could not connect to the authentication server. The backend may be starting up — please wait 30 seconds and try again.",
        no_email: "Could not get your email from the provider.",
        server_error: "Something went wrong on our server. This is usually a temporary issue — please try again in a moment.",
      };
      let msg = messages[oauthErr] || "OAuth login failed. Please try again.";

      // Check for detailed error info from backend (base64 encoded)
      const errDetail = searchParams.get("err_detail");
      if (errDetail) {
        try {
          const decoded = atob(errDetail.replace(/-/g, "+").replace(/_/g, "/"));
          // Append detail only if it adds useful info
          if (decoded && !decoded.includes("None") && decoded.trim().length > 0) {
            msg += ` (${decoded})`;
          }
        } catch {
          // Ignore decode errors
        }
      }

      setOauthError(msg);
      toast.error(msg, { duration: 8000 });
      // Clean URL after showing error (remove oauth_error params)
      window.history.replaceState({}, "", "/auth/login");
    }
  }, [searchParams]);

  return (
    <>
      {oauthError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)]">
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center">
            {oauthError}
          </div>
        </div>
      )}
      <LoginCard />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080C10]" />}>
      <main className="min-h-screen bg-[#080C10] text-[#f3f7f7] selection:bg-[#04e184] selection:text-black relative">
        {/* Background Elements */}
        <div className="fixed inset-0 bg-dot-grid opacity-[0.2] z-0 pointer-events-none" />
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-radial-blue opacity-20 z-0 pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-radial-mint opacity-10 z-0 pointer-events-none" />

        <Header />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center pt-24 pb-12">
          <div className="grid lg:grid-cols-2 items-center gap-16 lg:gap-32 w-full">
            
            {/* Left Side: Brand Narrative */}
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:flex flex-col space-y-10"
            >
              <div className="space-y-6">
                <span className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 text-[#04e184] text-[10px] tracking-[0.4em] font-bold uppercase rounded-full">
                  <div className="h-2 w-2 rounded-full bg-[#04e184] animate-pulse" />
                  Secure &amp; Fast
                </span>
                <h1 className="text-7xl font-black tracking-tight leading-[0.85] text-white">
                  Protect your <br />
                  <span className="text-[#04e184]">API in minutes.</span>
                </h1>
                <p className="text-[#A2BDDB] max-w-md text-lg leading-relaxed opacity-80">
                  Sign in to manage your API gateway, view analytics, and configure security settings.
                </p>
              </div>

              {/* Visual Stats */}
              <div className="flex gap-12 pt-8">
                 {[
                   { label: "WAF Patterns", val: "17+", color: "#04e184" },
                   { label: "Setup Time", val: "30s", color: "#6BA9FF" }
                 ].map(stat => (
                   <div key={stat.label} className="space-y-1">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">{stat.label}</div>
                      <div className="text-3xl font-black" style={{ color: stat.color }}>{stat.val}</div>
                   </div>
                 ))}
              </div>
            </motion.div>

            {/* Right Side: Auth Component */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="flex justify-center lg:justify-end"
            >
              <LoginContent />
            </motion.div>
          </div>
        </div>
        
        <Footer />
      </main>
    </Suspense>
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
  );
}
