"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Shield,
  Key,
  LogOut,
  CreditCard,
} from "lucide-react";
import { useEffect, useState } from "react";
import { auth, apiFetch } from "@/lib/auth";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    setMounted(true);
    apiFetch("/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setEmail(d.email);
        setPlan(d.plan);
      })
      .catch(() => {});
  }, []);

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "API Keys", href: "/dashboard/api-keys", icon: Key },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  ];

  const handleLogout = () => {
    auth.removeToken();
    router.push("/login");
  };

  if (!mounted) {
    return <div className="h-screen w-64 border-r border-zinc-800 bg-black" />;
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r border-zinc-800 bg-black text-zinc-300 flex-shrink-0">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-zinc-800 px-6">
        <Shield className="mr-3 h-5 w-5 text-emerald-500 flex-shrink-0" />
        <span className="text-base font-semibold text-zinc-50 tracking-tight">
          Backport
        </span>
        <Link
          href="/"
          className="ml-auto text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          ↗ Site
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-4">
        {links.map(({ name, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={name}
              href={href}
              className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-800/70 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/40 hover:text-white"
              }`}
            >
              <Icon
                className={`mr-3 h-4 w-4 flex-shrink-0 ${isActive ? "text-emerald-400" : ""}`}
              />
              {name}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-zinc-800 p-4 space-y-3">
        {/* Plan badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-600">Plan</span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
              plan === "pro"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {plan}
          </span>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold flex-shrink-0">
            {email ? email[0].toUpperCase() : "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">
              {email || "Loading..."}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
