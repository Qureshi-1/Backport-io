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
    <div className="relative min-h-screen bg-[#0e0e0e] text-[#e2e2e2]">
      
      <div className="mx-auto max-w-7xl px-6 py-24 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-[10px] uppercase font-headline tracking-widest font-bold mb-6">
            <span className="h-2 w-2 rounded-full bg-[#00F0FF] animate-pulse" />
            PRICING TIERS
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-headline uppercase tracking-widest text-white mb-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
            Choose Your <span className="text-[#00F0FF] drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]">Plan</span>
          </h1>
          <p className="text-xl text-[#849495] font-mono max-w-2xl mx-auto uppercase tracking-widest text-[14px]">
            From individual developers to enterprise teams. Scale as you grow.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {tiers.map((tier) => (
            <div 
              key={tier.name} 
              className={`relative p-8 rounded-none border transition-all ${
                tier.popular 
                  ? 'border-[#00F0FF]/50 bg-[#00F0FF]/5 shadow-[0_0_40px_rgba(0,240,255,0.15)]' 
                  : 'border-[#3b494b]/50 bg-[#111111]/80 hover:border-[#00F0FF]/30'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#00F0FF] text-[#003338] text-[10px] font-headline tracking-widest uppercase font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                  MOST POPULAR
                </div>
              )}
              
              <tier.icon className="w-10 h-10 mb-4" style={{ color: tier.color }} />
              <span className="text-[10px] font-headline font-bold text-[#849495] uppercase tracking-[0.2em]">{tier.name}</span>
              <h3 className="text-xl font-headline font-bold text-[#e2e2e2] uppercase tracking-widest mt-1 mb-2">{tier.subtitle}</h3>
              <p className="text-sm text-[#849495] font-mono mb-6">{tier.description}</p>
              
              <div className="mb-6">
                <span className="text-4xl font-headline font-bold text-[#00F0FF]">{tier.price}</span>
                {tier.period && <span className="text-[#849495] font-mono text-sm ml-1 uppercase">{tier.period}</span>}
              </div>

              <Link 
                href={tier.href}
                className={`block w-full py-4 text-center rounded-none font-headline font-bold text-[11px] uppercase tracking-widest transition-all mb-8 ${
                  tier.popular 
                    ? 'bg-[#00F0FF] text-[#003338] hover:bg-[#34FF8C] hover:shadow-[0_0_20px_rgba(52,255,140,0.3)]' 
                    : 'border border-[#3b494b] text-[#b9cacb] hover:text-[#00F0FF] hover:border-[#00F0FF] hover:shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                }`}
              >
                {tier.cta}
              </Link>

              <ul className="space-y-3">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs font-mono">
                    {f.included ? (
                      <CheckCircle2 className="w-4 h-4 text-[#34FF8C] flex-shrink-0" />
                    ) : (
                      <span className="w-4 h-4 text-[#3b494b] flex-shrink-0">✗</span>
                    )}
                    <span className={f.included ? 'text-[#b9cacb]' : 'text-[#849495]'}>{f.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold font-headline uppercase tracking-widest text-white mb-8 text-center drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
            Detailed <span className="text-[#00F0FF] drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]">Comparison</span>
          </h2>
          <div className="overflow-x-auto rounded-none border border-[#3b494b]/50 bg-[#111111]/80 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#3b494b]/50">
                  <th className="p-4 text-[#849495] font-headline uppercase tracking-widest text-[11px]">Feature</th>
                  <th className="p-4 text-center text-[#00F0FF] font-headline uppercase tracking-widest text-[11px]">Video</th>
                  <th className="p-4 text-center text-[#34FF8C] font-headline uppercase tracking-widest text-[11px]">Indie</th>
                  <th className="p-4 text-center text-yellow-400 font-headline uppercase tracking-widest text-[11px]">Startup</th>
                  <th className="p-4 text-center text-rose-400 font-headline uppercase tracking-widest text-[11px]">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3b494b]/30">
                {comparisons.map((row) => (
                  <tr key={row.feature} className="hover:bg-[#00F0FF]/5 transition-colors font-mono text-sm">
                    <td className="p-4 text-[#e2e2e2] font-medium">{row.feature}</td>
                    <td className="p-4 text-center text-[#849495]">{row.video}</td>
                    <td className="p-4 text-center text-[#849495]">{row.indie}</td>
                    <td className="p-4 text-center text-[#849495]">{row.startup}</td>
                    <td className="p-4 text-center text-[#849495]">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Use Case Breakdown */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold font-headline uppercase tracking-widest text-[#e2e2e2] mb-8 text-center drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
            Which Tier is <span className="text-[#00F0FF] drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]">Right for You</span>?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-none border border-[#00F0FF]/20 bg-[#00F0FF]/5 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
              <Film className="w-10 h-10 text-[#00F0FF] mb-4" />
              <h3 className="text-xl font-headline tracking-widest uppercase font-bold text-[#e2e2e2] mb-2">Video / Streaming</h3>
              <p className="text-[#849495] font-mono text-[11px] mb-4">
                Building a video platform, streaming service, or CDN? Start with our free Video tier and get basic rate limiting, WAF protection, and caching.
              </p>
              <ul className="space-y-2 text-[#849495] font-mono text-[11px]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#00F0FF]" /> Handle traffic spikes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#00F0FF]" /> Protect against scraping</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#00F0FF]" /> Cache popular content</li>
              </ul>
            </div>
            
            <div className="p-8 rounded-none border border-[#34FF8C]/20 bg-[#34FF8C]/5 shadow-[0_0_20px_rgba(52,255,140,0.1)]">
              <Users className="w-10 h-10 text-[#34FF8C] mb-4" />
              <h3 className="text-xl font-headline tracking-widest uppercase font-bold text-[#e2e2e2] mb-2">Indie / Hobby</h3>
              <p className="text-[#849495] font-mono text-[11px] mb-4">
                Building a side project or personal API? Our free Indie tier gives you everything you need to ship without worrying about infrastructure.
              </p>
              <ul className="space-y-2 text-[#849495] font-mono text-[11px]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#34FF8C]" /> No credit card required</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#34FF8C]" /> Full WAF protection</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#34FF8C]" /> Focus on building</li>
              </ul>
            </div>
            
            <div className="p-8 rounded-none border border-yellow-500/20 bg-yellow-500/5 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
              <Briefcase className="w-10 h-10 text-yellow-400 mb-4" />
              <h3 className="text-xl font-headline tracking-widest uppercase font-bold text-[#e2e2e2] mb-2">Startup / MVP</h3>
              <p className="text-[#849495] font-mono text-[11px] mb-4">
                Scaling your team and product? The Startup tier gives you enterprise features at a fraction of the cost.
              </p>
              <ul className="space-y-2 text-[#849495] font-mono text-[11px]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-400" /> Scale with traffic</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-400" /> Advanced analytics</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-400" /> Priority support</li>
              </ul>
            </div>
            
            <div className="p-8 rounded-none border border-rose-500/20 bg-rose-500/5 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
              <Building2 className="w-10 h-10 text-rose-400 mb-4" />
              <h3 className="text-xl font-headline tracking-widest uppercase font-bold text-[#e2e2e2] mb-2">Enterprise</h3>
              <p className="text-[#849495] font-mono text-[11px] mb-4">
                Mission-critical infrastructure? Get dedicated resources, custom SLAs, and 24/7 support.
              </p>
              <ul className="space-y-2 text-[#849495] font-mono text-[11px]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-400" /> Dedicated VPC</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-400" /> Custom integrations</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-400" /> 24/7 phone support</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ROI Calculator Preview */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold font-headline uppercase tracking-widest text-white mb-8 text-center drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
            Calculate Your <span className="text-[#00F0FF] drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]">Savings</span>
          </h2>
          <div className="p-8 rounded-none border border-[#00F0FF]/20 bg-[#00F0FF]/5">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <Zap className="w-10 h-10 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                <h3 className="text-4xl font-headline tracking-widest font-bold text-white mb-2">90%</h3>
                <p className="text-[#849495] font-mono text-[11px] uppercase tracking-widest">Database cost reduction with caching</p>
              </div>
              <div>
                <Shield className="w-10 h-10 text-[#34FF8C] mx-auto mb-4 drop-shadow-[0_0_8px_rgba(52,255,140,0.5)]" />
                <h3 className="text-4xl font-headline tracking-widest font-bold text-white mb-2">94%</h3>
                <p className="text-[#849495] font-mono text-[11px] uppercase tracking-widest">Less API abuse with rate limiting</p>
              </div>
              <div>
                <Database className="w-10 h-10 text-[#00F0FF] mx-auto mb-4 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
                <h3 className="text-4xl font-headline tracking-widest font-bold text-white mb-2">60%</h3>
                <p className="text-[#849495] font-mono text-[11px] uppercase tracking-widest">Cheaper than AWS API Gateway</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold font-headline uppercase tracking-widest text-[#e2e2e2] mb-8 text-center drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
            Frequently Asked <span className="text-[#00F0FF] drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]">Questions</span>
          </h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              { q: "Can I change plans later?", a: "Yes! You can upgrade instantly and downgrade at the end of your billing cycle." },
              { q: "What happens if I exceed my limit?", a: "Requests will return HTTP 429. You can upgrade anytime to get more requests." },
              { q: "Is there a free trial for paid plans?", a: "Yes! The Startup plan comes with a 14-day free trial. No credit card required." },
              { q: "Can I self-host Backport?", a: "Yes! All plans support self-hosting with the same features." },
              { q: "Do you offer refunds?", a: "Yes, we offer a 30-day money-back guarantee on all paid plans." },
            ].map((faq, i) => (
              <div key={i} className="p-6 rounded-none border border-[#3b494b]/50 bg-[#111111]/80 backdrop-blur-sm">
                <h3 className="text-lg font-headline tracking-widest uppercase font-bold text-[#00F0FF] mb-2">{faq.q}</h3>
                <p className="text-[#849495] font-mono text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-4xl font-bold font-headline uppercase tracking-widest text-white mb-4 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
            Start <span className="text-[#34FF8C] drop-shadow-[0_0_15px_rgba(52,255,140,0.6)]">Protecting</span> Your APIs
          </h2>
          <p className="text-[#849495] font-mono uppercase tracking-[0.2em] mb-8 text-[11px]">No credit card required. Free forever for indie developers.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 bg-[#00F0FF] text-[#003338] px-8 py-4 font-headline uppercase tracking-widest font-bold hover:bg-[#34FF8C] hover:shadow-[0_0_20px_rgba(52,255,140,0.4)] transition-all">
              Initialize Uplink <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/setup-guide" className="inline-flex items-center justify-center gap-2 border border-[#3b494b] text-[#b9cacb] px-8 py-4 font-headline uppercase tracking-widest font-bold hover:border-[#00F0FF] hover:text-[#00F0FF] hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all">
              View Specs
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
