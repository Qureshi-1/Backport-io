import { auth } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backport-io.onrender.com";

/**
 * Extract a human-readable error message from various FastAPI response shapes.
 *
 * FastAPI can return `detail` as:
 *   - string:  `{"detail": "Invalid email or password"}`
 *   - array:   `{"detail": [{"msg": "Password must be at least 8 chars", ...}, ...]}`
 *   - object:  `{"detail": {"msg": "..."}}`
 *
 * It may also use `error`, `message`, or `message.detail` fields.
 */
function extractErrorMessage(data: Record<string, unknown>): string {
  const direct = (data.detail || data.error || data.message || data.msg) as unknown;
  if (typeof direct === "string") return direct;

  if (Array.isArray(direct) && direct.length > 0) {
    const first = direct[0];
    if (first && typeof first === "object" && typeof (first as Record<string, unknown>).msg === "string") {
      return (first as Record<string, unknown>).msg as string;
    }
    return JSON.stringify(direct);
  }

  if (direct && typeof direct === "object") {
    const obj = direct as Record<string, unknown>;
    if (typeof obj.msg === "string") return obj.msg;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.detail === "string") return obj.detail;
    return JSON.stringify(direct);
  }

  if (data.message && typeof data.message === "object") {
    const msgObj = data.message as Record<string, unknown>;
    if (typeof msgObj.detail === "string") return msgObj.detail;
  }

  return "Something went wrong. Please try again.";
}

/**
 * Authenticated API fetch wrapper.
 *
 * SECURITY: JWT is stored in HttpOnly cookie (set by backend).
 * - We do NOT send Authorization header — the browser sends the cookie automatically.
 * - credentials: "include" is required so the browser sends cookies cross-origin
 *   (Vercel frontend → Render backend).
 * - Content-Type is only set for JSON request bodies.
 */
/**
 * Internal: abort-safe fetch with timeout.
 * Default 12s per attempt — fast fail + retry is better than one long wait.
 */
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
 clearTimeout(timeoutId);
    return res;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

// ─── Cold Start Detection ─────────────────────────────────────────────────
// Tracks recent failures to detect Render cold start patterns.
// When multiple consecutive network errors occur, subsequent calls
// automatically get higher retry counts to survive cold starts.
let coldStartFailCount = 0;
let coldStartDetectedAt = 0;
const COLD_START_WINDOW = 2 * 60 * 1000; // 2 min cooldown

/** Check if we're likely in a cold-start window */
export function isColdStarting(): boolean {
  if (coldStartFailCount >= 2 && Date.now() - coldStartDetectedAt < COLD_START_WINDOW) {
    return true;
  }
  return false;
}

/** Call this when a request succeeds to reset cold start tracking */
function resetColdStart() {
  if (coldStartFailCount > 0) {
    coldStartFailCount = 0;
  }
}

/** Call this when a network-level failure occurs */
function recordColdStartFailure() {
  coldStartFailCount++;
  if (coldStartFailCount >= 2) {
    coldStartDetectedAt = Date.now();
  }
}

export async function fetchApi(endpoint: string, options: RequestInit = {}, retries?: number): Promise<any> {

  const isBodyJson = typeof options.body === "string";
  const headers: Record<string, string> = {
    ...(isBodyJson ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string> || {})
  };

  // Auto-boost retries during cold start (3 retries = ~45s patience)
  const effectiveRetries = retries ?? (isColdStarting() ? 3 : 1);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= effectiveRetries; attempt++) {
    try {
      const res = await fetchWithTimeout(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",  // Send HttpOnly cookies cross-origin
      });

      // Request reached the server — cold start is over
      resetColdStart();

      if (res.status === 401) {
        // Try to refresh the token before logging out
        try {
          const refreshRes = await fetchWithTimeout(`${API_URL}/api/auth/refresh`, {
            method: "POST",
            credentials: "include",
          });
          if (refreshRes.ok) {
            // Token refreshed successfully, retry the original request
            const retryRes = await fetchWithTimeout(`${API_URL}${endpoint}`, {
              ...options,
              headers,
              credentials: "include",
            });
            resetColdStart();
            if (retryRes.status === 401) {
              auth.logout();
              throw new Error("Unauthorized");
            }
            const contentType = retryRes.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data = await retryRes.json();
              if (!retryRes.ok) throw new Error(extractErrorMessage(data));
              return data;
            }
            if (!retryRes.ok) {
              const text = await retryRes.text();
              throw new Error(text || "API Error");
            }
            return retryRes;
          }
        } catch {
          // Refresh failed, proceed with logout
        }
        auth.logout();
        throw new Error("Unauthorized");
      }

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (!res.ok) {
          const errMsg = extractErrorMessage(data);
          throw new Error(errMsg);
        }
        return data;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "API Error");
      }
      return res;

    } catch (err: any) {
      lastError = err;
      // Don't retry on 401 (auth errors)
      if (err.message === "Unauthorized") throw err;
      // Record network failures for cold start detection
      recordColdStartFailure();
      // Retry on network errors / timeouts / Render cold start
      if (attempt < effectiveRetries) {
        // Progressive backoff: 2s, 3s, 4s
        await new Promise(r => setTimeout(r, 2000 + attempt * 1000));
        continue;
      }
    }
  }

  // All retries failed
  if (lastError) throw lastError;
  throw new Error("Something went wrong. Please try again.");
}
