"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { auth } from "@/lib/auth";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import LoginCard from "@/components/LoginCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const HeroScene = dynamic(() => import("@/components/HeroScene"), {
  ssr: false,
  loading: () => null,
});

const LiveMetricsCard = dynamic(() => import("@/components/HomeSections").then(mod => mod.LiveMetricsCard), {
  ssr: false,
  loading: () => null,
});

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
    <main className="min-h-screen bg-[#0e0e0e] text-[#f3f7f7] selection:bg-[#00F0FF] selection:text-[#003338] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 opacity-40">
        <HeroScene />
      </div>
      <div className="fixed inset-0 bg-cyber-grid opacity-30 z-0 pointer-events-none" />
      <div className="fixed inset-0 scanline-bg opacity-10 z-0 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(0,240,255,0.08),transparent_48%),radial-gradient(circle_at_80%_70%,rgba(52,255,140,0.06),transparent_42%)] z-0 pointer-events-none" />

      <Header />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 min-h-screen flex items-center justify-center pt-24 pb-12">
        <div className="grid lg:grid-cols-2 items-center gap-16 lg:gap-32 w-full">
          
          {/* Left Layer — Brand & Presence */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex flex-col space-y-10"
          >
            <div className="space-y-6">
              <span className="inline-flex items-center gap-3 px-4 py-2 bg-[#111111]/90 backdrop-blur-xl border border-[#00F0FF]/30 text-[#00F0FF] text-[10px] font-headline tracking-[0.4em] font-black uppercase shadow-[0_0_30px_rgba(0,240,255,0.12)]">
                <div className="h-2 w-2 rounded-full bg-[#00F0FF] animate-pulse" />
                SECURE_UPLINK_ESTABLISHED
              </span>
              <h1 className="font-headline text-7xl font-black tracking-tight leading-[0.85] text-white">
                Enter the <br />
                <span className="text-[#00F0FF] text-glow-cyan drop-shadow-[0_0_40px_rgba(0,240,255,0.4)]">Shield Portal</span>
              </h1>
              <p className="font-body text-[#b9cacb] max-w-md text-lg leading-relaxed opacity-80">
                Access your global gateway dashboard. Monitor real-time traffic, configure WAF rules, and manage edge-native security artifacts.
              </p>
            </div>

            {/* Live Data Peek in Auth */}
            <div className="relative grayscale-[0.3] opacity-60 scale-90 -translate-x-12 rotate-[-2deg] pointer-events-none">
              <LiveMetricsCard />
            </div>
          </motion.div>

          {/* Right Layer — The Card */}
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

      {/* Decorative artifacts */}
      <div className="fixed bottom-12 left-12 z-10 font-mono text-[8px] text-zinc-600 tracking-[0.6em] uppercase hidden xl:block">
        PORT_LOCKED: 443 | PROTOCOL: HTTPS_AES_256
      </div>
      
      <Footer />
    </main>
  );
}
