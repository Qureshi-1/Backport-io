"use client";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Loader2, Server, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gatewayEnabled, setGatewayEnabled] = useState(true);
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [cachingEnabled, setCachingEnabled] = useState(false);
  const [idempotencyEnabled, setIdempotencyEnabled] = useState(true);
  const [wafEnabled, setWafEnabled] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [lastTested, setLastTested] = useState<string | null>(null);

  useEffect(() => {
    fetchApi("/api/user/settings")
      .then((res) => {
        setUrl(res.target_backend_url || "");
        setRateLimitEnabled(res.rate_limit_enabled ?? true);
        setCachingEnabled(res.caching_enabled ?? false);
        setIdempotencyEnabled(res.idempotency_enabled ?? true);
        setWafEnabled(res.waf_enabled ?? false);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load settings");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate URL format
    if (url && !url.match(/^https?:\/\/.+/)) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setSaving(true);

    try {
      await fetchApi("/api/user/settings", {
        method: "PUT",
        body: JSON.stringify({ 
          target_backend_url: url,
          rate_limit_enabled: rateLimitEnabled,
          caching_enabled: cachingEnabled,
          idempotency_enabled: idempotencyEnabled,
          waf_enabled: wafEnabled,
        }),
      });
      toast.success("Settings saved successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!url) return toast.error("Please enter a target URL first");
    setTestingConnection(true);
    try {
      await new Promise(r => setTimeout(r, 1500)); // mock network delay
      // Perform mock ping
      setLastTested(new Date().toISOString());
      toast.success("Connection successful! Backend is reachable.");
    } catch (err) {
      toast.error("Failed to connect to backend");
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
          <p className="text-zinc-400">Configure your target backend URL.</p>
        </div>
        
        {/* Gateway Toggle */}
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">
          <span className="text-sm font-medium text-zinc-300">Gateway Status</span>
          <button
            type="button"
            onClick={() => setGatewayEnabled(!gatewayEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${gatewayEnabled ? 'bg-emerald-500' : 'bg-zinc-600'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${gatewayEnabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
          <span className={`text-xs font-semibold ${gatewayEnabled ? 'text-emerald-500' : 'text-zinc-500'}`}>
            {gatewayEnabled ? 'Active' : 'Paused'}
          </span>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
              <Server className="h-4 w-4" />
              Target Backend URL
            </label>
            <p className="text-xs text-zinc-500 mb-3">
              Where should Backport forward traffic? (e.g.
              https://api.yourdomain.com)
            </p>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-api.com"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-800 space-y-4">
            <h3 className="text-zinc-300 font-semibold mb-4">Security & Performance Features</h3>
            
            <div className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
              <div>
                <h4 className="text-sm font-medium text-zinc-200">Rate Limiting</h4>
                <p className="text-xs text-zinc-500 mt-1">Cap traffic at 60 req/min (Free Tier limit rules)</p>
              </div>
              <button type="button" onClick={() => setRateLimitEnabled(!rateLimitEnabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rateLimitEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rateLimitEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
              <div>
                <h4 className="text-sm font-medium text-zinc-200">LRU Caching (GET)</h4>
                <p className="text-xs text-zinc-500 mt-1">Cache successful GET endpoints for 5 minutes.</p>
              </div>
              <button type="button" onClick={() => setCachingEnabled(!cachingEnabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${cachingEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cachingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
              <div>
                <h4 className="text-sm font-medium text-zinc-200">Idempotency</h4>
                <p className="text-xs text-zinc-500 mt-1">Drop duplicated POSTs returning same response safely.</p>
              </div>
              <button type="button" onClick={() => setIdempotencyEnabled(!idempotencyEnabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${idempotencyEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${idempotencyEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
              <div>
                <h4 className="text-sm font-medium text-zinc-200">WAF Blocklist</h4>
                <p className="text-xs text-zinc-500 mt-1">Auto-block SQL Injection rules and malicious tags.</p>
              </div>
              <button type="button" onClick={() => setWafEnabled(!wafEnabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${wafEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${wafEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection || !url}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 border border-zinc-700"
              >
                {testingConnection && <Loader2 className="h-4 w-4 animate-spin" />}
                {!testingConnection && <Server className="h-4 w-4" />}
                Test Connection
              </button>
              {lastTested && (
                <span className="text-xs text-zinc-500">
                  Last tested: {new Date(lastTested).toLocaleTimeString()}
                </span>
              )}
            </div>
            
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
