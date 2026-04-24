"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { auth, GATEWAY_URL } from "./auth";

// ─── Types ──────────────────────────────────────────────────────────────────────
export interface UserData {
  email: string;
  plan: string;
  is_admin: boolean;
  name?: string;
  avatar_url?: string;
  target_backend_url?: string;
  api_keys?: Array<{ id: number; key: string; name: string; created_at: string }>;
  analytics?: {
    total_requests: number;
    threats_blocked: number;
    cache_hits: number;
    avg_latency: number;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface UserContextValue {
  user: UserData | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  /** True while the keep-alive ping is running */
  warming: boolean;
  /** True if we detected a cold start (backend waking up) */
  coldStart: boolean;
  /** How many seconds we've been waiting */
  waitSeconds: number;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  error: null,
  retry: () => {},
  warming: false,
  coldStart: false,
  waitSeconds: 0,
});

export const useUser = () => useContext(UserContext);

// ─── Keep-Alive Manager ─────────────────────────────────────────────────────────
/**
 * Pings the backend /health endpoint every 4 minutes to prevent Render cold start.
 * Render free tier spins down after ~5 min of inactivity.
 * A ping every 4 min keeps the server warm indefinitely.
 */
let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

export function startKeepAlive() {
  if (keepAliveInterval) return; // Already running
  keepAliveInterval = setInterval(() => {
    fetch(`${GATEWAY_URL}/health`, { mode: "no-cors" })
      .catch(() => {}); // Silently fail
  }, 4 * 60 * 1000); // Every 4 minutes
}

export function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

// ─── Loading Messages ───────────────────────────────────────────────────────────
const LOADING_MESSAGES = [
  { text: "Connecting to your gateway...", delay: 0 },
  { text: "Warming up server...", delay: 2000 },
  { text: "Server is starting up...", delay: 8000 },
  { text: "Almost ready, please wait...", delay: 15000 },
  { text: "Still waking up — this is normal for cold starts", delay: 30000 },
];

// ─── Provider ───────────────────────────────────────────────────────────────────
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warming, setWarming] = useState(false);
  const [coldStart, setColdStart] = useState(false);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const mountedRef = useRef(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const waitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUser = useCallback(async (isRetry = false) => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);
    setWaitSeconds(0);

    if (isRetry) {
      setWarming(true);
    }

    // Start counting wait seconds
    waitTimerRef.current = setInterval(() => {
      if (mountedRef.current) setWaitSeconds(s => s + 1);
    }, 1000);

    // Start cycling loading messages
    setMessageIndex(0);

    // First — verify auth (checks HttpOnly cookie)
    // 4 retries × 15s timeout = ~75s total patience for cold starts
    try {
      const authResult = await auth.checkAuth(4); // 4 retries, 15s timeout each
      if (!authResult || !authResult.authenticated) {
        if (mountedRef.current) {
          stopWaitTimer();
          setLoading(false);
          setError("not_authenticated");
        }
        return;
      }
    } catch {
      if (mountedRef.current) {
        stopWaitTimer();
        setLoading(false);
        setError("not_authenticated");
      }
      return;
    }

    // Auth verified — now fetch full user data
    try {
      const API_URL = GATEWAY_URL;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const res = await fetch(`${API_URL}/api/user/me`, {
        credentials: "include",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Failed to fetch user data");

      const data = await res.json();

      if (mountedRef.current) {
        stopWaitTimer();
        setUser(data);
        setLoading(false);
        setWarming(false);
        setColdStart(false);
        setError(null);
        // Start keep-alive after first successful fetch
        startKeepAlive();
      }
    } catch {
      if (mountedRef.current) {
        stopWaitTimer();
        setLoading(false);
        setWarming(false);
        setError("fetch_failed");
      }
    }
  }, []);

  function stopWaitTimer() {
    if (waitTimerRef.current) {
      clearInterval(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  }

  // Cycle loading messages + detect cold start after 5s
  useEffect(() => {
    if (!loading) {
      setMessageIndex(0);
      setColdStart(false);
      return;
    }

    // After 2s of waiting, mark as cold start (faster detection)
    const coldStartTimer = setTimeout(() => {
      if (mountedRef.current) setColdStart(true);
    }, 2000);

    const timeouts: ReturnType<typeof setTimeout>[] = [coldStartTimer];
    LOADING_MESSAGES.forEach((msg, i) => {
      if (i === 0) return; // First message is shown immediately
      const t = setTimeout(() => {
        if (mountedRef.current) setMessageIndex(i);
      }, msg.delay);
      timeouts.push(t);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [loading]);

  // Initial fetch + cleanup
  useEffect(() => {
    fetchUser();
    return () => {
      mountedRef.current = false;
      stopWaitTimer();
      stopKeepAlive();
    };
  }, [fetchUser]);

  const retry = useCallback(() => {
    fetchUser(true);
  }, [fetchUser]);

  const currentMessage = LOADING_MESSAGES[messageIndex];

  return (
    <UserContext.Provider value={{ user, loading, error, retry, warming, coldStart, waitSeconds }}>
      {children}
    </UserContext.Provider>
  );
}

export { LOADING_MESSAGES };
export default UserContext;
