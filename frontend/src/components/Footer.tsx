"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Shield, Twitter, Github, Linkedin, Youtube, 
  ArrowUpRight, Mail, Globe, MapPin 
} from "lucide-react";

const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { name: "Overview", href: "/#features" },
      { name: "Features", href: "/#features" },
      { name: "Pricing", href: "/#pricing" },
      { name: "What's New", href: "/changelog" },
    ]
  },
  {
    title: "Company",
    links: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Blog", href: "/blog" },
      { name: "Partners", href: "/partners" },
    ]
  },
  {
    title: "Specs",
    links: [
      { name: "Documentation", href: "/docs" },
      { name: "API Reference", href: "/docs/api" },
      { name: "System Status", href: "/status" },
      { name: "Security", href: "/security" },
    ]
  },
  {
    title: "Legal",
    links: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "GDPR Compliance", href: "/gdpr" },
    ]
  }
];

export default function Footer() {
  return (
    <footer className="bg-black py-24 px-6 border-t border-white/5 relative overflow-hidden">
      {/* Background radial for depth */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-radial-purple opacity-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 border-b border-white/5 pb-20">
          
          {/* Logo Column */}
          <div className="lg:col-span-2 space-y-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-[#D9FF00] p-1.5 rounded-lg">
                <Shield className="w-5 h-5 text-black" fill="currentColor" />
              </div>
              <span className="font-headline text-2xl font-black tracking-tighter text-white">
                BACKPORT<span className="text-[#D9FF00]">.IO</span>
              </span>
            </Link>
            <p className="font-body text-zinc-500 text-base max-w-xs leading-relaxed">
              Backport represents the final layer of your API infrastructure. High-performance, edge-native, and developer-obsessed.
            </p>
            <div className="flex gap-4">
               {[Twitter, Github, Linkedin, Youtube].map((Icon, i) => (
                 <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-[#D9FF00] hover:border-[#D9FF00]/40 transition-all duration-300">
                   <Icon className="w-5 h-5" />
                 </a>
               ))}
            </div>
          </div>

          {/* Links Columns */}
          {FOOTER_LINKS.map(section => (
            <div key={section.title} className="space-y-6">
              <h4 className="font-headline text-[10px] uppercase tracking-[0.4em] font-black text-white/50">{section.title}</h4>
              <ul className="space-y-4">
                {section.links.map(link => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="font-body text-sm font-medium text-zinc-500 hover:text-white transition-colors flex items-center gap-2 group"
                    >
                      {link.name}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-8 pt-8 text-[10px] font-headline font-semibold text-zinc-600 uppercase tracking-[0.3em]">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#34FF8C] pulse-glow" />
              BACKPORT_PROTOCOL_V4.0.1 // ALL_SYSTEMS_OPERATIONAL
           </div>
           
           <div className="flex items-center gap-12">
              <p>&copy; 2026 Backport Labs, Inc. All rights reserved.</p>
              <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                 <Globe className="w-3 h-3" />
                 ENGLISH (US)
              </div>
           </div>
        </div>
      </div>
    </footer>
  );
}
