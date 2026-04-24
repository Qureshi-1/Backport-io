"use client";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  Loader2,
  Plus,
  Trash2,
  ShieldAlert,
  FlaskConical,
  ToggleLeft,
  ToggleRight,
  X,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface MockEndpoint {
  id: number;
  method: string;
  path_pattern: string;
  status_code: number;
  response_body: string;
  headers: Record<string, string>;
  enabled: boolean;
  created_at: string;
}

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400" },
  POST: { bg: "bg-[#6BA9FF]/10 border-[#6BA9FF]/20", text: "text-[#6BA9FF]" },
  PUT: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400" },
  PATCH: { bg: "bg-purple-500/10 border-purple-500/20", text: "text-purple-400" },
  DELETE: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400" },
};

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export default function MocksPage() {
  const [mocks, setMocks] = useState<MockEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Form state
  const [formMethod, setFormMethod] = useState("GET");
  const [formPath, setFormPath] = useState("");
  const [formStatus, setFormStatus] = useState(200);
  const [formBody, setFormBody] = useState('{\n  "message": "mocked response"\n}');
  const [formHeaders, setFormHeaders] = useState("{}");

  const loadMocks = () => {
    setLoading(true);
    setError("");
    fetchApi("/api/mocks")
      .then((res) => {
        const arr = Array.isArray(res) ? res : (res as any)?.mocks || [];
        setMocks(arr);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load mock endpoints");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMocks();
  }, []);

  const resetForm = () => {
    setFormMethod("GET");
    setFormPath("");
    setFormStatus(200);
    setFormBody('{\n  "message": "mocked response"\n}');
    setFormHeaders("{}");
    setError("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    let parsedBody: Record<string, unknown>;
    try {
      parsedBody = JSON.parse(formBody);
    } catch {
      setError("Invalid JSON in response body");
      return;
    }

    let parsedHeaders: Record<string, string>;
    try {
      parsedHeaders = JSON.parse(formHeaders);
    } catch {
      setError("Invalid JSON in headers");
      return;
    }

    setProcessing(true);
    try {
      await fetchApi("/api/mocks", {
        method: "POST",
        body: JSON.stringify({
          method: formMethod,
          path_pattern: formPath,
          status_code: formStatus,
          response_body: JSON.stringify(parsedBody),
          headers: parsedHeaders,
        }),
      });
      toast.success("Mock endpoint created successfully");
      setShowForm(false);
      resetForm();
      loadMocks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create mock";
      setError(msg);
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggle = async (id: number, currentEnabled: boolean) => {
    try {
      await fetchApi(`/api/mocks/${id}/toggle`, { method: "PATCH" });
      setMocks((prev) =>
        prev.map((m) => (m.id === id ? { ...m, enabled: !currentEnabled } : m))
      );
      toast.success(currentEnabled ? "Mock disabled" : "Mock enabled");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle mock");
    }
  };

  const handleDelete = async () => {
    if (deleteTarget === null) return;
    setProcessing(true);
    try {
      await fetchApi(`/api/mocks/${deleteTarget}`, { method: "DELETE" });
      toast.success("Mock endpoint deleted");
      setDeleteTarget(null);
      loadMocks();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete mock");
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
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">API Mocks</h1>
          <p className="text-sm text-zinc-400">
            Define mock endpoints that activate when your backend is unavailable.
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
          Add Mock
        </button>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-[#6BA9FF]/10 border border-[#6BA9FF]/20 rounded-xl p-4">
        <Info className="h-5 w-5 text-[#6BA9FF] flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-[#6BA9FF] font-semibold mb-1">How Mocks Work</p>
          <p className="text-zinc-400 leading-relaxed">
            Mock endpoints activate automatically when your backend times out. Requests
            include the{" "}
            <code className="bg-zinc-950 px-1.5 py-0.5 rounded text-[11px] font-mono text-zinc-300">
              X-Backport-Mock: true
            </code>{" "}
            header so your clients can detect mocked responses.
          </p>
        </div>
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
                  <FlaskConical className="h-5 w-5 text-[#2CE8C3]" />
                  New Mock Endpoint
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors"
                >
                  <X className="h-4 w-4 text-zinc-500" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-mono block mb-2">
                      HTTP Method
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {HTTP_METHODS.map((m) => {
                        const colors = METHOD_COLORS[m] || {
                          bg: "bg-zinc-500/10 border-zinc-500/20",
                          text: "text-zinc-400",
                        };
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setFormMethod(m)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-all ${
                              formMethod === m
                                ? `${colors.bg} ${colors.text} border-current`
                                : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
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
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-mono block mb-2">
                      Status Code
                    </label>
                    <input
                      type="number"
                      value={formStatus}
                      onChange={(e) => setFormStatus(Number(e.target.value))}
                      min={100}
                      max={599}
                      required
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:border-[#2CE8C3] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-500 uppercase font-mono block mb-2">
                    Response Body (JSON)
                  </label>
                  <textarea
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    rows={5}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:border-[#2CE8C3] outline-none transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-500 uppercase font-mono block mb-2">
                    Custom Headers (JSON)
                  </label>
                  <textarea
                    value={formHeaders}
                    onChange={(e) => setFormHeaders(e.target.value)}
                    rows={2}
                    placeholder='{"Content-Type": "application/json"}'
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
                    Create Mock
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mocks List */}
      {mocks.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 mx-auto mb-4">
            <FlaskConical className="h-7 w-7 text-zinc-600" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300 mb-1">
            No mock endpoints yet
          </h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Define mock responses that will be served when your backend is unreachable.
            Great for development, testing, and graceful degradation.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {mocks.map((mock, index) => {
            const methodStyle = METHOD_COLORS[mock.method] || {
              bg: "bg-zinc-500/10 border-zinc-500/20",
              text: "text-zinc-400",
            };
            return (
              <motion.div
                key={mock.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 hover:bg-zinc-900/80 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${methodStyle.bg} ${methodStyle.text}`}
                      >
                        {mock.method}
                      </span>
                      <code className="text-sm font-mono text-zinc-300 truncate">
                        {mock.path_pattern}
                      </code>
                      <span
                        className={`text-xs font-mono font-semibold ${
                          mock.status_code >= 200 && mock.status_code < 300
                            ? "text-emerald-400"
                            : mock.status_code >= 400
                            ? "text-red-400"
                            : "text-amber-400"
                        }`}
                      >
                        {mock.status_code}
                      </span>
                    </div>
                    {mock.headers &&
                      Object.keys(mock.headers).length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {Object.entries(mock.headers).map(([k, v]) => (
                            <span
                              key={k}
                              className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded-md"
                            >
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 sm:ml-auto">
                    <button
                      onClick={() => handleToggle(mock.id, mock.enabled)}
                      className={`relative inline-flex h-8 w-12 sm:h-6 sm:w-11 items-center rounded-full transition-colors min-h-[44px] sm:min-h-0 ${
                        mock.enabled ? "bg-emerald-500" : "bg-zinc-700"
                      }`}
                    >
                      {mock.enabled ? (
                        <ToggleRight className="h-4 w-4 text-white translate-x-6" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-zinc-400 translate-x-1" />
                      )}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(mock.id)}
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
            <h3 className="mb-2 text-lg font-bold text-white">Delete Mock?</h3>
            <p className="mb-6 text-sm text-zinc-400 leading-relaxed">
              This mock endpoint will be permanently removed. Requests matching this
              pattern will no longer receive a mocked response.
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
                Delete Mock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
