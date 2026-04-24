"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";

const GITHUB_SVG = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "/#features" },
      { name: "Pricing", href: "/#pricing" },
      { name: "Documentation", href: "/docs" },
      { name: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Blog", href: "/blog" },
      { name: "API Reference", href: "/docs#proxy-endpoint" },
      { name: "Setup Guide", href: "/setup-guide" },
      { name: "Community", href: "https://github.com/Qureshi-1/Backport-io/discussions", external: true },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "/about" },
      { name: "Open Source", href: "https://github.com/Qureshi-1/Backport-io", external: true },
      { name: "Contact", href: "/about" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
    ],
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-[#080C10] border-t border-white/[0.06]">
      {/* Newsletter Section */}
      <div className="border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
              Stay connected
            </h3>
            <p className="text-sm text-[#A2BDDB]/40 mb-6 max-w-md mx-auto">
              Get product updates, security tips, and developer resources delivered to your inbox. No spam, ever.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-[#A2BDDB]/30 focus:outline-none focus:border-[#04e184]/30 focus:ring-1 focus:ring-[#04e184]/20 transition-all min-h-[44px]"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#04e184] hover:bg-white text-black text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 min-h-[44px]"
              >
                {subscribed ? (
                  <span>Subscribed!</span>
                ) : (
                  <>
                    Subscribe <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 py-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="bg-[#04e184] p-1.5 rounded-lg">
                <Shield className="w-4 h-4 text-black" fill="currentColor" />
              </div>
              <span className="text-base font-bold text-white">Backport</span>
            </Link>
            <p className="text-[#A2BDDB]/30 text-sm leading-relaxed max-w-xs mb-6">
              Enterprise-grade API gateway with WAF, rate limiting, caching, response transformation, and analytics. Protect your backend without the complexity.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/Qureshi-1/Backport-io"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#A2BDDB]/40 hover:text-white hover:border-white/[0.12] transition-all"
              >
                {GITHUB_SVG}
              </a>
              <a
                href="https://x.com/backportio"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#A2BDDB]/40 hover:text-white hover:border-white/[0.12] transition-all text-xs font-bold"
              >
                X
              </a>
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((section) => (
            <div key={section.title} className="md:col-span-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/20 mb-4">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="text-sm text-[#A2BDDB]/30 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/[0.04] py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#A2BDDB]/20">
            &copy; {new Date().getFullYear()} Backport. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs text-[#A2BDDB]/15">
              Enterprise-grade API Gateway
            </p>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-xs text-[#A2BDDB]/25 hover:text-[#04e184] transition-colors flex items-center gap-1"
            >
              Back to top
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
