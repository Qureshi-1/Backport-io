"use client";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  Loader2,
  Plus,
  Trash2,
  ShieldAlert,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface TransformRule {
  id: number;
  name: string;
  path_pattern: string;
  action: string;
  config: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
}

const ACTION_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  add_field: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", label: "Add Field" },
  remove_field: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", label: "Remove Field" },
  rename_field: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", label: "Rename Field" },
  filter_keys: { bg: "bg-[#6BA9FF]/10 border-[#6BA9FF]/20", text: "text-[#6BA9FF]", label: "Filter Keys" },
};

export default function TransformsPage() {
  const [rules, setRules] = useState<TransformRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Form state
  const [formName, setFormName] = useState("");
  const [formPath, setFormPath] = useState("");
  const [formAction, setFormAction] = useState("add_field");
  const [formConfig, setFormConfig] = useState("{}");

  const loadRules = () => {
    setLoading(true);
    setError("");
    fetchApi("/api/transforms")
      .then((res) => {
        const arr = Array.isArray(res) ? res : (res as any)?.rules || [];
        setRules(arr);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load transform rules");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRules();
  }, []);

  const resetForm = () => {
    setFormName("");
    setFormPath("");
    setFormAction("add_field");
    setFormConfig("{}");
    setError("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    let parsedConfig: Record<string, unknown>;
    try {
      parsedConfig = JSON.parse(formConfig);
    } catch {
      setError("Invalid JSON in config field");
      return;
    }

    setProcessing(true);
    try {
      await fetchApi("/api/transforms", {
        method: "POST",
        body: JSON.stringify({
          name: formName,
          path_pattern: formPath,
          action: formAction,
          config: parsedConfig,
        }),
      });
      toast.success("Transform rule created successfully");
      setShowForm(false);
      resetForm();
      loadRules();
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
      await fetchApi(`/api/transforms/${id}/toggle`, { method: "PATCH" });
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
      await fetchApi(`/api/transforms/${deleteTarget}`, { method: "DELETE" });
      toast.success("Rule deleted");
      setDeleteTarget(null);
      loadRules();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete rule");
    } finally {
      setProcessing(false);
    }
  };

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
            Response Transforms
          </h1>
          <p className="text-sm text-zinc-400">
            Automatically modify API responses before they reach your clients.
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
                  <RefreshCw className="h-5 w-5 text-[#2CE8C3]" />
                  New Transform Rule
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
                      placeholder="e.g. Add timestamp to all responses"
                      required
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#2CE8C3] outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-mono block mb-2">
                      Path Pattern
                    </label>
                    <input
                      value={formPath}
                      onChange={(e) => setFormPath(e.target.value)}
                      placeholder="e.g. /api/users/*"
                      required
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:border-[#2CE8C3] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-500 uppercase font-mono block mb-2">
                    Action Type
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(ACTION_COLORS).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormAction(key)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          formAction === key
                            ? `${val.bg} ${val.text} border-current`
                            : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        }`}
                      >
                        {val.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-500 uppercase font-mono block mb-2">
                    Config (JSON)
                  </label>
                  <textarea
                    value={formConfig}
                    onChange={(e) => setFormConfig(e.target.value)}
                    placeholder='{"field": "value"}'
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:border-[#2CE8C3] outline-none transition-colors resize-none"
                  />
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
            <RefreshCw className="h-7 w-7 text-zinc-600" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300 mb-1">
            No transform rules yet
          </h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Create your first rule to start automatically modifying API responses.
            Add fields, remove sensitive data, or reshape responses on the fly.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, index) => {
            const actionStyle = ACTION_COLORS[rule.action] || {
              bg: "bg-zinc-500/10 border-zinc-500/20",
              text: "text-zinc-400",
              label: rule.action,
            };
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
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {rule.name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase border ${actionStyle.bg} ${actionStyle.text}`}
                      >
                        {actionStyle.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-1 rounded-md">
                        {rule.path_pattern}
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
            <h3 className="mb-2 text-lg font-bold text-white">
              Delete Transform Rule?
            </h3>
            <p className="mb-6 text-sm text-zinc-400 leading-relaxed">
              This rule will be permanently removed. API responses that matched this
              pattern will no longer be transformed.
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
