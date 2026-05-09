"use client";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  Loader2,
  Plus,
  Trash2,
  ShieldAlert,
  Webhook,
  ToggleLeft,
  ToggleRight,
  X,
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  EyeOff,
  Link2,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Webhook {
  id: number;
  url: string;
  events: string[];
  enabled: boolean;
  created_at: string;
  last_triggered_at: string | null;
  secret?: string;
}

interface DeliveryLog {
  id: number;
  webhook_id: number;
  event: string;
  status_code: number;
  timestamp: string;
  success: boolean;
}

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  waf_block: {
    label: "WAF Block",
    color: "bg-red-500/10 border-red-500/20 text-red-400",
  },
  rate_limit: {
    label: "Rate Limit",
    color: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  },
  error_5xx: {
    label: "5xx Error",
    color: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  },
  slow_endpoint: {
    label: "Slow Endpoint",
    color: "bg-[#6BA9FF]/10 border-[#6BA9FF]/20 text-[#6BA9FF]",
  },
};

const ALL_EVENTS = ["waf_block", "rate_limit", "error_5xx", "slow_endpoint"];

function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const masked =
      host.length > 12
        ? host.substring(0, 6) + "••••" + host.substring(host.length - 4)
        : host;
    return `${parsed.protocol}//${masked}${parsed.pathname}`;
  } catch {
    return "••••••••";
  }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);

  // Reveal URL state per webhook
  const [revealedUrls, setRevealedUrls] = useState<Set<number>>(new Set());

  // Form state
  const [formUrl, setFormUrl] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>([]);

  const loadData = () => {
    setLoading(true);
    setError("");
    Promise.all([
      fetchApi("/api/webhooks").catch(() => ({ webhooks: [] })),
      fetchApi("/api/webhooks/logs").catch(() => ({ logs: [] })),
    ])
      .then(([webhooksRes, logsRes]) => {
        const webhooksArr = Array.isArray(webhooksRes) ? webhooksRes : (webhooksRes as any)?.webhooks || [];
        const logsArr = Array.isArray(logsRes) ? logsRes : (logsRes as any)?.logs || [];
        setWebhooks(webhooksArr);
        setLogs(logsArr);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load webhooks");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormUrl("");
    setFormEvents([]);
    setError("");
  };

  const toggleEvent = (event: string) => {
    setFormEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formEvents.length === 0) {
      setError("Select at least one event type");
      return;
    }

    if (formUrl && !formUrl.match(/^https?:\/\/.+/)) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetchApi("/api/webhooks", {
        method: "POST",
        body: JSON.stringify({
          url: formUrl,
          events: formEvents,
        }),
      });
      toast.success("Webhook created successfully");

      // Show secret if returned
      if (res?.secret) {
        setNewSecret(res.secret);
        setSecretCopied(false);
      }

      setShowForm(false);
      resetForm();
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create webhook";
      setError(msg);
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggle = async (id: number, currentEnabled: boolean) => {
    try {
      await fetchApi(`/api/webhooks/${id}/toggle`, { method: "PATCH" });
      setWebhooks((prev) =>
        prev.map((w) => (w.id === id ? { ...w, enabled: !currentEnabled } : w))
      );
      toast.success(currentEnabled ? "Webhook disabled" : "Webhook enabled");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle webhook");
    }
  };

  const handleDelete = async () => {
    if (deleteTarget === null) return;
    setProcessing(true);
    try {
      await fetchApi(`/api/webhooks/${deleteTarget}`, { method: "DELETE" });
      toast.success("Webhook deleted");
      setDeleteTarget(null);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete webhook");
    } finally {
      setProcessing(false);
    }
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    setSecretCopied(true);
    toast.success("Secret copied to clipboard!");
    setTimeout(() => {
      setSecretCopied(false);
      setNewSecret(null);
    }, 3000);
  };

  const toggleReveal = (id: number) => {
    const newSet = new Set(revealedUrls);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setRevealedUrls(newSet);
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
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Webhooks</h1>
          <p className="text-sm text-zinc-400">
            Get notified instantly when important events occur on your gateway.
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
          Add Webhook
        </button>
      </div>

      {/* Secret Reveal Modal (shown once on creation) */}
      <AnimatePresence>
        {newSecret && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-400 font-semibold text-sm mb-2">
                  Save Your Webhook Secret
                </p>
                <p className="text-zinc-400 text-xs mb-3">
                  This secret is shown only once. Use it to verify webhook
                  signatures. You won&apos;t be able to see it again.
                </p>
                <div className="flex items-center gap-2 p-2 pl-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <code className="text-xs font-mono text-emerald-400 truncate flex-1">
                    {newSecret}
                  </code>
                  <button
                    onClick={() => copySecret(newSecret)}
                    className="flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-amber-400 transition-colors flex-shrink-0"
                  >
                    {secretCopied ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {secretCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setNewSecret(null)}
                className="p-1 hover:bg-zinc-800 rounded-md transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4 text-zinc-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <Webhook className="h-5 w-5 text-[#2CE8C3]" />
                  New Webhook
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors"
                >
                  <X className="h-4 w-4 text-zinc-500" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase font-mono block mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://your-app.com/api/webhooks/backport"
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:border-[#2CE8C3] outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-500 uppercase font-mono block mb-2">
                    Event Types
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_EVENTS.map((event) => {
                      const ev = EVENT_LABELS[event];
                      const isSelected = formEvents.includes(event);
                      return (
                        <button
                          key={event}
                          type="button"
                          onClick={() => toggleEvent(event)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all text-left ${
                            isSelected
                              ? `${ev.color} border-current`
                              : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                          }`}
                        >
                          <span
                            className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? "bg-white/10 border-current"
                                : "border-zinc-700"
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                          </span>
                          {ev.label}
                        </button>
                      );
                    })}
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
                    Create Webhook
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 mx-auto mb-4">
            <Webhook className="h-7 w-7 text-zinc-600" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300 mb-1">
            No webhooks configured
          </h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Add a webhook URL to receive real-time notifications for security events,
            errors, and performance alerts.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook, index) => (
            <motion.div
              key={webhook.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 hover:bg-zinc-900/80 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0 space-y-3">
                  {/* URL */}
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <code
                        className={`text-xs font-mono truncate ${
                          revealedUrls.has(webhook.id)
                            ? "text-white"
                            : "text-zinc-400"
                        }`}
                      >
                        {revealedUrls.has(webhook.id)
                          ? webhook.url
                          : maskUrl(webhook.url)}
                      </code>
                      <button
                        onClick={() => toggleReveal(webhook.id)}
                        className="p-2 hover:bg-zinc-800 rounded transition-colors flex-shrink-0"
                      >
                        {revealedUrls.has(webhook.id) ? (
                          <EyeOff className="h-3 w-3 text-zinc-500" />
                        ) : (
                          <Eye className="h-3 w-3 text-zinc-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Event badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(webhook.events || []).map((event) => {
                      const ev = EVENT_LABELS[event];
                      return (
                        <span
                          key={event}
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            ev?.color || "bg-zinc-500/10 border-zinc-500/20 text-zinc-400"
                          }`}
                        >
                          {ev?.label || event}
                        </span>
                      );
                    })}
                  </div>

                  {/* Last triggered */}
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <Clock className="h-3 w-3" />
                    Last triggered: {timeAgo(webhook.last_triggered_at)}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 sm:ml-auto">
                  <button
                    onClick={() => handleToggle(webhook.id, webhook.enabled)}
                    className={`relative inline-flex h-8 w-12 sm:h-6 sm:w-11 items-center rounded-full transition-colors min-h-[44px] sm:min-h-0 ${
                      webhook.enabled ? "bg-emerald-500" : "bg-zinc-700"
                    }`}
                  >
                    {webhook.enabled ? (
                      <ToggleRight className="h-4 w-4 text-white translate-x-6" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-zinc-400 translate-x-1" />
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(webhook.id)}
                    className="p-2.5 sm:p-2 hover:bg-red-500/10 rounded-md transition-colors group min-h-[44px] sm:min-h-0 flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4 text-zinc-500 group-hover:text-red-500" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recent Delivery Logs */}
      {logs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-zinc-500" />
            Recent Deliveries
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Desktop: table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left min-w-[480px]">
                <thead className="bg-zinc-800/50 text-zinc-400 text-sm">
                  <tr>
                    <th className="px-5 py-3 font-medium">Event</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-sm text-zinc-300">
                  {logs.slice(0, 20).map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-zinc-800/20 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            EVENT_LABELS[log.event]?.color ||
                            "bg-zinc-500/10 border-zinc-500/20 text-zinc-400"
                          }`}
                        >
                          {EVENT_LABELS[log.event]?.label || log.event}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`font-mono text-xs font-semibold ${
                            log.success
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {log.status_code}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-zinc-500 text-xs">
                        {timeAgo(log.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile: card view */}
            <div className="md:hidden divide-y divide-zinc-800">
              {logs.slice(0, 20).map((log) => (
                <div key={log.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        EVENT_LABELS[log.event]?.color ||
                        "bg-zinc-500/10 border-zinc-500/20 text-zinc-400"
                      }`}
                    >
                      {EVENT_LABELS[log.event]?.label || log.event}
                    </span>
                    <span
                      className={`font-mono text-xs font-semibold ${
                        log.success ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {log.status_code}
                    </span>
                  </div>
                  <div className="text-zinc-500 text-xs">
                    {timeAgo(log.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
              Delete Webhook?
            </h3>
            <p className="mb-6 text-sm text-zinc-400 leading-relaxed">
              This webhook will be permanently removed. You&apos;ll stop receiving
              event notifications for the configured URL.
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
                Delete Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
