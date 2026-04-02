"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  useScroll,
  useSpring,
} from "framer-motion";
import Link from "next/link";
import {
  ShieldCheck,
  Shield,
  Zap,
  Layers,
  Lock,
  Activity,
  Server,
  CheckCircle2,
  TerminalSquare,
  Database,
  ArrowRight,
  X,
  XCircle,
  AlertTriangle,
  Sparkles,
  Menu,
  Gift,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
// @ts-ignore
import { animate, createTimeline, stagger } from "animejs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { auth } from "@/lib/auth";

import { FinalCTA, Pricing, FAQ } from "@/components/HomeSections";

const HeroScene = dynamic(() => import("@/components/HeroScene"), {
  ssr: false,
  loading: () => null,
});

// ─── Scroll Progress Bar ──────────────────────────────────────────────────────
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: "left" }}
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-400"
    />
  );
};

// ─── GitHub Stars Live Count ──────────────────────────────────────────────────
const useGitHubStars = () => {
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    try {
      const cached = localStorage.getItem('gh_stars');
      const cachedTime = localStorage.getItem('gh_stars_time');
      if (cached && cachedTime && Date.now() - Number(cachedTime) < 3600000) {
        setStars(Number(cached)); return;
      }
    } catch {}
    fetch('https://api.github.com/repos/Qureshi-1/Backport-io')
      .then(r => r.json())
      .then(d => {
        if (d.stargazers_count !== undefined) {
          setStars(d.stargazers_count);
          try {
            localStorage.setItem('gh_stars', String(d.stargazers_count));
            localStorage.setItem('gh_stars_time', String(Date.now()));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);
  return stars;
};

// ─── Typewriter cycling text ──────────────────────────────────────────────────
const BACKENDS = [
  "Express.js API",
  "Django REST",
  "FastAPI",
  "Laravel",
  "Rails API",
  "Go Gin",
];
const TypewriterText = () => {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = BACKENDS[index];
    const delay = deleting ? 40 : 80;
    const timer = setTimeout(() => {
      if (!deleting && displayed === current) {
        setTimeout(() => setDeleting(true), 1400);
      } else if (deleting && displayed === "") {
        setDeleting(false);
        setIndex((i) => (i + 1) % BACKENDS.length);
      } else {
        setDisplayed(
          deleting
            ? displayed.slice(0, -1)
            : current.slice(0, displayed.length + 1),
        );
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [displayed, deleting, index]);

  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
      {displayed}
      <span className="animate-pulse text-emerald-400">|</span>
    </span>
  );
};

// ─── Floating Live Metrics Card ───────────────────────────────────────────────
const PATHS = [
  "/api/products",
  "/api/orders",
  "/api/users/me",
  "/api/auth",
  "/api/cart",
];
const METHODS = ["GET", "GET", "GET", "POST", "POST"];

const LiveMetricsCard = () => {
  const [reqs, setReqs] = useState(14282);
  const [hits, setHits] = useState(11340);
  const [blocked, setBlocked] = useState(412);
  const cardRef = useRef<HTMLDivElement>(null);
  const [log, setLog] = useState([
    { method: "GET", path: "/api/products", ms: 0.4, type: "cache", id: 1 },
    { method: "POST", path: "/api/orders", ms: 12, type: "forward", id: 2 },
    { method: "GET", path: "/api/users", ms: 0.3, type: "cache", id: 3 },
    { method: "POST", path: "/api/auth", ms: 0.1, type: "waf", id: 4 },
  ]);

  useEffect(() => {
    if (cardRef.current) {
      animate(cardRef.current, {
        translateY: [-10, 10],
        duration: 4000,
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine'
      });
    }

    const iv = setInterval(() => {
      const burst = Math.floor(Math.random() * 8) + 1;
      const isWaf = Math.random() < 0.1;
      const isCached = !isWaf && Math.random() < 0.7;
      const method = METHODS[Math.floor(Math.random() * METHODS.length)];
      const path = PATHS[Math.floor(Math.random() * PATHS.length)];
      const ms = isWaf ? 0.1 : isCached ? +(Math.random() * 0.5 + 0.1).toFixed(1) : +(Math.random() * 18 + 4).toFixed(0);
      
      const entryIdx = Math.floor(Math.random() * 1000); 
      const entry = { method, path, ms, type: isWaf ? "waf" : isCached ? "cache" : "forward", id: entryIdx };
      
      setReqs((r) => r + burst);
      setHits((h) => h + (isCached ? burst : 0));
      setBlocked((b) => b + (isWaf ? 1 : 0));
      setLog((prev) => [entry, ...prev].slice(0, 4));
    }, 400);
    return () => clearInterval(iv);
  }, []);

  return (
    <div ref={cardRef} className="relative w-full max-w-sm mx-auto">
      <div className="border border-[#3b494b]/30 bg-[#0a0a0a]/90 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#3b494b]/30 bg-[#1b1b1b]/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-[#00F0FF] animate-pulse shadow-[0_0_8px_#00F0FF]" />
            <span className="font-headline text-[10px] font-bold text-[#e2e2e2] uppercase tracking-[0.2rem]">
              GATEWAY_NODE_ALPHA
            </span>
          </div>
          <span className="font-headline text-[9px] text-[#00F0FF] uppercase tracking-widest animate-pulse">LIVE_FEED</span>
        </div>
        <div className="grid grid-cols-3 divide-x divide-[#3b494b]/30 border-b border-[#3b494b]/30">
          {[
            { label: "REQUESTS", value: reqs.toLocaleString(), color: "text-[#e2e2e2]" },
            { label: "CACHED", value: hits.toLocaleString(), color: "text-[#34FF8C]" },
            { label: "BLOCKED", value: String(blocked), color: "text-[#ffb4ab]" },
          ].map((s) => (
            <div key={s.label} className="px-2 py-3 text-center bg-[#0e0e0e]/50">
              <p className={`text-sm font-headline font-bold tabular-nums ${s.color}`}>
                {s.value}
              </p>
              <p className="text-[8px] font-headline text-[#849495] tracking-widest mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="p-3 space-y-1.5 min-h-[140px] bg-[#0a0a0a]">
          {log.map((entry, i) => (
            <div
              key={`${entry.path}-${i}`}
              className="flex items-center gap-2 border border-[#3b494b]/10 bg-[#111111]/80 px-3 py-2"
            >
              <span className={`text-[9px] font-mono font-bold w-8 ${entry.method === "GET" ? "text-[#00F0FF]" : "text-[#34FF8C]"}`}>
                {entry.method}
              </span>
              <span className="flex-1 truncate text-[9px] font-mono text-[#849495]">
                {entry.path}
              </span>
              <span className={`text-[9px] font-mono font-bold ${entry.type === "waf" ? "text-[#ffb4ab]" : entry.type === "cache" ? "text-[#34FF8C]" : "text-[#e2e2e2]"}`}>
                {entry.type === "waf" ? "BLOCKED" : `${entry.ms}ms`}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -inset-4 -z-10 bg-emerald-500/10 blur-2xl rounded-full" />
    </div>
  );
};

// ─── Mouse Glow ───────────────────────────────────────────────────────────────
const MouseGlow = () => {
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const background = useTransform(
    [mouseX, mouseY],
    ([x, y]: number[]) =>
      `radial-gradient(600px circle at ${x}px ${y}px, rgba(16,185,129,0.06), transparent 80%)`,
  );
  useEffect(() => {
    setMounted(true);
    const h = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, [mouseX, mouseY]);
  if (!mounted) return null;
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50"
      style={{ background }}
    />
  );
};

// ─── Demo Modal ───────────────────────────────────────────────────────────────
const DEMO_LINES = [
  {
    delay: 500,
    text: "# Step 1 — Sign up at backport-io.vercel.app/auth/signup (free, no card)",
    color: "text-zinc-500",
  },
  {
    delay: 900,
    text: "\u2713  Account created \u00b7 API Key: bk_a1b2c3d4e5f6...",
    color: "text-emerald-400",
  },
  { delay: 1900, text: "", color: "" },
  {
    delay: 2000,
    text: "# Step 2 \u2014 Start the gateway (Docker)",
    color: "text-zinc-500",
  },
  {
    delay: 2800,
    text: "$ docker run -p 8080:8080 -e TARGET_URL=https://backport-io.onrender.com Backport/gateway",
    color: "text-zinc-300",
  },
  {
    delay: 3700,
    text: "INFO:     Gateway live on :8080  |  WAF \u00b7 Rate Limit \u00b7 Cache \u2014 active",
    color: "text-zinc-500",
  },
  { delay: 4500, text: "", color: "" },
  {
    delay: 4600,
    text: "# Step 3 \u2014 Route your requests through Backport",
    color: "text-zinc-500",
  },
  {
    delay: 5400,
    text: '$ curl -H "X-API-Key: bk_a1b2c3d4" https://backport-io.onrender.com/api/products',
    color: "text-zinc-300",
  },
  {
    delay: 6200,
    text: "< HTTP/1.1 200 OK  (served from cache \u26a1 0.4ms)",
    color: "text-emerald-400",
  },
  { delay: 7000, text: "", color: "" },
  {
    delay: 7100,
    text: "# WAF \u2713  Rate Limit \u2713  Cache \u2713  Idempotency \u2713  Done \ud83c\udf92",
    color: "text-cyan-400",
  },
];

const DemoModal = ({ onClose }: { onClose: () => void }) => {
  const [visibleLines, setVisibleLines] = useState(0);
  const [isLogged, setIsLogged] = useState(false);
  useEffect(() => {
    const timers = DEMO_LINES.map((l, i) =>
      setTimeout(() => setVisibleLines(i + 1), l.delay),
    );
    setIsLogged(auth.isLoggedIn());
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.93, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl overflow-hidden"
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-white/5 bg-zinc-900/70 px-4 py-3">
          <button
            onClick={onClose}
            className="group flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 hover:bg-rose-400 transition-colors"
          >
            <X className="h-2 w-2 opacity-0 group-hover:opacity-100 text-rose-900" />
          </button>
          <div className="h-3.5 w-3.5 rounded-full bg-yellow-400" />
          <div className="h-3.5 w-3.5 rounded-full bg-emerald-500" />
          <span className="mx-auto font-mono text-xs text-zinc-500">
            bash — Backport demo
          </span>
        </div>
        {/* Terminal body */}
        <div className="p-6 font-mono text-sm leading-7 min-h-[300px]">
          {DEMO_LINES.slice(0, visibleLines).map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className={line.color}
            >
              {line.text || "\u00A0"}
            </motion.p>
          ))}
          {visibleLines < DEMO_LINES.length && (
            <span className="inline-block h-4 w-2 animate-pulse bg-[#00F0FF] translate-y-0.5" />
          )}
        </div>
        <div className="flex items-center justify-between border-t border-white/5 bg-zinc-900/40 px-6 py-4">
          <p className="text-xs text-zinc-500">Backport Gateway · 3-step setup</p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/80 transition-colors"
            >
              ✕ Close Demo
            </button>
            <Link
              href={isLogged ? "/dashboard" : "/auth/signup"}
              onClick={onClose}
              className="rounded-lg bg-[#00F0FF] px-4 py-1.5 text-xs font-semibold text-[#003338] hover:bg-[#34FF8C] transition-colors"
            >
              {isLogged ? "Dashboard →" : "Sign Up Free →"}
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── HeroStarButton ───────────────────────────────────────────────────────────
function HeroStarButton() {
  const stars = useGitHubStars();
  return (
    <a
      href="https://github.com/Qureshi-1/Backport-io"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 border border-[#3b494b]/40 bg-[#1b1b1b] px-3 py-1.5 font-headline uppercase text-[10px] tracking-widest text-white/60 hover:text-[#00F0FF] hover:border-[#00F0FF]/30 transition-colors"
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
      </svg>
      ★ GitHub{stars !== null ? ` (${stars})` : ''}
    </a>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
const Hero = ({ onDemo }: { onDemo: () => void }) => {
  const [isLogged, setIsLogged] = useState(false);
  useEffect(() => { setIsLogged(auth.isLoggedIn()); }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-24 pb-16 overflow-hidden bg-[#0e0e0e]">
      <div className="absolute inset-0 bg-cyber-grid opacity-60" />
      <div className="absolute inset-0 scanline-bg opacity-25 pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#00F0FF]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#34FF8C]/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 relative z-10 w-full">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col space-y-8">
            <div className="space-y-2">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-headline text-[10px] uppercase tracking-[0.3rem] text-[#34FF8C] font-bold block"
              >
                SYSTEM_STATUS: OPTIMIZED // V4.0.2-STABLE
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="font-headline text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-none text-[#e2e2e2]"
              >
                Shield your{" "}
                <br />
                <span className="text-[#00F0FF] text-glow-cyan inline-block min-w-[200px]">
                  <TypewriterText />
                </span>
                <br />
                in 30 seconds
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-body text-[#b9cacb] max-w-lg text-lg leading-relaxed"
            >
              Zero-config API Gateway: Rate limiting, Caching, WAF, and Idempotency.
              Deploy at the edge and scale to infinity. No code changes required.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-5 items-start sm:items-center"
            >
              {/* Primary CTA — V7 rectangular */}
              <Link
                href={isLogged ? "/dashboard" : "/auth/signup"}
                className="group inline-flex items-center gap-2 bg-[#00F0FF] text-[#003338] px-10 py-4 font-headline font-extrabold uppercase tracking-widest text-base hover:bg-[#34FF8C] transition-all duration-300 shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-[0_0_40px_rgba(52,255,140,0.4)] active:scale-95"
              >
                {isLogged ? "Go to Dashboard" : "Start for Free"}
                <ArrowRight suppressHydrationWarning className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Terminal install box */}
              <div className="bg-[#0a0a0a] border border-[#3b494b]/30 p-3 font-mono text-sm group cursor-pointer hover:border-[#00F0FF]/30 transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-[#ffb4ab]/60" />
                    <div className="w-2 h-2 bg-[#34FF8C]/60" />
                    <div className="w-2 h-2 bg-[#00F0FF]/60" />
                  </div>
                  <span className="text-[#849495] text-[10px] uppercase tracking-widest">terminal_session</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-[#00dbe9]">curl -sSL https://backport-io.vercel.app/install.sh | bash</code>
                  <button 
                    onClick={() => navigator.clipboard.writeText("curl -sSL https://backport-io.vercel.app/install.sh | bash")}
                    className="ml-3 text-zinc-500 hover:text-white transition-colors p-1"
                    title="Copy"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  </button>
                  <span className="inline-block w-2 h-4 bg-[#00F0FF] ml-1 animate-pulse" />
                </div>
              </div>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-3"
            >
              <HeroStarButton />
              <span className="flex items-center border border-[#34FF8C]/20 bg-[#34FF8C]/5 px-3 py-1.5 font-headline uppercase text-[10px] tracking-widest text-[#34FF8C]">
                ⭐ MIT Licensed • Open Source
              </span>
              <button
                onClick={() => { document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' }); onDemo(); }}
                className="flex items-center gap-1.5 border border-[#849495]/20 px-3 py-1.5 font-headline uppercase text-[10px] tracking-widest text-[#849495] hover:text-[#00F0FF] hover:border-[#00F0FF]/30 transition-colors"
              >
                <TerminalSquare suppressHydrationWarning className="h-3 w-3" /> Watch Demo
              </button>
            </motion.div>
          </div>

          {/* Right — 3D Interactive Scene */}
          <div className="lg:col-span-5 relative hidden lg:block h-[560px]">
            {/* Glow backdrop */}
            <div className="absolute inset-0 bg-[#00F0FF]/3 blur-[120px] rounded-full pointer-events-none" />
            {/* R3F Canvas */}
            <HeroScene />
            {/* Overlay metric tags */}
            <div className="absolute top-8 right-4 bg-[#0a0a0a]/90 border border-[#00F0FF]/20 backdrop-blur-sm px-4 py-2 z-10">
              <div className="text-[9px] font-headline uppercase tracking-[0.25rem] text-[#00F0FF]/60">NODE_01</div>
              <div className="text-[11px] font-headline font-bold text-[#00F0FF]">LATENCY: 12ms</div>
            </div>
            <div className="absolute bottom-16 left-2 bg-[#0a0a0a]/90 border border-[#34FF8C]/20 backdrop-blur-sm px-4 py-2 z-10">
              <div className="text-[9px] font-headline uppercase tracking-[0.25rem] text-[#34FF8C]/60">UPTIME</div>
              <div className="text-[11px] font-headline font-bold text-[#34FF8C]">99.99%</div>
            </div>
            <div className="absolute bottom-4 right-0 z-10">
              <LiveMetricsCard />
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="w-full mt-24 border-y border-[#3b494b]/15 bg-[#0a0a0a]/50 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {[
            { value: "100M+", label: "Requests / Day", color: "text-[#00F0FF]" },
            { value: "50+", label: "Edge Locations", color: "text-[#00F0FF]" },
            { value: "<1ms", label: "P99 Overhead", color: "text-[#34FF8C]" },
            { value: "∞", label: "Auto Scaling", color: "text-[#e2e2e2]" },
          ].map((stat) => (
            <div key={stat.label} className="space-y-1">
              <h4 className={`text-3xl font-headline font-bold ${stat.color}`}>{stat.value}</h4>
              <p className="text-[10px] font-headline uppercase tracking-widest text-[#849495]">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ─── Features ─────────────────────────────────────────────────────────────────
const Features = () => {
  const sectionRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const tl = createTimeline({
            defaults: {
              ease: "spring(1, 80, 10, 0)",
              duration: 1200,
            }
          });
          
          tl.add('.feature-card-anim', {
            translateY: [40, 0],
            opacity: [0, 1],
            delay: stagger(150),
          });
          
          if (sectionRef.current) {
            observer.unobserve(sectionRef.current);
          }
        }
      },
      { threshold: 0.1 }
    );
    
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const cards = [
    { icon: ShieldCheck, title: "WAF Engine", desc: "L7 dynamic shielding. SQLi, XSS, Path Traversal blocked in real-time.", col: "md:col-span-2", accent: "#00F0FF" },
    { icon: Zap, title: "Smart Cache", desc: "LRU cache. Sub-ms responses. 99.9% hit rate.", col: "md:col-span-1", accent: "#34FF8C" },
    { icon: Lock, title: "Rate Limiting", desc: "Sliding window throttling per IP, per API key.", col: "md:col-span-1", accent: "#00dbe9" },
    { icon: Database, title: "Idempotency", desc: "Replay protection for financial & stateful APIs.", col: "md:col-span-1", accent: "#00F0FF" },
    { icon: Server, title: "Multi-Env Deploy", desc: "Docker. Render. Fly. Railway. Any cloud.", col: "md:col-span-2", accent: "#34FF8C" },
  ];
  
  return (
    <section ref={sectionRef} id="features" className="py-24 relative bg-[#0e0e0e] border-y border-[#3b494b]/10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
          <div className="max-w-xl space-y-3">
            <span className="text-[#34FF8C] font-headline text-[10px] uppercase tracking-[0.3rem] font-bold">PROTOCOL GENESIS</span>
            <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter uppercase text-[#e2e2e2]">High Frequency <span className="text-[#00F0FF]">Protection</span></h2>
            <p className="text-[#b9cacb] leading-relaxed">Our engine intercepts traffic at the network layer before it touches your app.</p>
          </div>
          <Link href="/docs" className="text-[#00F0FF] font-headline uppercase text-[11px] tracking-[0.2rem] border-b border-[#00F0FF] pb-1 hover:text-[#34FF8C] hover:border-[#34FF8C] transition-colors whitespace-nowrap">Explore Docs</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((card, i) => (
            <div
              key={card.title}
              className={`feature-card-anim opacity-0 ${card.col} bg-[#0e0e0e] border border-[#3b494b]/15 p-10 flex flex-col justify-between min-h-[220px] monolith-card hover:border-[#00F0FF]/20 transition-colors group`}
            >
              <card.icon suppressHydrationWarning className="w-10 h-10 mb-6" style={{ color: card.accent }} />
              <div>
                <h3 className="text-xl font-headline font-bold uppercase text-white mb-3">{card.title}</h3>
                <p className="text-sm text-[#b9cacb] leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── How it Works ─────────────────────────────────────────────────────────────
const HowItWorks = () => {
  const sectionRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const tl = createTimeline({
            defaults: {
              ease: "spring(1, 80, 10, 0)",
              duration: 1200,
            }
          });
          
          tl.add('.hiw-step', {
            translateY: [30, 0],
            opacity: [0, 1],
            delay: stagger(200),
          });
          
          if (sectionRef.current) {
            observer.unobserve(sectionRef.current);
          }
        }
      },
      { threshold: 0.2 }
    );
    
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="how-it-works" className="py-24 relative bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center md:max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[#00F0FF] font-headline text-[10px] uppercase tracking-[0.3rem] font-bold">INSTALLATION</span>
          <h2 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter uppercase text-[#e2e2e2]">Up in <span className="text-[#34FF8C]">3 Steps</span></h2>
          <p className="text-[#b9cacb] leading-relaxed">No SDK. No code changes. Just point your traffic through Backport.</p>
        </div>
        
        <div className="relative grid gap-8 md:grid-cols-3">
          <div className="absolute top-8 left-[33%] right-[33%] hidden h-px bg-gradient-to-r from-transparent via-[#34FF8C]/30 to-transparent md:block" />
          {[
            {
              n: "01",
              title: "Multi-Environment",
              body: "Run the Docker image anywhere — Render, Fly, Railway, AWS. Takes under 30 seconds.",
              accent: "#00F0FF"
            },
            {
              n: "02",
              title: "Set Target URL",
              body: "In the dashboard, enter your backend's internal URL. Backport proxies all traffic through.",
              accent: "#34FF8C"
            },
            {
              n: "03",
              title: "Watch it Work",
              body: "Real-time metrics flow in. Cache hits rise. Threats blocked. Your backend stays clean.",
              accent: "#00dbe9"
            },
          ].map((s) => (
            <div key={s.n} className="hiw-step opacity-0 flex flex-col items-center group">
              <div 
                className="mb-6 flex h-16 w-16 items-center justify-center border bg-[#0e0e0e] font-headline text-xl font-bold transition-colors duration-500"
                style={{ borderColor: `${s.accent}40`, color: s.accent }}
              >
                {s.n}
              </div>
              <h3 className="mb-2 text-xl font-headline font-bold uppercase text-white">{s.title}</h3>
              <p className="text-sm text-[#b9cacb] text-center leading-relaxed max-w-sm">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
// ─── WAF Live Demo ────────────────────────────────────────────────────────────
const WAFDemo = () => {
  const [input, setInput] = useState("SELECT * FROM users WHERE id=1");
  const [result, setResult] = useState<null | { blocked: boolean; reason: string; code: number }>(null);
  const [testing, setTesting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result && containerRef.current) {
      animate('.waf-result-anim', {
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.95, 1],
        duration: 800,
        ease: "outElastic(1, .6)"
      });
    }
  }, [result]);

  const presets = [
    { label: "SQL Injection", value: "'; DROP TABLE users;--" },
    { label: "XSS Attack", value: "<script>alert('xss')</script>" },
    { label: "Normal Request", value: "/api/users?page=1&limit=10" },
    { label: "Path Traversal", value: "../../../etc/passwd" },
  ];

  const checkWAF = () => {
    setTesting(true);
    setResult(null);
    
    // Animate scanning process
    setTimeout(() => {
      const sqlPatterns = /('|--|;|DROP|SELECT|INSERT|UPDATE|DELETE|UNION|exec|script)/i;
      const xssPatterns = /(<script|<img|onerror|onload|javascript:|alert\()/i;
      const pathPatterns = /(\.\.\/|etc\/passwd|\/proc\/)/i;

      if (sqlPatterns.test(input)) {
        setResult({ blocked: true, reason: "SQL Injection pattern detected", code: 403 });
      } else if (xssPatterns.test(input)) {
        setResult({ blocked: true, reason: "XSS payload detected in request", code: 403 });
      } else if (pathPatterns.test(input)) {
        setResult({ blocked: true, reason: "Path traversal attempt blocked", code: 403 });
      } else {
        setResult({ blocked: false, reason: "Request is clean — forwarded to backend", code: 200 });
      }
      setTesting(false);
    }, 600);
  };

  return (
    <section className="bg-[#0e0e0e] py-24 border-y border-[#3b494b]/10 relative">
      <div className="absolute inset-0 scanline-bg opacity-10 pointer-events-none" />
      <div className="mx-auto max-w-4xl px-6 relative z-10">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 border border-[#00F0FF]/30 bg-[#00F0FF]/5 px-3 py-1 text-[10px] font-headline uppercase tracking-widest text-[#00F0FF] mb-4">
            <span className="h-1.5 w-1.5 bg-[#00F0FF] animate-pulse" /> Live WAF Demo
          </span>
          <h2 className="text-3xl md:text-5xl font-headline font-bold uppercase text-[#e2e2e2]">See the engine <span className="text-[#00F0FF]">in action</span></h2>
          <p className="mt-3 text-[#b9cacb] font-body">Type any request payload. Backport's WAF engine analyzes it in real-time.</p>
        </div>

        <div ref={containerRef} className="border border-[#3b494b]/30 bg-[#0a0a0a] shadow-[0_0_30px_rgba(0,240,255,0.05)] relative overflow-hidden group hover:border-[#00F0FF]/30 transition-colors duration-500">
          {/* Terminal header */}
          <div className="flex items-center gap-2 border-b border-[#3b494b]/30 bg-[#1b1b1b]/50 px-4 py-3">
            <div className="flex space-x-1.5">
              <div className="h-2 w-2 bg-[#ffb4ab]/60" />
              <div className="h-2 w-2 bg-[#34FF8C]/60" />
              <div className="h-2 w-2 bg-[#00F0FF]/60" />
            </div>
            <span className="ml-2 text-[10px] text-[#849495] font-headline uppercase tracking-widest">backport-waf-engine v4.0.2</span>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {/* Preset buttons */}
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setInput(p.value); setResult(null); }}
                  className="text-[10px] px-3 py-1.5 border border-[#3b494b] bg-transparent text-[#b9cacb] hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors font-headline uppercase tracking-wider"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="relative">
              <label className="block text-[10px] text-[#849495] mb-2 font-headline uppercase tracking-widest">REQUEST_PAYLOAD</label>
              <input
                value={input}
                onChange={(e) => { setInput(e.target.value); setResult(null); }}
                className="w-full bg-[#1b1b1b] border border-[#3b494b]/50 px-4 py-4 font-mono text-sm text-[#e2e2e2] focus:outline-none focus:border-[#00F0FF] transition-colors rounded-none"
                placeholder="Enter a request payload to test..."
              />
            </div>

            {/* Test button */}
            <button
              onClick={checkWAF}
              disabled={testing || !input.trim()}
              className="w-full bg-[#00F0FF] hover:bg-[#34FF8C] disabled:opacity-50 text-[#003338] font-headline font-bold uppercase tracking-widest py-4 transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            >
              {testing ? (
                <><span className="h-4 w-4 border-2 border-[#003338]/30 border-t-[#003338] rounded-full animate-spin" /> Analyzing_</>
              ) : (
                <><Shield className="h-4 w-4" /> Analyze with WAF</>
              )}
            </button>

            {/* Result */}
            {result && (
              <div
                className={`waf-result-anim border p-5 font-mono text-sm bg-[#0e0e0e] ${
                  result.blocked
                    ? "border-[#ff4444]/40 text-[#ff4444]"
                    : "border-[#34FF8C]/40 text-[#34FF8C]"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {result.blocked ? (
                    <XCircle className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="font-bold">HTTP {result.code} — {result.blocked ? "BLOCKED" : "ALLOWED"}</span>
                </div>
                <p className="text-xs opacity-80 ml-6">{result.reason}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};


// Pricing is imported from HomeSections
// (Footer is imported from @/components/Footer)

// ─── Floating Badge ───────────────────────────────────────────────────────────
const Badge = () => null;

// ─── Competitor Compare ───────────────────────────────────────────────────────
// ─── Competitor Compare ───────────────────────────────────────────────────────
const CompetitorCompare = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animate('.comp-row-anim', {
            translateX: [-20, 0],
            opacity: [0, 1],
            delay: stagger(80),
            ease: "outExpo",
            duration: 800
          });
          if (sectionRef.current) observer.unobserve(sectionRef.current);
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const rows = [
    {
      feature: "Setup Time",
      backport: "30 seconds",
      kong: "Hours",
      cloudflare: "Minutes",
      bpWin: true,
    },
    {
      feature: "Zero Code Changes",
      backport: "YES",
      kong: "NO",
      cloudflare: "NO",
      bpWin: true,
    },
    {
      feature: "Built-in Idempotency",
      backport: "YES",
      kong: "Plugin needed",
      cloudflare: "NO",
      bpWin: true,
    },
    {
      feature: "Open Source",
      backport: "MIT",
      kong: "Enterprise $",
      cloudflare: "NO",
      bpWin: true,
    },
    {
      feature: "Setup Complexity",
      backport: "Low",
      kong: "High",
      cloudflare: "Medium",
      bpWin: true,
    },
    {
      feature: "Starting Price",
      backport: "FREE",
      kong: "$250/month",
      cloudflare: "$200/month",
      bpWin: true,
    },
  ];

  return (
    <section ref={sectionRef} className="bg-[#0e0e0e] py-24 border-y border-[#3b494b]/10 relative">
      <div className="absolute inset-0 scanline-bg opacity-[0.03] pointer-events-none" />
      <div className="mx-auto max-w-5xl px-6 relative z-10">
        <div className="mb-14 text-center">
          <span className="text-[#34FF8C] font-headline text-[10px] uppercase tracking-[0.3rem] font-bold block mb-3">MARKET ANALYSIS</span>
          <h2 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter uppercase text-[#e2e2e2]">
            Why <span className="text-[#34FF8C]">Backport?</span>
          </h2>
          <p className="mt-4 text-[#849495] font-body">Compare with industry alternatives.</p>
        </div>
        <div className="overflow-x-auto border border-[#3b494b]/30 bg-[#0a0a0a]">
          <table className="w-full text-left text-sm text-[#b9cacb]">
            <thead className="border-b border-[#3b494b]/30 bg-[#1b1b1b]/50 text-[10px] uppercase tracking-widest text-[#849495] font-headline">
              <tr>
                <th className="px-6 py-5 font-bold">Feature</th>
                <th className="px-6 py-5 font-bold text-[#00F0FF]">Backport</th>
                <th className="px-6 py-5 font-bold">Kong</th>
                <th className="px-6 py-5 font-bold">Cloudflare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3b494b]/10">
              {rows.map((r, i) => (
                <tr key={r.feature} className="comp-row-anim opacity-0 transition-colors hover:bg-[#1b1b1b]/30 group">
                  <td className="whitespace-nowrap px-6 py-5 font-headline text-xs uppercase tracking-wider text-[#e2e2e2]">
                    {r.feature}
                  </td>
                  <td className="whitespace-nowrap px-6 py-5 font-bold text-[#34FF8C] text-glow-green">
                    <div className="flex items-center gap-2">
                       {r.bpWin && <CheckCircle2 className="h-4 w-4" />} {r.backport}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-5 text-[#849495]">
                    {r.kong}
                  </td>
                  <td className="whitespace-nowrap px-6 py-5 text-[#849495]">
                    {r.cloudflare}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

// ─── Architecture Diagram ───────────────────────────────────────────────────
const ArchitectureDiagram = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animate('.arch-node-anim', {
            scale: [0.9, 1],
            opacity: [0, 1],
            delay: stagger(150),
            ease: "outElastic(1, .8)"
          });
          if (sectionRef.current) observer.unobserve(sectionRef.current);
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-[#0e0e0e] py-24 hidden sm:block border-b border-[#3b494b]/10 relative">
      <div className="absolute inset-0 scanline-bg opacity-[0.03] pointer-events-none" />
      <div className="mx-auto max-w-5xl px-6 relative z-10">
        <div className="mb-20 text-center">
          <span className="text-[#00F0FF] font-headline text-[10px] uppercase tracking-[0.3rem] font-bold block mb-3">SYSTEM INFRASTRUCTURE</span>
          <h2 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter uppercase text-[#e2e2e2]">
            Data <span className="text-[#00F0FF]">Flow Architecture</span>
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="arch-node-anim opacity-0 flex flex-col items-center justify-center w-48 h-32 border border-[#3b494b]/30 bg-[#111111] relative">
            <span className="text-[#e2e2e2] font-headline text-xs uppercase tracking-widest relative z-10">Your Client</span>
            <span className="text-[10px] text-[#849495] font-mono mt-2 relative z-10">MOBILE / WEB / CLI</span>
          </div>

          <div className="arch-node-anim opacity-0 hidden md:flex items-center text-[#00F0FF]">
            <div className="h-px w-12 bg-[#00F0FF]/30"></div>
            <ArrowRight className="h-4 w-4 -ml-1" />
          </div>

          <div className="arch-node-anim opacity-0 flex flex-col items-center justify-center w-72 py-8 border-2 border-[#00F0FF] bg-[#0e0e0e] shadow-[0_0_40px_rgba(0,240,255,0.1)] z-10 relative">
            <div className="absolute -top-3 bg-[#00F0FF] px-2 py-0.5 text-[9px] font-bold text-[#003338] uppercase tracking-widest">
              BACKPORT GATEWAY
            </div>
            <div className="space-y-3 text-center">
              <p className="text-[10px] text-[#00F0FF] font-headline tracking-widest uppercase">Rate Limiting</p>
              <div className="h-4 w-px bg-[#3b494b]/30 mx-auto" />
              <p className="text-[10px] text-[#00F0FF] font-headline tracking-widest uppercase">WAF & Cache</p>
              <div className="h-4 w-px bg-[#3b494b]/30 mx-auto" />
              <p className="text-[10px] text-[#00F0FF] font-headline tracking-widest uppercase">Idempotency</p>
            </div>
          </div>

          <div className="arch-node-anim opacity-0 hidden md:flex items-center text-[#34FF8C]">
            <div className="h-px w-12 bg-[#34FF8C]/30"></div>
            <ArrowRight className="h-4 w-4 -ml-1" />
          </div>

          <div className="arch-node-anim opacity-0 flex flex-col items-center justify-center w-48 h-32 border border-[#3b494b]/30 bg-[#111111] relative">
            <span className="text-[#e2e2e2] font-headline text-xs uppercase tracking-widest relative z-10">Your Backend</span>
            <span className="text-[10px] text-[#849495] font-mono mt-2 relative z-10">EXPRESS / FASTAPI / ETC</span>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Code Example ───────────────────────────────────────────────────────────
const CodeExample = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animate('.code-example-anim', {
            translateY: [20, 0],
            opacity: [0, 1],
            ease: "outExpo",
            duration: 1000
          });
          if (sectionRef.current) observer.unobserve(sectionRef.current);
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="demo" className="bg-[#0e0e0e] py-24 border-b border-[#3b494b]/10 relative">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 relative z-10">
        <div className="code-example-anim opacity-0 mb-12 border border-[#34FF8C]/20 bg-[#34FF8C]/5 p-10 text-center flex flex-col items-center justify-center">
          <h3 className="font-headline font-bold text-[#34FF8C] uppercase tracking-widest text-lg mb-4">⚡ Quick Deployment Sequence</h3>
          <p className="text-[#b9cacb] font-body max-w-lg text-sm">Deploy Gateway → Configure Target → Zero Infrastructure Headaches.</p>
        </div>

        <div className="code-example-anim opacity-0 border border-[#3b494b]/30 bg-[#0a0a0a] shadow-2xl">
          <div className="flex items-center gap-2 border-b border-[#3b494b]/30 bg-[#1b1b1b]/50 px-4 py-3">
            <div className="flex space-x-1.5">
              <div className="h-2 w-2 bg-[#ffb4ab]/60" />
              <div className="h-2 w-2 bg-[#34FF8C]/60" />
              <div className="h-2 w-2 bg-[#00F0FF]/60" />
            </div>
            <span className="ml-2 font-headline text-[10px] text-[#849495] uppercase tracking-[0.2rem]">deployment_verify.sh</span>
          </div>
          <div className="p-6 md:p-8 overflow-x-auto bg-[#0e0e0e]">
            <pre className="font-mono text-xs sm:text-sm leading-relaxed text-[#b9cacb]">
<code className="text-[#849495]"># Step 1: Sign up and get your API Key</code>
<br />
<code className="text-[#849495]"># Step 2: Global installation</code>
<br />
<code className="text-[#00F0FF]">curl -sSL https://backport-io.vercel.app/install.sh | bash</code>
<br />
<br />
<code className="text-[#849495]"># Step 3: Route traffic protected</code>
<br />
<code className="text-[#34FF8C]">backport-io</code> proxy --target http://localhost:3000
<br />
<br />
<code className="text-[#34FF8C] font-bold"># DONE. PROTECTION ACTIVE.</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Testimonials ─────────────────────────────────────────────────────────────
const Testimonials = () => {
  const reviews = [
    {
      quote: "Cut our API abuse by 94% in the first week. WAF setup was smoother than I expected — no config files, no YAML hell.",
      author: "Beta Tester #1",
      initials: "BT",
      role: "Backend Engineer — API Security Project",
      stars: 5,
    },
    {
      quote: "Finally, rate limiting without writing middleware. The idempotency key feature alone saved us from a 3AM duplicate payment incident.",
      author: "Beta Tester #2",
      initials: "BT",
      role: "Indie Developer — Shipped 4 SaaS products",
      stars: 5,
    },
    {
      quote: "We tested it on our Express.js app. Pointed the URL, got an API key, and it just worked. No DevOps. No complexity.",
      author: "Beta Tester #3",
      initials: "BT",
      role: "Full Stack Developer — E-commerce Platform",
      stars: 5,
    },
  ];

  return (
    <section className="bg-black py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Loved by developers</h2>
          <p className="mt-3 text-zinc-400">Feedback from our early beta testers</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 flex flex-col"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: r.stars }).map((_, si) => (
                  <span key={si} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
              <p className="mb-6 flex-1 text-sm text-zinc-300 leading-relaxed">&ldquo;{r.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 flex-shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-sm">
                  {r.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{r.author}</p>
                  <p className="text-xs text-zinc-500">{r.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// FAQ is imported from HomeSections

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white">
      <ScrollProgress />
      <MouseGlow />
      <AnimatePresence>
        {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}
      </AnimatePresence>
      <Header onDemo={() => setShowDemo(true)} />
      <main>
        <Hero onDemo={() => setShowDemo(true)} />
        <Features />
        <CompetitorCompare />
        <ArchitectureDiagram />
        <HowItWorks />
        <WAFDemo />
        <CodeExample />
        {/* <Testimonials /> */}
        <Pricing />
        <FinalCTA onDemo={() => setShowDemo(true)} />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
