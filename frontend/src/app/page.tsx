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

  const HERO_COMMAND = "curl -sSL https://backport-io.vercel.app/install.sh | bash";

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#0e0e0e] pt-28 pb-16">
      <div className="absolute inset-0 z-0 opacity-80">
        <HeroScene />
      </div>
      <div className="absolute inset-0 bg-cyber-grid opacity-60 z-0 pointer-events-none" />
      <div className="absolute inset-0 scanline-bg opacity-30 z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,240,255,0.18),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(52,255,140,0.16),transparent_26%),linear-gradient(90deg,rgba(14,14,14,0.98)_0%,rgba(14,14,14,0.82)_48%,rgba(14,14,14,0.58)_100%)] z-0 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-12">
          
          <div className="relative overflow-hidden border border-[#3b494b]/20 bg-[#0a0a0a]/82 p-8 shadow-[0_24px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10 lg:p-12">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00F0FF]/80 to-transparent" />
            <div className="absolute -left-16 top-16 h-40 w-40 rounded-full bg-[#00F0FF]/10 blur-3xl" />
            <div className="absolute bottom-10 right-0 h-32 w-32 rounded-full bg-[#34FF8C]/10 blur-3xl" />

            <div className="relative flex flex-col gap-8">
            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-3 border border-[#34FF8C]/20 bg-[#34FF8C]/8 px-4 py-2 font-headline text-[10px] font-bold uppercase tracking-[0.35rem] text-[#34FF8C]"
              >
                <div className="h-2 w-2 rounded-full bg-[#34FF8C] pulse-glow" />
                System status: optimized // v4.1.0-stable
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="font-headline text-5xl font-bold leading-[0.94] tracking-[-0.06em] text-[#f3f7f7] sm:text-6xl lg:text-[6.4rem]"
              >
                Turn every{" "}
                <span className="text-[#00F0FF] text-glow-cyan">
                  API edge
                </span>
                <br />
                into a live{" "}
                <span className="inline-block min-w-[210px] text-[#34FF8C] text-glow-green">
                  <TypewriterText />
                </span>
                <br />
                shield in 30 seconds
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="max-w-2xl font-body text-lg leading-relaxed text-[#b9cacb] sm:text-xl"
            >
              Backport turns rate limiting, cache orchestration, WAF filtering, and
              idempotency into one cinematic edge control plane. Point traffic at the
              gateway, ship policies live, and keep product velocity high without
              slowing the stack.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.8 }}
              className="grid gap-4 border border-white/10 bg-white/[0.03] p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-2 font-headline text-[10px] uppercase tracking-[0.28rem] text-[#849495]">
                  <TerminalSquare suppressHydrationWarning className="h-3.5 w-3.5 text-[#00F0FF]" />
                  One-command edge deploy
                </div>
                <code className="block overflow-x-auto whitespace-nowrap font-mono text-sm text-[#00F0FF] sm:text-[15px]">
                  {HERO_COMMAND}
                </code>
                <p className="font-body text-sm text-[#849495]">
                  No SDK. No middleware swap. No rewrite sprint before launch.
                </p>
              </div>

              <button
                onClick={() => navigator.clipboard.writeText(HERO_COMMAND)}
                className="inline-flex h-12 items-center justify-center gap-2 border border-[#00F0FF]/25 bg-[#00F0FF]/8 px-5 font-headline text-[10px] uppercase tracking-[0.28rem] text-[#dffeff] transition-colors hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/14"
                title="Copy install command"
              >
                Copy
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex flex-col gap-4 sm:flex-row"
            >
              <Link
                href={isLogged ? "/dashboard" : "/auth/signup"}
                className="group inline-flex min-h-[60px] items-center justify-center gap-3 bg-[#00F0FF] px-8 font-headline text-sm font-extrabold uppercase tracking-[0.28rem] text-[#003338] transition-all duration-300 hover:bg-[#34FF8C] hover:shadow-[0_0_40px_rgba(52,255,140,0.35)] active:scale-[0.98]"
              >
                {isLogged ? "Open dashboard" : "Start free"}
                <ArrowRight suppressHydrationWarning className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Install Script — Award Winning Interaction */}
              <div 
                onClick={() => {
                  navigator.clipboard.writeText("curl -sSL https://backport-io.vercel.app/install.sh | bash");
                  const el = document.getElementById('copy-hint');
                  if (el) el.innerText = 'COPIED TO CLIPBOARD';
                  setTimeout(() => { if (el) el.innerText = 'CLICK TO COPY INSTALL SCRIPT'; }, 2000);
                }}
                className="w-full sm:w-auto bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/10 px-8 py-5 font-mono text-xs group cursor-pointer hover:border-[#00F0FF]/60 transition-all relative overflow-hidden monolith-card shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00F0FF]/80 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 opacity-20" />
                <div className="flex flex-col gap-2 relative z-10">
                  <span id="copy-hint" className="text-[8px] text-[#00F0FF] tracking-[0.4em] font-black uppercase opacity-70 group-hover:opacity-100 transition-opacity">CLICK TO COPY INSTALL SCRIPT</span>
                  <div className="flex items-center gap-4">
                    <span className="text-[#34FF8C] font-black animate-pulse">$</span>
                    <code className="text-white font-medium opacity-100">curl -sSL https://backport-io.vercel.app/install.sh | bash</code>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Verification Strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-6 pt-6"
            >
              <HeroStarButton />
              <div className="h-px w-10 bg-white/10" />
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-[#0e0e0e] bg-zinc-900 border-zinc-800 flex items-center justify-center text-[8px] font-black text-white overflow-hidden shadow-xl">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} alt="User" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <span className="text-[10px] font-headline uppercase tracking-[0.3em] text-zinc-500 font-black">ACTIVE ON 5.8K+ ENDPOINTS</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Layer — Live Telemetry Panel */}
        <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 80 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block w-full lg:w-[480px] perspective-2000"
          >
            <div className="absolute -inset-32 bg-[#00F0FF]/15 blur-[140px] rounded-full pointer-events-none opacity-40 animate-pulse" />
            <div className="relative transform-gpu transition-all duration-700 hover:rotate-y-[-8deg] hover:rotate-x-[4deg]">
              <LiveMetricsCard />
            </div>
            
            {/* Tech Specs */}
            <div className="absolute -bottom-12 left-0 font-mono text-[10px] text-zinc-600 tracking-[0.6em] uppercase flex flex-col gap-1 pointer-events-none">
              <span>LATENCY_SYNC: OK (0.2MS)</span>
              <span>WAF_CORE: ARMED_V4</span>
            </div>
          </motion.div>
        </div>

        {/* Global Infrastructure Display */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          viewport={{ once: true }}
          className="w-full mt-36 border border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent backdrop-blur-3xl py-16 px-12 grid grid-cols-2 lg:grid-cols-4 gap-12 relative overflow-hidden monolith-card shadow-2xl"
        >
          {/* Edge Scanline */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF]/60 to-transparent shadow-[0_0_30px_rgba(0,240,255,0.5)] animate-scan-fast" />

          {[
            { value: "100M+", label: "THROUGHPUT / DAY", color: "text-white" },
            { value: "50+", label: "GLOBAL EDGE POPS", color: "text-[#00F0FF]" },
            { value: "<1ms", label: "OVERHEAD LATENCY", color: "text-[#34FF8C]" },
            { value: "99.9%", label: "UPTIME ACCURACY", color: "text-zinc-600" },
          ].map((stat, idx) => (
            <div key={stat.label} className={`space-y-4 ${idx !== 0 ? "lg:border-l lg:border-white/5 lg:pl-12" : ""}`}>
              <h4 className={`text-6xl md:text-7xl font-headline font-black tracking-tighter ${stat.color} drop-shadow-[0_0_20px_rgba(255,255,255,0.08)]`}>
                {stat.value}
              </h4>
              <p className="text-[10px] font-headline uppercase tracking-[0.5em] text-zinc-500 font-black">{stat.label}</p>
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
                <>Scanning System... <div className="h-3 w-3 border-2 border-[#003338] border-t-transparent animate-spin rounded-full" /></>
              ) : (
                <>Run Security Check <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            {/* Results */}
            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`waf-result-anim p-5 border-l-4 ${result.blocked ? "bg-rose-500/10 border-rose-500" : "bg-emerald-500/10 border-emerald-500"}`}
                >
                  <div className="flex items-start gap-4">
                    {result.blocked ? <XCircle className="w-6 h-6 text-rose-500 shrink-0" /> : <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />}
                    <div>
                      <h4 className={`font-headline font-black uppercase text-sm ${result.blocked ? "text-rose-400" : "text-emerald-400"}`}>
                        {result.blocked ? `THREAT DETECTED [CODE ${result.code}]` : "CLEAN REQUEST [FORWARDING]"}
                      </h4>
                      <p className="text-xs text-[#b9cacb] mt-1 font-mono tracking-tight">{result.reason}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function Home() {
  const [showDemo, setShowDemo] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (this: HTMLAnchorElement, e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href')!);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#0e0e0e] text-[#f3f7f7] selection:bg-[#00F0FF] selection:text-[#003338]">
      <ScrollProgress />
      <MouseGlow />
      <Header />
      
      <AnimatePresence>
        {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}
      </AnimatePresence>

      <article className="relative">
        <Hero onDemo={() => setShowDemo(true)} />
        <Features />
        <WAFDemo />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <FinalCTA onDemo={() => setShowDemo(true)} />
      </article>

      <Footer />
    </main>
  );
}
