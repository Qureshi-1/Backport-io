"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { auth } from "@/lib/auth";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import SignupCard from "@/components/SignupCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
    <main className="min-h-screen bg-[#080C10] text-[#f3f7f7] selection:bg-[#2CE8C3] selection:text-black relative overflow-hidden">
      {/* Zen-Pro Background Elements */}
      <div className="fixed inset-0 bg-dot-grid opacity-[0.2] z-0 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-radial-blue opacity-20 z-0 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-radial-mint opacity-10 z-0 pointer-events-none" />

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
              <span className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 text-[#2CE8C3] text-[10px] font-headline tracking-[0.4em] font-black uppercase rounded-full shadow-2xl shadow-[#2CE8C3]/10">
                <div className="h-2 w-2 rounded-full bg-[#2CE8C3] animate-pulse" />
                Initialization_Sequence
              </span>
              <h1 className="font-headline text-7xl font-black tracking-tight leading-[0.85] text-white">
                Deploy your final <br />
                <span className="text-[#2CE8C3] text-glow-mint">Security Rails.</span>
              </h1>
              <p className="font-body text-[#A2BDDB] max-w-md text-lg leading-relaxed opacity-80">
                Join 5.8k+ developers protecting their APIs at the speed of light. Secure your edge clusters with zero-config deployment.
              </p>
            </div>

            {/* Visual Consistency Stats */}
            <div className="flex gap-12 pt-8">
               {[
                 { label: "Requests/sec", val: "42.1k", color: "#6BA9FF" },
                 { label: "Avg_Latency", val: "14ms", color: "#2CE8C3" }
               ].map(stat => (
                 <div key={stat.label} className="space-y-1">
                    <div className="font-headline text-[10px] uppercase tracking-widest text-zinc-600 font-black">{stat.label}</div>
                    <div className="text-3xl font-black" style={{ color: stat.color }}>{stat.val}</div>
                 </div>
               ))}
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
    <Suspense fallback={<div className="min-h-screen bg-[#080C10]" />}>
      <SignupContent />
    </Suspense>
  );
}
