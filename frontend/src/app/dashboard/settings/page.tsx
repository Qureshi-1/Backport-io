"use client";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Loader2, Server, AlertCircle, Lock, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [cachingEnabled, setCachingEnabled] = useState(false);
  const [idempotencyEnabled, setIdempotencyEnabled] = useState(true);
  const [wafEnabled, setWafEnabled] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [lastTested, setLastTested] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save settings";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!url) return toast.error("Please enter a target URL first");
    setTestingConnection(true);
    try {
      // First save the URL so the backend tests against the latest value
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
      // Then test the connection via the backend
      const res = await fetchApi("/api/user/test-connection");
      setLastTested(new Date().toISOString());
      if (res.success) {
        toast.success(`Connection successful! (HTTP ${res.status_code})`);
      } else {
        toast.error(res.error || "Connection failed");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Connection failed - check your URL");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      await fetchApi("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password";
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;

    setDeleting(true);
    try {
      await fetchApi("/api/user/account", {
        method: "DELETE",
      });
      toast.success("Account deleted successfully.");
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete account";
      toast.error(msg);
      setShowDeleteModal(false);
      setDeleteConfirmText("");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-[#04e184]" />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Settings</h1>
          <p className="text-sm text-zinc-400">Configure your target backend URL.</p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 sm:px-4 py-2 rounded-xl min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-500 whitespace-nowrap">
            Active
          </span>
        </div>
      </div>

      {/* ─── Backend Configuration ─── */}
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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
              <div>
                <h4 className="text-sm font-medium text-zinc-200">Rate Limiting</h4>
                <p className="text-xs text-zinc-500 mt-1">Cap traffic at 100 req/min (Free Tier limit rules)</p>
              </div>
              <button type="button" onClick={() => setRateLimitEnabled(!rateLimitEnabled)} className={`relative inline-flex h-8 w-14 sm:h-6 sm:w-11 items-center rounded-full transition-colors flex-shrink-0 ${rateLimitEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rateLimitEnabled ? 'translate-x-8 sm:translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
              <div>
                <h4 className="text-sm font-medium text-zinc-200">LRU Caching (GET)</h4>
                <p className="text-xs text-zinc-500 mt-1">Cache successful GET endpoints for 5 minutes.</p>
              </div>
              <button type="button" onClick={() => setCachingEnabled(!cachingEnabled)} className={`relative inline-flex h-8 w-14 sm:h-6 sm:w-11 items-center rounded-full transition-colors flex-shrink-0 ${cachingEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cachingEnabled ? 'translate-x-8 sm:translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
              <div>
                <h4 className="text-sm font-medium text-zinc-200">Idempotency</h4>
                <p className="text-xs text-zinc-500 mt-1">Drop duplicated POSTs returning same response safely.</p>
              </div>
              <button type="button" onClick={() => setIdempotencyEnabled(!idempotencyEnabled)} className={`relative inline-flex h-8 w-14 sm:h-6 sm:w-11 items-center rounded-full transition-colors flex-shrink-0 ${idempotencyEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${idempotencyEnabled ? 'translate-x-8 sm:translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
              <div>
                <h4 className="text-sm font-medium text-zinc-200">WAF Blocklist</h4>
                <p className="text-xs text-zinc-500 mt-1">Auto-block SQL Injection rules and malicious tags.</p>
              </div>
              <button type="button" onClick={() => setWafEnabled(!wafEnabled)} className={`relative inline-flex h-8 w-14 sm:h-6 sm:w-11 items-center rounded-full transition-colors flex-shrink-0 ${wafEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${wafEnabled ? 'translate-x-8 sm:translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-zinc-800">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection || !url}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 border border-zinc-700 min-h-[44px]"
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
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* ─── Change Password ─── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="h-4 w-4 text-zinc-400" />
          <h2 className="text-lg font-bold text-white">Change Password</h2>
        </div>
        <p className="text-sm text-zinc-500 mb-6">Update your password to keep your account secure.</p>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min. 8 characters)"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors"
            />
          </div>

          {passwordError && (
            <div className="flex items-start gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changingPassword}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {changingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
              Change Password
            </button>
          </div>
        </form>
      </div>

      {/* ─── Danger Zone ─── */}
      <div className="bg-zinc-900 border border-red-500/30 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <Trash2 className="h-4 w-4 text-red-500" />
          <h2 className="text-lg font-bold text-red-500">Danger Zone</h2>
        </div>
        <p className="text-sm text-zinc-500 mb-6">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-red-500/5 rounded-lg border border-red-500/20">
          <div>
            <h4 className="text-sm font-medium text-zinc-200">Delete Account</h4>
            <p className="text-xs text-zinc-500 mt-1">
              Once you delete your account, there is no going back.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors border border-red-500/30 min-h-[44px]"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </button>
        </div>
      </div>

      {/* ─── Delete Confirmation Modal ─── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
          />
          {/* Modal */}
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <button
              onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Account</h3>
                <p className="text-sm text-zinc-500">This action is permanent</p>
              </div>
            </div>

            <p className="text-sm text-zinc-400 mb-6">
              This will permanently delete your account, API keys, logs, and all associated data. You will be logged out and redirected to the homepage.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Type <span className="text-red-500 font-bold">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-red-500 outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors border border-zinc-700 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || deleting}
                className="bg-red-500 hover:bg-red-400 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {deleting ? "Deleting..." : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
