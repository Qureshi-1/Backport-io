"use client";

import { useEffect, useState } from "react";
import {
  Copy,
  Plus,
  Activity,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  CreditCard,
} from "lucide-react";
import { auth, GATEWAY_URL } from "@/lib/auth";

export default function BillingPage() {
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchMe();
  }, []);

  const fetchMe = async () => {
    try {
      const res = await fetch(`${GATEWAY_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${auth.getToken()}` },
      });
      const data = await res.json();
      if (res.ok && data.plan) {
        setPlan(data.plan);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById("razorpay-js")) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.id = "razorpay-js";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    if (plan === "pro") return;
    setUpgrading(true);
    try {
      // 1. Create Order on Backend
      const res = await fetch(`${GATEWAY_URL}/api/billing/create-order`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.getToken()}` },
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.detail || "Failed to create order");
        setUpgrading(false);
        return;
      }

      const orderData = await res.json();

      // 2. If backend uses Mock mode due to missing API keys
      if (orderData.mock) {
        await fetch(`${GATEWAY_URL}/api/billing/verify`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${auth.getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mock: true }),
        });
        setPlan("pro");
        window.location.reload();
        return;
      }

      // 3. Load Razorpay and open real payment modal
      const resLoad = await loadRazorpayScript();
      if (!resLoad) {
        alert("Razorpay SDK failed to load. Are you offline?");
        setUpgrading(false);
        return;
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Backpack API Gateway",
        description: "Upgrade to Pro Plan (Beta)",
        order_id: orderData.order_id,
        handler: async function (response: any) {
          const verifyRes = await fetch(`${GATEWAY_URL}/api/billing/verify`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${auth.getToken()}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          if (verifyRes.ok) {
            setPlan("pro");
            window.location.reload(); // Refresh immediately
          } else {
            alert("Payment verification failed on server");
            setUpgrading(false);
          }
        },
        prefill: {
          name: "Founder",
          email: "founder@startup.com",
          contact: "9999999999",
        },
        theme: {
          color: "#10b981", // Backpack emerald color
        },
        modal: {
          ondismiss: function () {
            setUpgrading(false);
          },
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error(err);
      alert("Something went wrong connecting to Razorpay");
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Billing & Plans
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Manage your subscription and usage limits.
        </p>
      </div>

      {/* Current Plan Overview */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-400 mb-1">
              Current Plan
            </p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-white capitalize">
                {plan}
              </span>
              {plan === "pro" && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> Active
                </span>
              )}
            </div>
          </div>
          {plan === "free" ? (
            <div className="text-right">
              <p className="text-sm font-medium text-zinc-400 mb-1">
                Usage Reset
              </p>
              <p className="text-sm text-white">1st of next month</p>
            </div>
          ) : (
            <div className="text-right">
              <p className="text-sm font-medium text-zinc-400 mb-1">
                Next Billing Date
              </p>
              <p className="text-sm text-white">Oct 4, 2026</p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 grid sm:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400 font-medium">
                Monthly Requests
              </span>
              <span className="text-xs text-white">
                {plan === "pro" ? "1M" : "10k"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[12%]" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400 font-medium">
                Max API Gateways
              </span>
              <span className="text-xs text-white">
                {plan === "pro" ? "10" : "1"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 w-[100%]" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400 font-medium">
                WAF Security
              </span>
              <span className="text-xs text-white">
                {plan === "pro" ? "Advanced" : "Basic"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${plan === "pro" ? "bg-purple-500" : "bg-zinc-600"} w-[100%]`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Call to Action */}
      {plan === "free" && (
        <div className="rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 p-1">
          <div className="bg-zinc-900 rounded-xl p-8 flex flex-col items-center text-center">
            <Zap className="h-10 w-10 text-emerald-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              Upgrade to Pro
            </h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto mb-8">
              Get up to 1,000,000 requests per month, create up to 10 API
              Gateways, and unlock advanced WAF rules to protect your backend
              from enterprise-level threats.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-3 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-60"
              >
                {upgrading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {upgrading ? "Processing..." : "Upgrade for $49/mo"}
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-4">
              Secure 1-click checkout via Razorpay (India & Global).
            </p>
          </div>
        </div>
      )}

      {/* Refer & Earn UI */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">
            🎁 Refer & Earn (Beta)
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Refer 1 friend to get a 10%–25% real-time discount key. Refer 10
            friends who upgrade to Plus/Pro, and you get the{" "}
            <strong className="text-emerald-400">
              Plus Plan FREE for lifetime!
            </strong>
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-1 lg:col-span-2 space-y-4">
            <label className="text-xs font-medium text-zinc-400">
              Your Unique Referral Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value="https://backpack.io/r/dev_9x2b3q"
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 px-4 text-sm text-white focus:outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    "https://backpack.io/r/dev_9x2b3q",
                  );
                  alert("Copied to clipboard!");
                }}
                className="flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition"
              >
                <Copy className="h-4 w-4" /> Copy
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              When a user signs up using this link, they get mapped to your
              account.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <p className="text-xs font-medium text-zinc-400 mb-2">
              Progress to Free Plus
            </p>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-3xl font-bold text-white">0</span>
              <span className="text-sm font-medium text-zinc-500 mb-1">
                / 10 Upgrades
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[5%]" />
            </div>
            <p className="text-[10px] text-zinc-400 mt-2">
              10 successful premium referrals left.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white">
              Your Earned Discount Keys
            </h3>
            <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded border border-emerald-500/20">
              1-Time Use Only
            </span>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-black/50 p-6 text-center text-sm text-zinc-500">
            No keys earned yet. Start referring friends to unlock your first 15%
            discount key!
          </div>
        </div>
      </div>
    </div>
  );
}
