"use client";

/**
 * KeepAlivePinger — Client-side backend warm-up
 * ─────────────────────────────────────────────
 * When a user has the site open, this component silently pings
 * the backend /health endpoint every 4 minutes to prevent
 * the Render free-tier from spinning down.
 *
 * This is a BACKUP to the server-side Render Cron Job.
 * Together they ensure the backend is always warm.
 */

import { useEffect, useRef } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://backport-io.onrender.com";
const PING_INTERVAL = 4 * 60 * 1000; // 4 minutes (Render sleeps after 15 min)

export default function KeepAlivePinger() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Don't ping in SSR or if backend URL is empty
    if (typeof window === "undefined" || !BACKEND_URL) return;

    const ping = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      try {
        await fetch(`${BACKEND_URL}/health`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });
      } catch {
        // Silent fail — user should never see errors from keep-alive
      } finally {
        clearTimeout(timeoutId);
      }
    };

    // Initial ping on mount
    ping();

    // Then ping every 4 minutes while user has the tab open
    intervalRef.current = setInterval(ping, PING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // This component renders nothing — it's purely functional
  return null;
}
