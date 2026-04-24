"use client";

import { useState, useEffect } from "react";
import { TerminalSquare, Send, Zap, Activity, Clock, ShieldAlert } from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function PlaygroundPage() {
  const [apiKey, setApiKey] = useState("");
  const [keys, setKeys] = useState<any[]>([]);
  const [targetUrl, setTargetUrl] = useState("https://jsonplaceholder.typicode.com/todos/1");
  const [method, setMethod] = useState("GET");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ ms: 0, status: 0 });

  useEffect(() => {
    fetchApi("/api/user/keys")
      .then((data: any) => {
        if (data && data.length > 0) {
          setKeys(data);
          setApiKey(data[0].key);
        }
      })
      .catch((err) => {
        toast.error("Failed to load API keys for playground");
      });
  }, []);

  const handleTest = async () => {
    if (!apiKey) {
      toast.error("Please explicitly select or create an API Key first.");
      return;
    }
    if (!targetUrl.startsWith("http")) {
      toast.error("Target URL must start with http:// or https://");
      return;
    }

    setLoading(true);
    setResponse(null);
    setStats({ ms: 0, status: 0 });
    
    // Extract endpoint path from targetUrl to put on proxy
    let path = "/target-endpoint";
    try {
      const url = new URL(targetUrl);
      path = url.pathname + url.search;
    } catch {}

    const proxyUrl = `${process.env.NEXT_PUBLIC_API_URL || "https://backport-io.onrender.com"}/proxy${path}`;
    const startTime = performance.now();
    
    try {
      const headers: Record<string, string> = {
        "X-API-Key": apiKey,
        "X-Target-Url": targetUrl, // Overrides the default backend purely for testing proxy
      };
      
      if (idempotencyKey && method === "POST") {
        headers["Idempotency-Key"] = idempotencyKey;
      }

      const res = await fetch(proxyUrl, {
        method,
        headers,
        // body only if POST
        ...(method === "POST" ? { body: JSON.stringify({ test: "data from playground" }) } : {})
      });
      
      const endTime = performance.now();
      setStats({ ms: Math.round(endTime - startTime), status: res.status });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await res.json();
        setResponse(json);
      } else {
        const text = await res.text();
        setResponse({ _text: text });
      }
      
      if (res.ok) {
        toast.success(`Success! ${res.status}`);
      } else {
        toast.error(`Error: HTTP ${res.status}`);
      }
      
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Request failed: ${msg}`);
      setResponse({ _error: msg });
      setStats({ ms: Math.round(performance.now() - startTime), status: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">API Playground</h1>
          <p className="text-sm text-zinc-400">
            Make real requests through your Backport Gateway to test Rate Limiting, Caching, WAF, and Idempotency in real-time.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Request Builder */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-zinc-400" />
            Build Request
          </h2>
          
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Request Method</label>
            <div className="flex flex-wrap gap-2">
              {['GET', 'POST', 'PUT', 'DELETE'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-colors min-h-[44px] ${method === m ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
             <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Select API Key</label>
             <select
               value={apiKey}
               onChange={(e) => setApiKey(e.target.value)}
               className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
             >
               <option value="" disabled>Select an API Key...</option>
               {keys.map((k) => (
                 <option key={k.key} value={k.key}>{k.name} - {k.key.substring(0, 15)}...</option>
               ))}
             </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Target URL to Proxy To</label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://api.example.com/data"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
          
          {method === "POST" && (
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Idempotency Key (Optional)</label>
              <input
                type="text"
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                placeholder="e.g. txn_12345"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm font-mono text-amber-400 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-zinc-500 mt-1">Send the identical POST request twice with the same key to verify idempotency blocks the second duplicate.</p>
            </div>
          )}

          <button
            onClick={handleTest}
            disabled={loading || !apiKey}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <span className="h-5 w-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Send className="w-5 h-5"/>}
            Send Request Through Proxy
          </button>
        </div>

        {/* Right Side: Response View */}
        <div className="bg-black border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
          <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Response Viewer
            </h2>
            <div className="flex items-center gap-3">
               {stats.status > 0 && (
                 <span className={`px-2 py-0.5 rounded text-xs font-bold ${stats.status >= 200 && stats.status < 300 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                   HTTP {stats.status}
                 </span>
               )}
               {stats.ms > 0 && (
                 <span className="flex items-center gap-1 text-xs text-zinc-400 font-mono">
                   <Clock className="w-3 h-3" /> {stats.ms}ms
                 </span>
               )}
            </div>
          </div>
          
          <div className="p-4 flex-1 bg-zinc-950 font-mono text-sm overflow-auto min-h-[300px]">
             {loading ? (
               <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-3">
                 <span className="h-8 w-8 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
                 <p className="animate-pulse">Awaiting Gateway Response...</p>
               </div>
             ) : response ? (
               <pre className="text-emerald-400 whitespace-pre-wrap word-break">
                 {JSON.stringify(response, null, 2)}
               </pre>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                 <TerminalSquare className="w-12 h-12 mb-3 opacity-20" />
                 Waiting to intercept traffic...
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
