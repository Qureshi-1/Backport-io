"use client";
import { CheckCircle2, Code2, Database, Activity, Zap, Shield, Sparkles, Lock, CreditCard } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const CHANGES = [
  {
    version: "v2.0.0",
    name: "The Gateway Update",
    date: "April 2026",
    color: "emerald",
    items: [
      { icon: Code2, text: "Response Transformation — modify API responses on the fly without touching your backend" },
      { icon: Database, text: "API Mocking — define mock endpoints for frontend development and testing" },
      { icon: Shield, text: "Custom WAF Rules — write your own regex security patterns beyond the built-in 17" },
      { icon: Activity, text: "Webhook Notifications — real-time alerts to Slack, Discord, or any URL" },
      { icon: Zap, text: "Full Analytics Dashboard — latency heatmaps, slow endpoint detection, threat alerts, request replay" },
    ]
  },
  {
    version: "v1.2.0",
    name: "The Payments Update",
    date: "April 2026",
    color: "blue",
    items: [
      { icon: CreditCard, text: "Razorpay payment integration — Plus and Pro plans available" },
      { icon: Shield, text: "Analytics engine with automated security and performance alerts" },
      { icon: Lock, text: "Full API log export (JSON and CSV) from the dashboard" },
    ]
  },
  {
    version: "v1.1.0",
    name: "The Performance Update",
    date: "March 2026",
    color: "blue",
    items: [
      { icon: Zap, text: "In-memory LRU caching for GET requests (5-minute TTL)" },
      { icon: Shield, text: "17 regex-based WAF patterns covering 6 attack categories" },
      { icon: Sparkles, text: "Real-time dashboard analytics with traffic charts and latency distribution" },
    ]
  },
  {
    version: "v1.0.0",
    name: "Initial Release",
    date: "February 2026",
    color: "zinc",
    items: [
      { icon: CheckCircle2, text: "Core reverse proxy engine with request forwarding" },
      { icon: Zap, text: "Sliding-window rate limiting per plan (100/500/5,000 req/min)" },
      { icon: CheckCircle2, text: "Idempotency key support for POST/PUT/PATCH deduplication" },
      { icon: CheckCircle2, text: "Admin panel for user management and feedback system" },
    ]
  }
];

export default function Changelog() {
  return (
    <div className="relative min-h-screen bg-[#080C10] text-zinc-300">
      <Header />
      <div className="mx-auto max-w-3xl px-6 py-24 pt-32 relative z-10">
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Changelog</h1>
        <p className="text-[#A2BDDB]/30 mb-16">What&apos;s new in each release. We ship frequently.</p>
        
        <div className="space-y-16">
          {CHANGES.map((change, idx) => (
            <div key={change.version} className="relative pl-8 border-l border-zinc-800">
              <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-4 border-[#080C10] ${
                change.color === 'emerald' ? 'bg-[#04e184]' :
                change.color === 'blue' ? 'bg-[#6BA9FF]' :
                'bg-zinc-700'
              }`} />
              
              <div className="mb-2 flex items-center gap-3">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  change.color === 'emerald' ? 'border-[#04e184]/30 text-[#04e184] bg-[#04e184]/10' :
                  change.color === 'blue' ? 'border-[#6BA9FF]/30 text-[#6BA9FF] bg-[#6BA9FF]/10' :
                  'border-zinc-800 text-zinc-500 bg-zinc-900'
                }`}>
                  {change.version}
                </span>
                <span className="text-sm text-[#A2BDDB]/30 font-mono">{change.date}</span>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-6">{change.name}</h2>
              
              <ul className="space-y-4">
                {change.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 group">
                    <item.icon className={`w-5 h-5 mt-0.5 transition-colors ${
                      change.color === 'emerald' ? 'text-[#04e184]/50 group-hover:text-[#04e184]' :
                      change.color === 'blue' ? 'text-[#6BA9FF]/50 group-hover:text-[#6BA9FF]' :
                      'text-[#A2BDDB]/30 group-hover:text-[#A2BDDB]/60'
                    }`} />
                    <span className="text-[#A2BDDB]/50 group-hover:text-[#A2BDDB]/80 transition-colors">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
