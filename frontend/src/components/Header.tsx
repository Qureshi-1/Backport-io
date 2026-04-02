"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
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
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
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
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
