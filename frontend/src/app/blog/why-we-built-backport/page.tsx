import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, User, Clock, ArrowRight, Github } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Why We Built Backport: An Open-Source API Gateway | Backport Blog",
  description: "The story behind Backport — why we built an open-source API gateway, how it works, and how you can start protecting your API in 30 seconds without any code changes.",
  openGraph: {
    title: "Why We Built Backport: An Open-Source API Gateway",
    description: "An open-source API gateway with WAF, rate limiting, caching, and analytics. Built for developers who want to ship, not do ops.",
    url: "https://backport.in/blog/why-we-built-backport",
    siteName: "Backport",
    type: "article",
    publishedTime: "2026-04-10",
    authors: ["Sohail Qureshi"],
    tags: ["Open Source", "API Gateway", "WAF", "Rate Limiting", "Backport"],
    images: [{ url: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Why We Built Backport: An Open-Source API Gateway",
    description: "The story behind Backport — an open-source API gateway for developers.",
    images: ["https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200"],
  },
  alternates: { canonical: "https://backport.in/blog/why-we-built-backport" },
};

export default function WhyWeBuiltBackport() {
  return (
    <div className="min-h-screen bg-[#080C10]">
      <Header />
      <div className="max-w-4xl mx-auto px-6 pt-28 pb-16">
        {/* Back link */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-[#A2BDDB]/40 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <span className="px-3 py-1 rounded-full bg-[#04e184]/[0.08] text-[#04e184] text-sm font-medium">
              Open Source
            </span>
            <span className="text-[#A2BDDB]/30 flex items-center gap-1">
              <Clock className="w-4 h-4" /> 4 min read
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Why We Built Backport: An Open-Source API Gateway for Developers
          </h1>

          <div className="flex items-center gap-6 text-[#A2BDDB]/40">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span>Sohail Qureshi</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>April 10, 2026</span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="aspect-video rounded-2xl bg-zinc-900 mb-12 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200"
            alt="Open source code on screen"
            className="w-full h-full object-cover opacity-80"
          />
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none mb-16">
          <p className="text-xl text-[#A2BDDB]/60 leading-relaxed mb-8">
            When I started building APIs, I quickly realized that securing them was harder than building them. Cloudflare was too generic. Kong was too complex. AWS API Gateway had a pricing model that scared indie developers. So I built Backport.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-6">The Problem We Faced</h2>

          <p className="text-[#A2BDDB]/50 leading-relaxed mb-6">
            Every API I deployed faced the same problems: bots hammering endpoints, SQL injection attempts in query params, no visibility into who was calling my API, and no way to rate limit abusive clients. The existing solutions were either too expensive, too complex, or too generic.
          </p>

          <p className="text-[#A2BDDB]/50 leading-relaxed mb-6">
            Cloudflare is great for websites, but it sits in front of your entire domain. It cannot transform API responses, mock endpoints for frontend development, or give you per-endpoint analytics. Kong requires Kubernetes and a dedicated DevOps engineer. AWS API Gateway charges per request and the free tier is laughable for production use.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-6">What Backport Does Differently</h2>

          <p className="text-[#A2BDDB]/50 leading-relaxed mb-6">
            Backport is an HTTP reverse proxy purpose-built for APIs. It sits between your clients and your backend. You change one URL in your client code, add an API key header, and suddenly your API has enterprise-grade protection. Here is what it does out of the box:
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-[#04e184]/20">
              <h4 className="text-lg font-bold text-[#04e184] mb-3">Protection</h4>
              <ul className="text-[#A2BDDB]/50 text-sm space-y-2">
                <li>WAF with 17 security patterns</li>
                <li>Plan-based rate limiting</li>
                <li>SSRF protection</li>
                <li>Custom WAF rules (regex)</li>
              </ul>
            </div>
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-[#6BA9FF]/20">
              <h4 className="text-lg font-bold text-[#6BA9FF] mb-3">Optimization</h4>
              <ul className="text-[#A2BDDB]/50 text-sm space-y-2">
                <li>LRU response caching</li>
                <li>Idempotency keys</li>
                <li>Response transformation</li>
                <li>API mocking</li>
              </ul>
            </div>
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-[#A2BDDB]/20">
              <h4 className="text-lg font-bold text-[#A2BDDB] mb-3">Observability</h4>
              <ul className="text-[#A2BDDB]/50 text-sm space-y-2">
                <li>Real-time analytics</li>
                <li>Request logging + export</li>
                <li>Health monitoring</li>
                <li>Webhook notifications</li>
              </ul>
            </div>
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-[#FBBF24]/20">
              <h4 className="text-lg font-bold text-[#FBBF24] mb-3">Developer Experience</h4>
              <ul className="text-[#A2BDDB]/50 text-sm space-y-2">
                <li>30-second setup</li>
                <li>Dashboard UI</li>
                <li>CLI tool</li>
                <li>Team management</li>
              </ul>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mt-12 mb-6">Why Open Source</h2>

          <p className="text-[#A2BDDB]/50 leading-relaxed mb-6">
            API security should not be locked behind enterprise paywalls. Every developer, whether building a side project or a production API, deserves protection from SQL injection, XSS, and abusive clients. By making Backport open source (MIT license), we ensure that the core security engine is transparent, auditable, and free for everyone.
          </p>

          <p className="text-[#A2BDDB]/50 leading-relaxed mb-6">
            The hosted version on Vercel + Render provides the dashboard, analytics, and team features for developers who want a managed experience. But the core proxy engine, WAF patterns, and rate limiting logic are all open source and self-hostable.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-6">The Tech Stack</h2>

          <p className="text-[#A2BDDB]/50 leading-relaxed mb-6">
            We chose each technology for a specific reason. Python FastAPI for the proxy engine because it handles async HTTP proxying with minimal overhead. Next.js for the dashboard because it provides the best developer experience for building React interfaces. SQLAlchemy for database models because it works with both SQLite (development) and PostgreSQL (production).
          </p>

          <pre className="bg-black rounded-lg p-4 overflow-x-auto mb-6">
            <code className="text-[#04e184] text-sm">
{`Frontend:  Next.js 16 + React 19 + TypeScript + Tailwind CSS
Backend:   Python 3.12 + FastAPI + SQLAlchemy
Database:  PostgreSQL (production) / SQLite (development)
Cache:     Redis (Upstash) with in-memory fallback
Proxy:     httpx async client with connection pooling
Deploy:    Vercel (frontend) + Render (backend)`}
            </code>
          </pre>

          <h2 className="text-2xl font-bold text-white mt-12 mb-6">What is Next</h2>

          <p className="text-[#A2BDDB]/50 leading-relaxed mb-6">
            We are just getting started. The roadmap includes automatic log retention policies, real-time alerting via Slack and Discord, custom domain support, and an API marketplace where developers can share their WAF rules and response transformation templates.
          </p>

          <p className="text-[#A2BDDB]/50 leading-relaxed mb-6">
            If you are building an API and want protection without the complexity, give Backport a try. The free plan includes core gateway features (WAF, rate limiting, caching, idempotency, and dashboard analytics) for 3 months, no credit card required. And if you are a developer who wants to contribute, the code is on GitHub under the MIT license. We welcome pull requests, bug reports, and feature suggestions.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#04e184]/10 to-[#6BA9FF]/10 border border-[#04e184]/20 rounded-2xl p-8 mb-16">
          <h3 className="text-2xl font-bold text-white mb-4">Get Started in 30 Seconds</h3>
          <p className="text-[#A2BDDB]/50 mb-6">
            Sign up, generate an API key, and point your traffic through Backport. No code changes to your backend.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-[#04e184] text-black px-6 py-3 rounded-xl font-bold hover:bg-white transition-colors">
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://github.com/Qureshi-1/Backport-io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/[0.08] text-[#A2BDDB]/60 px-6 py-3 rounded-xl font-semibold hover:bg-white/[0.04] hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" /> Star on GitHub
            </a>
          </div>
        </div>

        {/* Author */}
        <div className="flex items-center gap-4 p-6 bg-zinc-900/50 rounded-2xl mb-16">
          <div className="w-16 h-16 rounded-full bg-[#04e184]/20 flex items-center justify-center text-[#04e184] font-bold text-xl">
            SQ
          </div>
          <div>
            <h4 className="text-white font-bold">Sohail Qureshi</h4>
            <p className="text-[#A2BDDB]/40 text-sm">Founder &amp; Developer at Backport</p>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
