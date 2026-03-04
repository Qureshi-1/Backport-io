// Auth utilities — token storage, auth headers, fetch wrapper

// In the browser (Vercel production) we route through our own Next.js
// API proxy (/api/proxy/...) to avoid CORS entirely.
// On the server side (SSR) or local dev we hit the backend directly.
function getGatewayURL(): string {
  if (typeof window !== "undefined") {
    // Always use the same-origin proxy in the browser — no CORS possible
    return "/api/proxy";
  }
  // Server-side / local dev: use the real backend URL
  return (
    process.env.NEXT_PUBLIC_GATEWAY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080"
  );
}

export const GATEWAY_URL = getGatewayURL();

const TOKEN_KEY = "backpack_token";
const SELECTED_KEY = "backpack_api_key";

export const auth = {
  getToken: (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,
  setToken: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SELECTED_KEY);
  },
  isLoggedIn: (): boolean => !!auth.getToken(),

  getSelectedKey: (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem(SELECTED_KEY) : null,
  setSelectedKey: (k: string) => localStorage.setItem(SELECTED_KEY, k),

  authHeaders: (): Record<string, string> => ({
    Authorization: `Bearer ${auth.getToken() ?? ""}`,
    "Content-Type": "application/json",
  }),
};

/** Authenticated fetch — auto-redirects to /login on 401 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    ...options,
    headers: {
      ...auth.authHeaders(),
      ...(options.headers as Record<string, string> || {}),
    },
  });
  if (res.status === 401) {
    auth.removeToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  return res;
}
