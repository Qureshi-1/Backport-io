"use client";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Loader2, CheckCircle2, Gift, ArrowRight, ShieldCheck, Zap, Layers } from "lucide-react";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";

const PLANS = [
  {
    id: "free",
    name: "DEVELOPER",
    price: "$0",
    period: "/forever",
    desc: "For solo devs and side-project pioneers. No card required.",
    features: ["1,000 requests/day", "Basic WAF Rules", "Edge Rate Limiting", "Global Caching", "Idempotency (Standard)"],
    cta: "CURRENT_PROTOCOL",
    accent: "#e2e2e2",
  },
  {
    id: "plus",
    name: "CLOUD PRO",
    price: "$18",
    period: "/month",
    desc: "Unlimited power for growing apps. High frequency protection.",
    features: ["1,000,000 requests/day", "Advanced WAF Core", "Custom Throttling", "Private Cache Engine", "Priority Edge Ops"],
    cta: "UPGRADE_TO_PRO",
    highlight: true,
    accent: "#00F0FF",
    badge: "RECOMMENDED",
  },
  {
    id: "pro",
    name: "ENTERPRISE",
    price: "$39",
    period: "/month",
    desc: "Total isolation for mission-critical monoliths and clusters.",
    features: ["Unlimited requests", "Full WAF Customization", "SLA: 99.99% Guaranteed", "Dedicated Data Plane", "White-Glove Integration"],
    cta: "UNLOCK_ENTERPRISE",
    accent: "#34FF8C",
  },
];

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState("");
  const [isReferred, setIsReferred] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const user = await fetchApi("/api/user/me");
        setCurrentPlan(user.plan ?? "free");
        const refs = await fetchApi("/api/user/referrals");
        setIsReferred(refs.is_referred);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (planId === "free") return;
    try {
      setProcessingPlan(planId);
      setError("");

      const order = await fetchApi("/api/billing/create-order", { 
        method: "POST",
        body: JSON.stringify({ plan_id: planId })
      });

      if (order.mock) {
        const verify = await fetchApi("/api/billing/verify", {
          method: "POST",
          body: JSON.stringify({ mock: true, plan_id: planId }),
        });
        setCurrentPlan(verify.plan);
        setProcessingPlan(null);
        return;
      }

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Backport",
        description: `Backport ${planId.toUpperCase()} Upgrade` + (order.discount_applied ? " (Referral Discount)" : ""),
        order_id: order.order_id,
        handler: async function (response: any) {
          const verify = await fetchApi("/api/billing/verify", {
            method: "POST",
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: planId
            }),
          });
          if (verify.status === "success") {
            setCurrentPlan(planId);
            window.location.reload();
          }
        },
        theme: { color: "#00F0FF" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.message || "Could not initiate payment");
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#00F0FF]" />
        <span className="font-headline text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-black">SYNCING_BILL_DATA</span>
      </div>
    );

  return (
    <div className="max-w-7xl space-y-16 pb-20">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Header Layer */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 border-b border-white/5 pb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-[8px] font-headline tracking-[0.4em] font-black uppercase">
            PROTOCOL: BILLING_V4
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tighter text-white uppercase leading-none">
            Scale your <span className="text-[#00F0FF] text-glow-cyan">Presence</span>
          </h1>
          <p className="text-[#849495] font-headline text-[10px] uppercase tracking-[0.5em] font-black opacity-60">MANAGE_SUBSCRIPTION_LOGS</p>
        </div>

        {isReferred && currentPlan === "free" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#34FF8C]/5 border border-[#34FF8C]/20 p-6 monolith-card flex items-center gap-6"
          >
            <div className="w-12 h-12 border border-[#34FF8C]/30 flex items-center justify-center bg-black/40">
              <Gift className="w-6 h-6 text-[#34FF8C]" />
            </div>
            <div>
              <p className="text-xs font-black font-headline tracking-[0.2em] text-[#34FF8C] uppercase">REFERRAL_DISCOUNT_ARMED</p>
              <p className="text-[10px] text-white/50 uppercase font-headline tracking-widest mt-1">60% ONE-TIME REDUCTION APPLIED</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Plans Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0 border border-white/10">
        {PLANS.map((p, i) => {
          const isCurrent = currentPlan === p.id;
          const isPro = p.id === "plus" || p.id === "pro";

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative flex flex-col p-12 border border-white/5 transition-all duration-500 overflow-hidden min-h-[680px]
                ${isCurrent ? "bg-[#111111]/90 z-10 shadow-[0_0_60px_rgba(0,240,255,0.1)] monolith-card" : "bg-[#0e0e0e] hover:bg-[#111111]/40"}
              `}
            >
              {isCurrent && (
                <div className="absolute inset-x-0 top-0 h-1 bg-[#00F0FF] shadow-[0_0_20px_#00F0FF] z-20" />
              )}
              
              {p.badge && (
                <div className="absolute top-8 right-8 bg-[#00F0FF] text-[#003338] font-headline text-[9px] font-black px-3 py-1 uppercase tracking-widest shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                  {p.badge}
                </div>
              )}

              <div className="mb-12">
                <h3 className="text-[11px] font-headline tracking-[0.6em] font-black uppercase mb-4" style={{ color: p.accent }}>
                  {p.name}
                </h3>
                <div className="mb-8">
                  <span className="text-6xl font-headline font-black text-white tracking-tighter leading-none">
                    {p.price}
                  </span>
                  <span className="font-headline text-[10px] font-black text-[#849495] uppercase tracking-widest ml-3 opacity-40">
                    {p.period}
                  </span>
                </div>
                <p className="text-[#849495] font-body text-xs font-medium leading-relaxed opacity-80 border-b border-white/5 pb-8">{p.desc}</p>
              </div>

              <ul className="space-y-5 mb-14 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-4 text-[10px] font-headline uppercase tracking-[0.2em] text-[#b9cacb] font-black">
                    <CheckCircle2 className={`h-4 w-4 flex-shrink-0`} style={{ color: p.accent }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(p.id)}
                disabled={processingPlan === p.id || isCurrent}
                className={`w-full py-6 font-headline font-black text-[10px] uppercase tracking-[0.4em] transition-all relative overflow-hidden group
                  ${isCurrent 
                    ? "bg-white/5 text-zinc-500 border border-white/5 cursor-default" 
                    : p.highlight
                      ? "bg-[#00F0FF] text-[#003338] hover:bg-[#34FF8C] shadow-[0_0_40px_rgba(0,240,255,0.4)]"
                      : "border border-white/10 text-white hover:border-[#00F0FF] hover:text-[#00F0FF] hover:shadow-[0_0_30px_rgba(0,240,255,0.2)]"
                  }
                `}
              >
                {processingPlan === p.id ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-[#003338]" />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-white/40 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 opacity-20" />
                    <span className="relative z-10">{isCurrent ? "ACTIVE_NODE" : p.cta}</span>
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 monolith-card font-mono text-xs uppercase tracking-widest"
        >
          // ERROR_MSG: {error}
        </motion.div>
      )}

      {/* Footer Artifact */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-12 opacity-40">
        <div className="flex items-center gap-12 font-mono text-[9px] text-[#849495] font-bold tracking-[0.6em] uppercase">
          <div className="flex items-center gap-3"><ShieldCheck className="w-3 h-3" /> PCI_COMPLIANT</div>
          <div className="flex items-center gap-3"><Zap className="w-3 h-3" /> SSL_ENCRYPTED</div>
          <div className="flex items-center gap-3"><Layers className="w-3 h-3" /> RAZORPAY_ACTIVE</div>
        </div>
        <span className="font-mono text-[9px] text-[#849495] font-bold tracking-[0.6em] uppercase">GLOBAL_GATEWAY_V4.2.0</span>
      </div>
    </div>
  );
}
