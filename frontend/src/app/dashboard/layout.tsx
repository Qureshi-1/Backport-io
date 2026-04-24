"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import CommandPalette from "@/components/CommandPalette";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  Key,
  Settings,
  CreditCard,
  Activity,
  GitBranch,
  Users,
  FlaskConical,
  Shield,
  Webhook,
  Eye,
  FileText,
  Terminal,
  Bell,
  LogOut,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { fetchApi } from "@/lib/api";
import { UserProvider, useUser } from "@/lib/user-context";

// Build sidebar items from the same source as Navbar
const sidebarItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "API Keys", href: "/dashboard/api-keys", icon: Key },
  { name: "Transforms", href: "/dashboard/transforms", icon: FlaskConical },
  { name: "Mocks", href: "/dashboard/mocks", icon: Eye },
  { name: "WAF", href: "/dashboard/waf", icon: Shield },
  { name: "Webhooks", href: "/dashboard/webhooks", icon: Webhook },
  { name: "Integrations", href: "/dashboard/integrations", icon: Bell },
  { name: "Monitoring", href: "/dashboard/monitoring", icon: Activity },
  { name: "Endpoints", href: "/dashboard/endpoints", icon: GitBranch },
  { name: "Teams", href: "/dashboard/teams", icon: Users },
  { name: "Inspector", href: "/dashboard/inspector", icon: Terminal },
  { name: "API Docs", href: "/dashboard/docs", icon: FileText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
];

function DashboardSidebarContent({
  collapsed,
  onCloseMobile,
}: {
  collapsed: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useUser();

  const email = user?.email || "";
  const plan = user?.plan || "free";
  const isAdmin = user?.is_admin === true;

  const allItems = isAdmin
    ? [...sidebarItems, { name: "Admin", href: "/dashboard/admin", icon: Shield }]
    : sidebarItems;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-3 px-2 space-y-0.5 min-h-0">
        {allItems.map(({ name, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group min-h-[44px] ${
                isActive
                  ? "bg-[#04e184]/[0.06] text-white border border-[#04e184]/15"
                  : "text-[#A2BDDB]/40 hover:bg-white/[0.03] hover:text-[#A2BDDB]/70 border border-transparent"
              }`}
              title={collapsed ? name : undefined}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-colors ${
                  isActive ? "text-[#04e184]" : "text-[#A2BDDB]/25 group-hover:text-[#A2BDDB]/50"
                }`}
              />
              {!collapsed && <span className="truncate">{name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/[0.04] p-3 space-y-3 flex-shrink-0 safe-area-pb">
        {!collapsed && (
          <div className="flex items-center justify-between px-1">
            <span className="text-[9px] text-[#A2BDDB]/15 uppercase tracking-widest font-bold">
              Plan
            </span>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                plan === "pro"
                  ? "bg-[#04e184]/[0.1] text-[#04e184] border border-[#04e184]/20"
                  : plan === "plus"
                    ? "bg-[#6BA9FF]/[0.1] text-[#6BA9FF] border border-[#6BA9FF]/20"
                    : "bg-white/[0.03] text-[#A2BDDB]/30 border border-white/[0.06]"
              }`}
            >
              {plan}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#04e184]/[0.1] border border-[#04e184]/15 flex items-center justify-center text-[#04e184] text-xs font-bold flex-shrink-0">
            {email ? email[0].toUpperCase() : "U"}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">{email || "Loading..."}</p>
              </div>
              <button
                onClick={() => auth.logout()}
                className="text-[#A2BDDB]/15 hover:text-white transition-colors flex-shrink-0 w-10 h-10 min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white/[0.04]"
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const openCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  // Show welcome toast after OAuth social login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth") === "success") {
      toast.success("Welcome to Backport!", { duration: 4000 });
      window.history.replaceState({}, "", "/dashboard");
    }
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileSidebarOpen]);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <UserProvider>
      <div className="min-h-screen bg-[#080C10] flex flex-col overflow-x-hidden">
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          onOpenCommandPalette={openCommandPalette}
          onMobileMenuOpen={() => setMobileSidebarOpen(true)}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar */}
          <motion.aside
            animate={{ width: sidebarCollapsed ? 64 : 220 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex flex-col border-r border-white/[0.04] bg-[#080C10]/50 backdrop-blur-sm flex-shrink-0 overflow-hidden"
          >
            <DashboardSidebarContent collapsed={sidebarCollapsed} />
          </motion.aside>

          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {mobileSidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                  onClick={() => setMobileSidebarOpen(false)}
                />
                <motion.aside
                  initial={{ x: -300 }}
                  animate={{ x: 0 }}
                  exit={{ x: -300 }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                  className="lg:hidden fixed top-0 left-0 bottom-0 w-[280px] max-w-[85vw] border-r border-white/[0.04] bg-[#080C10] z-50 flex flex-col overflow-y-auto overflow-x-hidden"
                  style={{
                    paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                  }}
                >
                  {/* Close button at top */}
                  <div className="flex items-center justify-between px-4 pb-3 border-b border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#04e184] flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-black fill-current" aria-hidden="true">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-bold text-white">Backport</span>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0">
                    <DashboardSidebarContent
                      collapsed={false}
                      onCloseMobile={() => setMobileSidebarOpen(false)}
                    />
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 min-w-0">
              <AuthGuard>{children}</AuthGuard>
            </div>
          </div>
        </div>

        {/* Command Palette */}
        <CommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />
      </div>
    </UserProvider>
  );
}
