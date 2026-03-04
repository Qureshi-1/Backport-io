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
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

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
  const [reqs, setReqs] = useState(1284);
  const [hits, setHits] = useState(947);
  const [blocked, setBlocked] = useState(23);
  const [log, setLog] = useState([
    { method: "GET", path: "/api/products", ms: 0.4, type: "cache" },
    { method: "POST", path: "/api/orders", ms: 12, type: "forward" },
    { method: "GET", path: "/api/users/me", ms: 0.3, type: "cache" },
    { method: "POST", path: "/api/login", ms: 0.1, type: "waf" },
  ]);

  useEffect(() => {
    const iv = setInterval(() => {
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
      setReqs((r) => r + 1);
      if (isCached) setHits((h) => h + 1);
      if (isWaf) setBlocked((b) => b + 1);
      setLog((prev) => [entry, ...prev].slice(0, 4));
    }, 1200);
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
              Backpack Gateway
            </span>
          </div>
          <span className="text-xs text-zinc-500">live</span>
        </div>
        <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
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
    delay: 0,
    text: "# Step 1 \u2014 Sign up at localhost:3000/signup (free, no card)",
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
    text: "$ docker run -p 8080:8080 -e TARGET_URL=http://your-api.com backpack/gateway",
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
    text: "# Step 3 \u2014 Route your requests through Backpack",
    color: "text-zinc-500",
  },
  {
    delay: 5400,
    text: '$ curl -H "X-API-Key: bk_a1b2c3d4" http://localhost:8080/api/products',
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
  useEffect(() => {
    const timers = DEMO_LINES.map((l, i) =>
      setTimeout(() => setVisibleLines(i + 1), l.delay),
    );
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
            bash — backpack demo
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
            <span className="inline-block h-4 w-2 animate-pulse bg-emerald-400 translate-y-0.5" />
          )}
        </div>
        <div className="flex items-center justify-between border-t border-white/5 bg-zinc-900/40 px-6 py-4">
          <p className="text-xs text-zinc-500">
            Backpack Gateway · 3-step setup
          </p>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              onClick={onClose}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              onClick={onClose}
              className="rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-black hover:bg-emerald-400 transition-colors"
            >
              Sign Up Free →
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = ({ onDemo }: { onDemo: () => void }) => (
  <header
    suppressHydrationWarning
    className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-black/50 backdrop-blur-xl"
  >
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
      <div suppressHydrationWarning className="flex items-center gap-2">
        <ShieldCheck
          suppressHydrationWarning
          className="h-6 w-6 text-emerald-500"
        />
        <span className="text-lg font-semibold tracking-tight text-white">
          Backpack
        </span>
      </div>
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
        <a href="#features" className="hover:text-white transition-colors">
          Features
        </a>
        <a href="#how-it-works" className="hover:text-white transition-colors">
          How it Works
        </a>
        <a href="#compare" className="hover:text-white transition-colors">
          Compare
        </a>
        <a href="#pricing" className="hover:text-white transition-colors">
          Pricing
        </a>
      </nav>
      <div className="flex items-center gap-3">
        <button
          onClick={onDemo}
          className="hidden md:block text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          Demo
        </button>
        <Link
          href="/login"
          className="hidden md:block text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:scale-105 active:scale-95 transition-transform"
        >
          Start Free
        </Link>
      </div>
    </div>
  </header>
);

// ─── Hero ─────────────────────────────────────────────────────────────────────
const Hero = ({ onDemo }: { onDemo: () => void }) => (
  <section className="relative pt-28 pb-16 md:pt-36 md:pb-28 overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_100%)]" />

    <div className="mx-auto max-w-7xl px-6 relative z-10">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Left — Text */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-400 mb-8"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Backpack 1.0 is now live
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl leading-[1.08]"
          >
            Shield your
            <br />
            <TypewriterText />
            <br />
            <span className="text-white">in 30 seconds.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 max-w-lg text-lg text-zinc-400 leading-relaxed"
          >
            Add rate limiting, intelligent caching, idempotency, and WAF to any
            backend. No code changes required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-start gap-4"
          >
            <Link
              href="/signup"
              className="group flex h-12 items-center gap-2 rounded-full bg-white px-8 text-sm font-semibold text-black hover:scale-105 active:scale-95 transition-all"
            >
              Start Free{" "}
              <ArrowRight
                suppressHydrationWarning
                className="h-4 w-4 group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <button
              onClick={onDemo}
              className="flex h-12 items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/50 px-8 text-sm font-semibold text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all"
            >
              <TerminalSquare suppressHydrationWarning className="h-4 w-4" />{" "}
              Watch Demo
            </button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex items-center gap-4"
          >
            <div className="flex -space-x-2">
              {["E", "A", "S", "R"].map((l) => (
                <div
                  key={l}
                  className="h-8 w-8 rounded-full border-2 border-black bg-zinc-700 flex items-center justify-center text-xs font-bold text-white"
                >
                  {l}
                </div>
              ))}
            </div>
            <p className="text-sm text-zinc-500">
              Trusted by <span className="text-white font-medium">500+</span>{" "}
              developers
            </p>
          </motion.div>
        </div>

        {/* Right — Live Metrics Card */}
        <div className="hidden lg:flex justify-center">
          <LiveMetricsCard />
        </div>
      </div>
    </div>

    {/* Background glow */}
    <div className="pointer-events-none absolute top-0 right-0 -z-10">
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.06, 0.1, 0.06] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="h-[700px] w-[700px] rounded-full bg-emerald-500 blur-[140px]"
      />
    </div>
  </section>
);

// ─── Tech Stack ───────────────────────────────────────────────────────────────
const TechStack = () => (
  <div className="border-y border-white/5 bg-black/30 py-10">
    <div className="mx-auto max-w-7xl px-6">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-zinc-600">
        Powered by Open Source
      </p>
      <p className="mb-8 text-center text-xs text-zinc-700">
        100% MIT licensed · no vendor lock-in
      </p>
      <div className="flex flex-wrap justify-center gap-10 opacity-60 sm:gap-20">
        {[
          { icon: Server, label: "FastAPI" },
          { icon: Layers, label: "Next.js" },
          { icon: TerminalSquare, label: "Python" },
          { icon: Sparkles, label: "Antigravity" },
          { icon: Database, label: "Docker" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex cursor-default items-center gap-3 text-lg font-medium text-zinc-400 transition-colors hover:text-white"
          >
            <Icon suppressHydrationWarning className="h-5 w-5" /> {label}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Problem → Solution ────────────────────────────────────────────────────────
const ProblemSolution = () => (
  <section className="bg-black py-28">
    <div className="mx-auto max-w-7xl px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <h2 className="mb-4 text-3xl font-bold text-white sm:text-5xl">
          Your backend deserves a shield.
        </h2>
        <p className="mx-auto max-w-xl text-zinc-400">
          Without Backpack, every public API is one bad request away from a
          crisis.
        </p>
      </motion.div>
      <div className="grid gap-8 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8"
        >
          <div className="mb-6 flex items-center gap-2 font-semibold text-rose-400">
            <XCircle className="h-5 w-5" /> Without Backpack
          </div>
          <ul className="space-y-4">
            {[
              "Bots hammer your API with thousands of requests per second",
              "Same database query runs 1000× unnecessarily on hot paths",
              "SQL injection slips right past your bare endpoint",
              "Duplicate payments processed when user retries a payment",
              "Zero visibility into traffic hitting your raw server",
            ].map((p) => (
              <li
                key={p}
                className="flex items-start gap-3 text-sm text-zinc-400"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" />{" "}
                {p}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8"
        >
          <div className="mb-6 flex items-center gap-2 font-semibold text-emerald-400">
            <ShieldCheck suppressHydrationWarning className="h-5 w-5" /> With
            Backpack
          </div>
          <ul className="space-y-4">
            {[
              "Rate limiter drops abusers before they touch your code",
              "LRU cache serves repeated responses in microseconds",
              "WAF intercepts malicious payloads at the gateway layer",
              "Idempotency keys ensure each operation runs exactly once",
              "Real-time dashboard shows every request, hit, and block",
            ].map((p) => (
              <li
                key={p}
                className="flex items-start gap-3 text-sm text-zinc-300"
              >
                <CheckCircle2
                  suppressHydrationWarning
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400"
                />{" "}
                {p}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  </section>
);

// ─── Features ─────────────────────────────────────────────────────────────────
const Features = () => {
  const feats = [
    {
      title: "Zero-Knowledge Proxying",
      description:
        "Routes traffic without stripping headers or modifying payloads. Fully transparent.",
      icon: Activity,
    },
    {
      title: "Intelligent WAF",
      description:
        "Blocks SQLi and XSS before they reach your backend using deep pattern matching.",
      icon: ShieldCheck,
    },
    {
      title: "Sliding Window Rate Limit",
      description:
        "Per-IP abuse prevention via sliding window memory counters. Configurable limits.",
      icon: Lock,
    },
    {
      title: "LRU Caching",
      description:
        "Sub-millisecond GET response cache with configurable TTL to slash database load.",
      icon: Zap,
    },
    {
      title: "POST Idempotency",
      description:
        "Guarantees endpoints execute once per unique key. Safe retries, always.",
      icon: Layers,
    },
    {
      title: "Real-time Dashboard",
      description:
        "Live metrics for total requests, cache hits, and blocked threats. Zero setup.",
      icon: Server,
    },
  ];
  return (
    <section id="features" className="py-24 relative">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Everything you need. <br />
            Nothing you don't.
          </h2>
          <p className="mt-4 text-zinc-400">
            One gateway. Zero config. All the infrastructure you've been putting
            off.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {feats.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.07 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40 p-8 transition-colors hover:bg-zinc-900/80"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-zinc-800 text-emerald-400 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-500/20">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  {f.description}
                </p>
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
        No SDK. No code changes. Just point your traffic through Backpack.
      </p>
      <div className="relative grid gap-8 md:grid-cols-3">
        <div className="absolute top-8 left-[33%] right-[33%] hidden h-px bg-gradient-to-r from-emerald-500/0 via-emerald-500/40 to-emerald-500/0 md:block" />
        {[
          {
            n: "1",
            title: "Deploy Backpack",
            body: "Run the Docker image anywhere — localhost, Render, Fly, Railway. Takes under 30 seconds.",
          },
          {
            n: "2",
            title: "Set Target URL",
            body: "In the dashboard, enter your backend's internal URL. Backpack proxies all traffic through.",
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

// ─── Comparison Table ─────────────────────────────────────────────────────────
const CompareTable = () => {
  const rows = [
    {
      feature: "Deployment",
      self: "Your infrastructure",
      cloud: "Managed globally",
    },
    {
      feature: "Rate Limiting",
      self: "In-memory counters",
      cloud: "Redis cluster",
    },
    {
      feature: "Cache Storage",
      self: "In-process LRU",
      cloud: "Distributed Redis",
    },
    {
      feature: "WAF Rules",
      self: "Built-in patterns",
      cloud: "AI-enhanced rules",
    },
    { feature: "Dashboard", self: "✓", cloud: "✓ + Alerts & Logs" },
    {
      feature: "Uptime SLA",
      self: "You manage it",
      cloud: "99.99% guaranteed",
    },
    { feature: "Support", self: "Community (GitHub)", cloud: "Priority email" },
    { feature: "Price", self: "$0 forever", cloud: "$9 / month" },
  ];
  return (
    <section id="compare" className="bg-black py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-14 text-center">
          <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
            Self-Host vs Cloud Pro
          </h2>
          <p className="text-zinc-400">
            Pick what fits your scale. Switch anytime, no lock-in.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="grid grid-cols-3 bg-zinc-900/60 px-6 py-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            <span>Feature</span>
            <span className="text-center">Self-Hosted</span>
            <span className="text-center text-emerald-400">Cloud Pro</span>
          </div>
          {rows.map((r, i) => (
            <div
              key={r.feature}
              className={`grid grid-cols-3 border-t border-white/5 px-6 py-4 text-sm ${i % 2 === 0 ? "bg-zinc-900/20" : ""}`}
            >
              <span className="font-medium text-zinc-400">{r.feature}</span>
              <span className="text-center text-zinc-300">{r.self}</span>
              <span className="text-center font-medium text-emerald-300">
                {r.cloud}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Pricing ─────────────────────────────────────────────────────────────────
const Pricing = () => (
  <section id="pricing" className="border-t border-white/5 bg-zinc-950 py-24">
    <div className="mx-auto max-w-7xl px-6">
      <div className="mb-16 text-center">
        <h2 className="mb-3 text-3xl font-bold text-white sm:text-5xl">
          Simple pricing
        </h2>
        <p className="text-zinc-400">Start free. No credit card required.</p>
      </div>
      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
        {/* Free */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/30 p-8 backdrop-blur-sm">
          <h3 className="mb-2 text-2xl font-semibold text-white">
            Self-Hosted
          </h3>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">$0</span>
            <span className="text-zinc-500">/forever</span>
          </div>
          <p className="mb-6 border-b border-white/10 pb-6 text-sm text-zinc-500">
            For developers who love owning their stack.
          </p>
          <ul className="mb-8 space-y-3">
            {[
              "Unlimited Requests",
              "Basic WAF patterns",
              "In-memory LRU Cache",
              "Community support (GitHub)",
            ].map((f) => (
              <li
                key={f}
                className="flex items-center gap-3 text-sm text-zinc-300"
              >
                <CheckCircle2
                  suppressHydrationWarning
                  className="h-4 w-4 flex-shrink-0 text-emerald-500"
                />{" "}
                {f}
              </li>
            ))}
          </ul>
          <a
            href="https://github.com/Qureshi-1/Backpack-io"
            target="_blank"
            className="block w-full rounded-xl bg-white/10 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            View on GitHub
          </a>
        </div>
        {/* Pro */}
        <div className="relative rounded-3xl border border-emerald-500/50 bg-black p-8 shadow-[0_0_60px_-20px_rgba(16,185,129,0.4)]">
          <div className="absolute right-8 top-0 -translate-y-1/2">
            <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-black">
              Most Popular
            </span>
          </div>
          <h3 className="mb-2 text-2xl font-semibold text-white">Cloud Pro</h3>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">$9</span>
            <span className="text-zinc-500">/month</span>
          </div>
          <p className="mb-6 border-b border-white/10 pb-6 text-sm text-zinc-500">
            For teams who want it managed globally.
          </p>
          <ul className="mb-8 space-y-3">
            {[
              "Everything in Free",
              "Redis Distributed Cache",
              "AI-enhanced WAF rules",
              "99.99% Uptime SLA",
              "Priority email support",
            ].map((f) => (
              <li
                key={f}
                className="flex items-center gap-3 text-sm text-zinc-300"
              >
                <CheckCircle2
                  suppressHydrationWarning
                  className="h-4 w-4 flex-shrink-0 text-emerald-400"
                />{" "}
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard"
            className="block w-full rounded-xl bg-emerald-500 py-3 text-center text-sm font-semibold text-black transition-colors hover:bg-emerald-400"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  </section>
);

// ─── Final CTA ────────────────────────────────────────────────────────────────
const FinalCTA = ({ onDemo }: { onDemo: () => void }) => (
  <section className="relative overflow-hidden bg-black py-32">
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="h-[300px] w-[700px] rounded-full bg-emerald-500/10 blur-[120px]" />
    </div>
    <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-6xl">
          Your backend is one gateway <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            away from production-ready.
          </span>
        </h2>
        <p className="mb-10 text-lg text-zinc-400">
          Join developers shipping with confidence. Free to start. No credit
          card required.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/dashboard"
            className="group flex h-14 items-center gap-2 rounded-full bg-white px-10 text-base font-semibold text-black transition-transform hover:scale-105 active:scale-95"
          >
            Start Free Now{" "}
            <ArrowRight
              suppressHydrationWarning
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
            />
          </Link>
          <button
            onClick={onDemo}
            className="flex h-14 items-center gap-2 rounded-full border border-zinc-700 px-8 text-base font-semibold text-white transition-colors hover:bg-zinc-900"
          >
            <TerminalSquare suppressHydrationWarning className="h-4 w-4" /> See
            the Demo
          </button>
        </div>
      </motion.div>
    </div>
  </section>
);

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="border-t border-white/10 bg-black pb-8 pt-16">
    <div className="mx-auto mb-12 grid max-w-7xl gap-10 px-6 md:grid-cols-4">
      <div>
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck
            suppressHydrationWarning
            className="h-5 w-5 text-emerald-500"
          />
          <span className="text-base font-semibold text-white">Backpack</span>
        </div>
        <p className="text-sm leading-relaxed text-zinc-500">
          Zero-code API gateway. Security and speed for every backend.
        </p>
      </div>
      {[
        {
          title: "Product",
          links: ["Features", "Pricing", "Changelog", "Roadmap"],
        },
        {
          title: "Developers",
          links: ["Documentation", "GitHub", "Docker Hub", "API Reference"],
        },
        {
          title: "Company",
          links: ["About", "Blog", "Open Source", "Contact"],
        },
      ].map((col) => (
        <div key={col.title}>
          <p className="mb-4 text-sm font-semibold text-white">{col.title}</p>
          <ul className="space-y-2">
            {col.links.map((l) => (
              <li key={l}>
                <a
                  href="#"
                  className="text-sm text-zinc-500 transition-colors hover:text-white"
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/5 px-6 pt-8 md:flex-row">
      <p className="text-xs text-zinc-600">
        &copy; {new Date().getFullYear()} Backpack.io · MIT License
      </p>
      <p className="text-xs text-zinc-600">
        Built with ❤️ using FastAPI + Next.js + Docker
      </p>
    </div>
  </footer>
);

// ─── Floating Badge ───────────────────────────────────────────────────────────
const Badge = () => (
  <a
    href="https://antigravity.google"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-zinc-800 bg-black/80 px-4 py-2 text-xs font-medium text-zinc-400 backdrop-blur-md transition-all hover:border-zinc-600 hover:text-white"
  >
    <div className="h-2 w-2 animate-pulse rounded-full bg-gradient-to-r from-purple-500 to-emerald-500" />
    Made with Antigravity
  </a>
);

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
        <TechStack />
        <ProblemSolution />
        <Features />
        <HowItWorks />
        <CompareTable />
        <Pricing />
        <FinalCTA onDemo={() => setShowDemo(true)} />
      </main>
      <Footer />
      <Badge />
    </div>
  );
}
