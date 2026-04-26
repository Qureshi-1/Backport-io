"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, ChevronLeft, Copy, Check, Terminal,
  RefreshCw, ChevronDown, ChevronUp, Zap, Database, Clock,
  Globe, Shield, FileJson,
} from "lucide-react";
import toast from "react-hot-toast";
import GlowOrb from "@/components/GlowOrb";

 
interface LogDetail {
  id: number;
  method: string;
  path: string;
  query_params: string | null;
  status_code: number;
  latency_ms: number;
  was_cached: boolean;
  ip_address: string | null;
  request_headers: Record<string, string>;
   
  request_body: any;
   
  response_body: any;
  response_size: number;
  created_at: string | null;
}

interface LogSummary {
  id: number;
  method: string;
  path: string;
  status: number;
  time: string;
  date: string;
}

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET: { bg: "bg-[#6BA9FF]/[0.1]", text: "text-[#6BA9FF]" },
  POST: { bg: "bg-[#2CE8C3]/[0.1]", text: "text-[#2CE8C3]" },
  PUT: { bg: "bg-yellow-500/[0.1]", text: "text-yellow-400" },
  DELETE: { bg: "bg-red-500/[0.1]", text: "text-red-400" },
  PATCH: { bg: "bg-purple-500/[0.1]", text: "text-purple-400" },
};

function getMethodColor(method: string) {
  return METHOD_COLORS[method] || { bg: "bg-white/[0.04]", text: "text-[#A2BDDB]/50" };
}

function getStatusColor(code: number) {
  if (code < 300) return { bg: "bg-emerald-500/[0.1]", text: "text-emerald-400", label: "2xx Success" };
  if (code < 400) return { bg: "bg-[#6BA9FF]/[0.1]", text: "text-[#6BA9FF]", label: "3xx Redirect" };
  if (code < 500) return { bg: "bg-yellow-500/[0.1]", text: "text-yellow-400", label: "4xx Client Error" };
  return { bg: "bg-red-500/[0.1]", text: "text-red-400", label: "5xx Server Error" };
}

/* ─── JSON Syntax Highlighting ──────────────────────────────────────────── */

function JsonHighlight({ data }: { data: unknown }) {
  const json = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  const lines = json.split("\n");

  const highlightLine = (line: string) => {
    const parts: React.ReactNode[] = [];
    let key = "";
    let i = 0;
    let inString = false;
    let strChar = "";

    while (i < line.length) {
      const ch = line[i];

      if (!inString && (ch === '"' || ch === "'")) {
        inString = true;
        strChar = ch;
        key += ch;
        i++;
        continue;
      }

      if (inString && ch === strChar) {
        inString = false;
        key += ch;
        i++;
        continue;
      }

      if (inString) {
        key += ch;
        i++;
        continue;
      }

      // Outside string - check for special values
      if (ch === ":") {
        // Key ended
        parts.push(
          <span key={`k-${i}`} className="text-[#6BA9FF]">
            {key}
          </span>
        );
        parts.push(
          <span key={`c-${i}`} className="text-[#A2BDDB]/30">
            {ch}
          </span>
        );
        key = "";
        i++;
        continue;
      }

      // Number values
      if ((ch >= "0" && ch <= "9") || ch === "-") {
        let num = "";
        while (i < line.length && ((line[i] >= "0" && line[i] <= "9") || line[i] === "." || line[i] === "-")) {
          num += line[i];
          i++;
        }
        parts.push(
          <span key={`n-${i}`} className="text-orange-400">
            {num}
          </span>
        );
        continue;
      }

      // Boolean / null
      const rest = line.slice(i);
      if (rest.startsWith("true") || rest.startsWith("false") || rest.startsWith("null")) {
        const word = rest.startsWith("true") ? "true" : rest.startsWith("false") ? "false" : "null";
        parts.push(
          <span key={`b-${i}`} className="text-[#A2BDDB]/40 italic">
            {word}
          </span>
        );
        i += word.length;
        continue;
      }

      key += ch;
      i++;
    }

    if (key) {
      // Check if this is a string value (starts with quote after trim)
      const trimmed = key.trimStart();
      if (trimmed.startsWith('"')) {
        parts.push(
          <span key={`v-${i}`} className="text-emerald-400">
            {key}
          </span>
        );
      } else {
        parts.push(<span key={`r-${i}`}>{key}</span>);
      }
    }

    return parts;
  };

  return (
    <pre className="text-[11px] leading-[1.7] font-mono overflow-x-auto">
      <code>{lines.map((line, idx) => (
        <div key={idx}>
          {highlightLine(line)}
          {"\n"}
        </div>
      ))}</code>
    </pre>
  );
}

