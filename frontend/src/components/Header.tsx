"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, Shield, Zap, LayoutGrid, Cpu, Terminal } from "lucide-react";

const NAV_ITEMS = [
  { href: "/#features", label: "Features", icon: Zap },
  { href: "/#how-it-works", label: "Network", icon: Cpu },
  { href: "/#pricing", label: "Pricing", icon: LayoutGrid },
  { href: "/docs", label: "Docs", icon: Terminal },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    const checkLogin = () => {
      const vcreds = localStorage.getItem("vcreds");
      setIsLogged(!!vcreds);
    };
    checkLogin();
    const interval = setInterval(checkLogin, 2000);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => {
      clearInterval(interval);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b ${
        isScrolled 
          ? "bg-[#0A0A0A]/80 backdrop-blur-2xl border-white/5 py-4" 
          : "bg-transparent border-transparent py-8"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo Section */}
        <Link href="/" className="group flex items-center gap-3 relative">
          <div className="bg-[#D9FF00] p-1.5 rounded-lg group-hover:rotate-12 transition-transform duration-300">
             <Shield className="w-5 h-5 text-black" fill="currentColor" />
          </div>
          <span className="font-headline text-xl font-black tracking-tighter text-white">
            BACKPORT<span className="text-[#D9FF00]">.IO</span>
          </span>
          <div className="absolute -top-1 -right-4 h-2 w-2 rounded-full bg-[#D9FF00] pulse-glow" />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-10">
          {NAV_ITEMS.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className="group flex items-center gap-2 font-body text-sm font-medium tracking-wide text-zinc-400 hover:text-[#D9FF00] transition-colors"
            >
              <item.icon className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4">
            {isLogged ? (
               <Link 
                  href="/dashboard"
                  className="bg-[#D9FF00] hover:bg-white text-black px-6 py-2.5 rounded-full font-headline text-[13px] font-bold tracking-tight transition-premium flex items-center gap-2 group shadow-lg shadow-[#D9FF00]/10"
                >
                  DASHBOARD
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            ) : (
              <>
                 <Link 
                    href="/auth/login"
                    className="text-zinc-400 hover:text-white px-4 py-2 font-body text-sm font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/auth/signup"
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-2.5 rounded-full font-body text-sm font-semibold transition-premium flex items-center gap-2 group"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform opacity-60" />
                  </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 text-white hover:text-[#D9FF00] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 top-[88px] z-[90] bg-black/98 backdrop-blur-3xl overflow-hidden lg:hidden"
          >
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-12 text-center">
               <div className="text-zinc-600 font-headline text-[10px] tracking-[0.4em] uppercase mb-4">Navigation</div>
               {NAV_ITEMS.map((item, i) => (
                 <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                 >
                   <Link 
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-headline text-5xl font-black tracking-tighter text-white hover:text-[#D9FF00] transition-premium"
                   >
                     {item.label}
                   </Link>
                 </motion.div>
               ))}

               <div className="w-full h-px bg-white/5 max-w-[200px]" />

               <div className="flex flex-col gap-6 w-full max-w-sm">
                  {isLogged ? (
                    <Link 
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="bg-[#D9FF00] text-black w-full py-6 rounded-3xl font-headline text-xl font-black transition-premium"
                    >
                      OPEN_TERMINAL
                    </Link>
                  ) : (
                    <>
                      <Link 
                        href="/auth/signup"
                        onClick={() => setMobileMenuOpen(false)}
                        className="bg-[#D9FF00] text-black w-full py-6 rounded-3xl font-headline text-xl font-black transition-premium"
                      >
                         GET_STARTED
                      </Link>
                      <Link 
                        href="/auth/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-zinc-500 hover:text-white font-body py-4 uppercase tracking-widest text-xs"
                      >
                        Existing Account? Login
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
