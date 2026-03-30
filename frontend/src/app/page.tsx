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
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { auth } from "@/lib/auth";
import { Pricing, FinalCTA, FAQ } from "@/components/HomeSections";

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
  const [log, setLog] = useState([
    { method: "GET", path: "/api/products", ms: 0.4, type: "cache" },
    { method: "POST", path: "/api/orders", ms: 12, type: "forward" },
    { method: "GET", path: "/api/users/me", ms: 0.3, type: "cache" },
    { method: "POST", path: "/api/login", ms: 0.1, type: "waf" },
  ]);

  useEffect(() => {
    const iv = setInterval(() => {
      const burst = Math.floor(Math.random() * 8) + 1; // Add 1 to 8 requests per half-second
      
      const isWaf = Math.random() < 0.1;
      const isCached = !isWaf && Math.random() < 0.7;
      const method = METHODS[Math.floor(Math.random() * METHODS.length)];
      const path = PATHS[Math.floor(Math.random() * PATHS.length)];
      const ms = isWaf
        ? 0.1
        : isCached
          ? +(Math.random() * 0.5 + 0.1).toFixed(1)
          : +(Math.random() * 18 + 4).toFixed(0);
      const entry = {
        method,
        path,
        ms,
        type: isWaf ? "waf" : isCached ? "cache" : "forward",
      };
      
      setReqs((r) => r + burst);
      setHits((h) => h + (isCached ? burst : 0));
      setBlocked((b) => b + (isWaf ? 1 : 0));
      setLog((prev) => [entry, ...prev].slice(0, 4));
    }, 400); // Super fast 400ms updates
    return () => clearInterval(iv);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.6, type: "spring", stiffness: 120 }}
      className="relative w-full max-w-sm mx-auto"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-white/5 bg-zinc-900/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-white">
              Backport Gateway
            </span>
          </div>
          <span className="text-xs text-zinc-500">live</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/5 border-b border-white/5">
          {[
            {
              label: "Requests",
              value: reqs.toLocaleString(),
              color: "text-white",
            },
            {
              label: "Cached",
              value: hits.toLocaleString(),
              color: "text-emerald-400",
            },
            {
              label: "Blocked",
              value: String(blocked),
              color: "text-rose-400",
            },
          ].map((s) => (
            <div key={s.label} className="px-3 py-3 text-center">
              <p className={`text-lg font-bold tabular-nums ${s.color}`}>
                {s.value}
              </p>
              <p className="text-[10px] text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="p-3 space-y-1.5 min-h-[130px]">
          <AnimatePresence initial={false}>
            {log.map((entry, i) => (
              <motion.div
                key={`${entry.path}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-2.5 py-1.5"
              >
                <span
                  className={`text-[10px] font-mono font-bold ${entry.method === "GET" ? "text-cyan-400" : "text-purple-400"}`}
                >
                  {entry.method}
                </span>
                <span className="flex-1 truncate text-[10px] font-mono text-zinc-400">
                  {entry.path}
                </span>
                <span
                  className={`text-[10px] font-mono ${entry.type === "waf" ? "text-rose-400" : entry.type === "cache" ? "text-emerald-400" : "text-zinc-400"}`}
                >
                  {entry.type === "waf"
                    ? "🛡 blocked"
                    : entry.type === "cache"
                      ? `⚡${entry.ms}ms`
                      : `${entry.ms}ms`}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
      <div className="absolute -inset-4 -z-10 bg-emerald-500/10 blur-2xl rounded-full" />
    </motion.div>
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
                  <code className="text-[#00dbe9]">npx backport-io init</code>
                  <button
                    onClick={() => navigator.clipboard.writeText("npx backport-io init")}
                    className="text-[#849495] hover:text-[#00F0FF] transition-colors"
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
  const cards = [
    { icon: ShieldCheck, title: "WAF Engine", desc: "L7 dynamic shielding. SQLi, XSS, Path Traversal blocked in real-time.", col: "md:col-span-2", accent: "#00F0FF" },
    { icon: Zap, title: "Smart Cache", desc: "LRU cache. Sub-ms responses. 99.9% hit rate.", col: "md:col-span-1", accent: "#34FF8C" },
    { icon: Lock, title: "Rate Limiting", desc: "Sliding window throttling per IP, per API key.", col: "md:col-span-1", accent: "#00dbe9" },
    { icon: Database, title: "Idempotency", desc: "Replay protection for financial & stateful APIs.", col: "md:col-span-1", accent: "#00F0FF" },
    { icon: Server, title: "Multi-Env Deploy", desc: "Docker. Render. Fly. Railway. Any cloud.", col: "md:col-span-2", accent: "#34FF8C" },
  ];
  return (
    <section id="features" className="py-24 relative bg-[#0e0e0e] border-y border-[#3b494b]/10">
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
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className={`${card.col} bg-[#0e0e0e] border border-[#3b494b]/15 p-10 flex flex-col justify-between min-h-[220px] monolith-card hover:border-[#00F0FF]/20 transition-colors group`}
            >
              <card.icon suppressHydrationWarning className="w-10 h-10 mb-6" style={{ color: card.accent }} />
              <div>
                <h3 className="text-xl font-headline font-bold uppercase text-white mb-3">{card.title}</h3>
                <p className="text-sm text-[#b9cacb] leading-relaxed">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── How it Works ─────────────────────────────────────────────────────────────
const HowItWorks = () => (
  <section
    id="how-it-works"
    className="border-y border-white/5 bg-zinc-950 py-24"
  >
    <div className="mx-auto max-w-7xl px-6 text-center">
      <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Up and running in 3 steps.
      </h2>
      <p className="mx-auto mb-16 max-w-lg text-zinc-400">
        No SDK. No code changes. Just point your traffic through Backport.
      </p>
      <div className="relative grid gap-8 md:grid-cols-3">
        <div className="absolute top-8 left-[33%] right-[33%] hidden h-px bg-gradient-to-r from-emerald-500/0 via-emerald-500/40 to-emerald-500/0 md:block" />
        {[
          {
            n: "1",
            title: "Multi-Environment",
            body: "Run the Docker image anywhere — Render, Fly, Railway, AWS. Takes under 30 seconds.",
          },
          {
            n: "2",
            title: "Set Target URL",
            body: "In the dashboard, enter your backend's internal URL. Backport proxies all traffic through.",
          },
          {
            n: "3",
            title: "Watch it Work",
            body: "Real-time metrics flow in. Cache hits rise. Threats blocked. Your backend stays clean.",
          },
        ].map((s) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xl font-bold text-emerald-400">
              {s.n}
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">{s.title}</h3>
            <p className="text-sm text-zinc-400">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
// ─── WAF Live Demo ────────────────────────────────────────────────────────────
const WAFDemo = () => {
  const [input, setInput] = useState("SELECT * FROM users WHERE id=1");
  const [result, setResult] = useState<null | { blocked: boolean; reason: string; code: number }>(null);
  const [testing, setTesting] = useState(false);

  const presets = [
    { label: "SQL Injection", value: "'; DROP TABLE users;--" },
    { label: "XSS Attack", value: "<script>alert('xss')</script>" },
    { label: "Normal Request", value: "/api/users?page=1&limit=10" },
    { label: "Path Traversal", value: "../../../etc/passwd" },
  ];

  const checkWAF = () => {
    setTesting(true);
    setResult(null);
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
    <section className="bg-zinc-950 py-24 border-y border-white/5">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live WAF Demo
          </span>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">See the WAF in action</h2>
          <p className="mt-3 text-zinc-400">Type any request payload. Backport's WAF engine analyzes it in real-time.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black overflow-hidden shadow-2xl">
          {/* Terminal header */}
          <div className="flex items-center gap-2 border-b border-white/10 bg-zinc-900/60 px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="ml-2 text-xs text-zinc-500 font-mono">backport-waf-engine v1.0</span>
          </div>

          <div className="p-6 space-y-4">
            {/* Preset buttons */}
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setInput(p.value); setResult(null); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors font-mono"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="relative">
              <label className="block text-xs text-zinc-500 mb-2 font-mono">REQUEST_PAYLOAD</label>
              <input
                value={input}
                onChange={(e) => { setInput(e.target.value); setResult(null); }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Enter a request payload to test..."
              />
            </div>

            {/* Test button */}
            <button
              onClick={checkWAF}
              disabled={testing || !input.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {testing ? (
                <><span className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Analyzing...</>
              ) : (
                <><Shield className="h-4 w-4" /> Analyze with WAF</>
              )}
            </button>

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`rounded-xl border p-4 font-mono text-sm ${
                    result.blocked
                      ? "border-red-500/30 bg-red-500/10 text-red-400"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {result.blocked ? (
                      <XCircle className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="font-bold">HTTP {result.code} — {result.blocked ? "BLOCKED" : "ALLOWED"}</span>
                  </div>
                  <p className="text-xs opacity-80 ml-6">{result.reason}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};


// ─── Pricing ─────────────────────────────────────────────────────────────────
const Pricing = () => {
  const [isYearly, setIsYearly] = useState(true);
  const plans = [
    {
      name: "STEALTH",
      sub: "Free forever",
      price: "$0",
      period: "",
      desc: "For indie devs and students. No credit card required.",
      features: ["50,000 Requests / month", "Basic WAF", "1 API Gateway", "Redis Cache", "Community support"],
      cta: "Deploy Now",
      href: "/auth/signup",
      accent: "#00F0FF",
      hot: false,
    },
    {
      name: "CLOUD PRO",
      sub: isYearly ? "Billed $468/yr · Save $117" : "Billed monthly",
      price: isYearly ? "$39" : "$49",
      period: "/mo",
      desc: "For teams shipping at scale.",
      features: ["1,000,000 Requests / month", "AI-enhanced WAF", "Up to 10 Gateways", "Distributed Redis", "Priority support"],
      cta: "Get Cloud Pro",
      href: "/auth/signup?plan=cloud_pro",
      accent: "#34FF8C",
      hot: true,
    },
    {
      name: "ENTERPRISE",
      sub: "Custom terms",
      price: "Custom",
      period: "",
      desc: "Dedicated VPC. Unlimited gateways.",
      features: ["Unlimited volume", "Custom rate limits", "Unlimited gateways", "Dedicated VPC", "24/7 phone support"],
      cta: "Contact Sales",
      href: "mailto:support@backportio.com",
      accent: "#849495",
      hot: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-[#0e0e0e] border-t border-[#3b494b]/10">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-16">
          <span className="text-[#00F0FF] font-headline text-[10px] uppercase tracking-[0.3rem] font-bold block mb-3">PRICING MATRIX</span>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter uppercase text-[#e2e2e2]">Access <span className="text-[#34FF8C]">Tiers</span></h2>
            {/* Toggle */}
            <div className="flex items-center gap-4">
              <span className={`font-headline text-[11px] uppercase tracking-widest ${!isYearly ? 'text-white' : 'text-[#849495]'}`}>Monthly</span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative w-14 h-7 transition-colors ${isYearly ? 'bg-[#34FF8C]' : 'bg-[#353535]'}`}
              >
                <span className={`absolute top-1 w-5 h-5 bg-[#0e0e0e] transition-all ${isYearly ? 'left-8' : 'left-1'}`} />
              </button>
              <span className={`font-headline text-[11px] uppercase tracking-widest ${isYearly ? 'text-[#34FF8C]' : 'text-[#849495]'}`}>
                Yearly <span className="text-[#34FF8C] text-[9px] ml-1">-20%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#3b494b]/15">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative flex flex-col p-10 bg-[#0e0e0e] ${
                plan.hot ? 'bg-[#111111]' : ''
              }`}
            >
              {plan.hot && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#34FF8C] shadow-[0_0_10px_#34FF8C]" />
              )}
              <div className="mb-8">
                <div className="text-[10px] font-headline uppercase tracking-[0.3rem] mb-1" style={{ color: plan.accent }}>{plan.name}</div>
                <div className="text-[10px] font-headline uppercase tracking-widest text-[#849495]">{plan.sub}</div>
              </div>
              <div className="mb-8">
                <span className="font-headline text-5xl font-bold text-white">{plan.price}</span>
                <span className="font-headline text-sm text-[#849495] ml-1">{plan.period}</span>
              </div>
              <p className="text-sm text-[#849495] mb-8 border-b border-[#3b494b]/20 pb-8">{plan.desc}</p>
              <ul className="space-y-3 mb-10 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-[#b9cacb]">
                    <CheckCircle2 suppressHydrationWarning className="h-4 w-4 flex-shrink-0" style={{ color: plan.accent }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`block w-full py-4 text-center font-headline text-[11px] uppercase tracking-[0.2rem] font-bold transition-all ${
                  plan.hot
                    ? 'bg-[#34FF8C] text-[#0e0e0e] hover:bg-[#00F0FF]'
                    : 'border border-[#3b494b]/30 text-[#e2e2e2] hover:border-[#00F0FF]/40 hover:text-[#00F0FF]'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Refer & Earn Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 border border-[#34FF8C]/15 bg-[#34FF8C]/5 p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 border border-[#34FF8C]/30 flex items-center justify-center">
              <Gift suppressHydrationWarning className="w-6 h-6 text-[#34FF8C]" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-white uppercase tracking-wider">Refer &amp; Earn</h3>
              <p className="text-sm text-[#849495] mt-1">Invite friends. Get 1 month Cloud Pro FREE per referral.</p>
            </div>
          </div>
          <Link
            href="/auth/signup?next=/dashboard/billing"
            className="flex items-center gap-2 bg-[#34FF8C] text-[#0e0e0e] px-8 py-3 font-headline uppercase text-[11px] tracking-[0.2rem] font-bold hover:bg-[#00F0FF] transition-colors whitespace-nowrap"
          >
            Get Referral Link <ArrowRight suppressHydrationWarning className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
// (Footer is imported from @/components/Footer)

// ─── Floating Badge ───────────────────────────────────────────────────────────
const Badge = () => null;

// ─── Competitor Compare ───────────────────────────────────────────────────────
const CompetitorCompare = () => {
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
    <section className="bg-zinc-950 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-14 text-center">
          <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
            Why Backport?
          </h2>
          <p className="text-zinc-400">
            Compare with the industry alternatives
          </p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="border-b border-white/10 bg-zinc-900/50 text-xs uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Feature</th>
                <th className="px-6 py-4 font-semibold text-emerald-400">Backport</th>
                <th className="px-6 py-4 font-semibold">Kong</th>
                <th className="px-6 py-4 font-semibold">Cloudflare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r, i) => (
                <tr key={r.feature} className="transition-colors hover:bg-zinc-900/30">
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-zinc-300">
                    {r.feature}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-semibold text-emerald-300 flex items-center gap-2">
                    {r.bpWin && <CheckCircle2 className="h-4 w-4 text-emerald-500" />} {r.backport}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-zinc-500">
                    {r.kong}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-zinc-500">
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
const ArchitectureDiagram = () => (
  <section className="bg-black py-24 hidden sm:block">
    <div className="mx-auto max-w-5xl px-6">
      <div className="mb-16 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">
          How Backport Works
        </h2>
        <p className="text-zinc-400">
          Zero code changes to your existing backend
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4">
        {/* Client */}
        <div className="flex flex-col items-center justify-center w-48 h-32 rounded-2xl border border-emerald-500/20 bg-zinc-900 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
          <span className="text-white font-medium mb-2 relative z-10">Your Client</span>
          <span className="text-xs text-zinc-500 font-mono relative z-10">Mobile / Web / CLI</span>
        </div>

        {/* Arrow */}
        <div className="hidden md:flex items-center text-emerald-500 -mx-2">
          <div className="h-px w-8 sm:w-16 bg-emerald-500/50"></div>
          <ArrowRight className="h-5 w-5 -ml-1" />
        </div>

        {/* Gateway */}
        <div className="flex flex-col items-center justify-center w-64 h-auto py-6 rounded-2xl border-2 border-emerald-500 bg-black shadow-[0_0_30px_rgba(0,255,135,0.15)] z-10 relative">
          <div className="absolute -top-3 bg-black px-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
            Backport Gateway
          </div>
          <p className="text-sm text-emerald-300 font-medium mb-2">Rate Limit</p>
          <div className="text-emerald-500/30 mb-2">+</div>
          <p className="text-sm text-emerald-300 font-medium mb-2">WAF & Cache</p>
          <div className="text-emerald-500/30 mb-2">+</div>
          <p className="text-sm text-emerald-300 font-medium">Idempotency</p>
        </div>

        {/* Arrow */}
        <div className="hidden md:flex items-center text-zinc-500 -mx-2">
          <div className="h-px w-8 sm:w-16 bg-white/20"></div>
          <ArrowRight className="h-5 w-5 -ml-1 text-white/50" />
        </div>

        {/* Backend */}
        <div className="flex flex-col items-center justify-center w-48 h-32 rounded-2xl border border-emerald-500/20 bg-zinc-900 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
          <span className="text-white font-medium mb-2 relative z-10">Your Backend</span>
          <span className="text-xs text-zinc-500 font-mono relative z-10">Express / FastAPI / etc</span>
        </div>
      </div>
    </div>
  </section>
);

// ─── Code Example ───────────────────────────────────────────────────────────
const CodeExample = () => (
  <section id="demo" className="bg-black py-16 md:py-24 border-y border-white/5">
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      <div className="mb-12 rounded-2xl border-2 border-dashed border-emerald-500/20 bg-emerald-500/5 p-10 text-center flex flex-col items-center justify-center">
        <h3 className="text-xl font-bold text-emerald-400 mb-2">⚡ Simple 3-Step Setup</h3>
        <p className="text-zinc-400">Deploy Gateway → Add Target URL → Zero Code Changes in Backend.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/5 bg-zinc-900/80 px-4 py-3">
          <div className="h-3 w-3 rounded-full bg-rose-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 font-mono text-xs text-zinc-500">
            quickstart.sh
          </span>
        </div>
        <div className="p-4 sm:p-8 overflow-x-auto">
          <pre className="font-mono text-xs sm:text-sm leading-relaxed text-zinc-300">
<code className="text-zinc-500"># Step 1: Sign up and get API key</code>
<br />
<code className="text-zinc-500"># Step 2: Set your target backend URL in dashboard</code>
<br />
<code className="text-zinc-500"># Step 3: Route traffic through Backport</code>
<br />
<code className="text-emerald-400">curl</code> -X GET https://backport-io.vercel.app/api/proxy/users \
  -H <code className="text-emerald-300">"X-API-Key: bk_YOUR_API_KEY"</code>
<br />
<code className="text-emerald-500 font-bold"># That's it! Your backend is now protected.</code>
          </pre>
        </div>
      </div>
    </div>
  </section>
);

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

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQ = () => {
  const faqs = [
    {
      q: "Does Backport store my API request data?",
      a: "No. Traffic is inspected in-memory only. Logs are opt-in.",
    },
    {
      q: "What happens if Backport goes down?",
      a: "Cloud instances have 99.9% uptime SLA and run in a highly available setup.",
    },
    {
      q: "Can I migrate away easily?",
      a: "Yes. Backport is a reverse proxy. Remove it and your backend works unchanged.",
    },
    {
      q: "Is there a free tier?",
      a: "Yes! Forever-free Hobby plan for up to 10,000 requests/month. No credit card required.",
    },
    {
      q: "Does it work with my existing backend?",
      a: "Yes. Works with Express, FastAPI, Django, Laravel, Rails, Go Gin — any HTTP backend. Zero code changes.",
    },
    {
      q: "How does billing and overage work?",
      a: "If you hit your plan's request limit, new requests will return HTTP 429 (Too Many Requests) until the next billing cycle. You can upgrade your plan anytime from the dashboard to avoid disruption.",
    },
    {
      q: "Can I switch between plans easily?",
      a: "Yes. Upgrades take effect immediately. Downgrades take effect at the start of your next billing cycle. Manage everything from the Billing section of your dashboard.",
    },
  ];

  return (
    <section className="bg-black py-24 border-t border-white/5">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="mb-12 text-center text-3xl font-bold text-white sm:text-4xl">
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-white/10 bg-zinc-900/30 p-6 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between text-lg font-medium text-white">
                {faq.q}
                <span className="ml-4 flex-shrink-0 text-emerald-500 transition-transform group-open:rotate-45">
                  <X className="h-5 w-5 rotate-45" />
                </span>
              </summary>
              <p className="mt-4 text-zinc-400 leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

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
