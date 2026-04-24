"use client";
import React, { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LayoutDashboard,
  Key,
  Settings,
  CreditCard,
  Shield,
  GitBranch,
  Users,
  Activity,
  Code2,
  Webhook,
  FlaskConical,
  FileJson,
  FileSpreadsheet,
  Plus,
  Eye,
  Zap,
  ArrowRight,
  Terminal,
  FileText,
  Bell,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  action?: string;
  category: "navigation" | "action";
}

const COMMANDS: CommandItem[] = [
  // Navigation
  { id: "nav-dashboard", label: "Dashboard Overview", description: "View your API gateway overview", icon: LayoutDashboard, href: "/dashboard", category: "navigation" },
  { id: "nav-api-keys", label: "API Keys", description: "Manage your API keys", icon: Key, href: "/dashboard/api-keys", category: "navigation" },
  { id: "nav-transforms", label: "Transforms", description: "Configure request/response transforms", icon: Code2, href: "/dashboard/transforms", category: "navigation" },
  { id: "nav-mocks", label: "Mocks", description: "Manage API mock endpoints", icon: FlaskConical, href: "/dashboard/mocks", category: "navigation" },
  { id: "nav-waf", label: "WAF", description: "Web Application Firewall rules", icon: Shield, href: "/dashboard/waf", category: "navigation" },
  { id: "nav-webhooks", label: "Webhooks", description: "Configure webhook endpoints", icon: Webhook, href: "/dashboard/webhooks", category: "navigation" },
  { id: "nav-integrations", label: "Integrations", description: "Slack & Discord alerting", icon: Bell, href: "/dashboard/integrations", category: "navigation" },
  { id: "nav-playground", label: "Playground", description: "Test your API endpoints", icon: Eye, href: "/dashboard/playground", category: "navigation" },
  { id: "nav-settings", label: "Settings", description: "Account and backend configuration", icon: Settings, href: "/dashboard/settings", category: "navigation" },
  { id: "nav-billing", label: "Billing", description: "Manage your subscription", icon: CreditCard, href: "/dashboard/billing", category: "navigation" },
  { id: "nav-monitoring", label: "Health Monitoring", description: "Real-time backend health status", icon: Activity, href: "/dashboard/monitoring", category: "navigation" },
  { id: "nav-endpoints", label: "Endpoint Config", description: "Per-endpoint rate limiting", icon: GitBranch, href: "/dashboard/endpoints", category: "navigation" },
  { id: "nav-teams", label: "Teams", description: "Manage teams and collaboration", icon: Users, href: "/dashboard/teams", category: "navigation" },
  { id: "nav-inspector", label: "Request Inspector", description: "Inspect request/response details", icon: Terminal, href: "/dashboard/inspector", category: "navigation" },
  { id: "nav-api-docs", label: "Auto API Docs", description: "Auto-generated API documentation", icon: FileText, href: "/dashboard/docs", category: "navigation" },
  { id: "nav-admin", label: "Admin Panel", description: "Admin dashboard", icon: Shield, href: "/dashboard/admin", category: "navigation" },

  // Actions
  { id: "act-create-key", label: "Create API Key", description: "Generate a new API key", icon: Plus, href: "/dashboard/api-keys", action: "create-key", category: "action" },
  { id: "act-export-json", label: "Export Logs (JSON)", description: "Download analytics as JSON", icon: FileJson, action: "export-json", category: "action" },
  { id: "act-export-csv", label: "Export Logs (CSV)", description: "Download logs as CSV", icon: FileSpreadsheet, action: "export-csv", category: "action" },
  { id: "act-view-settings", label: "View Settings", description: "Go to account settings", icon: Settings, href: "/dashboard/settings", category: "action" },
  { id: "act-speed-test", label: "Speed Test", description: "Test your API response time", icon: Zap, href: "/dashboard/playground", category: "action" },
];

// ─── Fuzzy Search ───────────────────────────────────────────────────────────────

function fuzzyMatch(query: string, text: string): { match: boolean; score: number } {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  if (t.includes(q)) return { match: true, score: 0 };

  let qi = 0;
  let score = 0;
  let lastMatchIdx = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += (lastMatchIdx === ti - 1) ? 5 : 1;
      if (ti === 0 || t[ti - 1] === " " || t[ti - 1] === "-") score += 10;
      lastMatchIdx = ti;
      qi++;
    }
  }

  return { match: qi === q.length, score };
}

