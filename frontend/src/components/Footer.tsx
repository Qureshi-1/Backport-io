"use client";

import Link from "next/link";
import { 
  Shield, Twitter, Github, Linkedin, Youtube, 
  ArrowUpRight, Globe
} from "lucide-react";

const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
       { name: "Overview", href: "/#features" },
       { name: "Pricing", href: "/#pricing" },
       { name: "Documentation", href: "/docs" }
    ]
  },
  {
    title: "Company",
    links: [
       { name: "About", href: "/about" },
       { name: "Careers", href: "/careers" }
    ]
  },
  {
    title: "Support",
    links: [
       { name: "Help Center", href: "/help" },
       { name: "System Status", href: "/status" }
    ]
  }
];

export default function Footer() {
  return (
    <footer className="bg-[#080C10] py-24 px-6 border-t border-white/5 relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-radial-mint opacity-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-20 lg:gap-8 pb-20 border-b border-white/5">
        <div className="md:w-1/3 space-y-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-[#2CE8C3] p-1.5 rounded-lg shadow-lg shadow-[#2CE8C3]/20">
                <Shield className="w-5 h-5 text-black" fill="currentColor" />
              </div>
              <span className="font-headline text-2xl font-black tracking-tighter text-white">
                BACKPORT<span className="text-[#2CE8C3]">.IO</span>
              </span>
            </Link>
            <p className="font-body text-[#A2BDDB] text-base leading-relaxed max-w-sm">
              The modern infrastructure for secure, high-performance backends. Armed by global edge intelligence.
            </p>
            <div className="flex gap-4">
               {[Twitter, Github, Linkedin, Youtube].map((Icon, i) => (
                 <a key={i} href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-[#2CE8C3] hover:border-[#2CE8C3]/40 transition-all duration-300 transform-gpu hover:-translate-y-1">
                   <Icon className="w-5 h-5" />
                 </a>
               ))}
            </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-24 flex-1">
           {FOOTER_LINKS.map(sec => (
             <div key={sec.title} className="space-y-6">
                <h4 className="font-headline text-[10px] uppercase tracking-[0.4em] font-black text-white/50">{sec.title}</h4>
                <ul className="space-y-4">
                  {sec.links.map(l => (
                    <li key={l.name}>
                       <Link 
                        href={l.href}
                        className="font-body text-sm font-medium text-[#A2BDDB] hover:text-[#6BA9FF] transition-colors flex items-center gap-2 group"
                       >
                         {l.name}
                         <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                       </Link>
                    </li>
                  ))}
                </ul>
             </div>
           ))}
        </div>
      </div>

      <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-8 pt-8 text-[10px] font-headline font-semibold text-[#A2BDDB]/40 uppercase tracking-[0.3em]">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-[#2CE8C3] pulse-glow" />
             BACKPORT_NETWORK_LIVE // v0.4.1_ESTABLISHED
          </div>
          <div className="flex items-center gap-12">
             <p>&copy; 2026 Backport Labs, Inc.</p>
             <div className="flex items-center gap-2 hover:text-[#2CE8C3] cursor-pointer transition-colors">
                <Globe className="w-3 h-3" />
                ENGLISH (GLOBAL)
             </div>
          </div>
      </div>
    </footer>
  );
}
