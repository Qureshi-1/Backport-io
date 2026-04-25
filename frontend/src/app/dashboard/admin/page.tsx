"use client";
import { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import {
  Users, Activity, MessageSquare, Loader2, ShieldCheck, AlertTriangle,
  Lightbulb, Bug, ChevronDown, ChevronUp, Search, Clock, CreditCard,
  CheckCircle2, XCircle, X, Crown, Zap, Star, TrendingUp, UserCog,
  Plus, ArrowDownUp, Ban, Server, Database, Shield, Cpu, RefreshCw,
  Eye, Trash2, UserMinus, Mail, ExternalLink, DollarSign, Key, Monitor, Gauge,
} from "lucide-react";

type Tab = "overview" | "users" | "system" | "feedback";
type PlanFilter = "all" | "free" | "plus" | "pro" | "enterprise";
type StatusFilter = "all" | "active" | "expiring" | "expired";

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  free:        { label: "Free",        color: "text-zinc-400", bg: "bg-zinc-800/60", icon: Users },
  plus:        { label: "Plus",        color: "text-blue-400",   bg: "bg-blue-500/10", icon: Zap },
  pro:         { label: "Pro",         color: "text-emerald-400",bg: "bg-emerald-500/10", icon: ShieldCheck },
  enterprise:  { label: "Enterprise",  color: "text-orange-400", bg: "bg-orange-500/10", icon: Crown },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active:        { label: "Active",        color: "text-emerald-400", bg: "bg-emerald-500/10", dot: "bg-emerald-400" },
  expiring_soon: { label: "Expiring Soon", color: "text-yellow-400",  bg: "bg-yellow-500/10", dot: "bg-yellow-400 animate-pulse" },
  expired:       { label: "Expired",       color: "text-red-400",     bg: "bg-red-500/10",     dot: "bg-red-400" },
};

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [expandedFeedback, setExpandedFeedback] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalPlan, setModalPlan] = useState("pro");
  const [modalDuration, setModalDuration] = useState(30);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");

  // Action feedback
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMsg = useCallback((type: "success" | "error", text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  }, []);

  const fetchUsers = useCallback(async (plan?: string, status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (plan && plan !== "all") params.set("plan_filter", plan);
    if (status && status !== "all") params.set("status_filter", status);
    if (search) params.set("search", search);
    const res = await fetchApi(`/api/admin/users?${params.toString()}`);
    setUsers(res || []);
    return res || [];
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, u, f, h] = await Promise.all([
        fetchApi("/api/admin/stats").catch(() => null),
        fetchUsers(planFilter, statusFilter, searchQuery).catch(() => []),
        fetchApi("/api/feedback").catch(() => []),
        fetchApi("/health").catch(() => null),
      ]);
      setStats(s || null);
      setFeedbacks(f || []);
      setHealth(h || null);
    } catch (err: any) {
      setError(err?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, planFilter, statusFilter, searchQuery]);

  useEffect(() => { refreshData(); }, [refreshData]);

  useEffect(() => {
    if (activeTab === "users") fetchUsers(planFilter, statusFilter, searchQuery);
  }, [planFilter, statusFilter, searchQuery, activeTab, fetchUsers]);

  const openPlanModal = (user: any) => {
    setSelectedUser(user);
    setModalPlan(user.plan === "free" ? "pro" : user.plan);
    setModalDuration(30);
    setShowPlanModal(true);
  };

  const openDeleteModal = (user: any) => {
    setSelectedUser(user);
    setDeleteConfirmEmail("");
    setShowDeleteModal(true);
  };

  const handleAssignPlan = async () => {
    if (!selectedUser) return;
    setUpdating(selectedUser.email);
    try {
      await fetchApi("/api/admin/update-plan", {
        method: "POST",
        body: JSON.stringify({ email: selectedUser.email, plan: modalPlan, duration_days: modalDuration }),
      });
      showMsg("success", `${selectedUser.email} -> ${modalPlan} (${modalDuration} days)`);
      setShowPlanModal(false);
      await Promise.all([fetchUsers(planFilter, statusFilter, searchQuery), fetchApi("/api/admin/stats").then(s => setStats(s))]);
    } catch {
      showMsg("error", "Failed to update plan");
    } finally {
      setUpdating(null);
    }
  };

  const handleExtendPlan = async (email: string, days: number) => {
    setUpdating(email);
    try {
      await fetchApi("/api/admin/extend-plan", {
        method: "POST",
        body: JSON.stringify({ email, extra_days: days }),
      });
      showMsg("success", `${email} extended by ${days} days`);
      refreshData();
    } catch {
      showMsg("error", "Failed to extend plan");
    } finally {
      setUpdating(null);
    }
  };

  const handleRevokePlan = async (email: string) => {
    if (!confirm(`Revoke paid plan from ${email}? They will be moved to Free.`)) return;
    setUpdating(email);
    try {
      await fetchApi("/api/admin/revoke-plan", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      showMsg("success", `${email} moved to Free plan`);
      refreshData();
    } catch {
      showMsg("error", "Failed to revoke plan");
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || deleteConfirmEmail !== selectedUser.email) return;
    if (!confirm(`PERMANENTLY delete ${selectedUser.email} and ALL their data? This cannot be undone!`)) return;
    setUpdating(selectedUser.email);
    try {
      await fetchApi("/api/admin/delete-user", {
        method: "POST",
        body: JSON.stringify({ email: selectedUser.email, secret: "skip" }),
      });
      showMsg("success", `User ${selectedUser.email} deleted permanently`);
      setShowDeleteModal(false);
      refreshData();
    } catch {
      showMsg("error", "Failed to delete user");
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateFeedbackStatus = async (id: number, status: string) => {
    try {
      await fetchApi(`/api/feedback/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      const updated = await fetchApi("/api/feedback");
      setFeedbacks(updated || []);
    } catch {
      alert("Failed to update feedback status");
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "--";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatDateTime = (iso: string | null) => {
    if (!iso) return "--";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getDaysUntilExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatMRR = (mrr: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(mrr);
  };

  const pendingFeedbacks = feedbacks.filter((f: any) => f.status === "pending").length;

  // Health check helper
  const healthStatus = (key: string) => {
    const val = health?.checks?.[key];
    if (val === "ok") return { label: "Healthy", ok: true };
    if (val) return { label: val, ok: false };
    return { label: "Unknown", ok: false };
  };

  // ─── Loading State ─────────────────────────────────────────────────────
  if (loading && !stats && !error) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl">
        <div className="h-8 w-64 bg-zinc-800 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl h-28" />
          ))}
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl h-64" />
      </div>
    );
  }

  // ─── Error State ───────────────────────────────────────────────────────
  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-white text-sm font-medium mb-1">Failed to load admin data</p>
          <p className="text-zinc-500 text-xs">{error}</p>
        </div>
        <button onClick={refreshData} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-zinc-700 text-white text-sm hover:bg-white/10 transition-colors">
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Control Center</h1>
          </div>
          <p className="text-sm text-zinc-500 ml-12">Full platform control: analytics, users, system health & revenue.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refreshData} className="p-2 rounded-lg bg-white/[0.03] border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors" title="Refresh">
            <RefreshCw className="w-4 w-4" />
          </button>
          <UserCog className="w-5 h-5 text-zinc-600" />
        </div>
      </div>

      {/* Action Toast */}
      {actionMsg && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${actionMsg.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
          {actionMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
          <span className="text-sm font-medium">{actionMsg.text}</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-zinc-900/40 border border-zinc-800 rounded-xl w-fit flex-wrap">
        {([
          { id: "overview" as Tab, label: "Overview", icon: Activity },
          { id: "users" as Tab, label: `Users (${stats?.total_users ?? users.length})`, icon: Users },
          { id: "system" as Tab, label: "System", icon: Monitor },
          { id: "feedback" as Tab, label: "Feedback", icon: MessageSquare, badge: pendingFeedbacks },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white/10 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge && tab.badge > 0 && (
              <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          OVERVIEW TAB
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards — 8 metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: stats?.total_users || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", format: "number" },
              { label: "Revenue (MRR)", value: stats?.mrr_inr || 0, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10", format: "currency" },
              { label: "Requests (24h)", value: stats?.requests_last_24h || 0, icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10", format: "number" },
              { label: "Active API Keys", value: stats?.active_api_keys || 0, icon: Key, color: "text-indigo-400", bg: "bg-indigo-500/10", format: "number" },
              { label: "Paid Users", value: stats?.paid_users || 0, icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/10", format: "number" },
              { label: "WAF Blocks", value: stats?.waf_blocks || 0, icon: Shield, color: "text-red-400", bg: "bg-red-500/10", format: "number" },
              { label: "Error Rate", value: stats?.error_rate || 0, icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10", format: "percent", ok: (stats?.error_rate || 0) < 5 },
              { label: "Avg Latency", value: stats?.avg_latency_ms || 0, icon: Gauge, color: "text-cyan-400", bg: "bg-cyan-500/10", format: "ms", ok: (stats?.avg_latency_ms || 0) < 500 },
            ].map((card) => (
              <div key={card.label} className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl hover:border-zinc-700/50 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 ${card.bg} rounded-lg ${card.color}`}><card.icon className="h-4 w-4" /></div>
                  <span className="text-xs text-zinc-500">{card.label}</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {card.format === "currency" && formatMRR(card.value)}
                  {card.format === "percent" && `${card.value}%`}
                  {card.format === "ms" && `${card.value}ms`}
                  {card.format === "number" && card.value.toLocaleString()}
                </p>
                {card.ok === false && <span className="text-[10px] text-yellow-400 mt-1 block">Needs attention</span>}
              </div>
            ))}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan Distribution */}
            {stats?.plan_distribution && (
              <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-4">Plan Distribution</p>
                <div className="flex h-3 rounded-full overflow-hidden bg-zinc-800 mb-4">
                  {["free", "plus", "pro", "enterprise"].map(plan => {
                    const count = stats.plan_distribution[plan] || 0;
                    const total = stats.total_users || 1;
                    const pct = (count / total) * 100;
                    if (pct === 0) return null;
                    const colors: Record<string, string> = { free: "bg-zinc-500", plus: "bg-blue-500", pro: "bg-emerald-500", enterprise: "bg-orange-500" };
                    return <div key={plan} className={`${colors[plan]} transition-all`} style={{ width: `${Math.max(pct, 2)}%` }} title={`${plan}: ${count}`} />;
                  })}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {["free", "plus", "pro", "enterprise"].map(plan => {
                    const count = stats.plan_distribution[plan] || 0;
                    const cfg = PLAN_CONFIG[plan];
                    const pct = stats.total_users ? Math.round((count / stats.total_users) * 100) : 0;
                    return (
                      <div key={plan} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/30">
                        <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                          <cfg.icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-white font-medium">{cfg.label}</p>
                          <p className="text-[10px] text-zinc-500">{count} users ({pct}%)</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* System Health — Enhanced with real data */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Server className="w-4 h-4 text-zinc-500" />
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">System Health</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Backend", value: health?.status === "ok" ? "Online" : health?.status === "degraded" ? "Degraded" : "Checking...", icon: Cpu, ok: health?.status === "ok", detail: health ? `v${health.version || "2.0"}` : null },
                  { label: "Database", value: healthStatus("database").label, icon: Database, ok: healthStatus("database").ok },
                  { label: "Cache / Redis", value: healthStatus("cache").label, icon: Server, ok: healthStatus("cache").ok },
                  { label: "Uptime", value: health?.uptime || "--", icon: Clock, ok: true },
                  { label: "Expired Plans", value: stats?.expired_plans || 0, icon: AlertTriangle, ok: (stats?.expired_plans || 0) < 3, detail: (stats?.expired_plans || 0) > 0 ? "Need attention" : null },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30">
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-4 w-4 ${item.ok ? "text-zinc-500" : "text-yellow-400"}`} />
                      <span className="text-xs text-zinc-400">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.detail && <span className="text-[10px] text-zinc-600">{item.detail}</span>}
                      <span className={`w-2 h-2 rounded-full ${item.ok ? "bg-emerald-400" : "bg-yellow-400 animate-pulse"}`} />
                      <span className="text-xs font-medium text-white">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-4">Quick Actions</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Manage Users", desc: "Plans, access & more", icon: Users, tab: "users" as Tab },
                { label: "System Monitor", desc: "Health, uptime & checks", icon: Monitor, tab: "system" as Tab },
                { label: "View Feedback", desc: `${pendingFeedbacks} pending`, icon: MessageSquare, tab: "feedback" as Tab },
                { label: "API Docs", desc: "Swagger / OpenAPI", icon: ExternalLink, href: "/dashboard/docs" },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => action.tab ? setActiveTab(action.tab) : action.href ? window.open(action.href, "_blank") : null}
                  className="flex items-start gap-3 p-4 rounded-xl bg-zinc-800/30 border border-zinc-800 hover:border-zinc-600 text-left transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-white/[0.03] group-hover:bg-white/[0.06] transition-colors">
                    <action.icon className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">{action.label}</p>
                    <p className="text-[10px] text-zinc-600">{action.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          USERS TAB
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="text"
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as PlanFilter)}
              className="px-3 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-zinc-400 focus:outline-none focus:border-zinc-600"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="plus">Plus</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-zinc-400 focus:outline-none focus:border-zinc-600"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="font-semibold text-white text-sm">Users ({users.length})</h2>
              {(planFilter !== "all" || statusFilter !== "all" || searchQuery) && (
                <button onClick={() => { setPlanFilter("all"); setStatusFilter("all"); setSearchQuery(""); }} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Clear filters</button>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-900/60 text-[10px] uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Started</th>
                    <th className="px-4 py-3 font-medium">Expires</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {users.map((u) => {
                    const plan = PLAN_CONFIG[u.plan] || PLAN_CONFIG.free;
                    const status = STATUS_CONFIG[u.plan_status] || STATUS_CONFIG.active;
                    const daysLeft = getDaysUntilExpiry(u.plan_expires_at);

                    return (
                      <tr key={u.id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                              {(u.email || "U")[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-white text-xs font-medium truncate max-w-[180px]">{u.email}</div>
                              <div className="text-zinc-600 text-[10px]">
                                Joined {formatDate(u.created_at)}
                                {u.is_verified === false && <span className="ml-1 text-yellow-500">unverified</span>}
                              </div>
                            </div>
                            {u.is_admin && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-bold">ADMIN</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${plan.bg} ${plan.color}`}>
                            <plan.icon className="w-3 h-3" />
                            {plan.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.bg} ${status.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                          {daysLeft !== null && u.plan !== "free" && daysLeft > 0 && (
                            <span className="text-[10px] text-zinc-600 ml-1">{daysLeft}d left</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 text-xs">{formatDate(u.plan_started_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${u.plan_status === "expired" ? "text-red-400" : "text-zinc-500"}`}>
                            {formatDate(u.plan_expires_at)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold uppercase ${u.plan_source === "payment" ? "text-emerald-400" : u.plan_source === "admin" ? "text-blue-400" : "text-zinc-600"}`}>
                            {u.plan_source || "none"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openPlanModal(u)} disabled={updating === u.email} className="p-1.5 rounded-lg text-zinc-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50" title="Change Plan">
                              <ArrowDownUp className="w-3.5 h-3.5" />
                            </button>
                            {u.plan !== "free" && (
                              <>
                                <button onClick={() => handleExtendPlan(u.email, 30)} disabled={updating === u.email} className="p-1.5 rounded-lg text-zinc-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50" title="Extend +30 days">
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleRevokePlan(u.email)} disabled={updating === u.email} className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50" title="Revoke to Free">
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button onClick={() => openDeleteModal(u)} disabled={updating === u.email} className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50" title="Delete User">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-zinc-800/50">
              {users.map((u) => {
                const plan = PLAN_CONFIG[u.plan] || PLAN_CONFIG.free;
                const status = STATUS_CONFIG[u.plan_status] || STATUS_CONFIG.active;
                const daysLeft = getDaysUntilExpiry(u.plan_expires_at);

                return (
                  <div key={u.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-white text-sm font-medium truncate">{u.email}</div>
                        <div className="text-zinc-600 text-[10px] mt-0.5">Joined {formatDate(u.created_at)} {u.is_admin && <span className="ml-1 text-purple-400">ADMIN</span>}</div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${plan.bg} ${plan.color}`}>{plan.label}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${status.bg} ${status.color}`}>
                          <span className={`inline-block w-1 h-1 rounded-full mr-0.5 ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {(u.plan !== "free" && (u.plan_started_at || u.plan_expires_at)) && (
                      <div className="flex gap-4 text-[11px]">
                        {u.plan_started_at && <span className="text-zinc-500">Started: <strong className="text-zinc-400">{formatDate(u.plan_started_at)}</strong></span>}
                        {u.plan_expires_at && <span className={u.plan_status === "expired" ? "text-red-400" : "text-zinc-500"}>Expires: <strong>{formatDate(u.plan_expires_at)}</strong> {daysLeft !== null && daysLeft > 0 && <span className="text-zinc-600">({daysLeft}d)</span>}</span>}
                        <span className={`font-bold uppercase ${u.plan_source === "payment" ? "text-emerald-400" : u.plan_source === "admin" ? "text-blue-400" : "text-zinc-600"}`}>{u.plan_source}</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button onClick={() => openPlanModal(u)} className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-400 text-center min-h-[40px] inline-flex items-center justify-center gap-1"><ArrowDownUp className="w-3 h-3" /> Plan</button>
                      {u.plan !== "free" && (
                        <>
                          <button onClick={() => handleExtendPlan(u.email, 30)} className="py-1.5 px-3 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 min-h-[40px] inline-flex items-center justify-center gap-1"><Plus className="w-3 h-3" /> +30d</button>
                          <button onClick={() => handleRevokePlan(u.email)} className="py-1.5 px-3 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-400 min-h-[40px] inline-flex items-center justify-center gap-1"><Ban className="w-3 h-3" /> Revoke</button>
                        </>
                      )}
                      <button onClick={() => openDeleteModal(u)} className="py-1.5 px-3 rounded-lg text-[10px] font-bold bg-zinc-800/50 text-zinc-500 min-h-[40px] inline-flex items-center justify-center"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                );
              })}
            </div>

            {users.length === 0 && (
              <div className="p-12 text-center">
                <Users className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No users found matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SYSTEM TAB
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "system" && (
        <div className="space-y-6">
          {/* Service Status */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-4">Service Status</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Database", value: healthStatus("database").label, icon: Database, ok: healthStatus("database").ok },
                { label: "Cache / Redis", value: healthStatus("cache").label, icon: Server, ok: healthStatus("cache").ok },
                { label: "Backend", value: health?.status === "ok" ? "Running" : health?.status || "Unknown", icon: Cpu, ok: health?.status === "ok" },
                { label: "Version", value: health?.version ? `v${health.version}` : "--", icon: Shield, ok: true },
              ].map((svc) => (
                <div key={svc.label} className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-800">
                  <div className="flex items-center gap-3 mb-2">
                    <svc.icon className={`h-4 w-4 ${svc.ok ? "text-emerald-400" : "text-yellow-400"}`} />
                    <span className="text-xs text-zinc-400 font-medium">{svc.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${svc.ok ? "bg-emerald-400" : "bg-yellow-400 animate-pulse"}`} />
                    <span className="text-sm font-medium text-white">{svc.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Uptime & Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-4">Uptime & Performance</p>
              <div className="space-y-3">
                {[
                  { label: "Server Uptime", value: health?.uptime || "--", icon: Clock, ok: true },
                  { label: "Requests (24h)", value: (stats?.requests_last_24h || 0).toLocaleString(), icon: TrendingUp, ok: true },
                  { label: "Avg Latency", value: `${stats?.avg_latency_ms || 0}ms`, icon: Gauge, ok: (stats?.avg_latency_ms || 0) < 500 },
                  { label: "Error Rate", value: `${stats?.error_rate || 0}%`, icon: AlertTriangle, ok: (stats?.error_rate || 0) < 5 },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30">
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-4 w-4 ${item.ok ? "text-zinc-500" : "text-yellow-400"}`} />
                      <span className="text-xs text-zinc-400">{item.label}</span>
                    </div>
                    <span className="text-xs font-medium text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Stats */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-4">Platform Stats</p>
              <div className="space-y-3">
                {[
                  { label: "Total Teams", value: stats?.total_teams || 0, icon: Users },
                  { label: "Total Webhooks", value: stats?.total_webhooks || 0, icon: Zap },
                  { label: "WAF Rule Hits", value: stats?.waf_blocks || 0, icon: Shield },
                  { label: "Active API Keys", value: stats?.active_api_keys || 0, icon: Key },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30">
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-zinc-500" />
                      <span className="text-xs text-zinc-400">{item.label}</span>
                    </div>
                    <span className="text-xs font-medium text-white">{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Log placeholder */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center">
            <Activity className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-sm font-medium">Activity Log</p>
            <p className="text-zinc-600 text-xs mt-1">Detailed audit trail with user actions, API events, and system changes coming soon.</p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          FEEDBACK TAB
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "feedback" && (
        <div className="space-y-4">
          {feedbacks.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center">
              <MessageSquare className="h-10 w-10 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm">No feedback submitted yet.</p>
            </div>
          ) : (
            feedbacks.map((f: any) => {
              const typeColors: Record<string, { bg: string; text: string; border: string }> = {
                bug: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
                feature: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
              };
              const tc = typeColors[f.type] || { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" };
              const isExpanded = expandedFeedback === f.id;
              const statusStyles: Record<string, string> = {
                pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                reviewed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                dismissed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
              };
              return (
                <div key={f.id} className={`bg-zinc-900/40 border rounded-2xl overflow-hidden transition-all ${isExpanded ? "border-zinc-700" : "border-zinc-800"}`}>
                  <button onClick={() => setExpandedFeedback(isExpanded ? null : f.id)} className="w-full px-4 sm:px-6 py-4 flex items-center gap-4 text-left hover:bg-zinc-800/20 transition-colors">
                    <div className={`p-2 rounded-lg ${tc.bg} ${tc.text} flex-shrink-0`}>
                      {f.type === "bug" ? <Bug className="h-3.5 w-3.5" /> : f.type === "feature" ? <Lightbulb className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-sm font-medium truncate max-w-[200px]">{f.user_email}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${tc.bg} ${tc.text} ${tc.border}`}>{f.type}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusStyles[f.status] || statusStyles.pending}`}>{f.status}</span>
                      </div>
                      <p className="text-zinc-500 text-xs mt-1 truncate">{f.message}</p>
                    </div>
                    <div className="text-zinc-600 text-xs flex-shrink-0 hidden sm:block">{new Date(f.created_at).toLocaleDateString()}</div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-500 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-zinc-500 flex-shrink-0" />}
                  </button>
                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-6 border-t border-zinc-800">
                      <div className="pt-4 space-y-4">
                        <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800">
                          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{f.message}</p>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                          <span>From: <strong className="text-zinc-400">{f.user_email}</strong></span>
                          <span>Submitted: <strong className="text-zinc-400">{new Date(f.created_at).toLocaleString()}</strong></span>
                          {f.rating && <span>Rating: <strong className="text-zinc-400">{f.rating}/5</strong></span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {f.status === "pending" && (<>
                            <button onClick={() => handleUpdateFeedbackStatus(f.id, "reviewed")} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-500/20">Mark Reviewed</button>
                            <button onClick={() => handleUpdateFeedbackStatus(f.id, "resolved")} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">Mark Resolved</button>
                          </>)}
                          {f.status !== "dismissed" && <button onClick={() => handleUpdateFeedbackStatus(f.id, "dismissed")} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20 transition-colors border border-zinc-500/20">Dismiss</button>}
                          {f.status !== "pending" && <button onClick={() => handleUpdateFeedbackStatus(f.id, "pending")} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors border border-yellow-500/20">Reopen</button>}
                        </div>
                        {f.admin_comment && (
                          <div className="bg-yellow-500/5 rounded-xl p-4 border border-yellow-500/10">
                            <p className="text-xs text-yellow-500/60 font-bold uppercase tracking-wider mb-1">Admin Note</p>
                            <p className="text-sm text-yellow-200/70 whitespace-pre-wrap">{f.admin_comment}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PLAN ASSIGNMENT MODAL
      ═══════════════════════════════════════════════════════════════ */}
      {showPlanModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowPlanModal(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowPlanModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X className="h-4 w-4" /></button>

            <h3 className="text-lg font-bold text-white mb-1">Change Plan</h3>
            <p className="text-sm text-zinc-500 mb-6">{selectedUser.email}</p>

            {/* Current Plan Info */}
            {selectedUser.plan !== "free" && (
              <div className="bg-zinc-800/50 rounded-xl p-3 mb-6 border border-zinc-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Current Plan</span>
                  <span className={`font-bold ${PLAN_CONFIG[selectedUser.plan]?.color || "text-zinc-400"}`}>{selectedUser.plan?.toUpperCase()}</span>
                </div>
                {(selectedUser.plan_started_at || selectedUser.plan_expires_at) && (
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-zinc-500">Expires</span>
                    <span className="text-zinc-400">{formatDateTime(selectedUser.plan_expires_at)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Plan Selection */}
            <div className="space-y-2 mb-6">
              <label className="text-xs text-zinc-500 font-medium">Select Plan</label>
              <div className="grid grid-cols-3 gap-2">
                {["plus", "pro", "enterprise"].map(p => (
                  <button
                    key={p}
                    onClick={() => setModalPlan(p)}
                    className={`p-3 rounded-xl border text-center transition-all ${modalPlan === p ? "border-white/20 bg-white/5" : "border-zinc-800 hover:border-zinc-600"}`}
                  >
                    <div className={`text-lg font-bold ${PLAN_CONFIG[p].color}`}>{PLAN_CONFIG[p].label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2 mb-6">
              <label className="text-xs text-zinc-500 font-medium">Duration (days)</label>
              <input
                type="number"
                value={modalDuration}
                onChange={(e) => setModalDuration(parseInt(e.target.value) || 30)}
                min={1}
                max={3650}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
              />
              <div className="flex gap-2">
                {[7, 30, 90, 365].map(d => (
                  <button key={d} onClick={() => setModalDuration(d)} className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-colors ${modalDuration === d ? "border-white/20 bg-white/5 text-white" : "border-zinc-800 text-zinc-500 hover:text-zinc-300"}`}>{d}d</button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAssignPlan}
              disabled={updating === selectedUser.email}
              className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updating === selectedUser.email ? <Loader2 className="w-4 w-4 animate-spin" /> : null}
              Assign {modalPlan.toUpperCase()} Plan
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ═══════════════════════════════════════════════════════════════ */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-zinc-900 border border-red-500/20 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowDeleteModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X className="h-4 w-4" /></button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete User</h3>
            </div>

            <p className="text-sm text-zinc-400 mb-2">
              This will <strong className="text-red-400">permanently</strong> delete the user and ALL their data including API keys, logs, webhooks, and team memberships.
            </p>
            <p className="text-sm text-zinc-500 mb-6">Type <code className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs">{selectedUser.email}</code> to confirm:</p>

            <input
              type="email"
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
              placeholder={selectedUser.email}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-red-500/50 mb-4"
            />

            <button
              onClick={handleDeleteUser}
              disabled={updating === selectedUser.email || deleteConfirmEmail !== selectedUser.email}
              className="w-full py-3 rounded-xl bg-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-red-500/20"
            >
              {updating === selectedUser.email ? <Loader2 className="w-4 w-4 animate-spin" /> : <Trash2 className="w-4 w-4" />}
              Delete Permanently
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Temporary alias — Webhook icon for System tab (using existing lucide imports)