// ─── Component ──────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Derive filtered commands from search query
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return COMMANDS;
    return COMMANDS
      .map((cmd) => {
        const titleMatch = fuzzyMatch(searchQuery, cmd.label);
        const descMatch = fuzzyMatch(searchQuery, cmd.description);
        const bestScore = Math.max(titleMatch.score, descMatch.score * 0.5);
        return { cmd, ...titleMatch, score: bestScore, match: titleMatch.match || descMatch.match };
      })
      .filter((r) => r.match)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.cmd);
  }, [searchQuery]);

  // Derive safe selected index (clamp to valid range)
  const safeSelectedIndex = selectedIndex >= filteredCommands.length ? 0 : selectedIndex;

  // Handle search changes — reset selection
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setSelectedIndex(0);
  }, []);

  // Focus input when opened (using callback ref pattern)
  const setInputRef = useCallback((node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (node && open) {
      // Use requestAnimationFrame to avoid layout flush
      requestAnimationFrame(() => node.focus());
    }
  }, [open]);

  // Scroll into view when selection changes
  const scrollListRef = useCallback((node: HTMLDivElement | null) => {
    listRef.current = node;
    if (!node) return;
    const selected = node.children[safeSelectedIndex] as HTMLElement;
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [safeSelectedIndex]);

  const handleSelect = useCallback(
    (cmd: CommandItem) => {
      if (cmd.href) {
        router.push(cmd.href);
      }
      onClose();
    },
    [router, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[safeSelectedIndex]) {
          handleSelect(filteredCommands[safeSelectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [filteredCommands, safeSelectedIndex, handleSelect, onClose]
  );

  // Group by category
  const navItems = filteredCommands.filter((c) => c.category === "navigation");
  const actionItems = filteredCommands.filter((c) => c.category === "action");

  // Use key to reset state when palette opens
  const paletteKey = open ? "open" : "closed";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="command-palette"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
            className="relative w-full max-w-xl glass-card rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
            style={{
              borderColor: "rgba(44, 232, 195, 0.15)",
            }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
              <Search className="w-5 h-5 text-[#A2BDDB]/30 flex-shrink-0" />
              <input
                ref={setInputRef}
                key={paletteKey}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, actions..."
                className="flex-1 bg-transparent text-white text-sm placeholder:text-[#A2BDDB]/20 focus:outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] text-[#A2BDDB]/25 font-mono">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={scrollListRef} className="max-h-[350px] overflow-y-auto py-2">
              {filteredCommands.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Search className="w-6 h-6 text-[#A2BDDB]/15 mx-auto mb-3" />
                  <p className="text-sm text-[#A2BDDB]/30">No results found</p>
                  <p className="text-[10px] text-[#A2BDDB]/15 mt-1">Try a different search term</p>
                </div>
              ) : (
                <>
                  {navItems.length > 0 && (
                    <CommandGroup
                      label="Navigation"
                      items={navItems}
                      selectedIndex={safeSelectedIndex}
                      globalStartIdx={0}
                      onSelect={handleSelect}
                      onHover={setSelectedIndex}
                    />
                  )}
                  {actionItems.length > 0 && (
                    <CommandGroup
                      label="Actions"
                      items={actionItems}
                      selectedIndex={safeSelectedIndex}
                      globalStartIdx={navItems.length}
                      onSelect={handleSelect}
                      onHover={setSelectedIndex}
                    />
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
              <div className="flex items-center gap-3 text-[10px] text-[#A2BDDB]/15">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] font-mono text-[9px]">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] font-mono text-[9px]">↵</kbd>
                  Select
                </span>
              </div>
              <span className="text-[10px] text-[#A2BDDB]/10">
                {filteredCommands.length} result{filteredCommands.length !== 1 ? "s" : ""}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CommandGroup({
  label,
  items,
  selectedIndex,
  globalStartIdx,
  onSelect,
  onHover,
}: {
  label: string;
  items: CommandItem[];
  selectedIndex: number;
  globalStartIdx: number;
  onSelect: (cmd: CommandItem) => void;
  onHover: (idx: number) => void;
}) {
  return (
    <div className="mb-1">
      <div className="px-5 py-2">
        <span className="text-[9px] font-bold text-[#A2BDDB]/20 uppercase tracking-widest">
          {label}
        </span>
      </div>
      {items.map((cmd, idx) => {
        const globalIdx = globalStartIdx + idx;
        const isSelected = globalIdx === selectedIndex;
        const Icon = cmd.icon;

        return (
          <motion.button
            key={cmd.id}
            initial={false}
            animate={isSelected ? { backgroundColor: "rgba(255,255,255,0.04)" } : { backgroundColor: "rgba(0,0,0,0)" }}
            onClick={() => onSelect(cmd)}
            onMouseEnter={() => onHover(globalIdx)}
            className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                isSelected ? "bg-[#2CE8C3]/10" : "bg-white/[0.02]"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${isSelected ? "text-[#2CE8C3]" : "text-[#A2BDDB]/30"}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${isSelected ? "text-white" : "text-[#A2BDDB]/60"}`}>
                {cmd.label}
              </div>
              <div className="text-[10px] text-[#A2BDDB]/20 truncate">
                {cmd.description}
              </div>
            </div>
            {isSelected && (
              <ArrowRight className="w-3.5 h-3.5 text-[#2CE8C3] flex-shrink-0" />
            )}
            <span className="text-[9px] text-[#A2BDDB]/10 font-mono hidden sm:block flex-shrink-0">
              {cmd.category === "action" ? "Action" : "Page"}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
