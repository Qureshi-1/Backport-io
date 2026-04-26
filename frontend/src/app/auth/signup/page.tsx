"use client";
import { Suspense } from "react";
import { motion } from "framer-motion";
import SignupCard from "@/components/SignupCard";
import Header from "@/components/Header";
export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080C10]" />}>
      <main className="min-h-screen bg-[#080C10] text-[#f3f7f7] selection:bg-[#04e184] selection:text-black relative">
        {/* Background Elements */}
        <div className="fixed inset-0 bg-dot-grid opacity-[0.2] z-0 pointer-events-none" />
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-radial-blue opacity-20 z-0 pointer-events-none" />
        <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-radial-mint opacity-10 z-0 pointer-events-none" />

        <Header />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center pt-24 pb-12">
          <div className="grid lg:grid-cols-2 items-center gap-16 lg:gap-32 w-full">
            
            {/* Left Side — Value Prop */}
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:flex flex-col space-y-10"
            >
              <div className="space-y-6">
                <span className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 text-[#04e184] text-[10px] tracking-[0.4em] font-bold uppercase rounded-full">
                  <div className="h-2 w-2 rounded-full bg-[#04e184] animate-pulse" />
                  Open Source
                </span>
                <h1 className="text-7xl font-black tracking-tight leading-[0.85] text-white">
                  Ship your API <br />
                  <span className="text-[#04e184]">without worry.</span>
                </h1>
                <p className="text-[#A2BDDB] max-w-md text-lg leading-relaxed opacity-80">
                  Protect your API with rate limiting, caching, and WAF — no code changes required.
                </p>
              </div>

              {/* Stats */}
              <div className="flex gap-12 pt-8">
                 {[
                   { label: "WAF Patterns", val: "17+", color: "#04e184" },
                   { label: "Overhead", val: "<5ms", color: "#6BA9FF" }
                 ].map(stat => (
                   <div key={stat.label} className="space-y-1">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">{stat.label}</div>
                      <div className="text-3xl font-black" style={{ color: stat.color }}>{stat.val}</div>
                   </div>
                 ))}
              </div>
            </motion.div>

            {/* Right Side — The Register Card */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="flex justify-center lg:justify-end"
            >
              <SignupCard />
            </motion.div>
          </div>
        </div>
      </main>
    </Suspense>
  );
}
