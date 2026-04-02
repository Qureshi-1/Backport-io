"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
// @ts-ignore
import { animate, stagger } from "animejs";
import {
  CheckCircle2,
  ArrowRight,
  Gift,
  TerminalSquare,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/auth";

/* ─── Pricing ─────────────────────────────────────────────────────────────── */
export const Pricing = () => {
  const [isYearly, setIsYearly] = useState(true);
  const plans = [
    {
      name: "STEALTH",
      sub: "Free forever",
      price: "$0",
      period: "",
      desc: "For indie devs and students. No credit card required.",
      features: [
        "50,000 Requests / month",
        "Basic WAF",
        "1 API Gateway",
        "Redis Cache",
        "Community support",
      ],
      cta: "Deploy Now",
      href: "/auth/signup",
      accent: "#00F0FF",
      hot: false,
    },
    {
      name: "CLOUD PRO",
      sub: isYearly ? "Billed $468/yr" : "Billed monthly",
      price: isYearly ? "$39" : "$49",
      period: "/mo",
      desc: "For teams shipping at scale.",
      features: [
        "1,000,000 Requests / month",
        "AI-enhanced WAF",
        "Up to 10 Gateways",
        "Distributed Redis",
        "Priority support",
      ],
      cta: "Get Cloud Pro",
      href: "/auth/signup?plan=cloud_pro",
      accent: "#34FF8C",
      hot: true,
    },
    {
      name: "ENTERPRISE",
      sub: "Custom terms",
      price: "Custom",
      period: "",
      desc: "Dedicated VPC. Unlimited gateways.",
      features: [
        "Unlimited volume",
        "Custom rate limits",
        "Unlimited gateways",
        "Dedicated VPC",
        "24/7 phone support",
      ],
      cta: "Contact Sales",
      href: "mailto:support@backportio.com",
      accent: "#849495",
      hot: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-[#0e0e0e] border-t border-[#3b494b]/10">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-16">
          <span className="text-[#00F0FF] font-headline text-[10px] uppercase tracking-[0.3rem] font-bold block mb-3">
            PRICING MATRIX
          </span>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter uppercase text-[#e2e2e2]">
              Access <span className="text-[#34FF8C]">Tiers</span>
            </h2>
            {/* Toggle */}
            <div className="flex items-center gap-4">
              <span
                className={`font-headline text-[11px] uppercase tracking-widest ${
                  !isYearly ? "text-white" : "text-[#849495]"
                }`}
              >
                Monthly
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative w-14 h-7 transition-colors ${
                  isYearly ? "bg-[#34FF8C]" : "bg-[#353535]"
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-[#0e0e0e] transition-all ${
                    isYearly ? "left-8" : "left-1"
                  }`}
                />
              </button>
              <span
                className={`font-headline text-[11px] uppercase tracking-widest ${
                  isYearly ? "text-[#34FF8C]" : "text-[#849495]"
                }`}
              >
                Yearly{" "}
                <span className="text-[#34FF8C] text-[9px] ml-1">-20%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#3b494b]/15">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative flex flex-col p-10 border border-[#3b494b]/20 hover:border-[#00F0FF]/40 transition-all group overflow-hidden ${
                plan.hot ? "bg-[#111111]/90" : "bg-[#0e0e0e]/80"
              } backdrop-blur-md`}
            >
              {/* Subtle background glow */}
              <div 
                className="absolute -right-20 -top-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-10 transition-opacity blur-3xl"
                style={{ backgroundColor: plan.accent }}
              />
              {plan.hot && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#34FF8C] shadow-[0_0_10px_#34FF8C]" />
              )}
              <div className="mb-8">
                <div
                  className="text-[10px] font-headline uppercase tracking-[0.3rem] mb-1 drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]"
                  style={{ color: plan.accent }}
                >
                  {plan.name}
                </div>
                <div className="text-[10px] font-headline uppercase tracking-widest text-[#849495]">
                  {plan.sub}
                </div>
              </div>
              <div className="mb-8">
                <span className="font-headline text-5xl font-bold text-white tracking-tighter">
                  {plan.price}
                </span>
                <span className="font-headline text-sm text-[#849495] ml-1">
                  {plan.period}
                </span>
              </div>
              <p className="text-sm text-[#849495] mb-8 border-b border-[#3b494b]/20 pb-8">
                {plan.desc}
              </p>
              <ul className="space-y-3 mb-10 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-[#b9cacb]">
                    <CheckCircle2
                      suppressHydrationWarning
                      className="h-4 w-4 flex-shrink-0"
                      style={{ color: plan.accent }}
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`block w-full py-5 text-center font-headline text-[11px] uppercase tracking-[0.3rem] font-bold transition-all relative overflow-hidden group/btn ${
                  plan.hot
                    ? "bg-[#34FF8C] text-[#0e0e0e] hover:bg-[#00F0FF] shadow-[0_0_20px_rgba(52,255,140,0.3)]"
                    : "border border-[#3b494b]/40 text-[#e2e2e2] hover:border-[#00F0FF] hover:text-[#00F0FF] hover:shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                }`}
              >
                <span className="relative z-10">{plan.cta}</span>
                {plan.hot && (
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                )}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Refer & Earn Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 border border-[#34FF8C]/15 bg-[#34FF8C]/5 p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 border border-[#34FF8C]/30 flex items-center justify-center">
              <Gift suppressHydrationWarning className="w-6 h-6 text-[#34FF8C]" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-white uppercase tracking-wider">
                Refer &amp; Earn
              </h3>
              <p className="text-sm text-[#849495] mt-1">
                Invite friends. Get 1 month Cloud Pro FREE per referral.
              </p>
            </div>
          </div>
          <Link
            href="/auth/signup?next=/dashboard/billing"
            className="flex items-center gap-2 bg-[#34FF8C] text-[#0e0e0e] px-8 py-3 font-headline uppercase text-[11px] tracking-[0.2rem] font-bold hover:bg-[#00F0FF] transition-colors whitespace-nowrap"
          >
            Get Referral Link{" "}
            <ArrowRight suppressHydrationWarning className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

/* ─── Final CTA ───────────────────────────────────────────────────────────── */
export const FinalCTA = ({ onDemo }: { onDemo: () => void }) => {
  const [isLogged, setIsLogged] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsLogged(auth.isLoggedIn());

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animate('.final-cta-anim', {
            translateY: [40, 0],
            opacity: [0, 1],
            ease: "outExpo",
            duration: 1200,
            delay: stagger(150)
          });
          if (sectionRef.current) observer.unobserve(sectionRef.current);
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#0e0e0e] py-32 border-t border-[#3b494b]/10">
      {/* Background effects */}
      <div className="absolute inset-0 bg-cyber-grid opacity-40 pointer-events-none" />
      <div className="absolute inset-0 scanline-bg opacity-15 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#00F0FF]/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <div className="space-y-8">
          <span className="final-cta-anim opacity-0 text-[#00F0FF] font-headline text-[10px] uppercase tracking-[0.3rem] font-bold block">
            INITIATE SEQUENCE
          </span>
          <h2
            className="final-cta-anim opacity-0 font-headline text-5xl md:text-7xl font-bold tracking-tighter leading-none text-[#e2e2e2] glitch-text"
            data-text="Your backend. Production-grade. In 30 seconds."
          >
            Your backend.
            <br />
            <span className="text-[#00F0FF] text-glow-cyan">
              Production-grade.
            </span>
            <br />
            In 30 seconds.
          </h2>
          <p className="final-cta-anim opacity-0 font-body text-[#b9cacb] text-xl max-w-xl mx-auto">
            Join developers shipping with confidence. Free to start. No credit
            card required.
          </p>
          <div className="final-cta-anim opacity-0 flex flex-col sm:flex-row items-center justify-center gap-5 mt-10">
            <Link
              href={isLogged ? "/dashboard" : "/auth/signup"}
              className="inline-flex items-center gap-3 bg-[#00F0FF] text-[#003338] px-12 py-5 font-headline font-extrabold uppercase tracking-widest text-base hover:bg-[#34FF8C] transition-all duration-300 shadow-[0_0_40px_rgba(0,240,255,0.25)] hover:shadow-[0_0_60px_rgba(52,255,140,0.35)] active:scale-95 group"
            >
              {isLogged ? "Go to Dashboard" : "Deploy Now — Free"}
              <ArrowRight
                suppressHydrationWarning
                className="h-5 w-5 group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <button
              onClick={() => {
                document
                  .getElementById("demo")
                  ?.scrollIntoView({ behavior: "smooth" });
                onDemo();
              }}
              className="inline-flex items-center gap-2 border border-[#3b494b]/30 px-8 py-5 font-headline uppercase text-[11px] tracking-[0.2rem] text-[#849495] hover:text-[#00F0FF] hover:border-[#00F0FF]/30 transition-colors"
            >
              <TerminalSquare suppressHydrationWarning className="h-4 w-4" />{" "}
              Watch Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── FAQ ─────────────────────────────────────────────────────────────────── */
const faqs = [
  {
    q: "Does Backport require code changes?",
    a: "Zero. Point your DNS to Backport's endpoint and you're done. No SDK, no middleware, no refactoring.",
  },
  {
    q: "How is it different from Cloudflare?",
    a: "Backport is developer-first and open source. You get idempotency, Redis caching, and WAF in a single self-hosted gateway — at a fraction of the cost.",
  },
  {
    q: "Can I self-host it?",
    a: "Yes, completely. Deploy on Docker, Railway, Fly.io, or any VPS. The free tier has no time limit.",
  },
  {
    q: "What languages / frameworks does it support?",
    a: "Any HTTP service — Express.js, FastAPI, Django, Rails, Laravel, Go, .NET. If it speaks HTTP, Backport protects it.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. The Stealth plan is permanently free with 50,000 requests/month and covers indie projects and students.",
  },
];

export const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 bg-[#0e0e0e] border-t border-[#3b494b]/10">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-16">
          <span className="text-[#34FF8C] font-headline text-[10px] uppercase tracking-[0.3rem] font-bold block mb-3">
            SYSTEM QUERIES
          </span>
          <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter uppercase text-[#e2e2e2]">
            Frequently Asked
          </h2>
        </div>
        <div className="space-y-px">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#0e0e0e] border border-[#3b494b]/15 hover:border-[#00F0FF]/15 transition-colors"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-8 text-left"
              >
                <span className="font-headline font-semibold text-[#e2e2e2] uppercase tracking-wide text-sm pr-8">
                  {faq.q}
                </span>
                <ChevronDown
                  suppressHydrationWarning
                  className={`w-5 h-5 text-[#00F0FF] flex-shrink-0 transition-transform duration-300 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-8 pb-8 text-[#b9cacb] text-sm leading-relaxed border-t border-[#3b494b]/10 pt-4">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
