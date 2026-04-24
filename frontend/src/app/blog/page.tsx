"use client";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowRight, Calendar, Clock, Search } from "lucide-react";
import { useState } from "react";

const POSTS = [
  {
    title: "Why We Built Backport: An Open-Source API Gateway for Developers Who Just Want to Ship",
    description: "The story behind Backport — why we built an open-source API gateway, how it works, and how you can start protecting your API in 30 seconds.",
    date: "April 10, 2026",
    author: "Sohail Qureshi",
    readTime: "4 min read",
    slug: "why-we-built-backport",
    tag: "Open Source",
    image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800",
    featured: true,
  },
  {
    title: "Why Traditional Backends Fail Under Burst Traffic",
    description: "How API gateways prevent database thrashing using sliding-window rate limits and intelligent caching. A deep dive into handling traffic spikes.",
    date: "March 28, 2026",
    author: "Sohail Qureshi",
    readTime: "8 min read",
    slug: "why-backends-fail",
    tag: "Performance",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
    featured: true,
  },
  {
    title: "How Backport's WAF Blocks Malicious Requests",
    description: "A look at our 17 regex-based WAF patterns covering SQL injection, XSS, path traversal, command injection, LDAP injection, and XXE.",
    date: "March 22, 2026",
    author: "Backport Team",
    readTime: "5 min read",
    slug: "waf-2-announcement",
    tag: "Security",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800",
    featured: true,
  },
];

const CATEGORIES = ["All", "Security", "Performance", "Open Source"];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = POSTS.filter(post => {
    const matchesCategory = selectedCategory === "All" || post.tag === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPosts = filteredPosts.filter(p => p.featured);
  const regularPosts = filteredPosts.filter(p => !p.featured);

  return (
    <div className="relative min-h-screen bg-[#080C10] text-[#e2e2e2]">
      <Header />
      <div className="mx-auto max-w-6xl px-6 py-24 pt-32 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#04e184]/[0.08] border border-[#04e184]/20 text-[#04e184] text-xs font-bold mb-6">
            ENGINEERING BLOG
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            API Security <span className="text-[#04e184]">Insights</span>
          </h1>
          <p className="text-xl text-[#A2BDDB]/50 max-w-2xl mx-auto">
            Deep dives into how Backport works and why API security matters.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A2BDDB]/30" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-[#A2BDDB]/30 focus:outline-none focus:border-[#04e184]/30 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#04e184] text-[#080C10]'
                    : 'bg-white/[0.03] text-[#A2BDDB]/40 hover:bg-white/[0.06]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="mb-16">
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#04e184]/20 transition-all overflow-hidden"
                >
                  <div className="aspect-video bg-[#0A0E14] overflow-hidden">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" />
                  </div>
                  <div className="p-6">
                    <span className="inline-block px-3 py-1 rounded-full bg-[#04e184]/[0.08] text-[#04e184] text-xs font-medium mb-4">
                      {post.tag}
                    </span>
                    <h2 className="text-xl font-bold text-white group-hover:text-[#04e184] transition-colors mb-2">
                      {post.title}
                    </h2>
                    <p className="text-[#A2BDDB]/40 mb-4 line-clamp-2">
                      {post.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-[#A2BDDB]/30 font-mono">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {post.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {post.readTime}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Regular Posts */}
        {regularPosts.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-6">
              All Articles
              <span className="text-[#A2BDDB]/20 font-normal ml-2">({regularPosts.length})</span>
            </h2>
            <div className="grid gap-6">
              {regularPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex gap-6 p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#04e184]/20 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[#A2BDDB]/40 text-xs font-medium">{post.tag}</span>
                      <span className="text-xs text-[#A2BDDB]/30 font-mono">{post.readTime}</span>
                    </div>
                    <h2 className="text-lg font-bold text-white group-hover:text-[#04e184] transition-colors mb-2">{post.title}</h2>
                    <p className="text-sm text-[#A2BDDB]/40 mb-4 line-clamp-2">{post.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#A2BDDB]/30 font-mono">{post.author}</span>
                      <ArrowRight className="w-4 h-4 text-[#A2BDDB]/20 group-hover:text-[#04e184] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* More coming */}
        <div className="mt-16 text-center p-12 rounded-2xl border border-dashed border-white/[0.06]">
          <p className="text-[#A2BDDB]/30 text-sm">More articles coming soon. Follow us on GitHub for updates.</p>
          <a
            href="https://github.com/Qureshi-1/Backport-io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#04e184] text-sm font-medium mt-4 hover:underline"
          >
            Star on GitHub <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
}
