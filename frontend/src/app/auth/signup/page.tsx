"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { auth } from "@/lib/auth";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import SignupCard from "@/components/SignupCard";
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

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref") || "";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.match(/^\S+@\S+\.\S+$/)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const data = await fetchApi("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ 
          email, 
          password,
          referral_code: referralCode 
        }),
      });
      toast.success("Account created! Check your email to verify.");
      router.push(`/auth/check-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      const msg = err.message || "Signup failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0e0e0e] text-[#f3f7f7] selection:bg-[#34FF8C] selection:text-[#003338] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 opacity-40">
        <HeroScene />
      </div>
      <div className="fixed inset-0 bg-cyber-grid opacity-30 z-0 pointer-events-none" />
      <div className="fixed inset-0 scanline-bg opacity-10 z-0 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_90%,rgba(52,255,140,0.08),transparent_48%),radial-gradient(circle_at_80%_10%,rgba(0,240,255,0.06),transparent_42%)] z-0 pointer-events-none" />

      <Header />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 min-h-screen flex items-center justify-center pt-24 pb-12">
        <div className="grid lg:grid-cols-2 items-center gap-16 lg:gap-32 w-full">
          
          {/* Left Layer — Value Prop */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex flex-col space-y-10"
          >
            <div className="space-y-6">
              <span className="inline-flex items-center gap-3 px-4 py-2 bg-[#111111]/90 backdrop-blur-xl border border-[#34FF8C]/30 text-[#34FF8C] text-[10px] font-headline tracking-[0.4em] font-black uppercase shadow-[0_0_30px_rgba(52,255,140,0.12)]">
                <div className="h-2 w-2 rounded-full bg-[#34FF8C] animate-pulse" />
                NEW_NODE_INITIALIZATION
              </span>
              <h1 className="font-headline text-7xl font-black tracking-tight leading-[0.85] text-white">
                Initialize your <br />
                <span className="text-[#34FF8C] text-glow-green drop-shadow-[0_0_40px_rgba(52,255,140,0.4)]">Security Rails</span>
              </h1>
              <p className="font-body text-[#b9cacb] max-w-md text-lg leading-relaxed opacity-80">
                Join 5.8k+ developers globally using Backport to protect their APIs at the speed of light. Zero-config deployment in minutes.
              </p>
            </div>

            {/* Visual Consistency */}
            <div className="relative grayscale-[0.3] opacity-60 scale-90 -translate-x-12 rotate-[2deg] pointer-events-none translate-y-8">
              <LiveMetricsCard />
            </div>
          </motion.div>

          {/* Right Layer — The Register Card */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="flex justify-center lg:justify-end"
          >
            <SignupCard
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              error={error}
              loading={loading}
              onSubmit={handleSubmit}
            />
          </motion.div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0e0e0e]" />}>
      <SignupContent />
    </Suspense>
  );
}
