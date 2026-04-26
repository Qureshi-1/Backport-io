"use client";
import { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import {
  Users,
  Activity,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Search,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  X,
  Crown,
  Zap,
  TrendingUp,
  UserCog,
  Ban,
  Server,
  Database,
  Shield,
  Cpu,
  RefreshCw,
  Eye,
  Trash2,
  UserMinus,
  Key,
  Monitor,
  Gauge,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  ShieldAlert,
  UserCheck,
  UserX,
  Settings,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Tab = "overview" | "users" | "revenue" | "audit_logs" | "activity";

interface Stats {
  total_users: number;
  active_users_today: number;
  total_api_keys: number;
  total_requests_today: number;
  mrr: number;
  plan_distribution: { free: number; plus: number; pro: number; enterprise: number };
  waf_blocks_today: number;
  error_rate_24h: number;
  avg_latency_ms: number;
  users_by_day_last_7_days: { date: string; count: number }[];
  user_growth_pct: number;
}

interface User {
  id: number;
  email: string;
  name: string;
  avatar_url: string;
  plan: string;
  plan_expiry_date: string;
  is_admin: boolean;
  is_active: boolean;
  is_banned: boolean;
  status: string;
  created_at: string;
  last_login_at: string;
  login_count: number;
  api_key_count: number;
}

interface AuditLog {
  id: number;
  user_id: number;
  email: string;
  event_type: string;
  details: string | Record<string, unknown>;
  ip_address: string;
  created_at: string;
}

interface RevenueData {
  mrr: number;
  current_month_revenue: number;
  last_month_revenue: number;
  revenue_by_plan: { plan: string; users: number; amount: number }[];
  daily_revenue_last_30_days: { date: string; revenue: number }[];
}

interface HealthData {
  status: string;
  version: string;
  uptime: string;
  uptime_seconds: number;
  checks: Record<string, string>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  free: { label: "Free", color: "text-zinc-400", bg: "bg-zinc-800/60", icon: Users },
  plus: { label: "Plus", color: "text-blue-400", bg: "bg-blue-500/10", icon: Zap },
  pro: { label: "Pro", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: ShieldCheck },
  enterprise: { label: "Enterprise", color: "text-orange-400", bg: "bg-orange-500/10", icon: Crown },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: "Active", color: "text-emerald-400", bg: "bg-emerald-500/10", dot: "bg-emerald-400" },
  suspended: { label: "Suspended", color: "text-yellow-400", bg: "bg-yellow-500/10", dot: "bg-yellow-400" },
  banned: { label: "Banned", color: "text-red-400", bg: "bg-red-500/10", dot: "bg-red-400" },
};

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  login: { label: "Login", color: "text-blue-400", bg: "bg-blue-500/10" },
  signup: { label: "Signup", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  plan_purchase: { label: "Plan Purchase", color: "text-purple-400", bg: "bg-purple-500/10" },
  plan_upgrade: { label: "Plan Upgrade", color: "text-violet-400", bg: "bg-violet-500/10" },
  plan_cancel: { label: "Plan Cancel", color: "text-orange-400", bg: "bg-orange-500/10" },
  plan_expire: { label: "Plan Expire", color: "text-amber-400", bg: "bg-amber-500/10" },
  api_key_created: { label: "API Key Created", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  api_key_deleted: { label: "API Key Deleted", color: "text-rose-400", bg: "bg-rose-500/10" },
  admin_action: { label: "Admin Action", color: "text-red-400", bg: "bg-red-500/10" },
  profile_update: { label: "Profile Update", color: "text-yellow-400", bg: "bg-yellow-500/10" },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  if (diff < 0) return "Just now";
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const d = new Date(dateStr);
    return `Today ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function formatMRR(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso: string | null): string {
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ─── Skeleton Components ────────────────────────────────────────────────────

function MetricCardSkeleton() {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-800" />
        <div className="h-3 w-20 bg-zinc-800 rounded" />
      </div>
      <div className="h-7 w-28 bg-zinc-800 rounded" />
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-zinc-800/30 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

// ─── Revenue Chart ──────────────────────────────────────────────────────────

function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="flex items-end gap-[2px] h-48 overflow-x-auto pb-2">
      {data.map((day, idx) => {
        const heightPct = (day.revenue / maxRevenue) * 100;
        const dateObj = new Date(day.date);
        const dayLabel = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        return (
          <div
            key={day.date}
            className="flex-1 min-w-[16px] flex flex-col items-center justify-end h-full relative group"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {hoveredIdx === idx && (
              <div className="absolute bottom-full mb-2 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10 whitespace-nowrap">
                <div className="text-[10px] text-zinc-400">{dayLabel}</div>
                <div className="text-xs font-bold text-white">{formatMRR(day.revenue)}</div>
              </div>
            )}
            <div
              className={`w-full rounded-t-sm transition-all cursor-pointer ${
                hoveredIdx === idx ? "bg-emerald-400" : "bg-emerald-500/30 hover:bg-emerald-500/50"
              }`}
              style={{ height: `${Math.max(heightPct, 1)}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AdminPage() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersLoading, setUsersLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);

  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [userPlanFilter, setUserPlanFilter] = useState("all");
  const [userSort, setUserSort] = useState("created_at");
  const [userSortOrder, setUserSortOrder] = useState<"asc" | "desc">("desc");
  const [auditEventType, setAuditEventType] = useState("all");
  const [auditFromDate, setAuditFromDate] = useState("");
  const [auditToDate, setAuditToDate] = useState("");

  // User activity logs for detail modal
  const [userActivityLogs, setUserActivityLogs] = useState<AuditLog[]>([]);
  const [userActivityLoading, setUserActivityLoading] = useState(false);

  // Modals & Actions
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionsDropdown, setActionsDropdown] = useState<number | null>(null);

  // Fetch user activity for detail modal
  const fetchUserActivity = useCallback(async (userId: number) => {
    setUserActivityLoading(true);
    try {
      const data = await fetchApi(`/api/admin/audit-logs?user_id=${userId}&limit=10`);
      setUserActivityLogs(data.logs || []);
    } catch {
      setUserActivityLogs([]);
    } finally {
      setUserActivityLoading(false);
    }
  }, []);

  // Toast
  const showMsg = useCallback((type: "success" | "error", text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  }, []);

  // ── Data Fetchers ─────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const data = await fetchApi("/api/admin/stats");
      setStats(data);
    } catch {
      // silent
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await fetchApi("/health");
      setHealth(data);
    } catch {
      // silent
    }
  }, []);

  const fetchUsers = useCallback(async (page: number, search: string, plan: string, sort: string, order: string) => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (plan && plan !== "all") params.set("plan", plan);
      if (sort) params.set("sort", sort);
      if (order) params.set("order", order);
      params.set("page", page.toString());
      params.set("limit", "20");
      const data = await fetchApi(`/api/admin/users?${params.toString()}`);
      setUsers(data.users || []);
      setUsersTotal(data.total || 0);
      setUsersPage(data.page || 1);
    } catch (err: any) {
      showMsg("error", "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }, [showMsg]);

  const fetchAuditLogs = useCallback(async (page: number, eventType: string, fromDate: string, toDate: string) => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams();
      if (eventType && eventType !== "all") params.set("event_type", eventType);
      if (fromDate) params.set("from_date", fromDate);
      if (toDate) params.set("to_date", toDate);
      params.set("page", page.toString());
      params.set("limit", "50");
      const data = await fetchApi(`/api/admin/audit-logs?${params.toString()}`);
      setAuditLogs(data.logs || []);
      setAuditTotal(data.total || 0);
      setAuditPage(data.page || 1);
    } catch {
      showMsg("error", "Failed to load audit logs");
    } finally {
      setAuditLoading(false);
    }
  }, [showMsg]);

  const fetchRevenue = useCallback(async () => {
    try {
      const data = await fetchApi("/api/admin/revenue");
      setRevenue(data);
    } catch {
      showMsg("error", "Failed to load revenue data");
    }
  }, [showMsg]);

  // ── Initial Load ──────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchStats(), fetchHealth()]);
    } catch (err: any) {
      setError(err?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchHealth]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Auto-refresh stats and health every 45 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
      fetchHealth();
    }, 45000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchHealth]);

  // Fetch users when tab is selected or filters change
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers(usersPage, userSearch, userPlanFilter, userSort, userSortOrder);
    }
  }, [activeTab, usersPage, userSearch, userPlanFilter, userSort, userSortOrder, fetchUsers]);

  // Fetch audit logs when tab is selected or filters change
  useEffect(() => {
    if (activeTab === "audit_logs") {
      fetchAuditLogs(auditPage, auditEventType, auditFromDate, auditToDate);
    }
  }, [activeTab, auditPage, auditEventType, auditFromDate, auditToDate, fetchAuditLogs]);

  // Fetch revenue when tab is selected
  useEffect(() => {
    if (activeTab === "revenue" && !revenue) {
      fetchRevenue();
    }
  }, [activeTab, revenue, fetchRevenue]);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = () => setActionsDropdown(null);
    if (actionsDropdown !== null) {
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }
  }, [actionsDropdown]);

  // ── User Actions ──────────────────────────────────────────────────────────

  const handleUserAction = async (userId: number, action: string) => {
    setActionLoading(true);
    try {
      const data = await fetchApi(`/api/admin/users/${userId}/action`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      showMsg("success", data.message || `Action "${action}" applied`);
      fetchUsers(usersPage, userSearch, userPlanFilter, userSort, userSortOrder);
      fetchStats();
      if (selectedUser && selectedUser.id === userId && data.user) {
        setSelectedUser({ ...selectedUser, ...data.user });
      }
      setActionsDropdown(null);
    } catch (err: any) {
      showMsg("error", err?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user? This action is soft-delete.")) return;
    setActionLoading(true);
    try {
      await fetchApi(`/api/admin/users/${userId}`, { method: "DELETE" });
      showMsg("success", "User deleted successfully");
      fetchUsers(usersPage, userSearch, userPlanFilter, userSort, userSortOrder);
      fetchStats();
      setSelectedUser(null);
    } catch (err: any) {
      showMsg("error", err?.message || "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Sorting ───────────────────────────────────────────────────────────────
  const handleSort = (column: string) => {
    if (userSort === column) {
      setUserSortOrder(userSortOrder === "asc" ? "desc" : "asc");
    } else {
      setUserSort(column);
      setUserSortOrder("desc");
    }
    setUsersPage(1);
  };

  // ── Health Helpers ────────────────────────────────────────────────────────
  const healthStatus = (key: string): { label: string; ok: boolean } => {
    const val = health?.checks?.[key];
    if (val === "ok") return { label: "Healthy", ok: true };
    if (val) return { label: val, ok: false };
    return { label: "Unknown", ok: false };
  };

  // ── Render Helpers ────────────────────────────────────────────────────────

  const getUserStatus = (user: User) => {
    if (user.is_banned) return "banned";
    if (!user.is_active) return "suspended";
    return "active";
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (userSort !== column) return <ArrowUpDown className="w-3 h-3 text-zinc-600 inline ml-1" />;
    return userSortOrder === "asc"
      ? <ArrowUp className="w-3 h-3 text-white inline ml-1" />
      : <ArrowDown className="w-3 h-3 text-white inline ml-1" />;
  };

  // ─── Loading State ────────────────────────────────────────────────────────
  if (loading && !stats && !error) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl">
        <div className="h-8 w-64 bg-zinc-800 rounded-lg" />
        <div className="h-10 w-96 bg-zinc-800 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl h-64" />
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl h-64" />
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────────────
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
        <button
          onClick={loadAll}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-zinc-700 text-white text-sm hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Control Center</h1>
          </div>
          <p className="text-sm text-zinc-500 ml-12">Platform analytics, user management, revenue &amp; system monitoring.</p>
        </div>
        <button
          onClick={loadAll}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors text-sm"
          title="Refresh all data"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Action Toast */}
      {actionMsg && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${actionMsg.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
          {actionMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
          <span className="text-sm font-medium">{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="ml-auto"><X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" /></button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-zinc-900/40 border border-zinc-800 rounded-xl w-fit flex-wrap">
        {([
          { id: "overview" as Tab, label: "Overview", icon: Activity },
          { id: "users" as Tab, label: `Users${stats ? ` (${stats.total_users})` : ""}`, icon: Users },
          { id: "revenue" as Tab, label: "Revenue", icon: DollarSign },
          { id: "audit_logs" as Tab, label: "Audit Logs", icon: FileText },
          { id: "activity" as Tab, label: "Activity", icon: Monitor },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: OVERVIEW
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top Metrics Row — 7 cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            {/* Total Users */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl hover:border-zinc-700/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Users className="h-4 w-4" /></div>
                <span className="text-xs text-zinc-500">Total Users</span>
              </div>
              <p className="text-2xl font-bold text-white">{(stats?.total_users || 0).toLocaleString()}</p>
              {stats?.user_growth_pct != null && (
                <span className={`text-[10px] mt-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold ${stats.user_growth_pct >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  <TrendingUp className="w-2.5 h-2.5" />
                  {stats.user_growth_pct >= 0 ? "+" : ""}{stats.user_growth_pct}%
                </span>
              )}
            </div>

            {/* Active Users Today */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl hover:border-zinc-700/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><Activity className="h-4 w-4" /></div>
                <span className="text-xs text-zinc-500">Active Today</span>
              </div>
              <p className="text-2xl font-bold text-white">{(stats?.active_users_today || 0).toLocaleString()}</p>
            </div>

            {/* MRR */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl hover:border-zinc-700/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><DollarSign className="h-4 w-4" /></div>
                <span className="text-xs text-zinc-500">MRR</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatMRR(stats?.mrr || 0)}</p>
              <span className="text-[10px] text-zinc-600 mt-1 block">Monthly Recurring Revenue</span>
            </div>

            {/* Total API Keys */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl hover:border-zinc-700/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400"><Key className="h-4 w-4" /></div>
                <span className="text-xs text-zinc-500">API Keys</span>
              </div>
              <p className="text-2xl font-bold text-white">{(stats?.total_api_keys || 0).toLocaleString()}</p>
            </div>

            {/* Total Requests Today */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl hover:border-zinc-700/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400"><Activity className="h-4 w-4" /></div>
                <span className="text-xs text-zinc-500">Requests Today</span>
              </div>
              <p className="text-2xl font-bold text-white">{(stats?.total_requests_today || 0).toLocaleString()}</p>
              <span className="text-[10px] text-zinc-600 mt-1 block">API proxy requests</span>
            </div>

            {/* WAF Blocks Today */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl hover:border-zinc-700/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-500/10 rounded-lg text-red-400"><Shield className="h-4 w-4" /></div>
                <span className="text-xs text-zinc-500">WAF Blocks</span>
              </div>
              <p className="text-2xl font-bold text-white">{(stats?.waf_blocks_today || 0).toLocaleString()}</p>
              <span className="text-[10px] text-zinc-600 mt-1 block">Today</span>
            </div>

            {/* Error Rate 24h */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl hover:border-zinc-700/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${(stats?.error_rate_24h || 0) > 5 ? "bg-yellow-500/10 text-yellow-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <span className="text-xs text-zinc-500">Error Rate</span>
              </div>
              <p className={`text-2xl font-bold ${(stats?.error_rate_24h || 0) > 5 ? "text-yellow-400" : "text-white"}`}>
                {stats?.error_rate_24h != null ? `${stats.error_rate_24h}%` : "0%"}
              </p>
              <span className="text-[10px] text-zinc-600 mt-1 block">Last 24 hours</span>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan Distribution */}
            {stats?.plan_distribution && (
              <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-4">Plan Distribution</p>
                {/* Stacked bar */}
                <div className="flex h-3 rounded-full overflow-hidden bg-zinc-800 mb-4">
                  {["free", "plus", "pro", "enterprise"].map((plan) => {
                    const count = stats.plan_distribution[plan as keyof typeof stats.plan_distribution] || 0;
                    const total = stats.total_users || 1;
                    const pct = (count / total) * 100;
                    if (pct === 0) return null;
                    const colors: Record<string, string> = { free: "bg-zinc-500", plus: "bg-blue-500", pro: "bg-emerald-500", enterprise: "bg-orange-500" };
                    return <div key={plan} className={`${colors[plan]} transition-all`} style={{ width: `${Math.max(pct, 1.5)}%` }} title={`${plan}: ${count}`} />;
                  })}
                </div>
                {/* Plan cards */}
                <div className="grid grid-cols-2 gap-3">
                  {["free", "plus", "pro", "enterprise"].map((plan) => {
                    const count = stats.plan_distribution[plan as keyof typeof stats.plan_distribution] || 0;
                    const cfg = PLAN_CONFIG[plan];
                    const pct = stats.total_users ? Math.round((count / stats.total_users) * 100) : 0;
                    const priceMap: Record<string, number> = { free: 0, plus: 499, pro: 999, enterprise: 4999 };
                    const planRev = (priceMap[plan] || 0) * count;
                    return (
                      <div key={plan} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/30">
                        <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                          <cfg.icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-white font-medium">{cfg.label}</p>
                          <p className="text-[10px] text-zinc-500">{count} users &middot; {pct}%</p>
                          {planRev > 0 && <p className="text-[10px] text-emerald-500">{formatMRR(planRev)} revenue</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* System Health (compact) */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Server className="w-4 h-4 text-zinc-500" />
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">System Health</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Database", value: healthStatus("database").label, icon: Database, ok: healthStatus("database").ok },
                  { label: "Cache / Redis", value: healthStatus("cache").label, icon: Server, ok: healthStatus("cache").ok },
                  { label: "Uptime", value: health?.uptime || "--", icon: Clock, ok: true },
                  { label: "Version", value: health?.version ? `v${health.version}` : "--", icon: Shield, ok: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30">
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-4 w-4 ${item.ok ? "text-zinc-500" : "text-yellow-400"}`} />
                      <span className="text-xs text-zinc-400">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
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
                { label: "Manage Users", desc: "View, suspend, ban users", icon: Users, tab: "users" as Tab },
                { label: "Revenue", desc: "MRR, daily revenue", icon: DollarSign, tab: "revenue" as Tab },
                { label: "Audit Logs", desc: "User activity trail", icon: FileText, tab: "audit_logs" as Tab },
                { label: "System Monitor", desc: "Health & platform stats", icon: Monitor, tab: "activity" as Tab },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => setActiveTab(action.tab)}
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

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2: USERS
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUsersPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>
            <select
              value={userPlanFilter}
              onChange={(e) => { setUserPlanFilter(e.target.value); setUsersPage(1); }}
              className="px-3 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-zinc-400 focus:outline-none focus:border-zinc-600"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="plus">Plus</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            {(userSearch || userPlanFilter !== "all") && (
              <button
                onClick={() => { setUserSearch(""); setUserPlanFilter("all"); setUsersPage(1); }}
                className="px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Users Table */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="font-semibold text-white text-sm">
                Users
                <span className="text-zinc-500 font-normal ml-1">({usersTotal} total)</span>
              </h2>
            </div>

            {usersLoading ? (
              <div className="p-6"><TableSkeleton rows={8} /></div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-900/60 text-[10px] uppercase tracking-wider text-zinc-500">
                      <tr>
                        <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => handleSort("email")}>User <SortIcon column="email" /></th>
                        <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => handleSort("plan")}>Plan <SortIcon column="plan" /></th>
                        <th className="px-4 py-3 font-medium">Plan Expiry</th>
                        <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => handleSort("last_login_at")}>Last Login <SortIcon column="last_login_at" /></th>
                        <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => handleSort("login_count")}>Logins <SortIcon column="login_count" /></th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {users.map((u) => {
                        const plan = PLAN_CONFIG[u.plan] || PLAN_CONFIG.free;
                        const statusKey = getUserStatus(u);
                        const status = STATUS_CONFIG[statusKey];

                        return (
                          <tr key={u.id} className="hover:bg-zinc-800/20 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 overflow-hidden flex-shrink-0">
                                  {u.avatar_url ? (
                                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    (u.name || u.email || "U")[0].toUpperCase()
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-white text-xs font-medium truncate max-w-[180px]">{u.name || u.email}</div>
                                  <div className="text-zinc-600 text-[10px] truncate max-w-[180px]">{u.email}</div>
                                </div>
                                {u.is_admin && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-bold flex-shrink-0">ADMIN</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${plan.bg} ${plan.color}`}>
                                <plan.icon className="w-3 h-3" />
                                {plan.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{formatDate(u.plan_expiry_date)}</td>
                            <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{timeAgo(u.last_login_at)}</td>
                            <td className="px-4 py-3 text-zinc-400 text-xs font-medium">{u.login_count || 0}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.bg} ${status.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                {status.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="relative inline-block">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setActionsDropdown(actionsDropdown === u.id ? null : u.id); }}
                                  className="p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-zinc-800 transition-colors"
                                  title="Actions"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {actionsDropdown === u.id && (
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 py-1">
                                    <button onClick={() => { setSelectedUser(u); fetchUserActivity(u.id); setActionsDropdown(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors">
                                      <Eye className="w-3.5 h-3.5" /> View Details
                                    </button>
                                    {!u.is_banned && u.is_active && (
                                      <button onClick={() => handleUserAction(u.id, "suspend")} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-yellow-400 hover:bg-zinc-800 transition-colors">
                                        <UserMinus className="w-3.5 h-3.5" /> Suspend
                                      </button>
                                    )}
                                    {!u.is_banned && (
                                      <button onClick={() => handleUserAction(u.id, "ban")} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-zinc-800 transition-colors">
                                        <Ban className="w-3.5 h-3.5" /> Ban
                                      </button>
                                    )}
                                    {u.is_banned && (
                                      <button onClick={() => handleUserAction(u.id, "unban")} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-400 hover:bg-zinc-800 transition-colors">
                                        <UserCheck className="w-3.5 h-3.5" /> Unban
                                      </button>
                                    )}
                                    {!u.is_active && !u.is_banned && (
                                      <button onClick={() => handleUserAction(u.id, "activate")} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-400 hover:bg-zinc-800 transition-colors">
                                        <UserCheck className="w-3.5 h-3.5" /> Activate
                                      </button>
                                    )}
                                    {!u.is_admin && (
                                      <button onClick={() => handleUserAction(u.id, "make_admin")} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-purple-400 hover:bg-zinc-800 transition-colors">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Make Admin
                                      </button>
                                    )}
                                    {u.is_admin && (
                                      <button onClick={() => handleUserAction(u.id, "remove_admin")} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 transition-colors">
                                        <UserX className="w-3.5 h-3.5" /> Remove Admin
                                      </button>
                                    )}
                                    <div className="border-t border-zinc-800 my-1" />
                                    <button onClick={() => handleDeleteUser(u.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors">
                                      <Trash2 className="w-3.5 h-3.5" /> Delete User
                                    </button>
                                  </div>
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
                    const statusKey = getUserStatus(u);
                    const status = STATUS_CONFIG[statusKey];

                    return (
                      <div key={u.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 overflow-hidden flex-shrink-0">
                              {u.avatar_url ? (
                                <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                (u.name || u.email || "U")[0].toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-white text-sm font-medium truncate">{u.name || u.email}</div>
                              <div className="text-zinc-600 text-[10px] truncate">{u.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {u.is_admin && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-bold">ADMIN</span>}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status.bg} ${status.color}`}>
                              <span className={`inline-block w-1 h-1 rounded-full mr-0.5 ${status.dot}`} />
                              {status.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                          <span className="text-zinc-500">Plan: <strong className="text-zinc-300">{plan.label}</strong></span>
                          <span className="text-zinc-500">Last login: <strong className="text-zinc-300">{timeAgo(u.last_login_at)}</strong></span>
                          <span className="text-zinc-500">Logins: <strong className="text-zinc-300">{u.login_count || 0}</strong></span>
                        </div>
                        <div className="flex gap-2 pt-1 flex-wrap">
                          <button onClick={() => setSelectedUser(u)} className="py-1.5 px-3 rounded-lg text-[10px] font-bold bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors min-h-[36px] inline-flex items-center justify-center gap-1">
                            <Eye className="w-3 h-3" /> View
                          </button>
                          {!u.is_banned && u.is_active && (
                            <button onClick={() => handleUserAction(u.id, "suspend")} className="py-1.5 px-3 rounded-lg text-[10px] font-bold bg-yellow-500/10 text-yellow-400 min-h-[36px] inline-flex items-center justify-center gap-1">
                              <UserMinus className="w-3 h-3" /> Suspend
                            </button>
                          )}
                          {!u.is_banned && (
                            <button onClick={() => handleUserAction(u.id, "ban")} className="py-1.5 px-3 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-400 min-h-[36px] inline-flex items-center justify-center gap-1">
                              <Ban className="w-3 h-3" /> Ban
                            </button>
                          )}
                          {u.is_banned && (
                            <button onClick={() => handleUserAction(u.id, "unban")} className="py-1.5 px-3 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 min-h-[36px] inline-flex items-center justify-center gap-1">
                              <UserCheck className="w-3 h-3" /> Unban
                            </button>
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
              </>
            )}

            {/* Pagination */}
            {usersTotal > 20 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
                <span className="text-xs text-zinc-500">
                  Showing {(usersPage - 1) * 20 + 1}-{Math.min(usersPage * 20, usersTotal)} of {usersTotal}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUsersPage(Math.max(1, usersPage - 1))}
                    disabled={usersPage <= 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-zinc-800/50 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <span className="text-xs text-zinc-500 px-2">Page {usersPage} of {Math.ceil(usersTotal / 20)}</span>
                  <button
                    onClick={() => setUsersPage(Math.min(Math.ceil(usersTotal / 20), usersPage + 1))}
                    disabled={usersPage >= Math.ceil(usersTotal / 20)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-zinc-800/50 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 3: REVENUE
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "revenue" && (
        <div className="space-y-6">
          {!revenue ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl h-32 animate-pulse" />
                <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl h-32 animate-pulse" />
                <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl h-32 animate-pulse" />
              </div>
              <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl h-72 animate-pulse" />
            </div>
          ) : (
            <>
              {/* Revenue Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* MRR */}
                <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><DollarSign className="h-4 w-4" /></div>
                    <span className="text-xs text-zinc-500">Monthly Recurring Revenue</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{formatMRR(revenue.mrr || 0)}</p>
                  <span className="text-[10px] text-zinc-600 mt-1 block">Current MRR</span>
                </div>

                {/* Current Month Revenue */}
                <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><TrendingUp className="h-4 w-4" /></div>
                    <span className="text-xs text-zinc-500">This Month Revenue</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{formatMRR(revenue.current_month_revenue || 0)}</p>
                  {revenue.last_month_revenue > 0 && (
                    <span className={`text-[10px] mt-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold ${
                      revenue.current_month_revenue >= revenue.last_month_revenue ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {revenue.current_month_revenue >= revenue.last_month_revenue ? "+" : ""}
                      {((revenue.current_month_revenue - revenue.last_month_revenue) / revenue.last_month_revenue * 100).toFixed(1)}% vs last month
                    </span>
                  )}
                </div>

                {/* Last Month Revenue */}
                <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-zinc-500/10 rounded-lg text-zinc-400"><CalendarDays className="h-4 w-4" /></div>
                    <span className="text-xs text-zinc-500">Last Month Revenue</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{formatMRR(revenue.last_month_revenue || 0)}</p>
                  <span className="text-[10px] text-zinc-600 mt-1 block">Previous period</span>
                </div>
              </div>

              {/* Revenue by Plan */}
              {revenue.revenue_by_plan && revenue.revenue_by_plan.length > 0 && (
                <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-4">Revenue by Plan</p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {revenue.revenue_by_plan.map((item) => {
                      const cfg = PLAN_CONFIG[item.plan] || PLAN_CONFIG.free;
                      return (
                        <div key={item.plan} className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-800">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                              <cfg.icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                            </div>
                            <span className="text-xs text-zinc-400 font-medium">{cfg.label}</span>
                          </div>
                          <p className="text-lg font-bold text-white">{formatMRR(item.amount)}</p>
                          <p className="text-[10px] text-zinc-600">{item.users} users</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Daily Revenue Chart (CSS bars) */}
              {revenue.daily_revenue_last_30_days && revenue.daily_revenue_last_30_days.length > 0 && (
                <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Daily Revenue (Last 30 Days)</p>
                    <button onClick={fetchRevenue} className="p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-zinc-800 transition-colors" title="Refresh">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <RevenueChart data={revenue.daily_revenue_last_30_days} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 4: AUDIT LOGS
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "audit_logs" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <select
              value={auditEventType}
              onChange={(e) => { setAuditEventType(e.target.value); setAuditPage(1); }}
              className="px-3 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-zinc-400 focus:outline-none focus:border-zinc-600"
            >
              <option value="all">All Events</option>
              <option value="login">Login</option>
              <option value="signup">Signup</option>
              <option value="plan_purchase">Plan Purchase</option>
              <option value="plan_upgrade">Plan Upgrade</option>
              <option value="plan_cancel">Plan Cancel</option>
              <option value="plan_expire">Plan Expire</option>
              <option value="api_key_created">API Key Created</option>
              <option value="api_key_deleted">API Key Deleted</option>
              <option value="admin_action">Admin Action</option>
              <option value="profile_update">Profile Update</option>
            </select>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <input
                type="date"
                value={auditFromDate}
                onChange={(e) => { setAuditFromDate(e.target.value); setAuditPage(1); }}
                className="pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-zinc-400 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <input
                type="date"
                value={auditToDate}
                onChange={(e) => { setAuditToDate(e.target.value); setAuditPage(1); }}
                className="pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-zinc-400 focus:outline-none focus:border-zinc-600"
              />
            </div>
            {(auditEventType !== "all" || auditFromDate || auditToDate) && (
              <button
                onClick={() => { setAuditEventType("all"); setAuditFromDate(""); setAuditToDate(""); setAuditPage(1); }}
                className="px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Logs Table */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-zinc-800">
              <h2 className="font-semibold text-white text-sm">
                Audit Logs
                <span className="text-zinc-500 font-normal ml-1">({auditTotal} total)</span>
              </h2>
            </div>

            {auditLoading ? (
              <div className="p-6"><TableSkeleton rows={8} /></div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-900/60 text-[10px] uppercase tracking-wider text-zinc-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Timestamp</th>
                        <th className="px-4 py-3 font-medium">User</th>
                        <th className="px-4 py-3 font-medium">Event</th>
                        <th className="px-4 py-3 font-medium">Details</th>
                        <th className="px-4 py-3 font-medium">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {auditLogs.map((log) => {
                        const eventCfg = EVENT_TYPE_CONFIG[log.event_type] || { label: log.event_type, color: "text-zinc-400", bg: "bg-zinc-800/60" };
                        let detailsText = "";
                        let parsedDetails: Record<string, unknown> | null = null;
                        try {
                          const raw = typeof log.details === 'string' ? log.details : JSON.stringify(log.details);
                          parsedDetails = JSON.parse(raw);
                          // Extract meaningful summary from known event types
                          if (log.event_type === 'plan_purchase' && parsedDetails) {
                            detailsText = `Plan: ${parsedDetails.plan || 'N/A'} | Amount: ${parsedDetails.amount ? formatMRR(Number(parsedDetails.amount) / 100) : 'N/A'}`;
                          } else if (log.event_type === 'plan_upgrade' && parsedDetails) {
                            detailsText = `From: ${parsedDetails.previous_plan || 'free'} -> ${parsedDetails.plan || 'N/A'}`;
                          } else if (log.event_type === 'admin_action' && parsedDetails) {
                            detailsText = `Action: ${parsedDetails.action || 'N/A'} | Target: ${parsedDetails.target_email || parsedDetails.target_user_id || 'N/A'}`;
                          } else if (log.event_type === 'login' && parsedDetails) {
                            detailsText = `Provider: ${parsedDetails.provider || 'email'}`;
                          } else {
                            detailsText = JSON.stringify(parsedDetails, null, 2);
                          }
                        } catch {
                          detailsText = (log.details as string) || "";
                        }
                        if (detailsText.length > 100) detailsText = detailsText.slice(0, 100) + "...";

                        return (
                          <tr key={log.id} className="hover:bg-zinc-800/20 transition-colors">
                            <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                            <td className="px-4 py-3">
                              <div className="text-white text-xs font-medium">{log.email}</div>
                              <div className="text-zinc-600 text-[10px]">ID: {log.user_id}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${eventCfg.bg} ${eventCfg.color}`}>
                                {eventCfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-zinc-500 text-xs font-mono max-w-[300px] truncate" title={log.details}>
                              {detailsText}
                            </td>
                            <td className="px-4 py-3 text-zinc-500 text-xs font-mono">{log.ip_address || "--"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-zinc-800/50">
                  {auditLogs.map((log) => {
                    const eventCfg = EVENT_TYPE_CONFIG[log.event_type] || { label: log.event_type, color: "text-zinc-400", bg: "bg-zinc-800/60" };
                    let detailsText = log.details || "";
                    try {
                      const parsed = JSON.parse(log.details);
                      detailsText = JSON.stringify(parsed, null, 2);
                    } catch {
                      // not JSON
                    }
                    if (detailsText.length > 80) detailsText = detailsText.slice(0, 80) + "...";

                    return (
                      <div key={log.id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-white text-xs font-medium truncate">{log.email}</div>
                            <div className="text-zinc-600 text-[10px]">{log.ip_address || "No IP"}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${eventCfg.bg} ${eventCfg.color}`}>
                            {eventCfg.label}
                          </span>
                        </div>
                        {detailsText && (
                          <pre className="text-[10px] text-zinc-600 font-mono bg-zinc-800/30 p-2 rounded-lg overflow-hidden whitespace-pre-wrap break-all">{detailsText}</pre>
                        )}
                        <div className="text-[10px] text-zinc-600">{formatDateTime(log.created_at)}</div>
                      </div>
                    );
                  })}
                </div>

                {auditLogs.length === 0 && (
                  <div className="p-12 text-center">
                    <FileText className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">No audit logs found matching your filters.</p>
                  </div>
                )}
              </>
            )}

            {/* Pagination */}
            {auditTotal > 50 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
                <span className="text-xs text-zinc-500">
                  Showing {(auditPage - 1) * 50 + 1}-{Math.min(auditPage * 50, auditTotal)} of {auditTotal}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAuditPage(Math.max(1, auditPage - 1))}
                    disabled={auditPage <= 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-zinc-800/50 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <span className="text-xs text-zinc-500 px-2">Page {auditPage} of {Math.ceil(auditTotal / 50)}</span>
                  <button
                    onClick={() => setAuditPage(Math.min(Math.ceil(auditTotal / 50), auditPage + 1))}
                    disabled={auditPage >= Math.ceil(auditTotal / 50)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-zinc-800/50 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 5: ACTIVITY (System)
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "activity" && (
        <div className="space-y-6">
          {/* Service Status */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-4 h-4 text-zinc-500" />
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Service Status</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Backend", value: health?.status === "ok" ? "Online" : health?.status || "Unknown", icon: Cpu, ok: health?.status === "ok", detail: health?.version ? `v${health.version}` : null },
                { label: "Database", value: healthStatus("database").label, icon: Database, ok: healthStatus("database").ok },
                { label: "Cache / Redis", value: healthStatus("cache").label, icon: Server, ok: healthStatus("cache").ok },
                { label: "Uptime", value: health?.uptime || "--", icon: Clock, ok: true, detail: health?.uptime_seconds ? `${Math.floor(health.uptime_seconds / 86400)}d ${Math.floor((health.uptime_seconds % 86400) / 3600)}h` : null },
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
                  {svc.detail && <span className="text-[10px] text-zinc-600 mt-1 block">{svc.detail}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Uptime & Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-4">Performance Metrics</p>
              <div className="space-y-3">
                {[
                  { label: "Total Requests (Today)", value: (stats?.total_requests_today || 0).toLocaleString(), icon: Activity, ok: true },
                  { label: "Avg Latency", value: `${stats?.avg_latency_ms || 0}ms`, icon: Gauge, ok: (stats?.avg_latency_ms || 0) < 500 },
                  { label: "Error Rate (24h)", value: `${stats?.error_rate_24h || 0}%`, icon: AlertTriangle, ok: (stats?.error_rate_24h || 0) < 5 },
                  { label: "WAF Blocks (Today)", value: (stats?.waf_blocks_today || 0).toLocaleString(), icon: Shield, ok: true },
                ].map((item) => (
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
                  { label: "Total Users", value: (stats?.total_users || 0).toLocaleString(), icon: Users },
                  { label: "Active Users Today", value: (stats?.active_users_today || 0).toLocaleString(), icon: Activity },
                  { label: "Total API Keys", value: (stats?.total_api_keys || 0).toLocaleString(), icon: Key },
                  { label: "MRR", value: formatMRR(stats?.mrr || 0), icon: DollarSign },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30">
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-zinc-500" />
                      <span className="text-xs text-zinc-400">{item.label}</span>
                    </div>
                    <span className="text-xs font-medium text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* User Growth (Last 7 Days) */}
          {stats?.users_by_day_last_7_days && stats.users_by_day_last_7_days.length > 0 && (
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-4">User Signups (Last 7 Days)</p>
              <div className="flex items-end gap-2 h-32">
                {stats.users_by_day_last_7_days.map((day) => {
                  const maxCount = Math.max(...stats.users_by_day_last_7_days.map((d) => d.count), 1);
                  const heightPct = (day.count / maxCount) * 100;
                  const dateObj = new Date(day.date);
                  const dayLabel = dateObj.toLocaleDateString("en-IN", { weekday: "short" });
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">{day.count}</span>
                      <div
                        className="w-full rounded-t-md bg-emerald-500/30 hover:bg-emerald-500/50 transition-colors min-h-[4px]"
                        style={{ height: `${Math.max(heightPct, 3)}%` }}
                        title={`${day.date}: ${day.count} new users`}
                      />
                      <span className="text-[9px] text-zinc-600">{dayLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          USER DETAIL MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-[#0e1218] border border-zinc-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-white">User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* User Profile */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-bold text-zinc-400 overflow-hidden flex-shrink-0">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (selectedUser.name || selectedUser.email || "U")[0].toUpperCase()
                  )}
                </div>
                <div>
                  <div className="text-white font-medium">{selectedUser.name || "No name set"}</div>
                  <div className="text-zinc-500 text-sm">{selectedUser.email}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedUser.is_admin && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-bold">ADMIN</span>}
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_CONFIG[getUserStatus(selectedUser)].bg} ${STATUS_CONFIG[getUserStatus(selectedUser)].color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[getUserStatus(selectedUser)].dot}`} />
                      {STATUS_CONFIG[getUserStatus(selectedUser)].label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Plan", value: (PLAN_CONFIG[selectedUser.plan] || PLAN_CONFIG.free).label },
                  { label: "Plan Expiry", value: formatDate(selectedUser.plan_expiry_date) },
                  { label: "API Keys", value: String(selectedUser.api_key_count || 0) },
                  { label: "Login Count", value: String(selectedUser.login_count || 0) },
                  { label: "Last Login", value: timeAgo(selectedUser.last_login_at) },
                  { label: "Joined", value: formatDate(selectedUser.created_at) },
                ].map((info) => (
                  <div key={info.label} className="p-3 rounded-xl bg-zinc-800/30">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{info.label}</p>
                    <p className="text-sm text-white font-medium mt-0.5">{info.value}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  {!selectedUser.is_banned && selectedUser.is_active && (
                    <button
                      onClick={() => handleUserAction(selectedUser.id, "suspend")}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
                      Suspend
                    </button>
                  )}
                  {!selectedUser.is_banned && (
                    <button
                      onClick={() => handleUserAction(selectedUser.id, "ban")}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                      Ban
                    </button>
                  )}
                  {selectedUser.is_banned && (
                    <button
                      onClick={() => handleUserAction(selectedUser.id, "unban")}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                      Unban
                    </button>
                  )}
                  {!selectedUser.is_active && !selectedUser.is_banned && (
                    <button
                      onClick={() => handleUserAction(selectedUser.id, "activate")}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                      Activate
                    </button>
                  )}
                  {!selectedUser.is_admin && (
                    <button
                      onClick={() => handleUserAction(selectedUser.id, "make_admin")}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      Make Admin
                    </button>
                  )}
                  {selectedUser.is_admin && (
                    <button
                      onClick={() => handleUserAction(selectedUser.id, "remove_admin")}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-600 hover:bg-zinc-500/20 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                      Remove Admin
                    </button>
                  )}
                </div>
              </div>

              {/* Activity History */}
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">Recent Activity</p>
                {userActivityLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-8 bg-zinc-800/30 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : userActivityLogs.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                    {userActivityLogs.map((log) => {
                      const eventCfg = EVENT_TYPE_CONFIG[log.event_type] || { label: log.event_type, color: 'text-zinc-400', bg: 'bg-zinc-800/60' };
                      return (
                        <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/20">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold flex-shrink-0 ${eventCfg.bg} ${eventCfg.color}`}>
                            {eventCfg.label}
                          </span>
                          <span className="text-[10px] text-zinc-500 flex-1 truncate">{timeAgo(log.created_at)}</span>
                          <span className="text-[9px] text-zinc-600 font-mono flex-shrink-0">{log.ip_address || ''}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600">No recent activity found.</p>
                )}
              </div>

              {/* Delete */}
              <div className="border-t border-zinc-800 pt-4">
                <button
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50 w-full justify-center"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete User (Soft Delete)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
