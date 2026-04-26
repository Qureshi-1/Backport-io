"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Zap, Shield, Activity, ArrowRight, Check,
  Terminal, Lock, Code2,
  ChevronDown, Database,
  Copy, CheckCircle2,
  Users, Globe, Server,
  Ban, Eye, X, Loader2,
} from "lucide-react";

// Github icon inline SVG (lucide-react v1 removed Github icon)
const GithubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PRICING, detectUserCurrency, formatPrice, ALL_CURRENCIES, type CurrencyCode } from "@/lib/currency";

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionBadge({ children, color = "#04e184" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-block text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] mb-5 px-4 py-1.5 rounded-full border"
      style={{
        color: color,
        borderColor: `${color}30`,
        backgroundColor: `${color}08`,
      }}
    >
      {children}
    </span>
  );
}

function SectionHeading({
  title,
  subtitle,
  delay = 0,
}: {
  title: React.ReactNode;
  subtitle?: string;
  delay?: number;
}) {
  return (
    <FadeIn className="text-center mb-14 sm:mb-16" delay={delay}>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="max-w-2xl mx-auto text-[#A2BDDB]/50 text-base sm:text-lg leading-relaxed">
          {subtitle}
        </p>
      )}
    </FadeIn>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERACTIVE WAF DEMO
// ═══════════════════════════════════════════════════════════════════════════════

const DEMO_ATTACKS = [
  {
    id: "sqli",
    label: "SQL Injection",
    method: "GET" as const,
    path: "/api/users?id=1' OR '1'='1' --",
    explanation: "Attempt to extract all user records by injecting SQL into the query parameter.",
    blocked: true,
    wafRule: "SQL Injection Pattern Detected",
    responseCode: 403,
    responseTime: "3ms",
  },
  {
    id: "xss",
    label: "Cross-Site Scripting",
    method: "GET" as const,
    path: "/api/search?q=<script>document.cookie</script>",
    explanation: "Attempt to inject malicious JavaScript that would steal session cookies from other users.",
    blocked: true,
    wafRule: "XSS Pattern Detected",
    responseCode: 403,
    responseTime: "2ms",
  },
  {
    id: "path-traversal",
    label: "Path Traversal",
    method: "GET" as const,
    path: "/api/files/../../../../etc/passwd",
    explanation: "Attempt to access server filesystem by traversing directories using ../ sequences.",
    blocked: true,
    wafRule: "Path Traversal Detected",
    responseCode: 403,
    responseTime: "1ms",
  },
  {
    id: "cmd-injection",
    label: "Command Injection",
    method: "POST" as const,
    path: "/api/exec",
    body: '{"cmd": "ls; rm -rf /"}',
    explanation: "Attempt to execute arbitrary system commands by injecting shell metacharacters.",
    blocked: true,
    wafRule: "Command Injection Detected",
    responseCode: 403,
    responseTime: "2ms",
  },
  {
    id: "normal",
    label: "Legitimate Request",
    method: "GET" as const,
    path: "/api/users/42",
    explanation: "A normal API request with no malicious payload. This passes through to your backend.",
    blocked: false,
    wafRule: null,
    responseCode: 200,
    responseTime: "18ms",
  },
];

