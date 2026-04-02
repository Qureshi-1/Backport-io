import Link from "next/link";
import { ShieldCheck, Terminal, Disc, ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-[#0a0a0a] border-t border-white/5 py-40 overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-[600px] bg-gradient-to-t from-[#00F0FF]/5 to-transparent pointer-events-none" />

      <div className="mx-auto max-w-7xl px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-24 xl:gap-8 mb-32 pb-32 border-b border-white/5">
          
          <div className="xl:col-span-2 space-y-12">
            <Link href="/" className="flex items-center gap-4 group">
              <ShieldCheck className="h-8 w-8 text-[#00F0FF] drop-shadow-[0_0_15px_#00F0FF]" />
              <span className="text-3xl font-headline font-black tracking-tighter text-white uppercase select-none">
                BACKPORT<span className="text-[#00F0FF] text-glow-cyan">.IO</span>
              </span>
            </Link>
            <p className="text-[#849495] font-headline text-[10px] uppercase tracking-[0.5em] leading-relaxed font-black max-w-sm opacity-60">
              OPEN_SOURCE_PROTOCOL_FOR_THE_MODERN_WEB_ARCHITECTURE. 
              SECURITY_BY_DESIGN. SPEED_BY_CORE.
              BUILT_FOR_CRITICAL_SCALE.
            </p>
            <div className="flex items-center gap-6 pt-4">
              <div className="h-2 w-2 rounded-full bg-[#34FF8C] animate-pulse" />
              <span className="font-headline text-[9px] text-[#34FF8C] uppercase tracking-[0.5em] font-black">SYSTEM_STATUS: OK_NOMINAL</span>
            </div>
          </div>

          <div className="space-y-12">
            <h4 className="font-headline text-[11px] font-black uppercase tracking-[0.6em] text-white/50 border-b border-white/5 pb-4">SPECIFICATIONS</h4>
            <ul className="space-y-6">
              {[
                { label: "PROTOCOL_OVERVIEW", href: "/#features" },
                { label: "ALLOCATION_MODEL", href: "/#pricing" },
                { label: "DOCUMENTATION_CORE", href: "/docs" },
                { label: "CHANGELOG_HISTORY", href: "/changelog" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="font-headline text-[10px] uppercase tracking-[0.4em] font-black text-white/30 hover:text-[#00F0FF] transition-all hover:translate-x-3 block">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-12">
            <h4 className="font-headline text-[11px] font-black uppercase tracking-[0.6em] text-white/50 border-b border-white/5 pb-4">REPOSITORY</h4>
            <ul className="space-y-6">
              {[
                { label: "ARCHITECTURE", href: "/about" },
                { label: "INTEL_REPORTS", href: "/blog" },
                { label: "SOURCE_ARTIFACTS", href: "https://github.com/Qureshi-1/Backport-io" },
                { label: "SOCIAL_GRID", href: "https://twitter.com/backportio" },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className="font-headline text-[10px] uppercase tracking-[0.4em] font-black text-white/30 hover:text-[#34FF8C] transition-all hover:translate-x-3 flex items-center gap-2 group">
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-12">
            <h4 className="font-headline text-[11px] font-black uppercase tracking-[0.6em] text-white/50 border-b border-white/5 pb-4">SECURITY_LABS</h4>
            <ul className="space-y-6">
              {[
                { label: "PRIVACY_CONSTRAINTS", href: "/privacy" },
                { label: "USER_TERMS_OF_USE", href: "/terms" },
                { label: "VULNERABILITY_REPORT", href: "mailto:security@backportio.com" },
                { label: "SUPPORT_UPLINK", href: "mailto:support@backportio.com" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="font-headline text-[10px] uppercase tracking-[0.4em] font-black text-white/30 hover:text-[#00F0FF] transition-all hover:translate-x-3 block">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row items-center justify-between gap-12 font-headline text-[10px] font-black uppercase tracking-[0.5em] text-[#849495] opacity-40">
          <div className="flex items-center gap-12">
            <span>&copy; {new Date().getFullYear()} BP_OS_DISTRIBUTION</span>
            <span className="flex items-center gap-2"><Disc className="w-3 h-3 animate-spin-slow" /> STABLE_RELEASE_V4.2</span>
          </div>
          <div className="flex items-center gap-8">
            <span className="flex items-center gap-2"><Terminal className="w-3 h-3" /> NEXTJS_COORDINATE</span>
            <span className="flex items-center gap-2"><Terminal className="w-3 h-3" /> FASTAPI_CORE_LOGS</span>
            <span className="h-4 w-px bg-white/20 hidden xl:block" />
            <span className="text-[#34FF8C]">LOC_USA: US_EAST_REGION_ACTIVE</span>
          </div>
        </div>

        <div className="mt-20 pt-20 border-t border-white/5 text-center">
           <span className="font-headline text-[40px] md:text-[80px] font-black tracking-tighter text-white opacity-[0.02] select-none pointer-events-none uppercase">
             BACKPORT_NETWORK_EMPIRE
           </span>
        </div>
      </div>
    </footer>
  );
}
