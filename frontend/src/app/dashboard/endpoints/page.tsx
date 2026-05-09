"use client";
import React, { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  Plus,
  Trash2,
  Edit3,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  Zap,
  Shield,
  TestTube2,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import GlowOrb from "@/components/GlowOrb";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface EndpointConfig {
  id?: number;
  path_pattern: string;
  max_rpm: number;
  burst_size: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const EMPTY_CONFIG: Omit<EndpointConfig, "id"> = {
  path_pattern: "",
  max_rpm: 100,
  burst_size: 10,
  enabled: true,
};

export default function EndpointsPage() {
  const [configs, setConfigs] = useState<EndpointConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EndpointConfig | null>(null);
  const [form, setForm] = useState<Omit<EndpointConfig, "id">>(EMPTY_CONFIG);
  const [saving, setSaving] = useState(false);
  const [testPath, setTestPath] = useState("");
  const [testResults, setTestResults] = useState<{ pattern: string; matches: boolean }[]>([]);

  const fetchConfigs = useCallback(async () => {
    try {
      const data = await fetchApi("/api/endpoint-config");
      const arr = Array.isArray(data) ? data : (data as any)?.configs || [];
      setConfigs(arr as EndpointConfig[]);
    } catch {
      // fallback demo data
      setConfigs([
        { id: 1, path_pattern: "/api/users/*", max_rpm: 200, burst_size: 20, enabled: true, created_at: new Date().toISOString() },
        { id: 2, path_pattern: "/api/auth/login", max_rpm: 10, burst_size: 5, enabled: true, created_at: new Date().toISOString() },
        { id: 3, path_pattern: "/api/webhooks/*", max_rpm: 50, burst_size: 10, enabled: false, created_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleSave = async () => {
    if (!form.path_pattern.trim()) {
      toast.error("Path pattern is required");
      return;
    }
    setSaving(true);
    try {
      if (editing?.id) {
        await fetchApi(`/api/endpoint-config/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        toast.success("Endpoint config updated");
      } else {
        await fetchApi("/api/endpoint-config", {
          method: "POST",
          body: JSON.stringify(form),
        });
        toast.success("Endpoint config created");
      }
      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY_CONFIG);
      fetchConfigs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this endpoint config?")) return;
    try {
      await fetchApi(`/api/endpoint-config/${id}`, { method: "DELETE" });
      toast.success("Endpoint config deleted");
      fetchConfigs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleToggle = async (config: EndpointConfig) => {
    try {
      await fetchApi(`/api/endpoint-config/${config.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...config, enabled: !config.enabled }),
      });
      fetchConfigs();
      toast.success(`Endpoint ${config.enabled ? "disabled" : "enabled"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle");
    }
  };

  const openEdit = (config: EndpointConfig) => {
    setEditing(config);
    setForm({
      path_pattern: config.path_pattern,
      max_rpm: config.max_rpm,
      burst_size: config.burst_size,
      enabled: config.enabled,
    });
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_CONFIG);
    setModalOpen(true);
  };

  const testPatternMatch = () => {
    if (!testPath.trim()) return;
    const results = configs
      .filter((c) => c.enabled)
      .map((c) => ({
        pattern: c.path_pattern,
        matches: matchPattern(c.path_pattern, testPath),
      }));
    setTestResults(results);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-[3px] border-[#2CE8C3]/20 border-t-[#2CE8C3] rounded-full animate-spin" />
        <div className="text-xs font-semibold uppercase tracking-widest text-[#A2BDDB]/40">
          Loading endpoint configs...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 relative overflow-hidden">
      <GlowOrb color="#6BA9FF" size={400} x="80%" y="10%" delay={0} opacity={0.03} />

      <motion.div variants={container} initial="hidden" animate="show">
        {/* ═══ Header ═══ */}
        <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6BA9FF]/[0.08] border border-[#6BA9FF]/15 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-[#6BA9FF]" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold text-white tracking-tight"
                style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
              >
                Endpoint Configuration
              </h1>
              <p className="text-[#A2BDDB]/40 text-sm">
                Per-endpoint rate limiting and access control
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2CE8C3] text-black text-xs font-bold hover:bg-white transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Add Endpoint
          </motion.button>
        </motion.div>

        {/* ═══ Pattern Tester ═══ */}
        <motion.div variants={item} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TestTube2 className="w-4 h-4 text-[#A2BDDB]/40" />
            <h3 className="text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider">
              Test Pattern Matching
            </h3>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A2BDDB]/20" />
              <input
                type="text"
                value={testPath}
                onChange={(e) => setTestPath(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && testPatternMatch()}
                placeholder="Enter a path to test (e.g. /api/users/123)"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white text-sm font-mono placeholder:text-[#A2BDDB]/15 focus:outline-none focus:border-[#2CE8C3]/30 transition-colors"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={testPatternMatch}
              className="px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#A2BDDB]/60 text-xs font-semibold hover:text-white hover:border-white/[0.15] transition-colors min-h-[44px]"
            >
              Test
            </motion.button>
          </div>
          <AnimatePresence>
            {testResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-2"
              >
                {testResults.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      r.matches
                        ? "bg-[#2CE8C3]/[0.04] border border-[#2CE8C3]/15"
                        : "bg-white/[0.01] border border-white/[0.04]"
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${r.matches ? "text-[#2CE8C3]" : "text-[#A2BDDB]/25"}`}>
                      {r.matches ? "MATCH" : "NO MATCH"}
                    </span>
                    <span className="text-xs font-mono text-[#A2BDDB]/40">{r.pattern}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ═══ Endpoint Cards ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {configs.length > 0 ? (
            configs.map((config, idx) => (
              <motion.div
                key={config.id || idx}
                variants={item}
                whileHover={{ y: -2 }}
                className="glass-card glass-card-hover rounded-2xl p-6 relative group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          config.enabled
                            ? "bg-[#2CE8C3]/[0.08] text-[#2CE8C3] border border-[#2CE8C3]/15"
                            : "bg-white/[0.03] text-[#A2BDDB]/25 border border-white/[0.06]"
                        }`}
                      >
                        {config.enabled ? (
                          <ToggleRight className="w-3 h-3" />
                        ) : (
                          <ToggleLeft className="w-3 h-3" />
                        )}
                        {config.enabled ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <h4 className="font-mono text-white text-sm font-semibold truncate">
                      {config.path_pattern}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleToggle(config)}
                      className="p-1.5 rounded-lg min-w-[36px] min-h-[36px] hover:bg-white/[0.04] text-[#A2BDDB]/30 hover:text-white transition-colors inline-flex items-center justify-center"
                      title={config.enabled ? "Disable" : "Enable"}
                    >
                      {config.enabled ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(config)}
                      className="p-1.5 rounded-lg min-w-[36px] min-h-[36px] hover:bg-white/[0.04] text-[#A2BDDB]/30 hover:text-white transition-colors inline-flex items-center justify-center"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => config.id && handleDelete(config.id)}
                      className="p-1.5 rounded-lg min-w-[36px] min-h-[36px] hover:bg-red-500/[0.08] text-[#A2BDDB]/30 hover:text-red-400 transition-colors inline-flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-3 h-3 text-[#2CE8C3]" />
                      <span className="text-[9px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider">
                        Max RPM
                      </span>
                    </div>
                    <span className="text-lg font-bold text-white tabular-nums" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>
                      {config.max_rpm.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-3 h-3 text-[#6BA9FF]" />
                      <span className="text-[9px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider">
                        Burst Size
                      </span>
                    </div>
                    <span className="text-lg font-bold text-white tabular-nums" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>
                      {config.burst_size}
                    </span>
                  </div>
                </div>

                {config.created_at && (
                  <div className="mt-4 text-[10px] text-[#A2BDDB]/15 font-mono">
                    Created {new Date(config.created_at).toLocaleDateString()}
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <motion.div variants={item} className="col-span-full glass-card rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#6BA9FF]/[0.06] border border-[#6BA9FF]/15 flex items-center justify-center mx-auto mb-6">
                <GitBranch className="w-8 h-8 text-[#6BA9FF]" />
              </div>
              <h2
                className="text-xl font-bold text-white mb-2"
                style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
              >
                No endpoint configs
              </h2>
              <p className="text-[#A2BDDB]/40 text-sm max-w-md mx-auto mb-6">
                Create endpoint-specific rate limits to fine-tune access control for your API routes.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#2CE8C3] text-black text-sm font-bold hover:bg-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create First Config
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ═══ Modal ═══ */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="relative glass-card rounded-2xl p-6 sm:p-8 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-lg font-bold text-white"
                  style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
                >
                  {editing ? "Edit Endpoint Config" : "New Endpoint Config"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-[#A2BDDB]/30 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Path Pattern */}
                <div>
                  <label className="block text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider mb-2">
                    Path Pattern
                  </label>
                  <input
                    type="text"
                    value={form.path_pattern}
                    onChange={(e) => setForm({ ...form, path_pattern: e.target.value })}
                    placeholder="/api/users/*"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white text-sm font-mono placeholder:text-[#A2BDDB]/15 focus:outline-none focus:border-[#2CE8C3]/30 transition-colors"
                  />
                  <p className="text-[10px] text-[#A2BDDB]/20 mt-1.5">
                    Use <code className="text-[#2CE8C3]/60">*</code> as wildcard. e.g. <code className="text-[#2CE8C3]/60">/api/users/*</code> matches all sub-paths.
                  </p>
                </div>

                {/* Max RPM */}
                <div>
                  <label className="block text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider mb-2">
                    Max Requests Per Minute
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={10}
                      max={10000}
                      step={10}
                      value={form.max_rpm}
                      onChange={(e) => setForm({ ...form, max_rpm: Number(e.target.value) })}
                      className="flex-1 accent-[#2CE8C3]"
                    />
                    <input
                      type="number"
                      min={10}
                      max={10000}
                      value={form.max_rpm}
                      onChange={(e) => setForm({ ...form, max_rpm: Math.max(10, Math.min(10000, Number(e.target.value))) })}
                      className="w-24 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white text-sm font-mono text-center focus:outline-none focus:border-[#2CE8C3]/30 transition-colors"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#A2BDDB]/15 mt-1">
                    <span>10</span>
                    <span>10,000</span>
                  </div>
                </div>

                {/* Burst Size */}
                <div>
                  <label className="block text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider mb-2">
                    Burst Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={form.burst_size}
                    onChange={(e) => setForm({ ...form, burst_size: Math.max(1, Number(e.target.value)) })}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white text-sm font-mono focus:outline-none focus:border-[#2CE8C3]/30 transition-colors"
                  />
                  <p className="text-[10px] text-[#A2BDDB]/20 mt-1.5">
                    Max requests allowed in a single burst before rate limiting kicks in.
                  </p>
                </div>

                {/* Enabled Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div>
                    <span className="text-sm font-medium text-white">Enabled</span>
                    <p className="text-[10px] text-[#A2BDDB]/25 mt-0.5">Apply this config to matching requests</p>
                  </div>
                  <button
                    onClick={() => setForm({ ...form, enabled: !form.enabled })}
                    className="relative"
                  >
                    <motion.div
                      animate={{ x: form.enabled ? 24 : 0 }}
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                    <div className={`w-12 h-6 rounded-full transition-colors ${form.enabled ? "bg-[#2CE8C3]" : "bg-white/[0.1]"}`} />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/[0.08] text-[#A2BDDB]/50 text-xs font-semibold hover:text-white hover:border-white/[0.15] transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#2CE8C3] text-black text-xs font-bold hover:bg-white transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function matchPattern(pattern: string, path: string): boolean {
  const regexStr = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  const regex = new RegExp(`^${regexStr}$`);
  return regex.test(path);
}