/* ─── Collapsible Section ────────────────────────────────────────────────── */

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
  copyText,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
  copyText?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="border border-white/[0.04] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-[#A2BDDB]/30" />
          <span className="text-xs font-medium text-[#A2BDDB]/60">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {copyText && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.06] text-[#A2BDDB]/30 hover:text-[#A2BDDB]/60 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-[#2CE8C3]" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
          {open ? <ChevronUp className="w-3.5 h-3.5 text-[#A2BDDB]/20" /> : <ChevronDown className="w-3.5 h-3.5 text-[#A2BDDB]/20" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-white/[0.03]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Inspector Page ───────────────────────────────────────────────── */

export default function RequestInspector() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const logId = searchParams.get("log_id");

  const [logDetail, setLogDetail] = useState<LogDetail | null>(null);
  const [logs, setLogs] = useState<LogSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [replaying, setReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState<Record<string, unknown> | null>(null);

  const currentIndex = logs.findIndex((l) => String(l.id) === logId);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await fetchApi("/api/user/logs").catch(() => []);
      setLogs((data || []) as LogSummary[]);
    } catch {
      // ignore
    }
  }, []);

  const fetchLogDetail = useCallback(async (id: string) => {
    setLoading(true);
    setReplayResult(null);
    try {
      const data = await fetchApi(`/api/user/logs/${id}/inspect`);
      setLogDetail(data as LogDetail);
    } catch {
      toast.error("Failed to load log details");
      setLogDetail(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (logId) {
      fetchLogDetail(logId);
    }
  }, [logId, fetchLogDetail]);

  const navigateTo = (direction: "prev" | "next") => {
    const newIdx = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (newIdx >= 0 && newIdx < logs.length) {
      router.push(`/dashboard/inspector?log_id=${logs[newIdx].id}`);
    }
  };

  const handleReplay = async () => {
    if (!logDetail) return;
    setReplaying(true);
    try {
      const result = await fetchApi(`/api/user/replay/${logDetail.id}`, { method: "POST" });
      setReplayResult(result as Record<string, unknown>);
      toast.success("Request replayed successfully");
    } catch {
      toast.error("Replay failed");
    } finally {
      setReplaying(false);
    }
  };

  const generateCurl = () => {
    if (!logDetail) return "";
    const headers = Object.entries(logDetail.request_headers || {})
      .filter(([k]) => !["host", "content-length", "transfer-encoding"].includes(k.toLowerCase()))
      .map(([k, v]) => `  -H '${k}: ${v}'`)
      .join(" \\\n");
    const body = logDetail.request_body && ["POST", "PUT", "PATCH"].includes(logDetail.method)
      ? `\n  -d '${JSON.stringify(logDetail.request_body)}'`
      : "";
    return `curl -X ${logDetail.method} \\\n  '${logDetail.path}' \\\n${headers}${body}`;
  };

  const copyCurl = async () => {
    const curl = generateCurl();
    if (!curl) return;
    try {
      await navigator.clipboard.writeText(curl);
      toast.success("cURL command copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (!logId) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-[3px] border-[#2CE8C3]/20 border-t-[#2CE8C3] rounded-full animate-spin" />
        <div className="text-xs font-semibold uppercase tracking-widest text-[#A2BDDB]/40">Loading inspector...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-[3px] border-[#2CE8C3]/20 border-t-[#2CE8C3] rounded-full animate-spin" />
        <div className="text-xs font-semibold uppercase tracking-widest text-[#A2BDDB]/40">Inspecting request...</div>
      </div>
    );
  }

  if (!logDetail) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <Terminal className="w-12 h-12 text-[#A2BDDB]/15" />
        <div className="text-sm text-[#A2BDDB]/40">Log entry not found</div>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-[#A2BDDB]/50 hover:text-white transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const methodColor = getMethodColor(logDetail.method);
  const statusColor = getStatusColor(logDetail.status_code);

  return (
    <div className="space-y-6 pb-12 relative overflow-hidden">
      <GlowOrb color="#6BA9FF" size={400} x="30%" y="10%" delay={0} opacity={0.03} />
      <GlowOrb color="#2CE8C3" size={350} x="70%" y="40%" delay={2} opacity={0.02} />

      {/* ─── Top Bar ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-4 sm:p-5"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] text-xs text-[#A2BDDB]/40 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Dashboard
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navigateTo("prev")}
                disabled={currentIndex <= 0}
                className="p-2.5 rounded-md bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] text-[#A2BDDB]/30 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>

              <div className="px-3 py-1.5 rounded-md bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[10px] text-[#A2BDDB]/30 font-mono">
                  {currentIndex + 1} / {logs.length}
                </span>
              </div>

              <button
                onClick={() => navigateTo("next")}
                disabled={currentIndex >= logs.length - 1}
                className="p-2.5 rounded-md bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] text-[#A2BDDB]/30 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={copyCurl}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] text-[10px] font-bold text-[#A2BDDB]/40 hover:text-white uppercase tracking-wider transition-colors"
            >
              <Terminal className="w-3.5 h-3.5" />
              Copy cURL
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReplay}
              disabled={replaying}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2CE8C3]/[0.08] border border-[#2CE8C3]/15 text-[10px] font-bold text-[#2CE8C3] hover:bg-[#2CE8C3]/[0.15] uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${replaying ? "animate-spin" : ""}`} />
              {replaying ? "Replaying..." : "Replay"}
            </motion.button>
          </div>
        </div>

        {/* URL bar */}
        <div className="mt-3 flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-black/30 border border-white/[0.04] min-w-0">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${methodColor.bg} ${methodColor.text}`}>
            {logDetail.method}
          </span>
          <span className="font-mono text-xs text-[#A2BDDB]/50 flex-1 truncate">{logDetail.path}</span>
          {logDetail.query_params && (
            <span className="text-[10px] font-mono text-[#6BA9FF]/40 truncate">?{logDetail.query_params}</span>
          )}
        </div>
      </motion.div>

      {/* ─── Replay Result ───────────────────────────────────── */}
      <AnimatePresence>
        {replayResult && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="glass-card rounded-2xl p-4 sm:p-5 border border-[#2CE8C3]/10"
          >
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="w-4 h-4 text-[#2CE8C3]" />
              <span className="text-xs font-bold text-[#2CE8C3] uppercase tracking-wider">Replay Result</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[9px] text-[#A2BDDB]/20 uppercase tracking-wider mb-1">Status</div>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(Number(replayResult.status_code || 0)).bg} ${getStatusColor(Number(replayResult.status_code || 0)).text}`}>
                  {String(replayResult.status_code)}
                </span>
              </div>
              <div>
                <div className="text-[9px] text-[#A2BDDB]/20 uppercase tracking-wider mb-1">Latency</div>
                <span className="text-xs font-mono text-white">{String(replayResult.latency_ms)}ms</span>
              </div>
              <div>
                <div className="text-[9px] text-[#A2BDDB]/20 uppercase tracking-wider mb-1">Original</div>
                <span className="text-xs font-mono text-[#A2BDDB]/40">{String(logDetail.latency_ms)}ms</span>
              </div>
              <div>
                <div className="text-[9px] text-[#A2BDDB]/20 uppercase tracking-wider mb-1">Diff</div>
                <span className={`text-xs font-mono ${Number(replayResult.latency_ms) <= logDetail.latency_ms ? "text-[#2CE8C3]" : "text-red-400"}`}>
                  {Number(replayResult.latency_ms) - logDetail.latency_ms > 0 ? "+" : ""}
                  {Number(replayResult.latency_ms) - logDetail.latency_ms}ms
                </span>
              </div>
            </div>
            {replayResult.response != null && (
              <div className="mt-3 p-3 rounded-lg bg-black/20 border border-white/[0.03] max-h-[200px] overflow-auto">
                <JsonHighlight data={String(replayResult.response)} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Two Panel Layout ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Left Panel: Request ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-[#6BA9FF]" />
            <h2 className="text-sm font-bold text-white tracking-wider uppercase">Request</h2>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-xl p-3">
              <div className="text-[9px] text-[#A2BDDB]/20 uppercase tracking-wider mb-1">Method</div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${methodColor.bg} ${methodColor.text}`}>
                {logDetail.method}
              </span>
            </div>
            <div className="glass-card rounded-xl p-3">
              <div className="text-[9px] text-[#A2BDDB]/20 uppercase tracking-wider mb-1">IP Address</div>
              <span className="text-xs font-mono text-[#A2BDDB]/50">{logDetail.ip_address || "N/A"}</span>
            </div>
          </div>

          {/* Query Params */}
          {logDetail.query_params && (
            <CollapsibleSection
              title="Query Parameters"
              icon={Database}
              copyText={logDetail.query_params}
            >
              <table className="w-full text-left">
                <tbody className="divide-y divide-white/[0.03]">
                  {logDetail.query_params.split("&").map((param, idx) => {
                    const [key, ...rest] = param.split("=");
                    return (
                      <tr key={idx}>
                        <td className="py-1.5 pr-4 text-xs font-mono text-[#6BA9FF]">{decodeURIComponent(key)}</td>
                        <td className="py-1.5 text-xs font-mono text-emerald-400">{decodeURIComponent(rest.join("="))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CollapsibleSection>
          )}

          {/* Request Headers */}
          <CollapsibleSection
            title={`Request Headers (${Object.keys(logDetail.request_headers || {}).length})`}
            icon={Shield}
            defaultOpen={false}
            copyText={JSON.stringify(logDetail.request_headers || {}, null, 2)}
          >
            <div className="max-h-[300px] overflow-y-auto no-scrollbar">
              <table className="w-full text-left">
                <tbody className="divide-y divide-white/[0.03]">
                  {Object.entries(logDetail.request_headers || {}).map(([key, value]) => (
                    <tr key={key}>
                      <td className="py-1.5 pr-4 text-xs font-mono text-[#6BA9FF] whitespace-nowrap">{key}</td>
                      <td className="py-1.5 text-xs font-mono text-[#A2BDDB]/50 break-all">{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>

          {/* Request Body */}
          {logDetail.request_body && (
            <CollapsibleSection
              title="Request Body"
              icon={FileJson}
              copyText={typeof logDetail.request_body === "string" ? logDetail.request_body : JSON.stringify(logDetail.request_body, null, 2)}
            >
              <div className="max-h-[400px] overflow-auto no-scrollbar p-3 rounded-lg bg-black/20 border border-white/[0.03]">
                <JsonHighlight data={logDetail.request_body} />
              </div>
            </CollapsibleSection>
          )}
        </motion.div>

        {/* ─── Right Panel: Response ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-[#2CE8C3]" />
            <h2 className="text-sm font-bold text-white tracking-wider uppercase">Response</h2>
          </div>

          {/* Response Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-card rounded-xl p-3">
              <div className="text-[9px] text-[#A2BDDB]/20 uppercase tracking-wider mb-1">Status</div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusColor.bg} ${statusColor.text}`}>
                  {logDetail.status_code}
                </span>
                <span className="text-[9px] text-[#A2BDDB]/20">{statusColor.label}</span>
              </div>
            </div>
            <div className="glass-card rounded-xl p-3">
              <div className="text-[9px] text-[#A2BDDB]/20 uppercase tracking-wider mb-1">Latency</div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#A2BDDB]/30" />
                <span className="text-xs font-mono text-white">{logDetail.latency_ms}ms</span>
              </div>
            </div>
            <div className="glass-card rounded-xl p-3">
              <div className="text-[9px] text-[#A2BDDB]/20 uppercase tracking-wider mb-1">Size</div>
              <span className="text-xs font-mono text-[#A2BDDB]/50">
                {logDetail.response_size > 1024
                  ? `${(logDetail.response_size / 1024).toFixed(1)}KB`
                  : `${logDetail.response_size}B`}
              </span>
            </div>
            <div className="glass-card rounded-xl p-3">
              <div className="text-[9px] text-[#A2BDDB]/20 uppercase tracking-wider mb-1">Cache</div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                logDetail.was_cached
                  ? "bg-emerald-500/[0.1] text-emerald-400"
                  : "bg-white/[0.03] text-[#A2BDDB]/30"
              }`}>
                {logDetail.was_cached ? "HIT" : "MISS"}
              </span>
            </div>
          </div>

          {/* Timestamp */}
          <div className="glass-card rounded-xl p-3">
            <div className="text-[9px] text-[#A2BDDB]/20 uppercase tracking-wider mb-1">Timestamp</div>
            <span className="text-xs font-mono text-[#A2BDDB]/50">
              {logDetail.created_at ? new Date(logDetail.created_at).toLocaleString() : "N/A"}
            </span>
          </div>

          {/* Response Body */}
          {logDetail.response_body ? (
            <CollapsibleSection
              title="Response Body"
              icon={FileJson}
              copyText={typeof logDetail.response_body === "string" ? logDetail.response_body : JSON.stringify(logDetail.response_body, null, 2)}
            >
              <div className="max-h-[500px] overflow-auto no-scrollbar p-3 rounded-lg bg-black/20 border border-white/[0.03]">
                <JsonHighlight data={logDetail.response_body} />
              </div>
            </CollapsibleSection>
          ) : (
            <div className="glass-card rounded-xl p-8 text-center">
              <Database className="w-8 h-8 text-[#A2BDDB]/10 mx-auto mb-3" />
              <div className="text-xs text-[#A2BDDB]/30">No response body captured</div>
              <div className="text-[10px] text-[#A2BDDB]/15 mt-1">Response body will appear for future requests</div>
            </div>
          )}

          {/* cURL Preview */}
          <CollapsibleSection
            title="cURL Command"
            icon={Terminal}
            defaultOpen={false}
            copyText={generateCurl()}
          >
            <div className="max-h-[300px] overflow-auto no-scrollbar p-3 rounded-lg bg-black/20 border border-white/[0.03]">
              <pre className="text-[11px] leading-[1.7] font-mono text-[#A2BDDB]/50">
                <code>{generateCurl()}</code>
              </pre>
            </div>
          </CollapsibleSection>
        </motion.div>
      </div>
    </div>
  );
}
