"use client";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Loader2, Copy, CheckCircle2, Plus, Trash2, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

export default function ApiKeysPage() {
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
      .catch((err) => {
        toast.error("Failed to load keys");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
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
    } catch (err: any) {
      toast.error(err.message || "Failed to create key");
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
    } catch (err: any) {
      toast.error(err.message || "Failed to delete key");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  );

  const maxKeys = plan === "pro" ? 10 : plan === "plus" ? 3 : 1;
  const canCreateMore = keys.length < maxKeys;

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">API Keys</h1>
          <p className="text-zinc-400">Manage your Backport gateway keys.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!canCreateMore}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            canCreateMore 
              ? "bg-white text-black hover:bg-zinc-200" 
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50"
          }`}
        >
          <Plus className="h-4 w-4" />
          Create New Key
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
            <thead className="bg-zinc-800/50 text-zinc-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Key</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-sm text-zinc-300">
              {keys.map((k, i) => (
                <tr key={i} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{k.name}</td>
                  <td className="px-6 py-4 font-mono text-emerald-400 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {revealedKeys.has(k.key) 
                        ? k.key 
                        : `bk_••••••••••••${k.key.substring(k.key.length - 4)}`}
                      <button 
                        onClick={() => toggleReveal(k.key)}
                        className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors underline decoration-dotted"
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
                      className="p-2 hover:bg-zinc-800 rounded-md transition-colors"
                    >
                      {copied === k.key ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-zinc-400" />
                      )}
                    </button>
                    {keys.length > 1 && (
                      <button
                        onClick={() => setShowDeleteModal(k.id)}
                        className="p-2 hover:bg-red-500/10 rounded-md transition-colors group"
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

        {plan === "free" && (
          <div className="p-4 bg-zinc-800/30 border-t border-zinc-800 text-sm text-zinc-400 flex items-center justify-between">
            <p>Free plan is limited to 1 API gateway. Upgrade for more.</p>
            <a
              href="/dashboard/billing"
              className="text-emerald-400 hover:underline font-medium"
            >
              Upgrade Plan →
            </a>
          </div>
        )}
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
        <h3 className="font-semibold text-emerald-500 mb-2 flex items-center gap-2">
          Usage Guide <Copy className="h-3 w-3" />
        </h3>
        <p className="text-zinc-300 text-sm mb-4">
          Include your API key in the <code>X-API-Key</code> header to auth requests:
        </p>
        <pre className="bg-black border border-white/5 p-4 rounded-lg text-sm font-mono text-zinc-300">
          <code>{`curl -X GET https://backport-io.onrender.com/proxy/endpoint \\
  -H "X-API-Key: bk_YOUR_API_KEY"`}</code>
        </pre>
      </div>

      {/* Delete Modal */}
      {showDeleteModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
              <ShieldAlert className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-white">Delete API Key?</h3>
            <p className="mb-6 text-sm text-zinc-400 leading-relaxed">
              This will immediately invalidate this key. Any services currently using it will be blocked. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
                disabled={processing}
              >
                Keep Key
              </button>
              <button
                onClick={handleDeleteKey}
                disabled={processing}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 text-white">
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold">New API Key</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase font-mono block mb-2">Key Name</label>
                <input 
                  autoFocus
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Staging Environment"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateKey}
                  disabled={processing || !newKeyName.trim()}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50"
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
