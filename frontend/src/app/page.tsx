"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Shield, Activity, ArrowRight, Check,
  Terminal, Lock, Code2,
  ChevronDown, Database,
  Copy, CheckCircle2,
  Users, Globe, Server,
  Ban, Eye, X, Loader2,
} from "lucide-react";

// Github icon inline SVG
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
// FEATURES DATA
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
    desc: "Define your own regex-based firewall rules with per-endpoint control and severity levels.",
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
      a: "Cloudflare is a powerful CDN and security platform — great for websites and DNS. Backport is focused specifically on API management: response transformation, API mocking, and custom WAF rules that are API-specific. If you need a CDN, use Cloudflare. If you need API-specific tooling, Backport complements it well.",
    },
    {
      q: "What happens when my request limit is reached?",
      a: "Requests over your plan limit receive a 429 Too Many Requests response. You can upgrade your plan anytime from your dashboard. We do not auto-charge or surprise you with overage bills.",
    },
    {
      q: "Is this production-ready?",
      a: "Backport is production-ready with a free 3-month trial. The managed cloud includes full API gateway features — WAF, rate limiting, caching, response transformation, and analytics.",
    },
  ];

  const p = PRICING[currency];
  const yearlyDiscount = billing === "yearly" ? 0.8 : 1;
  const plusPrice = formatPrice(p.plus * yearlyDiscount, p);
  const proPrice = formatPrice(p.pro * yearlyDiscount, p);
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

      {/* HERO */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[30%] left-[15%] w-[500px] h-[500px] bg-radial-mint opacity-25 blur-3xl" />
          <div className="absolute -top-[10%] right-[15%] w-[400px] h-[400px] bg-radial-blue opacity-15 blur-3xl" />
          <div className="absolute inset-0 bg-dot-grid opacity-20" />
        </div>

        <div className="max-w-4xl mx-auto flex flex-col items-center text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#04e184]/20 bg-[#04e184]/[0.06] mb-6"
          >
            <span className="text-[#04e184] text-sm font-medium">Open-Source API Gateway</span>
          </motion.div>

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

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-xl text-[#A2BDDB]/50 text-base sm:text-lg leading-relaxed mb-10"
          >
            Backport is an API gateway that lets you transform responses, mock
            APIs, and add custom security rules — without changing your backend code.
            Point your clients to Backport. That&apos;s it.
          </motion.p>

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
              Star on GitHub
            </Link>
          </motion.div>
        </div>
      </section>

      {/* WHY CHOOSE BACKPORT */}
      <section className="py-12 sm:py-16 px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs text-[#A2BDDB]/25 uppercase tracking-[0.2em] font-medium mb-8">Why developers choose Backport</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { title: "Full Control", desc: "Production-grade API security with transparent pricing. Your data stays yours." },
              { title: "30-Second Setup", desc: "Sign up, get your API key, point your traffic. Done." },
              { title: "Built for APIs", desc: "Not a generic CDN. Purpose-built for API protection and management." },
            ].map((item) => (
              <div key={item.title} className="text-center px-4">
                <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-xs text-[#A2BDDB]/40">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* METRICS */}
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

      {/* COMPARISON */}
      <section className="py-20 sm:py-28 px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <SectionHeading
            title="Backport vs Cloudflare"
            subtitle="Cloudflare is great for websites. Backport is built for APIs."
          />
          <FadeIn delay={0.1}>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="grid grid-cols-3 text-xs font-semibold uppercase tracking-wider">
                <div className="p-4 border-b border-white/[0.06] text-[#A2BDDB]/40">Feature</div>
                <div className="p-4 border-b border-white/[0.06] text-center text-[#04e184]">Backport</div>
                <div className="p-4 border-b border-white/[0.06] text-center text-[#A2BDDB]/30">Cloudflare</div>
              </div>
              {[
                { feature: "API Response Transformation", backport: true, cf: false },
                { feature: "API Mocking", backport: true, cf: false },
                { feature: "Custom WAF Rules", backport: true, cf: "Pro $20/mo" },
                { feature: "Per-API-Key Rate Limiting", backport: true, cf: false },
                { feature: "Webhook Alerts", backport: true, cf: "Enterprise" },
                { feature: "Auto API Documentation", backport: true, cf: false },
                { feature: "No DNS Changes Needed", backport: true, cf: false },
                { feature: "Starting Price", backport: "Free", cf: "Free" },
              ].map((row, i) => (
                <div key={row.feature} className={`grid grid-cols-3 text-sm ${i % 2 === 0 ? "bg-white/[0.01]" : ""}`}>
                  <div className="p-4 border-b border-white/[0.04] text-white/70">{row.feature}</div>
                  <div className="p-4 border-b border-white/[0.04] text-center">
                    {row.backport === true ? (
                      <span className="text-[#04e184] font-medium">Included</span>
                    ) : (
                      <span className="text-white/50">{String(row.backport)}</span>
                    )}
                  </div>
                  <div className="p-4 border-b border-white/[0.04] text-center">
                    {row.cf === true ? (
                      <span className="text-[#04e184] font-medium">Included</span>
                    ) : (
                      <span className="text-[#A2BDDB]/30">{String(row.cf)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* LIVE WAF DEMO */}
      <section className="py-20 sm:py-28 px-6 relative border-t border-white/[0.04]">
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
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 sm:py-28 px-6 relative border-t border-white/[0.04]">
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

      {/* PRICING */}
      <section id="pricing" className="py-20 sm:py-28 px-6 relative border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <SectionHeading
            title="Pricing"
            subtitle="Start free. Upgrade when you need more requests or API keys. No hidden fees."
          />

          <FadeIn delay={0.05} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <div className="flex items-center gap-3">
              <span className={`text-sm ${billing === "monthly" ? "text-white" : "text-[#A2BDDB]/40"}`}>Monthly</span>
              <button
                onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
                className="relative w-11 h-6 rounded-full bg-white/10"
              >
                <div
                  className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: billing === "yearly" ? "24px" : "4px" }}
                />
              </button>
              <span className={`text-sm ${billing === "yearly" ? "text-white" : "text-[#A2BDDB]/40"}`}>Yearly</span>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {plans.map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.08}>
                <div className={`p-7 rounded-2xl flex flex-col h-full border ${plan.highlight ? "border-[#04e184]/50 bg-[#04e184]/5" : "border-white/10 bg-white/5"}`}>
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-[#A2BDDB]/40 mb-4">{plan.desc}</p>
                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-sm text-[#A2BDDB]/30">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-[#A2BDDB]/60">
                        <Check className="w-4 h-4 text-[#04e184] mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-all ${plan.highlight ? "bg-[#04e184] text-black" : "bg-white/10 text-white"}`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28 px-6 border-t border-white/[0.04]">
        <div className="max-w-2xl mx-auto">
          <SectionHeading title="FAQ" />
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-white/10 pb-4">
                <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                <p className="text-[#A2BDDB]/50 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {/* Contact Modal */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="bg-[#111] p-8 rounded-2xl max-w-md w-full border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">Contact Sales</h3>
              <p className="text-[#A2BDDB]/50 mb-6">Tell us about your needs and we will get back to you shortly.</p>
              <button onClick={() => setShowContactModal(false)} className="bg-[#04e184] text-black w-full py-3 rounded-xl font-bold">Close</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
