"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ShieldCheck, LogOut, Menu, X, ShieldAlert } from "lucide-react";
import { auth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchApi } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchApi("/api/user/me")
      .then((d) => {
        setIsAdmin(d.is_admin === true);
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    auth.logout();
  };

  const baseLinks = [
    { name: "Overview", href: "/dashboard" },
    { name: "API Keys", href: "/dashboard/api-keys" },
    { name: "Settings", href: "/dashboard/settings" },
    { name: "Billing", href: "/dashboard/billing" },
  ];

  const allLinks = isAdmin
    ? [...baseLinks, { name: "⚡ Admin", href: "/dashboard/admin" }]
    : baseLinks;

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
        {allLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2 rounded-lg transition-colors ${
               pathname === link.href
                 ? link.href === "/dashboard/admin"
                   ? "bg-emerald-500/20 text-emerald-400"
                   : "bg-zinc-800 text-white"
                 : link.href === "/dashboard/admin"
                   ? "text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
                   : "hover:bg-zinc-800/50 hover:text-white"
            }`}
          >
            {link.name}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <a
          href="https://github.com/Qureshi-1/Backport-io"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          <span className="hidden lg:inline">GitHub</span>
        </a>
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
              {allLinks.map((link) => (
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
