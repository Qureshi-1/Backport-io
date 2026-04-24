"use client";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  Loader2,
  Plus,
  Trash2,
  ShieldAlert,
  Shield,
  ToggleLeft,
  ToggleRight,
  X,
  Activity,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface WAFCustomRule {
  id: number;
  name: string;
  pattern: string;
  action: string;
  severity: string;
  enabled: boolean;
  created_at: string;
}

interface WAFStats {
  total_hits: number;
  rules: Record<string, number>;
}

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  low: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
    icon: "bg-yellow-500/10 border-yellow-500/20",
  },
  medium: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
    icon: "bg-orange-500/10 border-orange-500/20",
  },
  high: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
    icon: "bg-red-500/10 border-red-500/20",
  },
  critical: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
    icon: "bg-purple-500/10 border-purple-500/20",
  },
};

const SEVERITY_LEVELS = ["low", "medium", "high", "critical"];

export default function WAFPage() {
  const [rules, setRules] = useState<WAFCustomRule[]>([]);
  const [stats, setStats] = useState<WAFStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Form state
  const [formName, setFormName] = useState("");
  const [formPattern, setFormPattern] = useState("");
  const [formAction, setFormAction] = useState("block");
  const [formSeverity, setFormSeverity] = useState("medium");

  const loadData = () => {
    setLoading(true);
    setError("");
    Promise.all([
      fetchApi("/api/custom-waf").catch(() => ({ rules: [] })),
      fetchApi("/api/custom-waf/stats").catch(() => ({ total_hits: 0, rules: {} })),
    ])
      .then(([rulesRes, statsRes]) => {
        const rulesArr = Array.isArray(rulesRes) ? rulesRes : (rulesRes as any)?.rules || [];
        setRules(rulesArr);
        setStats(statsRes || null);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load WAF rules");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormName("");
    setFormPattern("");
    setFormAction("block");
    setFormSeverity("medium");
    setError("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formPattern.trim()) {
      setError("Regex pattern is required");
      return;
    }

    setProcessing(true);
    try {
      await fetchApi("/api/custom-waf", {
        method: "POST",
        body: JSON.stringify({
          name: formName,
          pattern: formPattern,
          action: formAction,
          severity: formSeverity,
        }),
      });
      toast.success("WAF rule created successfully");
      setShowForm(false);
      resetForm();
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create rule";
      setError(msg);
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggle = async (id: number, currentEnabled: boolean) => {
    try {
      await fetchApi(`/api/custom-waf/${id}/toggle`, { method: "PATCH" });
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, enabled: !currentEnabled } : r))
      );
      toast.success(currentEnabled ? "Rule disabled" : "Rule enabled");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle rule");
    }
  };

  const handleDelete = async () => {
    if (deleteTarget === null) return;
    setProcessing(true);
    try {
      await fetchApi(`/api/custom-waf/${deleteTarget}`, { method: "DELETE" });
      toast.success("WAF rule deleted");
      setDeleteTarget(null);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete rule");
    } finally {
      setProcessing(false);
    }
  };

  // Derived stats
  const mostTriggeredRule = rules.reduce<{ name: string; hits: number } | null>(
    (acc, rule) => {
      const hits = stats?.rules?.[rule.id] || 0;
      if (!acc || hits > acc.hits) return { name: rule.name, hits };
      return acc;
    },
    null
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
            Custom WAF Rules
          </h1>
          <p className="text-sm text-zinc-400">
            Define custom regex-based firewall rules to protect your API.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            resetForm();
          }}
          className="flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2.5 text-sm font-semibold hover:bg-zinc-200 transition-all min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          Add Rule
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex items-center gap-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2CE8C3]/10 border border-[#2CE8C3]/20">
            <Shield className="h-5 w-5 text-[#2CE8C3]" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500">Total Rules</p>
            <p className="text-2xl font-bold text-white tabular-nums">
              {rules.length}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex items-center gap-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6BA9FF]/10 border border-[#6BA9FF]/20">
            <Activity className="h-5 w-5 text-[#6BA9FF]" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500">Total Hits</p>
            <p className="text-2xl font-bold text-white tabular-nums">
              {stats?.total_hits || 0}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex items-center gap-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffd700]/10 border border-[#ffd700]/20">
            <Zap className="h-5 w-5 text-[#ffd700]" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500">Most Triggered</p>
            <p className="text-sm font-semibold text-white truncate max-w-[160px]">
              {mostTriggeredRule?.name || "—"}
            </p>
            {mostTriggeredRule && mostTriggeredRule.hits > 0 && (
              <p className="text-[10px] text-zinc-500">
                {mostTriggeredRule.hits} hit{mostTriggeredRule.hits !== 1 && "s"}
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Inline Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#2CE8C3]" />
                  New WAF Rule
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors"
                >
                  <X className="h-4 w-4 text-zinc-500" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-mono block mb-2">
                      Rule Name
                    </label>
                    <input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Block SQL injection attempts"
                      required
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#2CE8C3] outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-mono block mb-2">
                      Regex Pattern
                    </label>
                    <input
                      value={formPattern}
                      onChange={(e) => setFormPattern(e.target.value)}
                      placeholder="e.g. (UNION|SELECT|DROP).*FROM"
                      required
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:border-[#2CE8C3] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-mono block mb-2">
                      Action
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormAction("block")}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          formAction === "block"
                            ? "bg-red-500/10 border-red-500/20 text-red-400 border-current"
                            : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        }`}
                      >
                        Block
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormAction("log")}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          formAction === "log"
                            ? "bg-[#6BA9FF]/10 border-[#6BA9FF]/20 text-[#6BA9FF] border-current"
                            : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        }`}
                      >
                        Log Only
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-mono block mb-2">
                      Severity
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {SEVERITY_LEVELS.map((s) => {
                        const colors = SEVERITY_COLORS[s];
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setFormSeverity(s)}
                            className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase border transition-all ${
                              formSeverity === s
                                ? `${colors.bg} ${colors.text} border-current`
                                : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50 transition-colors min-h-[44px]"
                  >
                    {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create Rule
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 mx-auto mb-4">
            <Shield className="h-7 w-7 text-zinc-600" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300 mb-1">
            No custom WAF rules yet
          </h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Create custom regex-based rules to block or log malicious traffic. These
            work alongside the built-in WAF blocklist.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, index) => {
            const sevColors = SEVERITY_COLORS[rule.severity] || SEVERITY_COLORS.medium;
            const hitCount = stats?.rules?.[rule.id] || 0;
            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 hover:bg-zinc-900/80 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {rule.name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase border ${sevColors.bg} ${sevColors.text} ${sevColors.border}`}
                      >
                        {rule.severity}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase border ${
                          rule.action === "block"
                            ? "bg-red-500/10 border-red-500/20 text-red-400"
                            : "bg-[#6BA9FF]/10 border-[#6BA9FF]/20 text-[#6BA9FF]"
                        }`}
                      >
                        {rule.action}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                        <Zap className="h-3 w-3" />
                        {hitCount} hit{hitCount !== 1 && "s"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2 py-1 rounded-md break-all">
                        {rule.pattern}
                      </code>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 sm:ml-auto">
                    <button
                      onClick={() => handleToggle(rule.id, rule.enabled)}
                      className={`relative inline-flex h-8 w-12 sm:h-6 sm:w-11 items-center rounded-full transition-colors min-h-[44px] sm:min-h-0 ${
                        rule.enabled ? "bg-emerald-500" : "bg-zinc-700"
                      }`}
                    >
                      {rule.enabled ? (
                        <ToggleRight className="h-4 w-4 text-white translate-x-6" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-zinc-400 translate-x-1" />
                      )}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(rule.id)}
                      className="p-2.5 sm:p-2 hover:bg-red-500/10 rounded-md transition-colors group min-h-[44px] sm:min-h-0 flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4 text-zinc-500 group-hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
              <ShieldAlert className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-white">Delete WAF Rule?</h3>
            <p className="mb-6 text-sm text-zinc-400 leading-relaxed">
              This firewall rule will be permanently removed. Traffic that previously
              matched this pattern will no longer be blocked or logged.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors min-h-[44px]"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={processing}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition-colors min-h-[44px]"
              >
                {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
