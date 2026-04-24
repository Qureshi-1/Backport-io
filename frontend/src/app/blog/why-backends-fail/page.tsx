import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, User, Clock, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Why Traditional Backends Fail Under Burst Traffic | Backport Blog",
  description: "How API gateways prevent database thrashing using sliding-window rate limits and intelligent caching. A deep dive into handling traffic spikes.",
  openGraph: {
    title: "Why Traditional Backends Fail Under Burst Traffic",
    description: "How API gateways prevent database thrashing using sliding-window rate limits and intelligent caching.",
    url: "https://backport.in/blog/why-backends-fail",
    siteName: "Backport",
    type: "article",
    publishedTime: "2026-03-28",
    authors: ["Sohail Qureshi"],
    tags: ["API Gateway", "Rate Limiting", "Caching", "Performance", "Backend"],
    images: [{ url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Why Traditional Backends Fail Under Burst Traffic",
    description: "How API gateways prevent database thrashing using rate limits and caching.",
    images: ["https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200"],
  },
  alternates: { canonical: "https://backport.in/blog/why-backends-fail" },
};

export default function WhyBackendsFailPost() {
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
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium">
            Performance
          </span>
          <span className="text-[#A2BDDB]/30 flex items-center gap-1">
            <Clock className="w-4 h-4" /> 8 min read
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          Why Traditional Backends Fail Under Burst Traffic
        </h1>
        
        <div className="flex items-center gap-6 text-[#A2BDDB]/40">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <span>Sohail Qureshi</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span>March 28, 2026</span>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      <div className="aspect-video rounded-2xl bg-zinc-900 mb-12 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200" 
          alt="Server infrastructure" 
          className="w-full h-full object-cover opacity-80"
        />
      </div>

      {/* Content */}
      <div className="prose prose-invert prose-lg max-w-none mb-16">
        <p className="text-xl text-[#A2BDDB]/60 leading-relaxed mb-8">
          Every developer has been there: your API goes viral, HN front page, or a influencer tweets your link — and within minutes, your backend crumbles under the traffic.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-6">The Problem: Traditional Architecture</h2>
        
        <p className="text-[#A2BDDB]/50 leading-relaxed mb-6">
          Most backends are built for steady, predictable traffic. They assume:
        </p>
        
        <ul className="list-disc list-inside text-[#A2BDDB]/50 space-y-3 mb-8">
          <li>Traffic comes in at a steady rate</li>
          <li>Each request is independent</li>
          <li>Database can handle the load</li>
          <li>No malicious actors trying to abuse the system</li>
        </ul>

        <p className="text-[#A2BDDB]/50 leading-relaxed mb-6">
          In the real world, none of these assumptions hold. One viral tweet can bring 100,000 requests in 60 seconds. A single bot can hammer your API with thousands of requests per minute. And one clever attacker can bring down your entire database with a simple SQL injection.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-6">What Happens Without Protection</h2>

        <div className="bg-zinc-900/50 border border-red-500/20 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-red-400 mb-3">Without an API Gateway</h3>
          <ul className="space-y-2 text-[#A2BDDB]/50">
            <li>Bots hammer your API with thousands of requests per second</li>
            <li>Same database query runs 1000x unnecessarily on hot paths</li>
            <li>SQL injection slips right past your bare endpoint</li>
            <li>Duplicate payments processed when user retries a payment</li>
            <li>Zero visibility into traffic hitting your raw server</li>
          </ul>
        </div>

        <h2 className="text-2xl font-bold text-white mt-12 mb-6">The Solution: API Gateway Architecture</h2>

        <p className="text-[#A2BDDB]/50 leading-relaxed mb-6">
          An API gateway sits between your clients and your backend, providing a layer of protection and optimization:
        </p>

        <div className="bg-zinc-900/50 border border-emerald-500/20 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-emerald-400 mb-3">With Backport Gateway</h3>
          <ul className="space-y-2 text-[#A2BDDB]/50">
            <li>Rate limiter drops abusers before they touch your code</li>
            <li>LRU cache serves repeated responses in microseconds</li>
            <li>WAF intercepts malicious payloads at the gateway layer</li>
            <li>Idempotency keys ensure each operation runs exactly once</li>
            <li>Real-time dashboard shows every request, hit, and block</li>
          </ul>
        </div>

        <h2 className="text-2xl font-bold text-white mt-12 mb-6">Understanding Rate Limiting</h2>

        <p className="text-[#A2BDDB]/50 leading-relaxed mb-6">
          Rate limiting is the first line of defense against abuse. Backport uses a sliding window algorithm:
        </p>

        <pre className="bg-black rounded-lg p-4 overflow-x-auto mb-6">
          <code className="text-emerald-400 text-sm">
{`# Sliding Window Rate Limiting
# Window: 60 seconds
# Limit: 100 requests per minute (Free plan)

Request 1: timestamp 10:00:00 -> Allowed (1/60)
Request 2: timestamp 10:00:15 -> Allowed (2/60)
...
Request 60: timestamp 10:00:59 -> Allowed (60/60)
Request 61: timestamp 10:01:00 -> Rate Limited (HTTP 429)

# Old requests expire, new ones can be processed
Request 62: timestamp 10:01:01 -> Allowed (2/60)
`}
          </code>
        </pre>

        <h2 className="text-2xl font-bold text-white mt-12 mb-6">Caching: The Secret Weapon</h2>

        <p className="text-[#A2BDDB]/50 leading-relaxed mb-6">
          Caching is the most effective way to reduce backend load. An LRU (Least Recently Used) cache can significantly reduce database queries for frequently accessed read endpoints:
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-zinc-900/50 rounded-xl p-6 border border-red-500/20">
            <h4 className="text-lg font-bold text-red-400 mb-3">Without Cache</h4>
            <p className="text-[#A2BDDB]/50 text-sm mb-4">
              Every request hits the database:
            </p>
            <ul className="text-[#A2BDDB]/30 text-sm space-y-1">
              <li>Request 1: 200ms (DB Query)</li>
              <li>Request 2: 200ms (DB Query)</li>
              <li>Request 3: 200ms (DB Query)</li>
              <li>...</li>
              <li>Request 1000: 200ms (DB Query)</li>
            </ul>
          </div>
          <div className="bg-zinc-900/50 rounded-xl p-6 border border-emerald-500/20">
            <h4 className="text-lg font-bold text-emerald-400 mb-3">With LRU Cache</h4>
            <p className="text-[#A2BDDB]/50 text-sm mb-4">
              Repeated requests served from memory:
            </p>
            <ul className="text-[#A2BDDB]/30 text-sm space-y-1">
              <li>Request 1: 200ms (DB Query)</li>
              <li>Request 2: 0.4ms (Cache HIT)</li>
              <li>Request 3: 0.4ms (Cache HIT)</li>
              <li>...</li>
              <li>Request 1000: 0.4ms (Cache HIT)</li>
            </ul>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mt-12 mb-6">Conclusion</h2>

        <p className="text-[#A2BDDB]/50 leading-relaxed mb-6">
          Traditional backends are not designed to handle traffic spikes, bot abuse, or malicious attacks. By adding an API gateway like Backport in front of your backend, you get:
        </p>

        <ul className="list-disc list-inside text-[#A2BDDB]/50 space-y-3 mb-8">
          <li>Protection against DDoS and bot abuse</li>
          <li>Reduced database load through caching</li>
          <li>Security against SQL injection and XSS</li>
          <li>Reliability through idempotency</li>
          <li>Visibility into your API traffic</li>
        </ul>

        <p className="text-[#A2BDDB]/50 leading-relaxed">
          Best of all, Backport requires zero code changes to your existing backend. Just point your traffic through the gateway and you&apos;re protected.
        </p>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-8 mb-16">
        <h3 className="text-2xl font-bold text-white mb-4">Ready to Protect Your API?</h3>
        <p className="text-[#A2BDDB]/50 mb-6">
          Get started with Backport in 30 seconds. No code changes required.
        </p>
        <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-emerald-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-emerald-400 transition-colors">
          Start Free <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Author */}
      <div className="flex items-center gap-4 p-6 bg-zinc-900/50 rounded-2xl mb-16">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xl">
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
