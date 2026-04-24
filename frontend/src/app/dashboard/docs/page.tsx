"use client";
import React, { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Search, Star, RefreshCw, Download, Copy, Check,
  Clock, BarChart3, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Filter, Edit3, Save, X,
} from "lucide-react";
import toast from "react-hot-toast";
import GlowOrb from "@/components/GlowOrb";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface EndpointSummary {
  id: number;
  method: string;
  path: string;
  description: string | null;
  avg_latency_ms: number;
  total_requests: number;
  success_rate: number;
  last_seen: string | null;
  is_starred: boolean;
}

interface EndpointDetail extends EndpointSummary {
  request_headers: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request_body_example: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response_body_example: any;
}

const METHOD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  GET: { bg: "bg-[#6BA9FF]/[0.08]", text: "text-[#6BA9FF]", border: "border-[#6BA9FF]/20" },
  POST: { bg: "bg-[#2CE8C3]/[0.08]", text: "text-[#2CE8C3]", border: "border-[#2CE8C3]/20" },
  PUT: { bg: "bg-yellow-500/[0.08]", text: "text-yellow-400", border: "border-yellow-500/20" },
  DELETE: { bg: "bg-red-500/[0.08]", text: "text-red-400", border: "border-red-500/20" },
  PATCH: { bg: "bg-purple-500/[0.08]", text: "text-purple-400", border: "border-purple-500/20" },
};

function getMethodColor(method: string) {
  return METHOD_COLORS[method] || { bg: "bg-white/[0.04]", text: "text-[#A2BDDB]/50", border: "border-white/[0.06]" };
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

/* ─── JSON Highlighting ──────────────────────────────────────────────────── */

function JsonBlock({ data, label }: { data: unknown; label?: string }) {
  const [copied, setCopied] = useState(false);
  const json = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="rounded-lg bg-black/30 border border-white/[0.03] overflow-hidden">
      {label && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.03] bg-white/[0.01]">
          <span className="text-[9px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider">{label}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.03] hover:bg-white/[0.06] text-[#A2BDDB]/30 hover:text-[#A2BDDB]/60 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-[#2CE8C3]" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      )}
      <div className="p-3 max-h-[300px] overflow-auto no-scrollbar">
        <pre className="text-[10px] leading-[1.6] font-mono">
          <code className="text-[#A2BDDB]/50">{json}</code>
        </pre>
      </div>
    </div>
  );
}

/* ─── Success Rate Bar ───────────────────────────────────────────────────── */

function SuccessRateBar({ rate }: { rate: number }) {
  const color = rate >= 95 ? "#2CE8C3" : rate >= 80 ? "#FBBF24" : "#EF4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${rate}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold" style={{ color }}>{rate}%</span>
    </div>
  );
}

/* ─── Endpoint Detail View ───────────────────────────────────────────────── */

