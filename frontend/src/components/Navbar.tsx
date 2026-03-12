"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ShieldCheck, LogOut, Menu, X } from "lucide-react";
import { auth } from "@/lib/auth";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    auth.logout();
  };

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-emerald-500" />
          <span className="font-bold text-white text-lg tracking-tight">
            Backport
          </span>
        </Link>
        <Link
          href="/"
          className="hidden sm:block text-sm font-medium text-zinc-400 hover:text-emerald-400 transition-colors"
        >
          &larr; Backport.io
        </Link>
      </div>

      {/* Desktop Nav */}

      <div className="hidden md:flex flex-1 items-center justify-center gap-2 lg:gap-6 text-sm text-zinc-400 font-medium">
        {[
          { name: "Overview", href: "/dashboard" },
          { name: "API Keys", href: "/dashboard/api-keys" },
          { name: "Settings", href: "/dashboard/settings" },
          { name: "Billing", href: "/dashboard/billing" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2 rounded-lg transition-colors ${
               pathname === link.href ? "bg-zinc-800 text-white" : "hover:bg-zinc-800/50 hover:text-white"
            }`}
          >
            {link.name}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleLogout}
          className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
          title="Logout"
        >
          <LogOut className="h-5 w-5 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-zinc-400 hover:text-white transition-colors"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden absolute top-full left-0 right-0 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="flex flex-col p-4 space-y-2">
              {[
                { name: "Overview", href: "/dashboard" },
                { name: "API Keys", href: "/dashboard/api-keys" },
                { name: "Settings", href: "/dashboard/settings" },
                { name: "Billing", href: "/dashboard/billing" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                     pathname === link.href ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
