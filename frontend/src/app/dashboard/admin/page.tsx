"use client";
import { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import {
  Users, Activity, MessageSquare, Loader2, ShieldCheck, AlertTriangle,
  Lightbulb, Bug, ChevronDown, ChevronUp, Search, Clock, CreditCard,
  CheckCircle2, XCircle, X, Crown, Zap, Star, TrendingUp, UserCog,
  Plus, ArrowDownUp, Ban,
} from "lucide-react";

type Tab = "users" | "feedback";
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
  const [users, setUsers] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [expandedFeedback, setExpandedFeedback] = useState<number | null>(null);

  // Filters
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalPlan, setModalPlan] = useState("pro");
  const [modalDuration, setModalDuration] = useState(30);

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
    try {
      const [s, u, f] = await Promise.all([
        fetchApi("/api/admin/stats"),
        fetchUsers(planFilter, statusFilter, searchQuery),
        fetchApi("/api/feedback"),
      ]);
      setStats(s);
      setFeedbacks(f || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, planFilter, statusFilter, searchQuery]);

  useEffect(() => {
    refreshData();
  }, []);

  // Re-fetch users when filters change
  useEffect(() => {
    fetchUsers(planFilter, statusFilter, searchQuery);
  }, [planFilter, statusFilter, searchQuery, fetchUsers]);

  const openPlanModal = (user: any) => {
    setSelectedUser(user);
    setModalPlan(user.plan === "free" ? "pro" : user.plan);
    setModalDuration(30);
    setShowPlanModal(true);
  };

  const handleAssignPlan = async () => {
    if (!selectedUser) return;
    setUpdating(selectedUser.email);
    try {
      await fetchApi("/api/admin/update-plan", {
        method: "POST",
        body: JSON.stringify({ email: selectedUser.email, plan: modalPlan, duration_days: modalDuration }),
      });
      showMsg("success", `${selectedUser.email} → ${modalPlan} (${modalDuration} days)`);
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

  const handleUpdateFeedbackStatus = async (id: number, status: string) => {
    try {
      await fetchApi(`/api/feedback/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      const updated = await fetchApi("/api/feedback");
      setFeedbacks(updated || []);
    } catch {
      alert("Failed to update feedback");
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatDateTime = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getDaysUntilExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading && !stats) return <div className="p-8 text-zinc-400 flex items-center gap-2"><Loader2 className="animate-spin h-4 w-4" /> Loading Admin Dashboard...</div>;

  const pendingFeedbacks = feedbacks.filter((f: any) => f.status === "pending").length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Admin Control Center</h1>
          <p className="text-sm text-zinc-500">Manage users, plans, and platform analytics.</p>
        </div>
        <UserCog className="w-6 h-6 text-zinc-600 flex-shrink-0" />
      </div>

      {/* Action Toast */}
      {actionMsg && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${actionMsg.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
          {actionMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
          <span className="text-sm font-medium">{actionMsg.text}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Users className="h-4 w-4" /></div>
            <span className="text-xs text-zinc-500">Total Users</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.total_users || 0}</p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><CreditCard className="h-4 w-4" /></div>
            <span className="text-xs text-zinc-500">Paid Users</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.paid_users || 0}</p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl cursor-pointer hover:border-yellow-500/20 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400"><Clock className="h-4 w-4" /></div>
            <span className="text-xs text-zinc-500">Expiring Soon</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-white">{stats?.expiring_soon || 0}</p>
            <span className="text-[10px] text-zinc-600">(7 days)</span>
          </div>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><TrendingUp className="h-4 w-4" /></div>
            <span className="text-xs text-zinc-500">Total Requests</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.total_requests || 0}</p>
        </div>
      </div>

      {/* Plan Distribution Bar */}
      {stats?.plan_distribution && (
        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">Plan Distribution</p>
          <div className="flex h-3 rounded-full overflow-hidden bg-zinc-800">
            {["free", "plus", "pro", "enterprise"].map(plan => {
              const count = stats.plan_distribution[plan] || 0;
              const total = stats.total_users || 1;
              const pct = (count / total) * 100;
              if (pct === 0) return null;
              const colors: Record<string, string> = { free: "bg-zinc-500", plus: "bg-blue-500", pro: "bg-emerald-500", enterprise: "bg-orange-500" };
              return <div key={plan} className={`${colors[plan]} transition-all`} style={{ width: `${pct}%` }} title={`${plan}: ${count} (${pct.toFixed(0)}%)`} />;
            })}
          </div>
          <div className="flex gap-4 mt-3 flex-wrap">
            {["free", "plus", "pro", "enterprise"].map(plan => {
              const count = stats.plan_distribution[plan] || 0;
              return (
                <button key={plan} onClick={() => setPlanFilter(planFilter === plan ? "all" : plan as PlanFilter)} className={`flex items-center gap-1.5 text-xs ${planFilter === plan ? "text-white" : "text-zinc-500 hover:text-zinc-300"} transition-colors`}>
                  <span className={`w-2 h-2 rounded-full ${PLAN_CONFIG[plan]?.bg.replace("/10", "/40").replace("bg-zinc-800/60", "bg-zinc-400")}`} style={{ backgroundColor: planFilter === plan ? undefined : undefined }} />
                  {PLAN_CONFIG[plan]?.label}: {count}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2">
        {(["users", "feedback"] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-all ${activeTab === tab ? "bg-white/10 text-white border border-white/20" : "text-zinc-500 hover:text-zinc-300 border border-transparent"}`}>
            {tab === "users" ? <><Users className="h-4 w-4 inline mr-2" />Users</> : <><MessageSquare className="h-4 w-4 inline mr-2" />Feedback{pendingFeedbacks > 0 && <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">{pendingFeedbacks}</span>}</>}
          </button>
        ))}
      </div>

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
                            <button onClick={() => openPlanModal(u)} disabled={updating === u.email} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50" title="Change Plan">
                              <ArrowDownUp className="w-3 h-3" />
                            </button>
                            {u.plan !== "free" && (
                              <>
                                <button onClick={() => handleExtendPlan(u.email, 30)} disabled={updating === u.email} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50" title="Extend +30 days">
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleRevokePlan(u.email)} disabled={updating === u.email} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50" title="Revoke to Free">
                                  <Ban className="w-3 h-3" />
                                </button>
                              </>
                            )}
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
                      <button onClick={() => openPlanModal(u)} className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-400 text-center min-h-[40px] inline-flex items-center justify-center">Change Plan</button>
                      {u.plan !== "free" && (
                        <>
                          <button onClick={() => handleExtendPlan(u.email, 30)} className="py-1.5 px-3 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 min-h-[40px] inline-flex items-center justify-center">+30d</button>
                          <button onClick={() => handleRevokePlan(u.email)} className="py-1.5 px-3 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-400 min-h-[40px] inline-flex items-center justify-center">Revoke</button>
                        </>
                      )}
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
              <label className="text-xs text-zinc-500 font-medium">Select New Plan</label>
              <div className="grid grid-cols-2 gap-2">
                {(["free", "plus", "pro", "enterprise"] as const).map(plan => {
                  const PlanIcon = PLAN_CONFIG[plan].icon;
                  return (
                  <button key={plan} onClick={() => setModalPlan(plan)} className={`p-3 rounded-xl text-left transition-all border ${modalPlan === plan ? `${PLAN_CONFIG[plan].bg} ${PLAN_CONFIG[plan].color} border-current` : "bg-zinc-800/30 text-zinc-500 border-zinc-800 hover:border-zinc-700"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <PlanIcon className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{PLAN_CONFIG[plan].label}</span>
                    </div>
                    <span className="text-[10px] opacity-60">{plan === "free" ? "90 days" : plan === "enterprise" ? "365 days" : "30 days"}</span>
                  </button>
                  );
                })}
              </div>
            </div>

            {/* Duration */}
            {modalPlan !== "free" && (
              <div className="mb-6">
                <label className="text-xs text-zinc-500 font-medium mb-2 block">Duration (days)</label>
                <div className="flex gap-2">
                  {[7, 30, 90, 365].map(d => (
                    <button key={d} onClick={() => setModalDuration(d)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${modalDuration === d ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-800/30 text-zinc-500 border border-zinc-800 hover:border-zinc-700"}`}>
                      {d}d
                    </button>
                  ))}
                  <input
                    type="number"
                    value={modalDuration}
                    onChange={(e) => setModalDuration(Math.max(1, Math.min(3650, parseInt(e.target.value) || 30)))}
                    className="w-20 px-2 py-2 rounded-lg bg-zinc-800/30 border border-zinc-800 text-xs text-white text-center focus:outline-none focus:border-zinc-600"
                    min="1"
                    max="3650"
                  />
                </div>
                <p className="text-[10px] text-zinc-600 mt-2">Expires: {formatDate(new Date(Date.now() + modalDuration * 24 * 60 * 60 * 1000).toISOString())}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleAssignPlan}
              disabled={updating === selectedUser.email}
              className="w-full py-3 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updating === selectedUser.email ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : <>Assign {PLAN_CONFIG[modalPlan]?.label} Plan</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
