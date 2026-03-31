"use client";
import Link from "next/link";
import { ArrowRight, Calendar, User, Clock, Tag, Filter, Search } from "lucide-react";
import MatrixBackground from "@/components/MatrixBackground";
import { useState } from "react";

const POSTS = [
  {
    title: "Why Traditional Backends Fail Under Burst Traffic",
    description: "Learn how API gateways like Backport prevent database thrashing using sliding-window rate limits and intelligent caching. A deep dive into handling traffic spikes without infrastructure panic.",
    date: "March 28, 2026",
    author: "Sohail Qureshi",
    readTime: "8 min read",
    slug: "why-backends-fail",
    tag: "Performance",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
    featured: true
  },
  {
    title: "Introducing WAF 2.0: Stopping SQLi in 30 Seconds",
    description: "A deep dive into our new Web Application Firewall engine and how it intercepts malicious payloads without slowing down legitimate requests.",
    date: "March 22, 2026",
    author: "Backport Team",
    readTime: "5 min read",
    slug: "waf-2-announcement",
    tag: "Security",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800",
    featured: true
  },
  {
    title: "Building a Real-time Analytics Dashboard with Backport",
    description: "Step-by-step guide to building a real-time analytics dashboard for your API traffic using Backport's logging and metrics APIs.",
    date: "March 18, 2026",
    author: "Sohail Qureshi",
    readTime: "12 min read",
    slug: "realtime-analytics",
    tag: "Tutorial",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
    featured: false
  },
  {
    title: "The Complete Guide to API Idempotency",
    description: "Understanding idempotency keys and how they prevent duplicate payments, double-processing, and other critical failures in production systems.",
    date: "March 15, 2026",
    author: "Backport Team",
    readTime: "10 min read",
    slug: "api-idempotency-guide",
    tag: "Tutorial",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800",
    featured: false
  },
  {
    title: "Self-Hosting vs Managed API Gateway: Pros & Cons",
    description: "Compare the costs, benefits, and trade-offs of self-hosting an API gateway versus using a managed service like Backport Cloud.",
    date: "March 10, 2026",
    author: "Sohail Qureshi",
    readTime: "7 min read",
    slug: "self-hosted-vs-managed",
    tag: "Comparison",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
    featured: false
  },
  {
    title: "How to Protect Your Video Streaming API from Scraping",
    description: "Practical strategies and Backport features to prevent content scraping, credential stuffing, and API abuse on video platforms.",
    date: "March 5, 2026",
    author: "Backport Team",
    readTime: "9 min read",
    slug: "protect-video-api",
    tag: "Security",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800",
    featured: false
  },
];

const CATEGORIES = ["All", "Security", "Tutorial", "Performance", "Comparison", "Announcement", "Engineering"];

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
    <div className="relative min-h-screen bg-black text-zinc-300">
      <MatrixBackground />
      
      <div className="mx-auto max-w-6xl px-6 py-24 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            ENGINEERING BLOG
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Insights on <span className="text-emerald-400">API Security</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Deep dives, tutorials, and best practices for building secure and scalable APIs.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-emerald-500 text-black' 
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
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
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Featured Articles
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <Link 
                  key={post.slug} 
                  href={`/blog/${post.slug}`}
                  className="group block rounded-2xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-900 hover:border-emerald-500/30 transition-all overflow-hidden"
                >
                  <div className="aspect-video bg-zinc-800 overflow-hidden">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                  </div>
                  <div className="p-6">
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-4">
                      {post.tag}
                    </span>
                    <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors mb-2">
                      {post.title}
                    </h2>
                    <p className="text-zinc-400 mb-4 line-clamp-2">
                      {post.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-zinc-500 font-mono">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {post.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {post.readTime}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All Posts */}
        <section>
          <h2 className="text-xl font-bold text-white mb-6">
            {selectedCategory === "All" ? "All Articles" : selectedCategory}
            <span className="text-zinc-500 font-normal ml-2">({filteredPosts.length})</span>
          </h2>
          
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-zinc-800">
              <p className="text-zinc-500">No articles found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {regularPosts.map((post) => (
                <Link 
                  key={post.slug} 
                  href={`/blog/${post.slug}`}
                  className="group flex gap-6 p-6 rounded-2xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-900 hover:border-emerald-500/30 transition-all"
                >
                  <div className="hidden md:block w-32 h-24 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-xs font-medium">
                        {post.tag}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">{post.readTime}</span>
                    </div>
                    <h2 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors mb-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                      {post.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-mono">{post.author}</span>
                      <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Newsletter */}
        <section className="mt-20 p-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Stay Updated</h2>
          <p className="text-zinc-400 mb-6">Get the latest tutorials and updates delivered to your inbox.</p>
          <div className="flex max-w-md mx-auto gap-3">
            <input 
              type="email"
              placeholder="your@email.com"
              className="flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            <button className="bg-emerald-500 text-black px-6 py-3 rounded-lg font-bold hover:bg-emerald-400 transition-colors">
              Subscribe
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
