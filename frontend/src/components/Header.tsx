"use client";

import Link from "next/link";
import { Menu, X, ShieldCheck, Terminal, Disc } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/auth";

export default function Header({ onDemo }: { onDemo?: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsLogged(auth.isLoggedIn());
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      suppressHydrationWarning
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        scrolled
          ? "bg-[#0a0a0a]/95 backdrop-blur-3xl border-b border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] py-4"
          : "bg-transparent border-b border-transparent py-8"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-4 group">
          <div className="relative">
            <ShieldCheck className="h-8 w-8 text-[#00F0FF] drop-shadow-[0_0_15px_#00F0FF] transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 bg-[#00F0FF]/20 blur-xl group-hover:opacity-100 opacity-60 transition-opacity" />
          </div>
          <span className="text-2xl font-headline font-black tracking-tighter text-white uppercase select-none flex items-center gap-1">
            BACKPORT<span className="text-[#00F0FF] text-glow-cyan">.IO</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden xl:flex items-center gap-12">
          {[
            { href: "/#features", label: "Protocol" },
            { href: "/#how-it-works", label: "Network" },
            { href: "/docs", label: "Specs" },
            { href: "/#pricing", label: "Allocation" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="font-headline tracking-[0.4em] uppercase text-[10px] font-black text-white/40 hover:text-[#00F0FF] transition-all duration-300 relative group"
            >
              <span className="relative z-10">{item.label}</span>
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#00F0FF] group-hover:w-full transition-all duration-300 shadow-[0_0_10px_#00F0FF]" />
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-6">
          {onDemo && (
            <button
              onClick={onDemo}
              className="font-headline uppercase text-[9px] tracking-[0.5em] font-black text-white/30 hover:text-[#00F0FF] transition-colors border border-white/5 hover:border-[#00F0FF]/20 px-5 py-2.5 bg-white/[0.02] flex items-center gap-2"
            >
              <Disc className="w-3 h-3 animate-spin-slow" /> STAGE_DEMO
            </button>
          )}
          {isLogged ? (
            <Link
              href="/dashboard"
              className="bg-white text-black px-8 py-3.5 font-headline font-black uppercase tracking-[0.3em] text-[11px] hover:bg-[#00F0FF] hover:shadow-[0_0_40px_rgba(0,240,255,0.6)] transition-all duration-500 active:scale-95"
            >
              TERMINAL
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="font-headline uppercase text-[10px] tracking-[0.4em] font-black text-white/40 hover:text-white transition-colors"
              >
                IDENTITY_LOG
              </Link>
              <Link
                href="/auth/signup"
                className="bg-[#00F0FF] text-[#003338] px-8 py-3.5 font-headline font-black uppercase tracking-[0.3em] text-[11px] hover:bg-[#34FF8C] hover:shadow-[0_0_40px_rgba(52,255,140,0.6)] transition-all duration-500 active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
              >
                UPLINK_NOW
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="xl:hidden text-[#00F0FF] hover:text-[#34FF8C] transition-colors p-2 border border-white/5 bg-white/[0.02]"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "100vh", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="xl:hidden fixed inset-0 top-[104px] z-[90] bg-[#0a0a0a] backdrop-blur-4xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-cyber-grid opacity-20" />
            <div className="absolute inset-0 scanline-bg opacity-10" />
            
            <div className="relative z-10 flex flex-col gap-4 p-12 h-full justify-center">
              {[
                { href: "/#features", label: "Protocol" },
                { href: "/#how-it-works", label: "Network" },
                { href: "/docs", label: "Specs" },
                { href: "/#pricing", label: "Allocation" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-headline uppercase text-5xl font-black tracking-tighter text-white hover:text-[#00F0FF] transition-colors py-4 flex items-center justify-between"
                  >
                    {item.label}
                    <Terminal className="w-8 h-8 opacity-20" />
                  </Link>
                </motion.div>
              ))}
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-20 pt-20 border-t border-white/5 flex flex-col gap-8"
              >
                {isLogged ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center bg-[#00F0FF] text-[#003338] px-14 py-8 font-headline font-black uppercase tracking-[0.4em] text-xl"
                  >
                    ACCESS_TERMINAL
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/auth/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center bg-[#00F0FF] text-[#003338] px-14 py-8 font-headline font-black uppercase tracking-[0.4em] text-xl"
                    >
                      ESTABLISH_UPLINK
                    </Link>
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center border border-white/10 text-[#849495] px-14 py-8 font-headline font-black uppercase tracking-[0.4em] text-sm"
                    >
                      IDENTITY_LOG
                    </Link>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
