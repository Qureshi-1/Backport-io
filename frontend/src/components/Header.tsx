"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
<<<<<<< HEAD
import { Menu, X, ArrowRight, Shield, Zap, LayoutGrid, Cpu, Terminal } from "lucide-react";

const NAV_ITEMS = [
  { href: "/#features", label: "Protocol", icon: Zap },
  { href: "/#how-it-works", label: "Network", icon: Cpu },
  { href: "/#pricing", label: "Allocation", icon: LayoutGrid },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
=======
import { Menu, X, Shield, ArrowUpRight } from "lucide-react";

const GITHUB_SVG = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const NAV_ITEMS = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/compare", label: "Compare" },
  { href: "/docs", label: "Docs" },
  { href: "/blog", label: "Blog" },
  { href: "/changelog", label: "Changelog" },
  { href: "https://github.com/Qureshi-1/Backport-io", label: "GitHub", external: true },
];

function NavLink({ item }: { item: typeof NAV_ITEMS[number] }) {
  return (
    <Link
      href={item.href}
      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group relative px-4 py-2 text-sm text-[#A2BDDB]/60 hover:text-white transition-colors min-h-[44px] flex items-center"
    >
      <span className="relative z-10 flex items-center gap-1.5">
        {item.label}
        {item.external && <ArrowUpRight className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />}
      </span>
      <span className="absolute bottom-2 left-4 right-4 h-[1px] bg-[#04e184] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
    </Link>
  );
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
<<<<<<< HEAD
    setIsLogged(!!localStorage.getItem("vcreds"));
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b ${
      isScrolled ? "bg-[#080C10]/80 backdrop-blur-3xl border-white/5 py-4" : "bg-transparent border-transparent py-8"
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-3">
          <div className="bg-[#2CE8C3] p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-[#2CE8C3]/20">
             <Shield className="w-5 h-5 text-black" fill="currentColor" />
          </div>
          <span className="font-headline text-xl font-black tracking-tighter text-white">
            BACKPORT<span className="text-[#2CE8C3]">.IO</span>
          </span>
        </Link>
        
        <nav className="hidden lg:flex items-center gap-12">
          {NAV_ITEMS.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className="group flex items-center gap-2 font-headline text-[10px] font-black uppercase tracking-[0.2em] text-[#A2BDDB] hover:text-[#2CE8C3] transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/docs" className="text-[#6BA9FF] font-headline text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors">
             Docs
          </Link>
        </nav>

        <div className="flex items-center gap-6">
            <Link 
              href="/auth/login"
              className="hidden sm:block text-[#A2BDDB] hover:text-white font-headline text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
            >
              Uplink Log
            </Link>
            <Link 
                href="/auth/signup"
                className="bg-white/5 hover:bg-white/10 border border-[#2CE8C3]/20 text-[#2CE8C3] px-8 py-3 rounded-2xl font-headline text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#2CE8C3]/5 transition-premium group flex items-center gap-4"
              >
                Access Terminal
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 icon-glow-mint" />
            </Link>
            
            <button 
              className="lg:hidden p-2 text-[#A2BDDB] hover:text-[#2CE8C3] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
        </div>
      </div>
      
=======
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        isScrolled
          ? "bg-[#080C10]/90 backdrop-blur-xl"
          : "bg-transparent"
      }`}
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        borderBottom: isScrolled
          ? "1px solid transparent"
          : "1px solid transparent",
        borderImage: isScrolled
          ? "linear-gradient(90deg, transparent, rgba(4, 225, 132, 0.15), rgba(107, 169, 255, 0.1), transparent) 1"
          : "none",
      }}
    >
      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group min-h-[44px]">
          <div className="bg-[#04e184] p-1.5 rounded-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(4,225,132,0.3)]">
            <Shield className="w-4 h-4 text-black" fill="currentColor" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            Backport
          </span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] font-bold uppercase tracking-wider text-[#A2BDDB]/40">
            Open Source
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.label} item={item} />
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm text-[#A2BDDB]/60 hover:text-white transition-colors px-4 py-2 rounded-lg min-h-[44px] flex items-center"
          >
            Log In
          </Link>
          <Link
            href="/auth/signup"
            className="bg-[#04e184] hover:bg-white text-black px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 min-h-[44px] flex items-center hover:shadow-[0_0_30px_rgba(4,225,132,0.4)]"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2.5 text-[#A2BDDB] hover:text-white transition-colors rounded-lg w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
<<<<<<< HEAD
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 top-[88px] z-[90] bg-[#080C10] p-8 lg:hidden flex flex-col justify-center items-center text-center gap-12 shadow-2xl"
          >
             {NAV_ITEMS.map((item, i) => (
                <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Link href={item.href} onClick={() => setMobileMenuOpen(false)} className="font-headline text-5xl font-black text-white hover:text-[#2CE8C3] transition-colors uppercase tracking-tight">
                    {item.label}
                  </Link>
                </motion.div>
             ))}
             <div className="w-full h-px bg-white/5 max-w-[200px]" />
             <div className="flex flex-col gap-6 w-full max-w-sm">
                <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)} className="w-full bg-[#2CE8C3] text-black py-6 rounded-3xl font-headline text-xl font-black shadow-2xl shadow-[#2CE8C3]/20">
                  GET_STARTED
                </Link>
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="text-[#6BA9FF] font-headline text-xs font-black uppercase tracking-[0.4em] py-4">
                  Existing identity? Login
                </Link>
             </div>
=======
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 top-0 z-[90] bg-[#080C10]/98 backdrop-blur-2xl flex flex-col items-center justify-center"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-3 text-[#A2BDDB] hover:text-white transition-colors w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>

            <nav className="flex flex-col items-center gap-1">
              {NAV_ITEMS.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="block text-center py-3 text-2xl font-bold text-white hover:text-[#04e184] transition-colors min-h-[44px] flex items-center justify-center px-6 gap-2"
                  >
                    {item.label === "GitHub" ? GITHUB_SVG : null}
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-10 flex flex-col items-center gap-3 w-full max-w-xs px-4"
            >
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-[#A2BDDB]/60 hover:text-white transition-colors w-full text-center py-3 min-h-[44px] flex items-center justify-center"
              >
                Log In
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-[#04e184] text-black px-8 py-3 rounded-xl font-bold text-sm w-full text-center min-h-[44px] flex items-center justify-center"
              >
                Get Started
              </Link>
            </motion.div>
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
