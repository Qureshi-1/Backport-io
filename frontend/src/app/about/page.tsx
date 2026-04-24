import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About Backport — Enterprise-Grade API Gateway",
  description:
    "Backport is an open-source, enterprise-grade API gateway providing WAF, rate limiting, caching, response transformation, and analytics — with zero code changes.",
};

export default function About() {
  return (
    <div className="min-h-screen bg-[#080C10] text-[#e2e2e2]">
      <Header />
      <div className="mx-auto max-w-4xl px-6 py-24 pt-32">
        <div className="flex items-center gap-2 text-xs text-[#A2BDDB]/30 mb-10">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="text-[#A2BDDB]/15">/</span>
          <span className="text-white/60">About</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">About Backport</h1>
        <p className="text-lg text-[#A2BDDB]/50 mb-12 max-w-2xl leading-relaxed">
          Backport is an open-source API gateway built for developers who need enterprise-grade protection and performance — without the enterprise complexity.
        </p>

        <div className="bg-[#04e184]/[0.04] border border-[#04e184]/10 px-5 py-4 rounded-xl mb-16">
          <p className="text-[#A2BDDB]/60 text-sm">
            <strong className="text-[#04e184]">Backport is production-ready.</strong> It is actively maintained, MIT licensed, and the core engine is fully open source and auditable. Check the{" "}
            <Link href="/changelog" className="text-[#04e184] hover:underline">changelog</Link> for what&apos;s new.
          </p>
        </div>

        {/* Mission */}
        <h2 className="text-2xl font-bold text-white mt-16 mb-6">Our Mission</h2>
        <p className="mb-6 leading-relaxed text-[#A2BDDB]/60">
          Adding API gateway features shouldn&apos;t mean deploying heavy infrastructure like Kong or AWS API Gateway, or writing complex middleware. Backport was built to solve this — a lightweight reverse proxy that you can set up in under a minute, giving your backend production-grade protection instantly.
        </p>
        <p className="mb-6 leading-relaxed text-[#A2BDDB]/60">
          Every request passes through a comprehensive security pipeline — WAF inspection, rate limiting, cache checks, response transformation, and idempotency guards — before reaching your origin server. Your backend stays untouched while gaining enterprise-grade protection and acceleration.
        </p>

        {/* Production Infrastructure */}
        <h2 className="text-2xl font-bold text-white mt-16 mb-6">Production Infrastructure</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {[
            { label: "Backend", value: "Python, FastAPI, SQLAlchemy, httpx" },
            { label: "Frontend", value: "Next.js, React, TypeScript, Tailwind CSS" },
            { label: "Database", value: "PostgreSQL" },
            { label: "Payments", value: "Razorpay" },
            { label: "Email", value: "Resend" },
            { label: "License", value: "MIT — free and open source" },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="text-xs uppercase tracking-wider text-[#A2BDDB]/30 mb-1">{item.label}</div>
              <div className="text-white font-medium">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Capabilities */}
        <h2 className="text-2xl font-bold text-white mt-16 mb-6">Capabilities</h2>
        <ul className="space-y-3 mb-16">
          {[
            "17 regex-based WAF patterns covering SQL injection, XSS, path traversal, command injection, LDAP injection, and XXE",
            "Custom WAF rules — write your own regex security patterns",
            "Sliding-window rate limiting (100/500/5,000 requests per minute by plan)",
            "In-memory LRU cache for GET requests (5-minute TTL, up to 1000 entries)",
            "Idempotency key support for POST/PUT/PATCH deduplication (up to 5000 stored keys)",
            "Response transformation — modify API responses on the fly",
            "API mocking — define mock endpoints for frontend development and testing",
            "Webhook notifications — real-time alerts to Slack, Discord, or any URL",
            "Dashboard with analytics, request logs, traffic charts, and security alerts",
            "JSON + CSV log export",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-[#A2BDDB]/50">
              <span className="w-1.5 h-1.5 bg-[#04e184] flex-shrink-0 rounded-full mt-2" />
              {item}
            </li>
          ))}
        </ul>

        {/* Source Code */}
        <h2 className="text-2xl font-bold text-white mt-16 mb-6">Source Code</h2>
        <p className="text-[#A2BDDB]/60 leading-relaxed mb-16">
          Backport is fully open source under the MIT license. You can view the source code, report issues, or contribute on{" "}
          <a href="https://github.com/Qureshi-1/Backport-io" target="_blank" rel="noopener noreferrer" className="text-[#04e184] hover:underline">
            GitHub
          </a>.
        </p>
      </div>
      <Footer />
    </div>
  );
}
