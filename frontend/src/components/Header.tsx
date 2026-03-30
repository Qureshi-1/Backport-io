"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0e0e0e]/90 backdrop-blur-xl border-b border-[#00F0FF]/20 shadow-[0_0_30px_rgba(0,240,255,0.08)]"
          : "bg-[#0e0e0e]/60 backdrop-blur-md border-b border-[#00F0FF]/10"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-lg font-bold tracking-tighter text-[#00F0FF] font-headline uppercase glitch-hover select-none">
            BACKPORT-IO
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { href: "/#features", label: "Features" },
            { href: "/#how-it-works", label: "Network" },
            { href: "/docs", label: "Docs" },
            { href: "/#pricing", label: "Pricing" },
            { href: "/#compare", label: "Compare" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="font-headline tracking-tighter uppercase text-[13px] text-white/50 hover:text-[#00F0FF] hover:text-shadow-[0_0_8px_rgba(0,240,255,0.5)] transition-all duration-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {onDemo && (
            <button
              onClick={onDemo}
              className="font-headline uppercase text-[11px] tracking-widest text-white/40 hover:text-[#00F0FF] transition-colors px-3 py-2"
            >
              Demo
            </button>
          )}
          {isLogged ? (
            <Link
              href="/dashboard"
              className="bg-[#00F0FF] text-[#003338] px-5 py-2 font-headline font-bold uppercase tracking-widest text-[12px] hover:bg-[#34FF8C] transition-all duration-200 active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="font-headline uppercase text-[11px] tracking-widest text-white/40 hover:text-white transition-colors px-3 py-2"
              >
                Log In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-[#00F0FF] text-[#003338] px-5 py-2 font-headline font-bold uppercase tracking-widest text-[12px] hover:bg-[#34FF8C] transition-all duration-200 active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
              >
                Deploy Node
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-[#00F0FF] hover:text-[#34FF8C] transition-colors"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-[#00F0FF]/10 bg-[#0e0e0e]/98 backdrop-blur-xl overflow-hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-6">
              {[
                { href: "/#features", label: "Features" },
                { href: "/#how-it-works", label: "Network" },
                { href: "/docs", label: "Docs" },
                { href: "/#pricing", label: "Pricing" },
                { href: "/#compare", label: "Compare" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-headline uppercase text-[12px] tracking-widest text-white/50 hover:text-[#00F0FF] transition-colors py-3 border-b border-white/5"
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                {onDemo && (
                  <button
                    onClick={() => { onDemo(); setMobileMenuOpen(false); }}
                    className="text-left font-headline uppercase text-[11px] tracking-widest text-white/40 hover:text-[#00F0FF] transition-colors"
                  >
                    Watch Demo
                  </button>
                )}
                {isLogged ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mt-2 text-center bg-[#00F0FF] text-[#003338] px-5 py-3 font-headline font-bold uppercase tracking-widest text-[12px] hover:bg-[#34FF8C] transition-all"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="font-headline uppercase text-[11px] tracking-widest text-white/40 hover:text-white transition-colors py-2"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center bg-[#00F0FF] text-[#003338] px-5 py-3 font-headline font-bold uppercase tracking-widest text-[12px] hover:bg-[#34FF8C] transition-all"
                    >
                      Start Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
