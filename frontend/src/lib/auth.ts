/**
 * Auth helpers — Cookie-based authentication.
 *
 * SECURITY MODEL:
 * ────────────────
 * - JWT token is stored in an HttpOnly, Secure, SameSite=None cookie
 *   set by the backend on login/signup/verify-email.
 * - JavaScript CANNOT read HttpOnly cookies (no document.cookie access).
 * - The browser automatically sends the cookie with every request to the backend
 *   when credentials: "include" is used in fetch().
 * - localStorage is ONLY used for api_key (not sensitive — used for proxy header).
 * - Logout calls backend POST /api/auth/logout to clear the HttpOnly cookie.
 *
 * WHY THIS MATTERS:
 * - XSS attacks cannot steal the JWT via document.cookie
 * - Even if an attacker injects JS, they cannot extract the token
 * - The cookie is transmitted only over HTTPS (Secure flag)
 * - SameSite=None allows cross-origin (Vercel ↔ Render) but still protects against CSRF
 */

const API_KEY_KEY = "backport_api_key";

export const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || "https://backport-io.onrender.com";

export const auth = {
  /**
   * Check if user is logged in.
   * Since JWT is in HttpOnly cookie, we can't check directly.
   * This returns a cached optimistic value. Use checkAuth() for real verification.
   */
  isLoggedIn: () => !!(typeof window !== "undefined" && sessionStorage.getItem("backport_auth")),

  /** Mark user as logged in (optimistic, client-side only flag) */
  _markLoggedIn: () => typeof window !== "undefined" && sessionStorage.setItem("backport_auth", "1"),

  /** Clear login state */
  _markLoggedOut: () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("backport_auth");
    }
  },

  // ─── API Key (stored in localStorage — NOT sensitive, just a proxy header) ────
  getApiKey: () => typeof window !== "undefined" ? localStorage.getItem(API_KEY_KEY) : null,

  setApiKey: (k: string) => typeof window !== "undefined" && localStorage.setItem(API_KEY_KEY, k),

  // ─── Logout ──────────────────────────────────────────────────────────────────
  /**
   * Logout: Call backend to clear the HttpOnly cookie, then redirect.
   * We MUST call the backend because the cookie is HttpOnly —
   * JavaScript cannot delete it directly.
   */
  logout: async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backport-io.onrender.com";
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",  // Send cookie so backend can identify which one to clear
      });
    } catch {
      // Even if the API call fails, still clear client state
    }
    // Clear client-side state
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("backport_auth");
      localStorage.removeItem(API_KEY_KEY);
      window.location.href = "/auth/login";
    }
  },

  /**
   * Verify session by calling backend /api/auth/me.
   * Returns { authenticated, email, plan } or null if not logged in.
   * Includes retry logic for Render cold start (up to 2 attempts, 15s timeout each).
   */
  checkAuth: async (retries: number = 2): Promise<{ authenticated: boolean; email: string; plan: string; is_admin: boolean } | null> => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backport-io.onrender.com";

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s per attempt
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) return null;
        const data = await res.json();
        if (data.authenticated) {
          auth._markLoggedIn();
          return data;
        }
        return null;
      } catch {
        clearTimeout(timeoutId);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
          continue;
        }
        return null;
      }
    }
    return null;
  },
};
