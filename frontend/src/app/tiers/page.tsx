"use client";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Film, Users, Briefcase, Building2, Zap, Shield, Database, Clock, Phone, Mail, Globe, Server } from "lucide-react";
import MatrixBackground from "@/components/MatrixBackground";

export default function TiersPage() {
  const tiers = [
    {
      icon: Film,
      name: "VIDEO",
      subtitle: "Content Creators & Streaming",
      price: "Free",
      period: "forever",
      color: "#00F0FF",
      description: "Perfect for video APIs, streaming services, and CDN protection.",
      features: [
        { text: "50,000 requests/month", included: true },
        { text: "Basic WAF protection", included: true },
        { text: "Rate limiting (60 req/min)", included: true },
        { text: "1 API Gateway", included: true },
        { text: "In-memory cache", included: true },
        { text: "Email support", included: true },
        { text: "AI-enhanced WAF", included: false },
        { text: "Multi-gateway", included: false },
        { text: "Dedicated VPC", included: false },
      ],
      cta: "Start Free",
      href: "/auth/signup?plan=video"
    },
    {
      icon: Users,
      name: "INDIE",
      subtitle: "Solo Developers & Hobbyists",
      price: "$0",
      period: "forever",
      color: "#34FF8C",
      description: "Built for individual developers building side projects.",
      features: [
        { text: "50,000 requests/month", included: true },
        { text: "Full WAF protection", included: true },
        { text: "Rate limiting (60 req/min)", included: true },
        { text: "1 API Gateway", included: true },
        { text: "LRU Cache", included: true },
        { text: "Idempotency keys", included: true },
        { text: "Community support", included: true },
        { text: "Basic analytics", included: true },
        { text: "API key management", included: true },
      ],
      cta: "Get Started",
      href: "/auth/signup?plan=indie",
      popular: true
    },
    {
      icon: Briefcase,
      name: "STARTUP",
      subtitle: "Growing Teams & MVPs",
      price: "$39",
      period: "/month",
      color: "#ffd700",
      description: "For teams scaling from prototype to production.",
      features: [
        { text: "1,000,000 requests/month", included: true },
        { text: "AI-enhanced WAF", included: true },
        { text: "Rate limiting (1000 req/min)", included: true },
        { text: "Up to 10 Gateways", included: true },
        { text: "Distributed Redis cache", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Priority support", included: true },
        { text: "Custom domain SSL", included: true },
        { text: "Webhook alerts", included: true },
      ],
      cta: "Start Trial",
      href: "/auth/signup?plan=startup"
    },
    {
      icon: Building2,
      name: "ENTERPRISE",
      subtitle: "Large Scale & Mission Critical",
      price: "Custom",
      period: "",
      color: "#ff6b6b",
      description: "Dedicated infrastructure with SLA guarantees.",
      features: [
        { text: "Unlimited requests", included: true },
        { text: "Custom WAF rules", included: true },
        { text: "Custom rate limits", included: true },
        { text: "Unlimited Gateways", included: true },
        { text: "Dedicated VPC", included: true },
        { text: "24/7 Phone support", included: true },
        { text: "SLA guarantee", included: true },
        { text: "White-label option", included: true },
        { text: "Custom integrations", included: true },
      ],
      cta: "Contact Sales",
      href: "mailto:enterprise@backportio.com"
    }
  ];

  const comparisons = [
    { feature: "Requests/month", video: "50,000", indie: "50,000", startup: "1,000,000", enterprise: "Unlimited" },
    { feature: "API Gateways", video: "1", indie: "1", startup: "10", enterprise: "Unlimited" },
    { feature: "WAF Protection", video: "Basic", indie: "Full", startup: "AI-Enhanced", enterprise: "Custom" },
    { feature: "Rate Limit", video: "60/min", indie: "60/min", startup: "1000/min", enterprise: "Custom" },
    { feature: "Cache", video: "In-memory", indie: "LRU Cache", startup: "Distributed Redis", enterprise: "Custom" },
    { feature: "Analytics", video: "Basic", indie: "Basic", startup: "Advanced", enterprise: "Custom" },
    { feature: "Support", video: "Email", indie: "Community", startup: "Priority", enterprise: "24/7 Phone" },
    { feature: "SSL Certificates", video: "✓", indie: "✓", startup: "✓", enterprise: "Custom" },
    { feature: "Custom Domain", video: "✗", indie: "✗", startup: "✓", enterprise: "✓" },
    { feature: "VPC Deployment", video: "✗", indie: "✗", startup: "✗", enterprise: "✓" },
    { feature: "SLA", video: "✗", indie: "✗", startup: "99.9%", enterprise: "99.99%" },
  ];

  return (
    <div className="relative min-h-screen bg-black text-zinc-300">
      <MatrixBackground />
      
      <div className="mx-auto max-w-7xl px-6 py-24 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            PRICING TIERS
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Choose Your <span className="text-emerald-400">Plan</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            From individual developers to enterprise teams. Scale as you grow.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {tiers.map((tier) => (
            <div 
              key={tier.name} 
              className={`relative p-8 rounded-2xl border transition-all ${
                tier.popular 
                  ? 'border-emerald-500/50 bg-emerald-500/5' 
                  : 'border-white/5 bg-zinc-900/50 hover:border-white/10'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-black text-xs font-bold">
                  MOST POPULAR
                </div>
              )}
              
              <tier.icon className="w-10 h-10 mb-4" style={{ color: tier.color }} />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{tier.name}</span>
              <h3 className="text-lg font-bold text-white mt-1 mb-2">{tier.subtitle}</h3>
              <p className="text-sm text-zinc-400 mb-6">{tier.description}</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                {tier.period && <span className="text-zinc-500 ml-1">{tier.period}</span>}
              </div>

              <Link 
                href={tier.href}
                className={`block w-full py-3 text-center rounded-xl font-bold text-sm transition-colors mb-8 ${
                  tier.popular 
                    ? 'bg-emerald-500 text-black hover:bg-emerald-400' 
                    : 'border border-white/20 text-white hover:bg-white/5'
                }`}
              >
                {tier.cta}
              </Link>

              <ul className="space-y-3">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    {f.included ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <span className="w-4 h-4 text-zinc-600 flex-shrink-0">✗</span>
                    )}
                    <span className={f.included ? 'text-zinc-300' : 'text-zinc-600'}>{f.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Detailed <span className="text-emerald-400">Comparison</span>
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/50">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-4 text-zinc-400 font-medium">Feature</th>
                  <th className="p-4 text-center text-cyan-400 font-bold">Video</th>
                  <th className="p-4 text-center text-emerald-400 font-bold">Indie</th>
                  <th className="p-4 text-center text-yellow-400 font-bold">Startup</th>
                  <th className="p-4 text-center text-rose-400 font-bold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparisons.map((row) => (
                  <tr key={row.feature} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-zinc-300 font-medium">{row.feature}</td>
                    <td className="p-4 text-center text-zinc-400">{row.video}</td>
                    <td className="p-4 text-center text-zinc-400">{row.indie}</td>
                    <td className="p-4 text-center text-zinc-400">{row.startup}</td>
                    <td className="p-4 text-center text-zinc-400">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Use Case Breakdown */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Which Tier is <span className="text-emerald-400">Right for You</span>?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
              <Film className="w-10 h-10 text-cyan-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Video / Streaming</h3>
              <p className="text-zinc-400 mb-4">
                Building a video platform, streaming service, or CDN? Start with our free Video tier and get basic rate limiting, WAF protection, and caching.
              </p>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Handle traffic spikes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Protect against scraping</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Cache popular content</li>
              </ul>
            </div>
            
            <div className="p-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
              <Users className="w-10 h-10 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Indie / Hobby</h3>
              <p className="text-zinc-400 mb-4">
                Building a side project or personal API? Our free Indie tier gives you everything you need to ship without worrying about infrastructure.
              </p>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card required</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Full WAF protection</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Focus on building</li>
              </ul>
            </div>
            
            <div className="p-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
              <Briefcase className="w-10 h-10 text-yellow-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Startup / MVP</h3>
              <p className="text-zinc-400 mb-4">
                Scaling your team and product? The Startup tier gives you enterprise features at a fraction of the cost.
              </p>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-400" /> Scale with traffic</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-400" /> Advanced analytics</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-400" /> Priority support</li>
              </ul>
            </div>
            
            <div className="p-8 rounded-2xl border border-rose-500/20 bg-rose-500/5">
              <Building2 className="w-10 h-10 text-rose-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
              <p className="text-zinc-400 mb-4">
                Mission-critical infrastructure? Get dedicated resources, custom SLAs, and 24/7 support.
              </p>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-400" /> Dedicated VPC</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-400" /> Custom integrations</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-400" /> 24/7 phone support</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ROI Calculator Preview */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Calculate Your <span className="text-emerald-400">Savings</span>
          </h2>
          <div className="p-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <Zap className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-white mb-2">90%</h3>
                <p className="text-zinc-400">Database cost reduction with caching</p>
              </div>
              <div>
                <Shield className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-white mb-2">94%</h3>
                <p className="text-zinc-400">Less API abuse with rate limiting</p>
              </div>
              <div>
                <Database className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-white mb-2">60%</h3>
                <p className="text-zinc-400">Cheaper than AWS API Gateway</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Frequently Asked <span className="text-emerald-400">Questions</span>
          </h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              { q: "Can I change plans later?", a: "Yes! You can upgrade instantly and downgrade at the end of your billing cycle." },
              { q: "What happens if I exceed my limit?", a: "Requests will return HTTP 429. You can upgrade anytime to get more requests." },
              { q: "Is there a free trial for paid plans?", a: "Yes! The Startup plan comes with a 14-day free trial. No credit card required." },
              { q: "Can I self-host Backport?", a: "Yes! All plans support self-hosting with the same features." },
              { q: "Do you offer refunds?", a: "Yes, we offer a 30-day money-back guarantee on all paid plans." },
            ].map((faq, i) => (
              <div key={i} className="p-6 rounded-xl border border-white/5 bg-zinc-900/30">
                <h3 className="text-lg font-bold text-white mb-2">{faq.q}</h3>
                <p className="text-zinc-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start <span className="text-emerald-400">Protecting</span> Your APIs
          </h2>
          <p className="text-zinc-400 mb-8">No credit card required. Free forever for indie developers.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-emerald-500 text-black px-8 py-4 rounded-xl font-bold hover:bg-emerald-400 transition-colors">
              Start Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/setup-guide" className="inline-flex items-center gap-2 border border-white/20 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/5 transition-colors">
              View Setup Guide
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
