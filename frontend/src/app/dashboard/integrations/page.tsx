"use client";
import React, { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  MessageSquare,
  Bell,
  Plus,
  Trash2,
  TestTube2,
  Power,
  PowerOff,
  X,
  ExternalLink,
  Zap,
  Clock,
  AlertTriangle,
  Shield,
  RefreshCw,
  Check,
} from "lucide-react";
import GlowOrb from "@/components/GlowOrb";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface IntegrationItem {
  id: number;
  type: "slack" | "discord";
  name: string;
  events: string[];
  is_enabled: boolean;
  created_at: string | null;
  last_triggered_at: string | null;
  last_error: string | null;
}

const SUPPORTED_EVENTS = [
  { key: "waf_block", label: "WAF Block", color: "#EF4444", icon: Shield },
  { key: "rate_limit_exceeded", label: "Rate Limit", color: "#F97316", icon: AlertTriangle },
  { key: "error_spike", label: "Error Spike", color: "#EF4444", icon: AlertTriangle },
  { key: "backend_down", label: "Backend Down", color: "#EF4444", icon: PowerOff },
  { key: "backend_recovered", label: "Backend Recovered", color: "#2CE8C3", icon: Power },
  { key: "slow_endpoint", label: "Slow Endpoint", color: "#EAB308", icon: Clock },
  { key: "circuit_breaker_open", label: "Circuit Open", color: "#F97316", icon: Zap },
  { key: "circuit_breaker_closed", label: "Circuit Closed", color: "#2CE8C3", icon: Check },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

// ─── Page Component ────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [formType, setFormType] = useState<"slack" | "discord">("slack");
  const [formName, setFormName] = useState("");
  const [formWebhookUrl, setFormWebhookUrl] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);

  const fetchIntegrations = useCallback(async () => {
    try {
      const data = await fetchApi("/api/integrations");
      setIntegrations((data || []) as IntegrationItem[]);
    } catch {
      // Show empty state
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const resetForm = () => {
    setFormType("slack");
    setFormName("");
    setFormWebhookUrl("");
    setFormEvents([]);
    setEditingId(null);
    setSubmitting(false);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (integration: IntegrationItem) => {
    setEditingId(integration.id);
    setFormType(integration.type);
    setFormName(integration.name);
    setFormWebhookUrl("");
    setFormEvents(integration.events || []);
    setShowModal(true);
  };

  const toggleEvent = (eventKey: string) => {
    setFormEvents((prev) =>
      prev.includes(eventKey)
        ? prev.filter((e) => e !== eventKey)
        : [...prev, eventKey]
    );
  };

  const selectAllEvents = () => {
    setFormEvents(SUPPORTED_EVENTS.map((e) => e.key));
  };

  const deselectAllEvents = () => {
    setFormEvents([]);
  };

  const handleSubmit = async () => {
    if (!formWebhookUrl.trim()) {
      toast.error("Webhook URL is required");
      return;
    }
    if (formEvents.length === 0) {
      toast.error("Select at least one event");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const payload: Record<string, unknown> = {
          events: formEvents,
        };
        if (formName) payload.name = formName;
        if (formWebhookUrl) payload.webhook_url = formWebhookUrl;
        await fetchApi(`/api/integrations/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast.success("Integration updated");
      } else {
        await fetchApi("/api/integrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: formType,
            name: formName || `${formType === "slack" ? "Slack" : "Discord"} Integration`,
            webhook_url: formWebhookUrl,
            events: formEvents,
          }),
        });
        toast.success("Integration created & verified");
      }
      setShowModal(false);
      resetForm();
      fetchIntegrations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save integration");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this integration? This cannot be undone.")) return;
    try {
      await fetchApi(`/api/integrations/${id}`, { method: "DELETE" });
      toast.success("Integration deleted");
      fetchIntegrations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const data = await fetchApi(`/api/integrations/${id}/toggle`, {
        method: "PATCH",
      });
      const msg = (data as { message?: string }).message || "Toggled";
      toast.success(msg);
      fetchIntegrations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle");
    }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      await fetchApi(`/api/integrations/${id}/test`, { method: "POST" });
      toast.success("Test alert sent! Check your channel.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test failed");
    } finally {
      setTestingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-[3px] border-[#2CE8C3]/20 border-t-[#2CE8C3] rounded-full animate-spin" />
        <div className="text-xs font-semibold uppercase tracking-widest text-[#A2BDDB]/40">
          Loading integrations...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 relative overflow-hidden">
      <GlowOrb color="#5865F2" size={400} x="80%" y="5%" delay={0} opacity={0.03} />
      <GlowOrb color="#4A154B" size={350} x="15%" y="15%" delay={2} opacity={0.03} />

      <motion.div variants={container} initial="hidden" animate="show">
        {/* ═══ Header ═══ */}
        <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5865F2]/[0.08] border border-[#5865F2]/15 flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#5865F2]" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold text-white tracking-tight"
                style={{
                  fontFamily:
                    'var(--font-space-grotesk), "Space Grotesk", sans-serif',
                }}
              >
                Integrations
              </h1>
              <p className="text-[#A2BDDB]/40 text-sm">
                Slack & Discord real-time alerting
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2CE8C3]/[0.08] border border-[#2CE8C3]/20 text-[#2CE8C3] text-xs font-bold uppercase tracking-wider hover:bg-[#2CE8C3]/[0.15] hover:border-[#2CE8C3]/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Integration
          </motion.button>
        </motion.div>

        {/* ═══ Supported Events ═══ */}
        <motion.div variants={item} className="glass-card rounded-2xl p-6 sm:p-8 mb-6">
          <h3
            className="text-white text-base font-bold mb-4"
            style={{
              fontFamily:
                'var(--font-space-grotesk), "Space Grotesk", sans-serif',
            }}
          >
            Supported Events
          </h3>
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_EVENTS.map((event) => {
              const Icon = event.icon;
              return (
                <div
                  key={event.key}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-medium"
                  style={{
                    borderColor: `${event.color}30`,
                    color: event.color,
                    backgroundColor: `${event.color}08`,
                  }}
                >
                  <Icon className="w-3 h-3" />
                  {event.label}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ═══ Integration Cards ═══ */}
        {integrations.length === 0 ? (
          <motion.div
            variants={item}
            className="glass-card rounded-2xl p-12 sm:p-16 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
              <Bell className="w-8 h-8 text-[#A2BDDB]/15" />
            </div>
            <h3
              className="text-white text-xl font-bold mb-2"
              style={{
                fontFamily:
                  'var(--font-space-grotesk), "Space Grotesk", sans-serif',
              }}
            >
              No Integrations Yet
            </h3>
            <p className="text-[#A2BDDB]/30 text-sm max-w-md mx-auto mb-6">
              Connect Slack or Discord webhooks to receive real-time alerts for
              WAF blocks, rate limits, error spikes, and more.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2CE8C3]/[0.08] border border-[#2CE8C3]/20 text-[#2CE8C3] text-xs font-bold uppercase tracking-wider hover:bg-[#2CE8C3]/[0.15] hover:border-[#2CE8C3]/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Your First Integration
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onToggle={handleToggle}
                onTest={handleTest}
                onEdit={openEditModal}
                onDelete={handleDelete}
                testingId={testingId}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* ═══ Create/Edit Modal ═══ */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
              className="relative w-full max-w-lg glass-card rounded-2xl p-6 sm:p-8 max-h-[85vh] overflow-y-auto no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-lg font-bold text-white"
                  style={{
                    fontFamily:
                      'var(--font-space-grotesk), "Space Grotesk", sans-serif',
                  }}
                >
                  {editingId ? "Edit Integration" : "Add Integration"}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A2BDDB]/30 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Type Selector */}
              {!editingId && (
                <div className="mb-6">
                  <label className="text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-widest mb-3 block">
                    Integration Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <TypeButton
                      type="slack"
                      selected={formType === "slack"}
                      onClick={() => setFormType("slack")}
                    />
                    <TypeButton
                      type="discord"
                      selected={formType === "discord"}
                      onClick={() => setFormType("discord")}
                    />
                  </div>
                </div>
              )}

              {/* Name Input */}
              <div className="mb-5">
                <label className="text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-widest mb-2 block">
                  Name <span className="text-[#A2BDDB]/15">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={
                    formType === "slack"
                      ? "e.g. Security Alerts"
                      : "e.g. DevOps Channel"
                  }
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.08] text-white text-sm placeholder:text-[#A2BDDB]/15 focus:outline-none focus:border-[#2CE8C3]/30 focus:bg-white/[0.04] transition-all"
                />
              </div>

              {/* Webhook URL Input */}
              <div className="mb-6">
                <label className="text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-widest mb-2 block">
                  Webhook URL {editingId && <span className="text-[#A2BDDB]/15">(leave blank to keep current)</span>}
                </label>
                <input
                  type="url"
                  value={formWebhookUrl}
                  onChange={(e) => setFormWebhookUrl(e.target.value)}
                  placeholder={
                    formType === "slack"
                      ? "https://hooks.slack.com/services/T0.../B0.../..."
                      : "https://discord.com/api/webhooks/123456/..."
                  }
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.08] text-white text-sm placeholder:text-[#A2BDDB]/15 focus:outline-none focus:border-[#2CE8C3]/30 focus:bg-white/[0.04] transition-all font-mono text-xs"
                />
                <p className="text-[10px] text-[#A2BDDB]/15 mt-1.5">
                  {formType === "slack"
                    ? "Create a webhook in Slack: Apps → Incoming Webhooks"
                    : "Create a webhook in Discord: Server Settings → Integrations → Webhooks"}
                </p>
              </div>

              {/* Event Selection */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-widest">
                    Events
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAllEvents}
                      className="text-[10px] text-[#2CE8C3]/50 hover:text-[#2CE8C3] transition-colors"
                    >
                      Select all
                    </button>
                    <span className="text-[#A2BDDB]/10">|</span>
                    <button
                      onClick={deselectAllEvents}
                      className="text-[10px] text-[#A2BDDB]/25 hover:text-[#A2BDDB]/50 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUPPORTED_EVENTS.map((event) => {
                    const Icon = event.icon;
                    const isSelected = formEvents.includes(event.key);
                    return (
                      <button
                        key={event.key}
                        onClick={() => toggleEvent(event.key)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all border text-left ${
                          isSelected
                            ? "bg-white/[0.04] border-white/[0.12]"
                            : "bg-white/[0.01] border-white/[0.04] opacity-50 hover:opacity-80"
                        }`}
                        style={{
                          borderColor: isSelected ? `${event.color}30` : undefined,
                          color: isSelected ? event.color : "#A2BDDB",
                        }}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected ? "" : "border-white/10"
                          }`}
                          style={{
                            borderColor: isSelected ? event.color : undefined,
                            backgroundColor: isSelected ? `${event.color}20` : undefined,
                          }}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3" style={{ color: event.color }} />
                          )}
                        </div>
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{event.label}</span>
                      </button>
                    );
                  })}
                </div>
                {formEvents.length === 0 && (
                  <p className="text-[10px] text-red-400/60 mt-2">
                    Select at least one event to subscribe to
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-[#A2BDDB]/40 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={submitting || (!editingId && !formWebhookUrl.trim()) || formEvents.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2CE8C3]/[0.1] border border-[#2CE8C3]/20 text-[#2CE8C3] text-xs font-bold uppercase tracking-wider hover:bg-[#2CE8C3]/[0.2] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {editingId ? "Update" : "Create & Verify"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Integration Card ──────────────────────────────────────────────────────────

function IntegrationCard({
  integration,
  onToggle,
  onTest,
  onEdit,
  onDelete,
  testingId,
}: {
  integration: IntegrationItem;
  onToggle: (id: number) => void;
  onTest: (id: number) => void;
  onEdit: (integration: IntegrationItem) => void;
  onDelete: (id: number) => void;
  testingId: number | null;
}) {
  const isSlack = integration.type === "slack";
  const themeColor = isSlack ? "#4A154B" : "#5865F2";
  const brandColor = isSlack ? "#E01E5A" : "#5865F2";

  return (
    <motion.div
      layout
      variants={item}
      className="glass-card rounded-2xl p-6 relative overflow-hidden group"
    >
      {/* Accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${brandColor}40, transparent)`,
        }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: `${themeColor}20`,
              border: `1px solid ${themeColor}35`,
            }}
          >
            {isSlack ? (
              <MessageSquare className="w-5 h-5" style={{ color: "#E01E5A" }} />
            ) : (
              <Bell className="w-5 h-5" style={{ color: "#5865F2" }} />
            )}
          </div>
          <div>
            <h3 className="text-white text-sm font-bold">{integration.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: brandColor }}
              >
                {integration.type}
              </span>
              <span className="text-[#A2BDDB]/10">•</span>
              <span
                className={`text-[10px] font-medium flex items-center gap-1 ${
                  integration.is_enabled
                    ? "text-[#2CE8C3]"
                    : "text-[#A2BDDB]/30"
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    integration.is_enabled ? "bg-[#2CE8C3]" : "bg-[#A2BDDB]/30"
                  }`}
                />
                {integration.is_enabled ? "Active" : "Disabled"}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0 self-start">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onToggle(integration.id)}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[#A2BDDB]/25 hover:text-white hover:bg-white/[0.04] transition-colors"
            title={integration.is_enabled ? "Disable" : "Enable"}
          >
            {integration.is_enabled ? (
              <Power className="w-4 h-4" />
            ) : (
              <PowerOff className="w-4 h-4" />
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onTest(integration.id)}
            disabled={testingId === integration.id}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[#A2BDDB]/25 hover:text-[#2CE8C3] hover:bg-[#2CE8C3]/[0.05] transition-colors disabled:opacity-30"
            title="Send test alert"
          >
            <TestTube2
              className={`w-4 h-4 ${testingId === integration.id ? "animate-spin" : ""}`}
            />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(integration)}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[#A2BDDB]/25 hover:text-[#6BA9FF] hover:bg-[#6BA9FF]/[0.05] transition-colors"
            title="Edit"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(integration.id)}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[#A2BDDB]/25 hover:text-red-400 hover:bg-red-400/[0.05] transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      {/* Events */}
      <div className="mb-4">
        <div className="text-[10px] font-bold text-[#A2BDDB]/20 uppercase tracking-widest mb-2">
          Subscribed Events
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(integration.events || []).length > 0 ? (
            (integration.events || []).map((eventKey) => {
              const eventMeta = SUPPORTED_EVENTS.find((e) => e.key === eventKey);
              if (!eventMeta) return null;
              return (
                <span
                  key={eventKey}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium"
                  style={{
                    color: eventMeta.color,
                    backgroundColor: `${eventMeta.color}10`,
                    border: `1px solid ${eventMeta.color}20`,
                  }}
                >
                  {eventMeta.label}
                </span>
              );
            })
          ) : (
            <span className="text-[10px] text-[#A2BDDB]/15">
              All events (no filter)
            </span>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-white/[0.04] gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#A2BDDB]/20">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {integration.created_at
              ? new Date(integration.created_at).toLocaleDateString()
              : "—"}
          </div>
          {integration.last_triggered_at && (
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Last triggered:{" "}
              {new Date(integration.last_triggered_at).toLocaleDateString()}
            </div>
          )}
        </div>
        {integration.last_error && (
          <div className="flex items-center gap-1 text-[10px] text-red-400/60" title={integration.last_error}>
            <AlertTriangle className="w-3 h-3" />
            Error
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Type Button (Slack/Discord selector) ──────────────────────────────────────

function TypeButton({
  type,
  selected,
  onClick,
}: {
  type: "slack" | "discord";
  selected: boolean;
  onClick: () => void;
}) {
  const isSlack = type === "slack";
  const color = isSlack ? "#E01E5A" : "#5865F2";
  const bgColor = isSlack ? "#4A154B" : "#2B2D31";

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all"
      style={{
        borderColor: selected ? color : "transparent",
        backgroundColor: selected ? `${bgColor}40` : `${bgColor}15`,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          backgroundColor: `${bgColor}60`,
          border: `1px solid ${color}30`,
        }}
      >
        {isSlack ? (
          <MessageSquare className="w-5 h-5" style={{ color }} />
        ) : (
          <Bell className="w-5 h-5" style={{ color }} />
        )}
      </div>
      <div>
        <div
          className="text-sm font-bold"
          style={{ color: selected ? color : "#A2BDDB" }}
        >
          {isSlack ? "Slack" : "Discord"}
        </div>
        <div className="text-[10px] text-[#A2BDDB]/30 mt-0.5">
          {isSlack ? "Incoming Webhook" : "Server Webhook"}
        </div>
      </div>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${color}30` }}
        >
          <Check className="w-3 h-3" style={{ color }} />
        </motion.div>
      )}
    </motion.button>
  );
}
