"use client";
import { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { useUser } from "@/lib/user-context";
import { Loader2, CheckCircle2, ShieldCheck, Zap, Layers, ChevronDown, AlertTriangle, Tag, X, Gift, Sparkles, Receipt, CreditCard } from "lucide-react";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";
import { PRICING, detectUserCurrency, formatPrice, ALL_CURRENCIES, type CurrencyCode } from "@/lib/currency";
import ContactSalesModal from "@/components/ContactSalesModal";

export default function BillingPage() {
  const { user, loading: userLoading, error: userError, retry: _retry } = useUser();
  const [currentPlan, setCurrentPlan] = useState("free");
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [_rzpLoaded, setRzpLoaded] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Payment history state
  const [paymentHistory, setPaymentHistory] = useState<Array<{
    id: number;
    date: string;
    event_type: string;
    plan_name: string;
    amount: string;
    currency: string;
  }>>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [promoValid, setPromoValid] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoDescription, setPromoDescription] = useState("");

  // Detect currency once on mount
  useEffect(() => {
    setCurrency(detectUserCurrency());
  }, []);

  // Sync current plan from user context
  useEffect(() => {
    if (user?.plan) {
      setCurrentPlan(user.plan);
    }
  }, [user]);

  // Directly fetch plan from backend (fallback if context is slow)
  const fetchPlanDirectly = useCallback(async () => {
    try {
      const data = await fetchApi("/api/billing/plan");
      if (data?.plan) {
        setCurrentPlan(data.plan);
      }
    } catch {
      // Use context data as fallback
      if (user?.plan) setCurrentPlan(user.plan);
    }
  }, [user?.plan]);

  // Fetch payment history
  useEffect(() => {
    if (userLoading || !user) return;
    setHistoryLoading(true);
    fetchApi("/api/billing/history")
      .then((data) => {
        setPaymentHistory(Array.isArray(data) ? data : data?.history || []);
      })
      .catch(() => {
        // Silently fail - payment history is non-critical
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  }, [user, userLoading]);

  // If user is loaded but plan is still empty, fetch directly
  useEffect(() => {
    if (!userLoading && !currentPlan && user) {
      fetchPlanDirectly();
    }
  }, [userLoading, currentPlan, user, fetchPlanDirectly]);

  // Handle promo code validation
  const handleApplyPromo = async () => {
    const code = promoCode.trim();
    if (!code) {
      setPromoError("Please enter a promo code");
      return;
    }
    setPromoLoading(true);
    setPromoError("");
    setPromoSuccess("");
    try {
      const res = await fetchApi("/api/billing/validate-promo", {
        method: "POST",
        body: JSON.stringify({ promo_code: code }),
      });
      if (res.valid) {
        setPromoValid(true);
        setPromoDiscount(res.discount_percent);
        setPromoDescription(res.description);
        setPromoSuccess(`${res.discount_percent}% discount applied!`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid promo code";
      setPromoValid(false);
      setPromoDiscount(0);
      // Extract detail from fetchApi error
      try {
        const parsed = JSON.parse(msg);
        setPromoError(parsed.detail || parsed.message || "Invalid promo code");
      } catch {
        setPromoError(msg);
      }
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode("");
    setPromoValid(false);
    setPromoDiscount(0);
    setPromoDescription("");
    setPromoError("");
    setPromoSuccess("");
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === "free" || planId === currentPlan) return;

    // Check if Razorpay script is loaded
    if (typeof window !== "undefined" && !(window as any).Razorpay) {
      setError("Payment gateway is loading. Please wait a moment and try again.");
      return;
    }

    try {
      setProcessingPlan(planId);
      setError("");

      const order = await fetchApi("/api/billing/create-order", {
        method: "POST",
        body: JSON.stringify({
          plan_id: planId,
          promo_code: promoValid ? promoCode.trim() : null,
        }),
      });

      if (!order?.order_id || !order?.key_id) {
        setError("Invalid response from payment server. Please try again.");
        return;
      }

      // Build description with discount info
      const desc = order.discount_applied
        ? `Backport ${planId.toUpperCase()} Plan — ${order.discount_percent}% off`
        : `Backport ${planId.toUpperCase()} Plan`;

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Backport",
        description: desc,
        order_id: order.order_id,
        handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
          try {
            setVerifying(true);
            const verify = await fetchApi("/api/billing/verify", {
              method: "POST",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_id: planId,
              }),
            });
            if (verify.status === "success") {
              setCurrentPlan(planId);
              setVerifying(false);
              window.location.reload();
            } else {
              setVerifying(false);
              setError("Payment verification failed. Please contact support.");
            }
          } catch (verifyErr: unknown) {
            setVerifying(false);
            setError(verifyErr instanceof Error ? verifyErr.message : "Payment verification failed.");
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        modal: {
          ondismiss: function () {
            setProcessingPlan(null);
          },
        },
        theme: { color: "#04e184" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not initiate payment";
      if (msg.includes("503") || msg.includes("not available")) {
        setError("Payment system is temporarily unavailable. Please try again in a few minutes.");
      } else if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed")) {
        setError("Could not connect to server. Check your internet connection and try again.");
      } else {
        setError(msg);
      }
    } finally {
      setProcessingPlan(null);
    }
  };

  // Helper: apply discount to a price string
  const getDiscountedPrice = (originalPrice: string) => {
    if (!promoValid || promoDiscount <= 0) return null;
    const numStr = originalPrice.replace(/[^0-9.]/g, "");
    const num = parseFloat(numStr);
    if (isNaN(num)) return null;
    const discounted = num * (1 - promoDiscount / 100);
    const cur = PRICING[currency];
    return formatPrice(discounted, cur);
  };

  // Show loading while user context is loading (but don't block forever)
  if (userLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#04e184]" />
        <span className="font-headline text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-black">Loading billing data</span>
      </div>
    );
  }

  // If user is not authenticated, show auth error
  if (userError === "not_authenticated" || !user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-20 space-y-6">
        <AlertTriangle className="h-12 w-12 text-amber-400" />
        <div className="text-center space-y-2">
          <p className="text-white font-headline text-sm uppercase tracking-widest">Authentication Required</p>
          <p className="text-zinc-500 text-xs">Please log in to manage your billing.</p>
        </div>
        <button
          onClick={() => { window.location.href = "/auth/login"; }}
          className="px-6 py-3 bg-[#04e184] text-[#003338] font-headline text-[10px] font-black uppercase tracking-widest hover:bg-[#6BA9FF] transition-all"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-8 pb-20">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRzpLoaded(true)}
        onError={() => setError("Failed to load payment gateway. Please refresh the page.")}
      />

      {/* Header Layer */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 pb-6 sm:pb-8 border-b border-white/5">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#04e184]/10 border border-[#04e184]/30 text-[#04e184] text-[8px] font-headline tracking-[0.4em] font-black uppercase">
            Billing
          </div>
          <h1 className="text-2xl md:text-3xl font-headline font-black tracking-tighter text-white uppercase leading-none">
            Scale your <span className="text-[#04e184]">Presence</span>
          </h1>
          <p className="text-[#849495] font-headline text-[10px] uppercase tracking-[0.5em] font-black opacity-60">
            Manage your subscription &middot; Current: <span className="text-[#04e184]">{currentPlan.toUpperCase()}</span>
          </p>
        </div>
      </div>

      {/* Promo Code Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-5 sm:p-6 relative overflow-hidden"
      >
        {/* Decorative glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#04e184]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#6BA9FF]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-4 relative z-10">
          <Gift className="w-4 h-4 text-[#04e184]" />
          <h3 className="text-[11px] font-headline tracking-[0.6em] font-black uppercase text-white">
            Have a Promo Code?
          </h3>
        </div>

        {!promoValid ? (
          <div className="flex flex-col sm:flex-row gap-3 relative z-10">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); setPromoSuccess(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleApplyPromo(); }}
                placeholder="Enter promo code (e.g. BACKPORT20)"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-headline tracking-wider uppercase placeholder:text-zinc-600 focus:outline-none focus:border-[#04e184]/50 focus:ring-1 focus:ring-[#04e184]/20 transition-all"
                maxLength={20}
              />
            </div>
            <button
              onClick={handleApplyPromo}
              disabled={promoLoading || !promoCode.trim()}
              className="px-6 py-3 bg-[#04e184] text-[#003338] font-headline text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-[#6BA9FF] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[120px]"
            >
              {promoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  Apply
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#04e184]/10 border border-[#04e184]/30 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-[#04e184]" />
                <span className="text-[#04e184] font-headline text-[11px] font-black tracking-widest uppercase">{promoCode}</span>
              </div>
              <span className="text-white font-headline text-lg font-black">
                {promoDiscount}% <span className="text-[#04e184]">OFF</span>
              </span>
              <span className="text-zinc-500 font-headline text-[9px] uppercase tracking-wider hidden sm:inline">
                — {promoDescription}
              </span>
            </div>
            <button
              onClick={handleRemovePromo}
              className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-500 hover:text-white text-[9px] font-headline uppercase tracking-widest transition-colors"
            >
              <X className="w-3 h-3" />
              Remove
            </button>
          </div>
        )}

        {/* Promo messages */}
        <AnimatePresence>
          {promoError && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-rose-400 font-headline text-[9px] uppercase tracking-widest mt-3 relative z-10"
            >
              {promoError}
            </motion.p>
          )}
          {promoSuccess && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[#04e184] font-headline text-[9px] uppercase tracking-widest mt-3 flex items-center gap-2 relative z-10"
            >
              <Sparkles className="w-3 h-3" />
              {promoSuccess}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Active promo banner on all plans */}
        {promoValid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 pt-3 border-t border-white/5 relative z-10"
          >
            <p className="text-zinc-500 font-headline text-[9px] uppercase tracking-[0.3em]">
              Discount will be applied at checkout on all paid plans
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Currency Picker */}
      <div className="flex justify-end">
        <div className="relative">
          <button
            onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-[#A2BDDB] hover:text-white hover:border-white/20 transition-all"
          >
            {PRICING[currency].symbol} {currency}
            <ChevronDown className={`w-3 h-3 transition-transform ${showCurrencyPicker ? "rotate-180" : ""}`} />
          </button>
          {showCurrencyPicker && (
            <div className="absolute top-full mt-2 right-0 bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50 min-w-[140px]">
              {ALL_CURRENCIES.map((c) => (
                <button
                  key={c}
                  onClick={() => { setCurrency(c); setShowCurrencyPicker(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-all ${
                    c === currency
                      ? "bg-[#04e184]/10 text-[#04e184]"
                      : "text-[#A2BDDB] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {PRICING[c].symbol} {PRICING[c].code}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Verifying payment overlay */}
      <AnimatePresence>
        {verifying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="glass-card rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm mx-4">
              <Loader2 className="h-10 w-10 animate-spin text-[#04e184]" />
              <p className="text-white font-headline text-sm uppercase tracking-widest">Verifying Payment</p>
              <p className="text-zinc-500 text-xs text-center">Please wait while we confirm your payment...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plans Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(() => {
          const cur = PRICING[currency];
          const plusPrice = formatPrice(cur.plus, cur);
          const proPrice = formatPrice(cur.pro, cur);
          const plans = [
            {
              id: "free",
              name: "FREE",
              price: "$0",
              period: "/3 months",
              desc: "Try everything free for 3 months. No card required.",
              features: ["100 requests / minute", "WAF protection (17 patterns)", "Rate limiting", "1 API key", "LRU caching & idempotency", "Dashboard analytics"],
              cta: "Current Plan",
              accent: "#e2e2e2",
            },
            {
              id: "plus",
              name: "PLUS",
              price: plusPrice,
              period: "/month",
              desc: "For growing APIs with transformation and mocking.",
              features: ["500 requests / minute", "Advanced WAF (17 patterns)", "Response transformation", "API mocking", "3 API keys", "JSON + CSV log export"],
              cta: "Upgrade to Plus",
              highlight: true,
              accent: "#04e184",
              badge: "RECOMMENDED",
            },
            {
              id: "pro",
              name: "PRO",
              price: proPrice,
              period: "/month",
              desc: "For production APIs with full power and custom rules.",
              features: ["5,000 requests / minute", "Custom WAF rules", "10 API keys", "Webhook notifications", "Full analytics + auto docs", "Priority support"],
              cta: "Upgrade to Pro",
              accent: "#6BA9FF",
            },
            {
              id: "enterprise",
              name: "ENTERPRISE",
              price: "Custom",
              period: "Contract-based",
              desc: "Unlimited scale for enterprise teams and critical workloads.",
              features: ["Unlimited requests / minute", "Custom WAF + rate rules", "50 API keys", "Team collaboration", "Dedicated support & SLA", "Custom integrations"],
              cta: "Contact Sales",
              accent: "#ffd700",
              badge: "ENTERPRISE",
              enterprise: true,
            },
          ];
          return plans;
        })().map((p, i) => {
          const isCurrent = currentPlan === p.id;
          const discountedPrice = getDiscountedPrice(p.price);
          const showDiscount = promoValid && !p.enterprise && p.id !== "free";

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card rounded-2xl relative flex flex-col p-5 sm:p-6 lg:p-8 transition-all duration-500 overflow-hidden min-h-[320px] sm:min-h-[420px]
                ${isCurrent ? "z-10 shadow-[0_0_60px_rgba(44,232,195,0.1)]" : "hover:border-white/[0.1]"}
              `}
            >
              {isCurrent && (
                <div className="absolute inset-x-0 top-0 h-1 bg-[#04e184] shadow-[0_0_20px_#04e184] z-20" />
              )}

              {p.badge && (
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-[#04e184] text-[#003338] font-headline text-[9px] font-black px-3 py-1 uppercase tracking-widest shadow-[0_0_15px_rgba(44,232,195,0.4)]">
                  {p.badge}
                </div>
              )}

              {/* Discount badge on card */}
              {showDiscount && (
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] font-headline text-[8px] font-black px-2.5 py-1 uppercase tracking-widest z-10 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {promoDiscount}% OFF
                </div>
              )}

              <div className="mb-6 sm:mb-8">
                <h3 className="text-[11px] font-headline tracking-[0.6em] font-black uppercase mb-4" style={{ color: p.accent }}>
                  {p.name}
                </h3>
                <div className="mb-2">
                  <span className="text-3xl sm:text-4xl font-headline font-black text-white tracking-tighter leading-none">
                    {showDiscount && discountedPrice ? (
                      <span className="text-[#04e184]">{discountedPrice}</span>
                    ) : (
                      p.price
                    )}
                  </span>
                  {showDiscount && (
                    <span className="ml-2 font-headline text-sm font-black text-zinc-600 line-through">
                      {p.price}
                    </span>
                  )}
                  <span className="font-headline text-[10px] font-black text-[#849495] uppercase tracking-widest ml-3 opacity-40">
                    {p.period}
                  </span>
                </div>
                {showDiscount && (
                  <p className="text-[#04e184] font-headline text-[9px] uppercase tracking-widest mb-2 opacity-70">
                    You save {(parseFloat(p.price.replace(/[^0-9.]/g, "")) * promoDiscount / 100).toFixed(2)} {currency}
                  </p>
                )}
                <p className="text-[#849495] font-body text-xs font-medium leading-relaxed opacity-80 border-b border-white/5 pb-6">{p.desc}</p>
              </div>

              <ul className="space-y-3 mb-6 sm:mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[10px] font-headline uppercase tracking-[0.2em] text-[#b9cacb] font-black">
                    <CheckCircle2 className={`h-4 w-4 flex-shrink-0`} style={{ color: p.accent }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => p.enterprise ? setShowContactModal(true) : handleUpgrade(p.id)}
                disabled={processingPlan === p.id || isCurrent || verifying || undefined}
                className={`w-full py-4 sm:py-5 font-headline font-black text-[10px] uppercase tracking-[0.4em] transition-all relative overflow-hidden group min-h-[44px]
                  ${isCurrent
                    ? "bg-white/5 text-zinc-500 border border-white/5 cursor-default"
                    : p.highlight
                      ? "bg-[#04e184] text-[#003338] hover:bg-[#6BA9FF] shadow-[0_0_40px_rgba(44,232,195,0.4)]"
                      : p.enterprise
                        ? "bg-[#ffd700]/10 text-[#ffd700] border border-[#ffd700]/30 hover:bg-[#ffd700]/20 hover:border-[#ffd700]/50"
                        : "border border-white/10 text-white hover:border-[#04e184] hover:text-[#04e184] hover:shadow-[0_0_30px_rgba(44,232,195,0.2)]"
                  }
                `}
              >
                {(processingPlan === p.id || (verifying && !p.enterprise)) ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-[#003338]" />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-white/40 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 opacity-20" />
                    <span className="relative z-10">
                      {showDiscount ? `Get ${promoDiscount}% Off` : isCurrent ? "Active" : p.cta}
                    </span>
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
          className="glass-card rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 font-mono text-xs uppercase tracking-widest flex items-center justify-between"
        >
          <span>// ERROR: {error}</span>
          <button onClick={() => setError("")} className="text-rose-400/60 hover:text-rose-400 ml-4 text-lg leading-none">&times;</button>
        </motion.div>
      )}

      {/* ─── Payment History ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-5 sm:p-6 relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#6BA9FF]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-6 relative z-10">
          <Receipt className="w-4 h-4 text-[#6BA9FF]" />
          <h3 className="text-[11px] font-headline tracking-[0.6em] font-black uppercase text-white">
            Payment History
          </h3>
        </div>

        {historyLoading ? (
          <div className="space-y-3 relative z-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl animate-pulse">
                <div className="w-24 h-3 bg-white/[0.06] rounded" />
                <div className="w-16 h-6 bg-white/[0.06] rounded-md" />
                <div className="flex-1 h-3 bg-white/[0.06] rounded" />
                <div className="w-20 h-3 bg-white/[0.06] rounded" />
              </div>
            ))}
          </div>
        ) : paymentHistory.length === 0 ? (
          <div className="text-center py-12 relative z-10">
            <CreditCard className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No payment history yet.</p>
            <p className="text-zinc-600 text-xs mt-1">Your transactions will appear here after your first purchase.</p>
          </div>
        ) : (
          <div className="space-y-2 relative z-10 max-h-96 overflow-y-auto no-scrollbar">
            {paymentHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:bg-white/[0.04] transition-colors"
              >
                {/* Date */}
                <div className="min-w-0 flex-shrink-0">
                  <p className="text-xs text-zinc-400 font-mono whitespace-nowrap">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Event type badge */}
                <span className={`flex-shrink-0 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border ${
                  entry.event_type === "purchase"
                    ? "bg-[#04e184]/10 text-[#04e184] border-[#04e184]/20"
                    : entry.event_type === "upgrade"
                      ? "bg-[#6BA9FF]/10 text-[#6BA9FF] border-[#6BA9FF]/20"
                      : entry.event_type === "refund"
                        ? "bg-[#ffd700]/10 text-[#ffd700] border-[#ffd700]/20"
                        : "bg-white/5 text-zinc-400 border-white/10"
                }`}>
                  {entry.event_type}
                </span>

                {/* Plan name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {entry.plan_name}
                  </p>
                </div>

                {/* Amount */}
                <div className="flex-shrink-0 text-right">
                  <p className={`text-sm font-bold ${
                    entry.event_type === "refund" ? "text-[#ffd700]" : "text-white"
                  }`}>
                    {entry.event_type === "refund" ? "-" : ""}{entry.currency === "INR" ? "₹" : "$"}{parseFloat(entry.amount).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Footer Artifact */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 sm:pt-8 opacity-40">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 sm:gap-x-4 gap-y-2 font-mono text-[9px] text-[#849495] font-bold tracking-[0.4em] uppercase">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" />PCI</span>
          <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" />SSL</span>
          <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" />Razorpay</span>
        </div>
        <span className="font-mono text-[9px] text-[#849495] font-bold tracking-[0.4em] uppercase">v4.2.0</span>
      </div>

      <ContactSalesModal open={showContactModal} onClose={() => setShowContactModal(false)} />
    </div>
  );
}
