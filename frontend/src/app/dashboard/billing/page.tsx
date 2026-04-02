"use client";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Loader2, CheckCircle2, Circle, Gift } from "lucide-react";
import Script from "next/script";

const PLANS = [
  {
    id: "free",
    name: "Hobby",
    price: "Free",
    period: "/forever",
    desc: "Perfect for side projects or early stage applications.",
    features: [
      "10,000 Requests / month",
      "Community driven WAF",
      "Basic WAF patterns",
      "In-memory Cache",
      "Community support",
    ],
    cta: "Current Plan",
    highlight: false,
  },
  {
    id: "plus",
    name: "Plus",
     price: "$18",
    period: "/month",
    desc: "Perfect for indie hackers.",
    features: [
      "250,000 Requests / month",
      "Standard WAF rules",
      "Up to 3 API Gateways",
      "Managed Hosting",
      "Email support",
    ],
    cta: "Get Plus",
    highlight: false,
  },
  {
    id: "pro",
    name: "Cloud Pro",
     price: "$39",
    period: "/month",
    desc: "For teams handling traffic.",
    features: [
      "1,000,000 Requests / mo",
      "AI-enhanced WAF rules",
      "Up to 10 API Gateways",
      "Distributed Redis",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    highlight: true,
    badge: "MOST POPULAR",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For massive scale and dedicated infrastructure.",
    features: [
      "Custom Volume Limits",
      "Custom Rate Limits",
      "Unlimited Gateways",
      "Dedicated VPC Deployment",
      "24/7 Phone Support",
    ],
    cta: "Contact Sales",
    highlight: false,
    muted: true,
  },
];

export default function BillingPage() {
  const [plan, setPlan] = useState("");
  const [isReferred, setIsReferred] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchApi("/api/user/me")
      .then((res) => {
        setPlan(res.plan ?? "free");
        setIsReferred(res.referral_code && res.referrals_count !== undefined); // Check if they can see referral info
        // Well, we added 'is_referred' to the /api/user/referrals endpoint. Let's check that instead or just use the field we added to /me if we added it there (we didn't add is_referred to /me yet).
      });
      
    fetchApi("/api/user/referrals")
      .then(res => {
         setIsReferred(res.is_referred);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleUpgrade = async (planId: string) => {
    try {
      setProcessingPlan(planId);
      setError("");

      const order = await fetchApi("/api/billing/create-order", { 
        method: "POST",
        body: JSON.stringify({ plan_id: planId })
      });

      if (order.mock) {
        alert(order.discount_applied ? `🧪 Test mode: 60% Referral Discount Active! Pay only ${order.amount/100} INR` : `🧪 Test mode: Razorpay not configured. Upgrading to ${planId.toUpperCase()}.`);
        const verify = await fetchApi("/api/billing/verify", {
          method: "POST",
          body: JSON.stringify({ mock: true, plan_id: planId }),
        });
        setPlan(verify.plan);
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
          if (verify.status === "success") setPlan(planId);
        },
        theme: { color: "#00F0FF" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
      rzp.on("payment.failed", (resp: any) => {
        setError(resp.error.description || "Payment failed");
      });
    } catch (err: any) {
      setError(err.message || "Could not initiate payment");
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loading)
    return (
      <div className="flex items-center gap-2 text-zinc-400 p-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );

  return (
    <div className="max-w-5xl space-y-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline tracking-widest text-[#e2e2e2] mb-2 uppercase font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">Billing & Plans</h1>
          <p className="text-[#849495] font-mono text-sm uppercase tracking-widest">Manage your subscription.</p>
        </div>
        
        {isReferred && plan !== "pro" && (
          <div className="bg-[#34FF8C]/10 border border-[#34FF8C]/30 px-4 py-2 rounded-none flex items-center gap-3">
            <Gift className="w-5 h-5 text-[#34FF8C]" />
            <div>
              <p className="text-xs font-bold font-headline tracking-widest text-[#34FF8C]">REFERRAL BONUS ACTIVE</p>
              <p className="text-[10px] text-[#34FF8C]/70 uppercase font-mono">60% One-time discount applied</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLANS.map((p) => {
          const isCurrent = plan === p.id || (plan === "free" && p.id === "free");
          const isClickable = (p.id === "pro" || p.id === "plus") && plan !== p.id;

          return (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-none border p-8 transition-all group overflow-hidden
                ${isCurrent ? "border-[#00F0FF] bg-[#111111]/80 backdrop-blur-md shadow-[0_0_30px_rgba(0,240,255,0.15)]" : "border-[#3b494b]/30 bg-[#0e0e0e] hover:border-[#00F0FF]/40"}
              `}
            >
              {isCurrent && (
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-[#00F0FF] rounded-full opacity-10 blur-3xl" />
              )}
              {/* Badge */}
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00F0FF] text-[#003338] font-headline text-[10px] font-bold px-3 py-1 uppercase tracking-widest shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                  {p.badge}
                </div>
              )}
              {isCurrent && (
                <div className="absolute top-0 right-0 bg-[#00F0FF] text-[#003338] text-[10px] font-headline tracking-widest uppercase font-bold px-3 py-1">
                  CURRENT
                </div>
              )}

              <h3 className="text-xl font-headline tracking-widest text-[#00F0FF] mb-1 font-bold uppercase">{p.name}</h3>
              <p className="text-[#849495] font-mono text-xs mb-4">{p.desc}</p>

              <div className="mb-5">
                <span className={`text-4xl font-headline font-bold ${p.muted ? "text-[#b9cacb]" : "text-[#e2e2e2]"}`}>
                  {p.price}
                </span>
                {p.period && (
                  <span className="text-zinc-500 text-sm ml-1">{p.period}</span>
                )}
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-zinc-300">
                    {p.muted ? (
                      <Circle className="h-3.5 w-3.5 text-[#3b494b] mt-0.5 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#34FF8C] mt-0.5 flex-shrink-0" />
                    )}
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {isClickable ? (
                <button
                  onClick={() => handleUpgrade(p.id)}
                  disabled={processingPlan === p.id}
                  className="w-full bg-[#00F0FF] hover:bg-[#34FF8C] text-[#003338] text-[11px] font-headline tracking-widest font-bold py-4 uppercase transition-all hover:shadow-[0_0_20px_rgba(52,255,140,0.3)] disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {processingPlan === p.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  {processingPlan === p.id ? "Processing..." : p.cta}
                </button>
              ) : p.id === "enterprise" ? (
                <a
                  href="mailto:support@backport.dev"
                  className="w-full border border-[#3b494b] hover:border-[#00F0FF] text-[#b9cacb] hover:text-[#00F0FF] text-[11px] font-headline tracking-widest font-bold py-4 text-center transition-all block uppercase"
                >
                  {p.cta}
                </a>
              ) : isCurrent ? (
                <div className="w-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-[11px] font-headline tracking-widest font-bold py-4 text-center uppercase">
                  ✓ Active Plan
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(p.id)}
                  disabled={processingPlan === p.id}
                  className="w-full border border-[#3b494b] hover:border-[#00F0FF] text-[#b9cacb] hover:text-[#00F0FF] hover:shadow-[0_0_15px_rgba(0,240,255,0.15)] text-[11px] font-headline tracking-widest font-bold py-4 text-center transition-all uppercase flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {processingPlan === p.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  {processingPlan === p.id ? "Processing..." : p.cta}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
