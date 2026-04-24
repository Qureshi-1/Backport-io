"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchApi } from "@/lib/api";
import { useUser } from "@/lib/user-context";
import { GATEWAY_URL } from "@/lib/auth";
import {
  Key,
  Server,
  Terminal,
  Copy,
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const stepVariants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [backendUrl, setBackendUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [copied, setCopied] = useState(false);

  // ── Fetch API key on mount ────────────────────────────────────────────
  useEffect(() => {
    // Use cached context data for instant load
    if (user) {
      const keys = user.api_keys || [];
      if (keys.length > 0) {
        setApiKey(keys[0].key);
      }
      // Fetch settings separately (not in context)
      fetchApi("/api/user/settings")
        .then((settings) => {
          if (settings?.target_backend_url) {
            setBackendUrl(settings.target_backend_url);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      // Fallback: fetch everything
      fetchApi("/api/user/me")
        .then((res) => {
          const keys = res.api_keys || [];
          if (keys.length > 0) setApiKey(keys[0].key);
          return fetchApi("/api/user/settings");
        })
        .then((settings) => {
          if (settings?.target_backend_url) setBackendUrl(settings.target_backend_url);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  // ── Helpers ───────────────────────────────────────────────────────────
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const isValidUrl = (url: string) => /^https?:\/\/.+\..+/.test(url);

  const handleSaveUrl = async () => {
    setUrlError("");
    if (!backendUrl.trim()) {
      setUrlError("Please enter a backend URL.");
      return;
    }
    if (!isValidUrl(backendUrl)) {
      setUrlError("URL must start with http:// or https:// and include a domain.");
      return;
    }
    setSaving(true);
    try {
      await fetchApi("/api/user/settings", {
        method: "PUT",
        body: JSON.stringify({ target_backend_url: backendUrl.trim() }),
      });
      toast.success("Backend URL saved!");
      setStep(2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save backend URL.";
      toast.error(msg);
      setUrlError(msg);
    } finally {
      setSaving(false);
    }
  };

  const curlCommand = `curl ${GATEWAY_URL}/proxy/users \\
  -H "X-API-Key: ${apiKey}"`;

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#04e184]" />
      </div>
    );
  }

  // ── Step indicators ───────────────────────────────────────────────────
  const steps = [
    { label: "API Key", icon: Key },
    { label: "Backend URL", icon: Server },
    { label: "Start", icon: Terminal },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome to Backport
          </h1>
          <p className="text-sm text-[#A2BDDB]/60">
            Get your API gateway up and running in 3 steps.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.label} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isActive
                        ? "border-[#04e184] bg-[#04e184]/10 text-[#04e184]"
                        : isDone
                          ? "border-[#04e184]/40 bg-[#04e184]/10 text-[#04e184]/60"
                          : "border-white/[0.08] bg-white/[0.02] text-[#A2BDDB]/25"
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-medium tracking-wide ${
                      isActive
                        ? "text-[#04e184]"
                        : isDone
                          ? "text-[#A2BDDB]/50"
                          : "text-[#A2BDDB]/25"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`w-12 sm:w-20 h-[2px] mx-2 mb-5 rounded-full transition-colors duration-300 ${
                      i < step ? "bg-[#04e184]/30" : "bg-white/[0.06]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content card */}
        <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
          <AnimatePresence mode="wait">
            {/* ── Step 1: API Key ─────────────────────────────────────── */}
            {step === 0 && (
              <motion.div
                key="step-1"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="p-6 sm:p-8 space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#04e184]/10 border border-[#04e184]/20 flex items-center justify-center">
                    <Key className="w-5 h-5 text-[#04e184]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Your API Key
                    </h2>
                    <p className="text-sm text-[#A2BDDB]/50">
                      Step 1 of 3
                    </p>
                  </div>
                </div>

                <p className="text-sm text-[#A2BDDB]/70 leading-relaxed">
                  This is your API key. Use it in the{" "}
                  <code className="text-[#04e184] bg-[#04e184]/10 px-1.5 py-0.5 rounded text-xs font-mono">
                    X-API-Key
                  </code>{" "}
                  header for all requests.
                </p>

                {apiKey ? (
                  <div className="space-y-3">
                    <div className="relative group">
                      <pre className="bg-black/60 border border-white/[0.06] rounded-lg p-4 text-sm font-mono text-[#04e184] overflow-x-auto pr-12 select-all">
                        {apiKey}
                      </pre>
                      <button
                        onClick={() => handleCopy(apiKey)}
                        className="absolute top-3 right-3 p-2 rounded-md bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title="Copy key"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-4 h-4 text-[#04e184]" />
                        ) : (
                          <Copy className="w-4 h-4 text-[#A2BDDB]/50" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-[#A2BDDB]/30">
                      Keep this key secret. You can manage it from the API Keys
                      page.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>No API key found. Create one from the API Keys page.</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 bg-[#04e184] hover:bg-white text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-all min-h-[44px]"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Backend URL ─────────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step-2"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="p-6 sm:p-8 space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#6BA9FF]/10 border border-[#6BA9FF]/20 flex items-center justify-center">
                    <Server className="w-5 h-5 text-[#6BA9FF]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Set Target Backend URL
                    </h2>
                    <p className="text-sm text-[#A2BDDB]/50">
                      Step 2 of 3
                    </p>
                  </div>
                </div>

                <p className="text-sm text-[#A2BDDB]/70 leading-relaxed">
                  Enter the URL of your backend server. Backport will proxy all
                  incoming requests to this destination.
                </p>

                <div className="space-y-2">
                  <input
                    type="url"
                    value={backendUrl}
                    onChange={(e) => {
                      setBackendUrl(e.target.value);
                      setUrlError("");
                    }}
                    placeholder="https://api.myapp.com"
                    autoFocus
                    className={`w-full bg-black/50 border rounded-lg px-4 py-3 text-white text-sm focus:outline-none transition-colors min-h-[44px] ${
                      urlError
                        ? "border-red-500/50 focus:border-red-400"
                        : "border-white/[0.08] focus:border-[#6BA9FF]"
                    }`}
                  />
                  {urlError && (
                    <p className="flex items-center gap-1.5 text-xs text-red-400">
                      <AlertCircle className="w-3 h-3" />
                      {urlError}
                    </p>
                  )}
                  <p className="text-xs text-[#A2BDDB]/30">
                    Must start with http:// or https://
                  </p>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setStep(0)}
                    className="text-sm text-[#A2BDDB]/50 hover:text-[#A2BDDB] transition-colors min-h-[44px] px-3"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSaveUrl}
                    disabled={saving || !backendUrl.trim()}
                    className="flex items-center gap-2 bg-[#04e184] hover:bg-white text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save &amp; Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Start Sending Requests ─────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step-3"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="p-6 sm:p-8 space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#04e184]/10 border border-[#04e184]/20 flex items-center justify-center">
                    <Terminal className="w-5 h-5 text-[#04e184]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Start Sending Requests
                    </h2>
                    <p className="text-sm text-[#A2BDDB]/50">
                      Step 3 of 3
                    </p>
                  </div>
                </div>

                <p className="text-sm text-[#A2BDDB]/70 leading-relaxed">
                  Your gateway is ready. Send a test request using the command
                  below — traffic will be proxied to your backend at{" "}
                  <code className="text-[#6BA9FF] bg-[#6BA9FF]/10 px-1.5 py-0.5 rounded text-xs font-mono break-all">
                    {backendUrl || "<your-backend>"}
                  </code>
                  .
                </p>

                <div className="relative group">
                  <pre className="bg-black/60 border border-white/[0.06] rounded-lg p-4 text-sm font-mono text-[#A2BDDB] overflow-x-auto pr-12">
                    <code>{curlCommand}</code>
                  </pre>
                  <button
                    onClick={() => handleCopy(curlCommand)}
                    className="absolute top-3 right-3 p-2 rounded-md bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all min-w-[36px] min-h-[36px] flex items-center justify-center"
                    title="Copy command"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-[#04e184]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#A2BDDB]/50" />
                    )}
                  </button>
                </div>

                <div className="bg-[#04e184]/5 border border-[#04e184]/15 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-medium text-[#04e184] flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Setup complete
                  </p>
                  <p className="text-xs text-[#A2BDDB]/50 leading-relaxed">
                    You can further configure rate limiting, caching, WAF, and
                    more from the Settings page.
                  </p>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="text-sm text-[#A2BDDB]/50 hover:text-[#A2BDDB] transition-colors min-h-[44px] px-3"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-2 bg-[#04e184] hover:bg-white text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-all min-h-[44px]"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
