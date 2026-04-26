"use client";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useUser } from "@/lib/user-context";
import { Loader2, Copy, CheckCircle2, Plus, Trash2, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ApiKeysPage() {
  const { user } = useUser();
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");

  const loadKeys = () => {
    setLoading(true);
    fetchApi("/api/user/me")
      .then((res) => {
        setPlan(res.plan);
        setKeys(res.api_keys || []);
        setLoading(false);
      })
      .catch((_err) => {
        toast.error("Failed to load keys");
        setLoading(false);
      });
  };

  useEffect(() => {
    // Use cached data from UserContext if available (instant load!)
    if (user) {
      setPlan(user.plan || "free");
      setKeys(user.api_keys || []);
      setLoading(false);
    } else {
      // Fallback: fetch directly
      loadKeys();
    }
  }, [user]);

  const handleCopy = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(key);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Failed to copy — check browser permissions");
    }
  };

  const toggleReveal = (key: string) => {
    const newRevealed = new Set(revealedKeys);
    if (newRevealed.has(key)) {
      newRevealed.delete(key);
    } else {
      newRevealed.add(key);
    }
    setRevealedKeys(newRevealed);
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setProcessing(true);
    try {
      await fetchApi("/api/user/keys", {
        method: "POST",
        body: JSON.stringify({ name: newKeyName }),
      });
      toast.success("API Key created successfully");
      setShowCreateModal(false);
      setNewKeyName("");
      loadKeys();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteKey = async () => {
    if (showDeleteModal === null) return;
    setProcessing(true);
    try {
      await fetchApi(`/api/user/keys/${showDeleteModal}`, {
        method: "DELETE",
      });
      toast.success("API Key deleted");
      setShowDeleteModal(null);
      loadKeys();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete key");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#04e184]" />
    </div>
  );

  const maxKeys = plan === "pro" ? 10 : plan === "plus" ? 3 : 1;
  const canCreateMore = keys.length < maxKeys;

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">API Keys</h1>
          <p className="text-sm text-zinc-400">Manage your API gateway keys.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!canCreateMore}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all min-h-[44px] w-full sm:w-auto justify-center ${
            canCreateMore 
              ? "bg-[#04e184] text-black hover:bg-white" 
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50"
          }`}
        >
          <Plus className="h-4 w-4" />
          Create New Key
        </button>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        {/* Desktop: table view */}
        <div className="hidden md:block table-scroll-mobile">
          <table className="w-full text-left min-w-[500px]">
            <thead className="bg-white/[0.02] text-zinc-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Key</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-sm text-zinc-300">
              {keys.map((k, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{k.name}</td>
                  <td className="px-6 py-4 font-mono text-[#04e184] whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {revealedKeys.has(k.key) 
                        ? k.key 
                        : `bk_••••••••••••${k.key.substring(k.key.length - 4)}`}
                      <button 
                        onClick={() => toggleReveal(k.key)}
                        className="text-xs text-zinc-500 hover:text-[#04e184] transition-colors underline decoration-dotted"
                      >
                        {revealedKeys.has(k.key) ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400">
                    {new Date(k.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleCopy(k.key)}
                      className="p-2 hover:bg-white/[0.04] rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      {copied === k.key ? (
                        <CheckCircle2 className="h-4 w-4 text-[#04e184]" />
                      ) : (
                        <Copy className="h-4 w-4 text-zinc-400" />
                      )}
                    </button>
                    {keys.length > 1 && (
                      <button
                        onClick={() => setShowDeleteModal(k.id)}
                        className="p-2 hover:bg-red-500/10 rounded-md transition-colors group min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <Trash2 className="h-4 w-4 text-zinc-500 group-hover:text-red-500" />
                      </button>
                    )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: card view */}
        <div className="md:hidden divide-y divide-white/[0.04]">
          {keys.map((k, i) => (
            <div key={i} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white text-sm">{k.name}</span>
                <span className="text-xs text-zinc-500">
                  {new Date(k.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="font-mono text-[#04e184] text-sm break-all">
                {revealedKeys.has(k.key)
                  ? k.key
                  : `bk_••••••••••••${k.key.substring(k.key.length - 4)}`}
                <button
                  onClick={() => toggleReveal(k.key)}
                  className="text-xs text-zinc-500 hover:text-[#04e184] transition-colors underline decoration-dotted ml-2"
                >
                  {revealedKeys.has(k.key) ? 'Hide' : 'Reveal'}
                </button>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleCopy(k.key)}
                  className="p-2 hover:bg-white/[0.04] rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  {copied === k.key ? (
                    <CheckCircle2 className="h-4 w-4 text-[#04e184]" />
                  ) : (
                    <Copy className="h-4 w-4 text-zinc-400" />
                  )}
                </button>
                {keys.length > 1 && (
                  <button
                    onClick={() => setShowDeleteModal(k.id)}
                    className="p-2 hover:bg-red-500/10 rounded-md transition-colors group min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4 text-zinc-500 group-hover:text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white/[0.02] border-t border-white/[0.04] text-sm text-zinc-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="min-w-0">{`${plan === "free" ? "Free" : plan === "plus" ? "Plus" : "Pro"} plan — ${keys.length}/${maxKeys} API key${maxKeys > 1 ? 's' : ''} used.`}</p>
          {plan !== "pro" && (
            <Link
              href="/dashboard/billing"
              className="text-[#04e184] hover:underline font-medium flex-shrink-0"
            >
              Upgrade Plan →
            </Link>
          )}
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 sm:p-6">
        <h3 className="font-semibold text-[#04e184] mb-2 flex items-center gap-2">
          Usage Guide <Copy className="h-3 w-3" />
        </h3>
        <p className="text-zinc-300 text-sm mb-4">
          Include your API key in the <code className="text-[#04e184]">X-API-Key</code> header to auth requests:
        </p>
        <pre className="bg-black/50 border border-white/[0.06] p-3 sm:p-4 rounded-lg text-sm font-mono text-zinc-300 overflow-x-auto">
          <code>{`curl -X GET https://backport.in/proxy/endpoint \\
  -H "X-API-Key: bk_YOUR_API_KEY"`}</code>
        </pre>
      </div>

      {/* Delete Modal */}
      {showDeleteModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 sm:mobile-fullscreen-modal">
          <div className="w-full max-w-sm rounded-xl border border-white/[0.08] bg-[#0D131A] p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
              <ShieldAlert className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-white">Delete API Key?</h3>
            <p className="mb-6 text-sm text-zinc-400 leading-relaxed">
              This will immediately invalidate this key. Any services currently using it will be blocked. This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/[0.04] min-h-[44px] sm:order-1"
                disabled={processing}
              >
                Keep Key
              </button>
              <button
                onClick={handleDeleteKey}
                disabled={processing}
                className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 min-h-[44px] sm:order-2"
              >
                {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 sm:mobile-fullscreen-modal">
          <div className="w-full max-w-sm rounded-xl border border-white/[0.08] bg-[#0D131A] p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-white">New API Key</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase font-mono block mb-2">Key Name</label>
                <input 
                  autoFocus
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Staging Environment"
                  className="w-full bg-black/50 border border-white/[0.08] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#04e184] transition-colors text-white min-h-[44px]"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/[0.04] min-h-[44px] sm:order-1"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateKey}
                  disabled={processing || !newKeyName.trim()}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#04e184] px-4 py-2.5 text-sm font-semibold text-black hover:bg-white disabled:opacity-50 min-h-[44px] sm:order-2"
                >
                  {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