function EndpointDetail({ endpoint, onClose }: { endpoint: EndpointDetail; onClose: () => void }) {
  const [description, setDescription] = useState(endpoint.description || "");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveDescription = async () => {
    setSaving(true);
    try {
      await fetchApi(`/api/docs/auto/${endpoint.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      toast.success("Description updated");
      setIsEditing(false);
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStar = async () => {
    try {
      const result = await fetchApi(`/api/docs/auto/${endpoint.id}/star`, { method: "PATCH" });
      endpoint.is_starred = (result as { is_starred: boolean }).is_starred;
      toast.success(endpoint.is_starred ? "Starred" : "Unstarred");
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 sm:p-8 space-y-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getMethodColor(endpoint.method).bg} ${getMethodColor(endpoint.method).text}`}>
            {endpoint.method}
          </span>
          <span className="font-mono text-sm text-white">{endpoint.path}</span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleStar}
          >
            <Star className={`w-4 h-4 ${endpoint.is_starred ? "fill-yellow-400 text-yellow-400" : "text-[#A2BDDB]/15"}`} />
          </motion.button>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] text-[#A2BDDB]/30 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider">Description</span>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 text-[10px] text-[#A2BDDB]/30 hover:text-[#2CE8C3] transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setDescription(endpoint.description || ""); setIsEditing(false); }}
                className="flex items-center gap-1 text-[10px] text-[#A2BDDB]/30 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
              <button
                onClick={handleSaveDescription}
                disabled={saving}
                className="flex items-center gap-1 text-[10px] text-[#2CE8C3] hover:text-white transition-colors disabled:opacity-50"
              >
                <Save className="w-3 h-3" />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>
        {isEditing ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-black/30 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder-[#A2BDDB]/20 focus:outline-none focus:border-[#2CE8C3]/30 resize-none"
            placeholder="Describe this endpoint..."
          />
        ) : (
          <p className="text-xs text-[#A2BDDB]/50">
            {description || (
              <span className="italic text-[#A2BDDB]/20">No description yet. Click Edit to add one.</span>
            )}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.03]">
          <div className="text-[9px] text-[#A2BDDB]/20 uppercase tracking-wider mb-1">Avg Latency</div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#6BA9FF]" />
            <span className="text-sm font-bold text-white font-mono">{endpoint.avg_latency_ms}ms</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.03]">
          <div className="text-[9px] text-[#A2BDDB]/20 uppercase tracking-wider mb-1">Total Requests</div>
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-3 h-3 text-[#2CE8C3]" />
            <span className="text-sm font-bold text-white font-mono">{endpoint.total_requests}</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.03]">
          <div className="text-[9px] text-[#A2BDDB]/20 uppercase tracking-wider mb-1">Success Rate</div>
          <SuccessRateBar rate={endpoint.success_rate} />
        </div>
        <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.03]">
          <div className="text-[9px] text-[#A2BDDB]/20 uppercase tracking-wider mb-1">Last Seen</div>
          <span className="text-[10px] text-[#A2BDDB]/40 font-mono">
            {endpoint.last_seen ? new Date(endpoint.last_seen).toLocaleString() : "N/A"}
          </span>
        </div>
      </div>

      {/* Observed Headers */}
      {endpoint.request_headers && endpoint.request_headers.length > 0 && (
        <div>
          <span className="text-[9px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider mb-2 block">
            Observed Request Headers ({endpoint.request_headers.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {endpoint.request_headers.map((h) => (
              <span key={h} className="px-2 py-0.5 rounded-md bg-white/[0.02] border border-white/[0.04] text-[9px] font-mono text-[#A2BDDB]/40">
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Request/Response Examples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {endpoint.request_body_example && (
          <JsonBlock data={endpoint.request_body_example} label="Request Example" />
        )}
        {endpoint.response_body_example && (
          <JsonBlock data={endpoint.response_body_example} label="Response Example" />
        )}
      </div>

      {!endpoint.request_body_example && !endpoint.response_body_example && (
        <div className="text-center py-8 text-[#A2BDDB]/20 text-xs">
          No request/response examples captured yet. More traffic will populate these.
        </div>
      )}
    </motion.div>
  );
}

/* ─── Main Docs Page ─────────────────────────────────────────────────────── */

export default function ApiDocsPage() {
  const [endpoints, setEndpoints] = useState<EndpointSummary[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchEndpoints = useCallback(async () => {
    try {
      const data = await fetchApi("/api/docs/auto");
      setEndpoints((data || []) as EndpointSummary[]);
    } catch {
      setEndpoints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await fetchApi("/api/docs/auto/generate", { method: "POST" });
      toast.success("API docs regenerated");
      await fetchEndpoints();
    } catch {
      toast.error("Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleStar = async (id: number) => {
    try {
      await fetchApi(`/api/docs/auto/${id}/star`, { method: "PATCH" });
      setEndpoints((prev) =>
        prev.map((ep) => (ep.id === id ? { ...ep, is_starred: !ep.is_starred } : ep))
      );
    } catch {
      toast.error("Failed to toggle star");
    }
  };

  const handleExportOpenAPI = async () => {
    try {
      const spec = await fetchApi("/api/docs/auto/export/openapi");
      const blob = new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "openapi-spec.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("OpenAPI spec downloaded");
    } catch {
      toast.error("Export failed");
    }
  };

  const handleExpandEndpoint = async (id: number) => {
    if (expanded === id) {
      setExpanded(null);
      setSelectedEndpoint(null);
      return;
    }
    setExpanded(id);
    setLoading(true);
    try {
      const data = await fetchApi(`/api/docs/auto/${id}`);
      setSelectedEndpoint(data as EndpointDetail);
    } catch {
      toast.error("Failed to load endpoint details");
    } finally {
      setLoading(false);
    }
  };

  // Filter endpoints
  const filteredEndpoints = endpoints.filter((ep) => {
    const matchesSearch = !search || ep.path.toLowerCase().includes(search.toLowerCase()) || (ep.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesMethod = methodFilter === "all" || ep.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  // Sort: starred first, then by total requests
  const sortedEndpoints = [...filteredEndpoints].sort((a, b) => {
    if (a.is_starred && !b.is_starred) return -1;
    if (!a.is_starred && b.is_starred) return 1;
    return b.total_requests - a.total_requests;
  });

  const allMethods = ["all", ...Array.from(new Set(endpoints.map((e) => e.method)))];

  if (loading && endpoints.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-[3px] border-[#2CE8C3]/20 border-t-[#2CE8C3] rounded-full animate-spin" />
        <div className="text-xs font-semibold uppercase tracking-widest text-[#A2BDDB]/40">Loading API docs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 relative overflow-hidden">
      <GlowOrb color="#6BA9FF" size={400} x="80%" y="5%" delay={0} opacity={0.03} />
      <GlowOrb color="#2CE8C3" size={350} x="20%" y="50%" delay={2} opacity={0.02} />

      <motion.div variants={container} initial="hidden" animate="show">
        {/* ─── Header ────────────────────────────────────────────── */}
        <motion.div variants={item} className="glass-card rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#6BA9FF]" />
                <h1 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>
                  Auto-Generated <span className="text-[#6BA9FF]">API Docs</span>
                </h1>
              </div>
              <p className="text-[#A2BDDB]/30 text-xs mt-1.5 ml-8">
                {endpoints.length} endpoint{endpoints.length !== 1 ? "s" : ""} discovered from your API traffic
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2CE8C3]/[0.08] border border-[#2CE8C3]/15 text-[10px] font-bold text-[#2CE8C3] hover:bg-[#2CE8C3]/[0.15] uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
                {generating ? "Generating..." : "Generate Now"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportOpenAPI}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] text-[10px] font-bold text-[#A2BDDB]/40 hover:text-white uppercase tracking-wider transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                OpenAPI
              </motion.button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04] focus-within:border-[#6BA9FF]/20 transition-colors">
              <Search className="w-3.5 h-3.5 text-[#A2BDDB]/20" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by path or description..."
                className="flex-1 bg-transparent text-xs text-white placeholder-[#A2BDDB]/20 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#A2BDDB]/20" />
              {allMethods.map((m) => (
                <button
                  key={m}
                  onClick={() => setMethodFilter(m)}
                  className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-colors ${
                    methodFilter === m
                      ? m === "all" ? "bg-white/[0.06] text-white" : `${getMethodColor(m).bg} ${getMethodColor(m).text}`
                      : "bg-white/[0.01] text-[#A2BDDB]/20 hover:text-[#A2BDDB]/40"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ─── Endpoint Cards ────────────────────────────────────── */}
        {sortedEndpoints.length === 0 ? (
          <motion.div variants={item} className="glass-card rounded-2xl p-12 sm:p-16 text-center">
            <FileText className="w-12 h-12 text-[#A2BDDB]/10 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">No endpoints discovered yet</h2>
            <p className="text-[#A2BDDB]/30 text-sm max-w-md mx-auto mb-6">
              Start sending traffic through your Backport proxy. Endpoints will be automatically discovered and documented here.
            </p>
            <div className="flex items-center justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2CE8C3] text-black text-xs font-bold hover:bg-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
                Scan Now
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={container} className="space-y-3">
            {sortedEndpoints.map((ep) => (
              <motion.div
                key={ep.id}
                variants={item}
                whileHover={{ y: -1 }}
                className="glass-card glass-card-hover rounded-2xl overflow-hidden"
              >
                {/* Card Summary - Always Visible */}
                <button
                  onClick={() => handleExpandEndpoint(ep.id)}
                  className="w-full flex items-center gap-4 p-4 sm:p-5 text-left"
                >
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${getMethodColor(ep.method).bg} ${getMethodColor(ep.method).text}`}>
                    {ep.method}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-white truncate">{ep.path}</div>
                    {ep.description && (
                      <div className="text-[10px] text-[#A2BDDB]/30 truncate mt-0.5">{ep.description}</div>
                    )}
                  </div>

                  <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-[9px] text-[#A2BDDB]/20 uppercase tracking-wider">Latency</div>
                      <div className="text-xs font-mono text-white">{ep.avg_latency_ms}ms</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] text-[#A2BDDB]/20 uppercase tracking-wider">Requests</div>
                      <div className="text-xs font-mono text-white">{ep.total_requests}</div>
                    </div>
                    <div className="w-24">
                      <div className="text-[9px] text-[#A2BDDB]/20 uppercase tracking-wider mb-1">Success</div>
                      <SuccessRateBar rate={ep.success_rate} />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); handleToggleStar(ep.id); }}
                    className="flex-shrink-0"
                  >
                    <Star className={`w-4 h-4 ${ep.is_starred ? "fill-yellow-400 text-yellow-400" : "text-[#A2BDDB]/10 hover:text-[#A2BDDB]/30"}`} />
                  </motion.button>

                  <div className="flex-shrink-0 text-[#A2BDDB]/15">
                    {expanded === ep.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Expanded Detail */}
                <AnimatePresence>
                  {expanded === ep.id && selectedEndpoint && selectedEndpoint.id === ep.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/[0.04] p-5 sm:p-6">
                        <EndpointDetail
                          endpoint={selectedEndpoint}
                          onClose={() => { setExpanded(null); setSelectedEndpoint(null); }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