function WafDemo() {
  const [selectedAttack, setSelectedAttack] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<typeof DEMO_ATTACKS[0] | null>(null);
  const [requestSent, setRequestSent] = useState(false);

  const sendRequest = useCallback(() => {
    if (isSending) return;
    setIsSending(true);
    setRequestSent(false);
    setResult(null);

    setTimeout(() => {
      setResult(DEMO_ATTACKS[selectedAttack]);
      setRequestSent(true);
      setIsSending(false);
    }, 800);
  }, [isSending, selectedAttack]);

  const attack = DEMO_ATTACKS[selectedAttack];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left — Request Builder */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
          <Terminal className="w-4 h-4 text-[#04e184]" />
          Request
        </div>

        {/* Attack selector */}
        <div className="flex flex-wrap gap-2">
          {DEMO_ATTACKS.map((a, i) => (
            <button
              key={a.id}
              onClick={() => { setSelectedAttack(i); setResult(null); setRequestSent(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedAttack === i
                  ? "bg-white/10 text-white border border-white/20"
                  : "bg-white/[0.03] text-[#A2BDDB]/50 border border-white/[0.06] hover:border-white/10 hover:text-[#A2BDDB]/80"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* Request display */}
        <div className="bg-[#0D1117] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04] bg-white/[0.02]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#04e184]/40" />
            </div>
            <span className="text-[10px] text-[#A2BDDB]/30 font-mono ml-2">Request Preview</span>
          </div>
          <div className="p-5 space-y-3 font-mono text-sm">
            <div>
              <span className="text-[#c792ea] font-bold">{attack.method}</span>
              <span className="text-[#04e184]"> {attack.path}</span>
            </div>
            <div className="text-[#A2BDDB]/30">
              <span className="text-[#89ddff]">X-API-Key:</span>{" "}
              <span className="text-[#c3e88d]">bk_live_xxxxxxxxxxxx</span>
            </div>
            {attack.body && (
              <div className="text-[#A2BDDB]/30">
                <div className="text-[#89ddff] mb-1">Body:</div>
                <pre className="text-[#f07178] text-xs">{attack.body}</pre>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-[#A2BDDB]/40 leading-relaxed">
          {attack.explanation}
        </p>

        <button
          onClick={sendRequest}
          disabled={isSending}
          className="w-full bg-[#04e184] hover:bg-white text-black py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSending ? (
            <>
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              Analyzing request...
            </>
          ) : (
            <>
              Send Request <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Right — Response */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
          <Shield className="w-4 h-4 text-[#6BA9FF]" />
          Response
        </div>

        <div className="bg-[#0D1117] border border-white/[0.06] rounded-2xl overflow-hidden min-h-[320px] flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04] bg-white/[0.02]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#04e184]/40" />
            </div>
            <span className="text-[10px] text-[#A2BDDB]/30 font-mono ml-2">Backport Response</span>
          </div>

          <div className="flex-1 p-5 flex items-center justify-center">
            {!requestSent && !isSending && (
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto">
                  <Terminal className="w-5 h-5 text-[#A2BDDB]/20" />
                </div>
                <p className="text-sm text-[#A2BDDB]/30">Select an attack type and send a request to see the response</p>
              </div>
            )}

            {isSending && (
              <div className="text-center space-y-3">
                <div className="w-10 h-10 border-2 border-[#04e184]/20 border-t-[#04e184] rounded-full animate-spin mx-auto" />
                <p className="text-sm text-[#A2BDDB]/40">WAF analyzing request...</p>
              </div>
            )}

            {requestSent && result && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        result.blocked ? "bg-red-500/10 border border-red-500/20" : "bg-[#04e184]/10 border border-[#04e184]/20"
                      }`}
                    >
                      {result.blocked ? (
                        <Ban className="w-5 h-5 text-red-400" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-[#04e184]" />
                      )}
                    </div>
                    <div>
                      <div className={`text-lg font-bold ${result.blocked ? "text-red-400" : "text-[#04e184]"}`}>
                        {result.responseCode} {result.blocked ? "Forbidden" : "OK"}
                      </div>
                      <div className="text-xs text-[#A2BDDB]/40">Response time: {result.responseTime}</div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-xl border ${
                      result.blocked
                        ? "bg-red-500/[0.04] border-red-500/15"
                        : "bg-[#04e184]/[0.04] border-[#04e184]/15"
                    }`}
                  >
                    {result.blocked ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
                          <Shield className="w-3.5 h-3.5" />
                          WAF Blocked This Request
                        </div>
                        <p className="text-sm text-[#A2BDDB]/60">
                          Rule triggered: <span className="text-red-400 font-semibold">{result.wafRule}</span>
                        </p>
                        <p className="text-xs text-[#A2BDDB]/30">
                          The malicious payload was detected and the request was blocked before reaching your backend server.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[#04e184] text-xs font-bold uppercase tracking-wider">
                          <Check className="w-3.5 h-3.5" />
                          Request Passed Through
                        </div>
                        <p className="text-sm text-[#A2BDDB]/60">
                          No threats detected. Request forwarded to your origin server and response returned successfully.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-black/30 rounded-xl p-4 font-mono text-xs">
                    <div className="text-[#A2BDDB]/30 mb-1">// Response body</div>
                    {result.blocked ? (
                      <pre className="text-red-400/70">{`{
  "status": "blocked",
  "rule": "${result.wafRule}",
  "message": "Request contains malicious payload",
  "request_id": "req_a7x9k2m"
}`}</pre>
                    ) : (
                      <pre className="text-[#04e184]/70">{`{
  "id": 42,
  "name": "John Doe",
  "email": "john@example.com"
}`}</pre>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURES DATA — Honest descriptions
// ═══════════════════════════════════════════════════════════════════════════════

const FEATURES = [
  {
    title: "Response Transformation",
    desc: "Modify API responses on the fly without touching your backend. Add fields, remove sensitive data, rename keys, or filter response bodies. Set rules by path pattern — no code deployment needed.",
    icon: Code2,
    color: "#04e184",
  },
  {
    title: "API Mocking",
    desc: "Define mock endpoints in your dashboard. When your backend is down or during development, Backport serves your mock responses automatically. No more frontend teams blocked by backend downtime.",
    icon: Database,
    color: "#6BA9FF",
  },
  {
    title: "Custom WAF Rules",
    desc: "Go beyond the built-in 17 security patterns. Write your own regex rules to block specific threats unique to your API. Cloudflare charges $20/month for this — Backport includes it.",
    icon: Shield,
    color: "#A2BDDB",
  },
  {
    title: "Webhook Notifications",
    desc: "Get instant alerts on Slack, Discord, or any URL when WAF blocks a request, rate limits are hit, or your backend returns errors. Never miss a security event.",
    icon: Activity,
    color: "#04e184",
  },
  {
    title: "Built-in WAF + Rate Limiting",
    desc: "17 regex patterns covering SQL injection, XSS, path traversal, command injection, LDAP injection, and XXE. Plan-based rate limiting from 100 to 5,000 requests per minute.",
    icon: Lock,
    color: "#6BA9FF",
  },
  {
    title: "Full Analytics Dashboard",
    desc: "Real-time traffic charts, latency heatmaps, slow endpoint detection, threat alerts, and request replay. Export everything as JSON or CSV for your own analysis.",
    icon: Eye,
    color: "#A2BDDB",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CODE EXAMPLES
// ═══════════════════════════════════════════════════════════════════════════════

const CODE_TABS = [
  {
    lang: "cURL",
    icon: Terminal,
    raw: `curl https://backport.in/proxy/users \\\n  -H "X-API-Key: bk_your_key_here"`,
    code: `curl https://backport.in/proxy/users \\\n  -H "X-API-Key: bk_your_key_here"`,
  },
  {
    lang: "Python",
    icon: Code2,
    raw: `import requests\n\nresp = requests.get(\n    "https://backport.in/proxy/users",\n    headers={"X-API-Key": "bk_your_key"}\n)\nprint(resp.json())`,
    code: `import requests\n\nresp = requests.get(\n    "https://backport.in/proxy/users",\n    headers={"X-API-Key": "bk_your_key"}\n)\nprint(resp.json())`,
  },
  {
    lang: "JavaScript",
    icon: Code2,
    raw: `const res = await fetch(\n  "https://backport.in/proxy/users",\n  { headers: { "X-API-Key": "bk_your_key" } }\n);\nconst data = await res.json();`,
    code: `const res = await fetch(\n  "https://backport.in/proxy/users",\n  { headers: { "X-API-Key": "bk_your_key" } }\n);\nconst data = await res.json();`,
  },
];

function CodeBlock({ code, lang, raw }: { code: string; lang: string; raw: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] rounded-t-xl bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#04e184]/40" />
          </div>
          <span className="text-xs text-[#A2BDDB]/30 font-mono">{lang}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs text-[#A2BDDB]/40 hover:text-white hover:bg-white/[0.06] transition-all opacity-0 group-hover:opacity-100"
        >
          {copied ? (
            <><CheckCircle2 className="w-3.5 h-3.5 text-[#04e184]" /><span className="text-[#04e184]">Copied!</span></>
          ) : (
            <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>
          )}
        </button>
      </div>
      <div className="bg-[#0A0E14] border border-white/[0.04] border-t-0 rounded-b-xl p-5 overflow-x-auto">
        <pre className="font-mono text-sm leading-relaxed text-[#A2BDDB]/60">{code}</pre>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", company: "", message: "" });
  const [contactStatus, setContactStatus] = useState<{ state: "idle" | "submitting" | "success" | "error"; text: string }>({ state: "idle", text: "" });

  useEffect(() => {
    setCurrency(detectUserCurrency());
  }, []);

  const faqs = [
    {
      q: "Do I need to change my backend code?",
      a: "No. Backport sits in front of your API as a reverse proxy. You change the URL your clients call and add an X-API-Key header. Your backend code stays exactly the same.",
    },
    {
      q: "What attacks does the WAF block?",
      a: "The WAF uses regex pattern matching to block SQL injection, cross-site scripting (XSS), path traversal, and command injection. These cover the OWASP Top 10 web vulnerabilities. You can see it in action in the live demo above.",
    },
    {
      q: "How is this different from Cloudflare?",
      a: "Cloudflare is a CDN — it sits in front of your entire website and provides generic security. Backport is purpose-built for APIs. Cloudflare does not let you transform API responses or mock endpoints. Custom WAF rules on Cloudflare require their $20/month Pro plan. Backport gives you response transformation, API mocking, custom WAF rules, and webhooks starting at \u20b9499/month ($6). No DNS changes, no complex setup.",
    },
    {
      q: "What happens when my request limit is reached?",
      a: "Requests over your plan limit receive a 429 Too Many Requests response. You can upgrade your plan anytime from your dashboard. We do not auto-charge or surprise you with overage bills.",
    },
    {
      q: "Is this production-ready?",
      a: "Backport is built for production from day one — MIT licensed, fully open source, and auditable. Start with the free 3-month trial to evaluate it for your use case before committing.",
    },
  ];

  const p = PRICING[currency];
  const yearlyDiscount = billing === "yearly" ? 0.8 : 1;
  const plusPrice = formatPrice(p.plus * yearlyDiscount, p);
  const proPrice = formatPrice(p.pro * yearlyDiscount, p);
  // Enterprise is contract-based — no fixed price shown
  const enterprisePriceLabel = "Custom";

  const plans = [
    {
      name: "Free",
      desc: "Try everything free for 3 months. No card required.",
      price: "$0",
      period: "3 months",
      features: [
        "100 requests / minute",
        "WAF protection (17 patterns)",
        "Rate limiting",
        "1 API key",
        "LRU caching & idempotency",
        "Dashboard analytics",
      ],
      cta: "Start Free",
      href: "/auth/signup",
    },
    {
      name: "Plus",
      desc: "For growing APIs",
      price: plusPrice,
      period: billing === "yearly" ? "/mo (billed yearly)" : "/month",
      features: [
        "500 requests / minute",
        "Response transformation",
        "API mocking",
        "3 API keys",
        "Full analytics dashboard",
        "Export data (JSON/CSV)",
      ],
      cta: "Start Free Trial",
      href: "/auth/signup",
      highlight: true,
    },
    {
      name: "Pro",
      desc: "For production APIs",
      price: proPrice,
      period: billing === "yearly" ? "/mo (billed yearly)" : "/month",
      features: [
        "5,000 requests / minute",
        "Custom WAF rules",
        "10 API keys",
        "Webhook notifications",
        "Full analytics + auto docs",
        "JSON + CSV log export",
        "Priority support",
      ],
      cta: "Get Started",
      href: "/auth/signup",
    },
    {
      name: "Enterprise",
      desc: "For teams at scale",
      price: enterprisePriceLabel,
      period: "Contract-based",
      features: [
        "Unlimited requests / minute",
        "Custom WAF + rate rules",
        "50 API keys",
        "Team collaboration",
        "Webhooks + Slack/Discord",
        "Dedicated support & SLA",
        "Custom integrations",
        "On-call engineering",
      ],
      cta: "Contact Sales",
      href: "#contact-enterprise",
      enterprise: true,
    },
  ];

  return (
    <main className="bg-[#080C10] min-h-screen relative">
      <Header />

      {/* ═══════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[30%] left-[15%] w-[500px] h-[500px] bg-radial-mint opacity-25 blur-3xl" />
          <div className="absolute -top-[10%] right-[15%] w-[400px] h-[400px] bg-radial-blue opacity-15 blur-3xl" />
          <div className="absolute inset-0 bg-dot-grid opacity-20" />
        </div>

        <div className="max-w-4xl mx-auto flex flex-col items-center text-center relative z-10">
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight text-white max-w-3xl mb-6"
          >
            Protect your API from attacks.
            <br />
            <span className="text-[#A2BDDB]/70">No SDK. No code changes.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-xl text-[#A2BDDB]/50 text-base sm:text-lg leading-relaxed mb-10"
          >
            Backport is the only API gateway that lets you transform responses, mock
            APIs, and add custom security rules — without changing your backend code.
            Point your clients to Backport. That&apos;s it.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <Link
              href="/auth/signup"
              className="bg-[#04e184] hover:bg-white text-black px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="https://github.com/Qureshi-1/Backport-io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#A2BDDB] hover:text-white px-8 py-3.5 rounded-xl font-semibold border border-white/[0.08] hover:border-white/[0.15] transition-all duration-300 flex items-center gap-2"
            >
              <GithubIcon className="w-4 h-4" />
              View on GitHub
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TECH STACK BADGES
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs text-[#A2BDDB]/25 uppercase tracking-[0.2em] font-medium mb-8">Built with technologies developers love</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {["FastAPI", "Next.js", "PostgreSQL", "Python", "TypeScript"].map((name) => (
              <span key={name} className="text-sm sm:text-base font-semibold text-[#A2BDDB]/20 tracking-tight">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          METRICS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {[
            { value: "17+", label: "WAF Patterns" },
            { value: "MIT", label: "Open Source" },
            { value: "<5ms", label: "Overhead" },
            { value: "30s", label: "Setup Time" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-[#04e184] mb-1">{stat.value}</div>
              <div className="text-xs sm:text-sm text-[#A2BDDB]/40">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          LIVE WAF DEMO
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-6 relative border-t border-white/[0.04]">
        <div className="absolute inset-0 bg-mesh-hero pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <FadeIn>
            <div className="text-center mb-10">
              <SectionBadge>Live Demo</SectionBadge>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
                See the WAF in action
              </h2>
              <p className="max-w-xl mx-auto text-[#A2BDDB]/50 text-sm sm:text-base">
                Select an attack type, send a request, and watch Backport block it before it reaches your server.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 sm:p-8">
              <WafDemo />
            </div>
          </FadeIn>

          <FadeIn delay={0.15} className="mt-6 text-center">
            <p className="text-xs text-[#A2BDDB]/30">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FBBF24]/[0.06] border border-[#FBBF24]/15 text-[#FBBF24]/60 mr-1.5">
                Simulated Demo
              </span>
              This simulates how Backport&apos;s WAF processes real requests. Try all 5 attack types to see the difference.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <SectionHeading
            title="Three steps. That's it."
            subtitle="No complex setup. No SDK installation. No backend changes."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: "1",
                title: "Create an account",
                desc: "Sign up with your email. You will get access to a dashboard where you can manage API keys and view analytics.",
                icon: Users,
                color: "#04e184",
              },
              {
                step: "2",
                title: "Generate an API key",
                desc: "Create a unique API key from your dashboard. This key authenticates all your requests through the proxy.",
                icon: Lock,
                color: "#6BA9FF",
              },
              {
                step: "3",
                title: "Point your traffic here",
                desc: "Replace your backend URL with the Backport proxy URL in your client code. Add the X-API-Key header. Done.",
                icon: Globe,
                color: "#A2BDDB",
              },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.1}>
                <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-2xl p-7 sm:p-8 hover:border-white/[0.12] transition-all duration-300">
                  <div className="text-5xl font-bold text-white/[0.04] absolute top-3 right-5">
                    {item.step}
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: `${item.color}12`, color: item.color }}
                  >
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-[#A2BDDB]/45 leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-20 sm:py-28 px-6 relative border-t border-white/[0.04]">
        <div className="absolute inset-0 bg-dot-grid-subtle opacity-20 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <SectionHeading
            title="What makes Backport different"
            subtitle="Every feature listed here is real and functional. No vaporware."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.06}>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-7 hover:border-white/[0.12] transition-all duration-300 h-full">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: `${f.color}12`, color: f.color }}
                  >
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-[#A2BDDB]/45 leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CODE EXAMPLES
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-6 relative border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto">
          <SectionHeading
            title="Works with any language"
            subtitle="Backport is an HTTP proxy. If your backend speaks HTTP, it works. No SDK needed."
          />

          <FadeIn delay={0.1}>
            <div className="flex items-center gap-1 mb-6 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 max-w-md mx-auto">
              {CODE_TABS.map((tab, i) => (
                <button
                  key={tab.lang}
                  onClick={() => setActiveTab(i)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === i
                      ? "bg-white/[0.08] text-white"
                      : "text-[#A2BDDB]/40 hover:text-[#A2BDDB]/70"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.lang}</span>
                </button>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <CodeBlock
                  code={CODE_TABS[activeTab].code}
                  lang={CODE_TABS[activeTab].lang}
                  raw={CODE_TABS[activeTab].raw}
                />
              </motion.div>
            </AnimatePresence>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          WHO IS THIS FOR?
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-6 relative border-t border-white/[0.04]">
        <div className="absolute inset-0 bg-mesh-pricing pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <SectionHeading
            title="Who is this for?"
            subtitle="Backport is built for developers who want API protection without the complexity."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Indie developers",
                desc: "You are building an API and need basic protection. You do not want to spend hours configuring Cloudflare or setting up nginx rules. You want to ship, not do ops.",
                icon: Code2,
              },
              {
                title: "Small teams",
                desc: "Your team is focused on building features, not managing infrastructure. Backport gives you WAF, rate limiting, and analytics without a dedicated security engineer.",
                icon: Users,
              },
              {
                title: "API-first products",
                desc: "If your product exposes an API to third-party developers, you need protection from abuse. Backport gives each client their own API key and usage limits.",
                icon: Server,
              },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.1}>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-7 hover:border-white/[0.12] transition-all duration-300">
                  <item.icon className="w-5 h-5 text-[#04e184] mb-4" />
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-[#A2BDDB]/45 leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          OPEN SOURCE
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-6 relative border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-dot-grid-subtle opacity-20 pointer-events-none" />
              <div className="relative z-10">
                <GithubIcon className="w-10 h-10 text-white mx-auto mb-6" />
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Open Source
                </h2>
                <p className="max-w-lg mx-auto text-[#A2BDDB]/50 text-sm sm:text-base leading-relaxed mb-8">
                  Backport is MIT licensed. You can audit the code, report issues, or contribute features. Full transparency — nothing is hidden.
                </p>
                <Link
                  href="https://github.com/Qureshi-1/Backport-io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:bg-[#A2BDDB]"
                >
                  <GithubIcon className="w-4 h-4" />
                  Star on GitHub
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PRICING
      ═══════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-20 sm:py-28 px-6 relative border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <SectionHeading
            title="Pricing"
            subtitle="Start free. Upgrade when you need more requests or API keys. No hidden fees."
          />

          {/* Billing toggle + currency picker */}
          <FadeIn delay={0.05} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <div className="flex items-center gap-3">
              <span className={`text-sm ${billing === "monthly" ? "text-white" : "text-[#A2BDDB]/40"}`}>Monthly</span>
              <button
                onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
                className="relative w-11 h-6 rounded-full transition-colors duration-300"
                style={{ backgroundColor: billing === "yearly" ? "#04e184" : "rgba(255,255,255,0.08)" }}
                aria-label="Toggle billing period"
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-300"
                  style={{ left: billing === "yearly" ? "22px" : "2px" }}
                />
              </button>
              <span className={`text-sm ${billing === "yearly" ? "text-white" : "text-[#A2BDDB]/40"}`}>Yearly</span>
              {billing === "yearly" && (
                <span className="text-xs text-[#04e184] font-medium bg-[#04e184]/10 px-2.5 py-0.5 rounded-full border border-[#04e184]/20">
                  Save 20%
                </span>
              )}
            </div>

            {/* Currency picker */}
            <div className="relative">
              <button
                onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-[#A2BDDB] hover:text-white hover:border-white/20 transition-all"
              >
                {p.symbol} {p.code}
                <ChevronDown className={`w-3 h-3 transition-transform ${showCurrencyPicker ? "rotate-180" : ""}`} />
              </button>
              {showCurrencyPicker && (
                <div className="absolute top-full mt-2 right-0 bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50 min-w-[140px]">
                  {ALL_CURRENCIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setCurrency(c); setShowCurrencyPicker(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-all ${
                        c === currency
                          ? "bg-[#04e184]/10 text-[#04e184]"
                          : "text-[#A2BDDB] hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {PRICING[c].symbol} {PRICING[c].code}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {plans.map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.08}>
                <div
                  className={`relative p-7 rounded-2xl flex flex-col h-full transition-all duration-300 ${
                    plan.enterprise
                      ? "bg-[#f97316]/[0.04] border-2 border-[#f97316]/20"
                      : plan.highlight
                        ? "bg-[#04e184]/[0.04] border-2 border-[#04e184]/20"
                        : "bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12]"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#04e184] text-black text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                      Popular
                    </div>
                  )}
                  {plan.enterprise && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#f97316] text-black text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                      Scale
                    </div>
                  )}

                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-white mb-0.5">{plan.name}</h3>
                    <p className="text-sm text-[#A2BDDB]/40">{plan.desc}</p>
                  </div>

                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-sm text-[#A2BDDB]/30">{plan.period}</span>
                  </div>

                  <ul className="space-y-2.5 mb-7 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-[#A2BDDB]/60">
                        <Check className="w-4 h-4 text-[#04e184] mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {plan.enterprise ? (
                    <button
                      onClick={() => setShowContactModal(true)}
                      className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-all duration-300 block bg-[#f97316] hover:bg-[#fbbf24] text-black`}
                    >
                      {plan.cta}
                    </button>
                  ) : (
                    <Link
                      href={plan.href}
                      className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-all duration-300 block ${
                        plan.highlight
                          ? "bg-[#04e184] hover:bg-white text-black"
                          : "bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08]"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.3} className="mt-8 text-center">
            <p className="text-xs text-[#A2BDDB]/30">
              All plans include the core WAF and rate limiting. No credit card required for the free tier.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          OPEN SOURCE + COMMUNITY CTA
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-6 relative border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-dot-grid-subtle opacity-20 pointer-events-none" />
              <div className="relative z-10">
                <SectionBadge color="#6BA9FF">Open Source</SectionBadge>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  MIT Licensed. Fully Auditable.
                </h2>
                <p className="max-w-lg mx-auto text-[#A2BDDB]/50 text-sm sm:text-base leading-relaxed mb-8">
                  Backport is open source. Audit the code, self-host on your own servers, or contribute features. Report bugs, request features, and help shape the roadmap. Every issue and pull request matters.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/auth/signup"
                    className="bg-[#04e184] hover:bg-white text-black px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2"
                  >
                    Get Started Free <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="https://github.com/Qureshi-1/Backport-io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#A2BDDB] hover:text-white px-8 py-3.5 rounded-xl font-semibold border border-white/[0.08] hover:border-white/[0.15] transition-all duration-300 flex items-center gap-2"
                  >
                    <GithubIcon className="w-4 h-4" />
                    Star on GitHub
                  </Link>
                </div>
                <p className="text-xs text-[#A2BDDB]/25 mt-6">
                  No vendor lock-in. Self-hostable. Free tier available with no credit card.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-6 relative border-t border-white/[0.04]">
        <div className="max-w-2xl mx-auto">
          <SectionHeading title="FAQ" />

          <div className="space-y-2.5">
            {faqs.map((faq, i) => (
              <FadeIn key={i} delay={i * 0.04}>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.1] transition-colors">
                  <button
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="text-sm font-semibold text-white pr-4">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#A2BDDB]/40 flex-shrink-0 transition-transform duration-200 ${
                        faqOpen === i ? "rotate-180 text-[#04e184]" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {faqOpen === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 text-sm text-[#A2BDDB]/50 leading-relaxed">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-6 relative border-t border-white/[0.04]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-radial-mint opacity-20 blur-3xl" />
        </div>

        <div className="max-w-2xl mx-auto relative z-10 text-center">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
              Ready to protect your API?
            </h2>
            <p className="text-[#A2BDDB]/50 text-base sm:text-lg mb-8 max-w-lg mx-auto">
              Start protecting your API today. Free for 3 months, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth/signup"
                className="bg-[#04e184] hover:bg-white text-black px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/docs"
                className="text-[#A2BDDB] hover:text-white px-8 py-3.5 rounded-xl font-semibold border border-white/[0.08] hover:border-white/[0.15] transition-all duration-300 flex items-center gap-2"
              >
                Read the Docs
              </Link>
            </div>
            <p className="text-xs text-[#A2BDDB]/20 mt-6">
              MIT licensed &middot; Open source &middot; Self-hostable
            </p>
          </FadeIn>
        </div>
      </section>

      <Footer />

      {/* ═══ Contact Sales Modal ═══ */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => contactStatus.state !== "submitting" && setShowContactModal(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowContactModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {contactStatus.state === "success" ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Inquiry Sent!</h3>
                  <p className="text-zinc-400 text-sm mb-6">
                    Thanks for your interest. We&apos;ll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setShowContactModal(false);
                      setContactStatus({ state: "idle", text: "" });
                      setContactForm({ name: "", email: "", company: "", message: "" });
                    }}
                    className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-1">Enterprise Inquiry</h3>
                    <p className="text-zinc-500 text-sm">Tell us about your needs. We&apos;ll reach out within 24 hours.</p>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!contactForm.name.trim() || !contactForm.email.trim() || contactForm.message.trim().length < 10) return;
                      setContactStatus({ state: "submitting", text: "" });
                      try {
                        const res = await fetch("/api/proxy/contact-sales", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(contactForm),
                        });
                        if (res.ok) {
                          setContactStatus({ state: "success", text: "" });
                        } else {
                          setContactStatus({ state: "error", text: "Something went wrong. Try again." });
                        }
                      } catch {
                        setContactStatus({ state: "error", text: "Could not connect. Please try again." });
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Name *</label>
                      <input
                        required
                        type="text"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] outline-none transition-colors"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email *</label>
                      <input
                        required
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] outline-none transition-colors"
                        placeholder="you@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Company</label>
                      <input
                        type="text"
                        value={contactForm.company}
                        onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] outline-none transition-colors"
                        placeholder="Your company (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Message *</label>
                      <textarea
                        required
                        minLength={10}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        rows={3}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] outline-none transition-colors resize-none"
                        placeholder="Tell us about your requirements..."
                      />
                    </div>

                    {contactStatus.state === "error" && (
                      <div className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{contactStatus.text}</div>
                    )}

                    <button
                      type="submit"
                      disabled={contactStatus.state === "submitting"}
                      className="w-full py-3.5 rounded-xl bg-[#f97316] hover:bg-[#fbbf24] text-black font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {contactStatus.state === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
                      Send Inquiry
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
