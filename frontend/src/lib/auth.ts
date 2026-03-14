const TOKEN_KEY = "backport_token";
const API_KEY_KEY = "backport_api_key";

export const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || "https://backport-io.onrender.com";

export const auth = {
  getToken: () => typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,
  setToken: (t: string) => typeof window !== "undefined" && localStorage.setItem(TOKEN_KEY, t),
  
  getApiKey: () => typeof window !== "undefined" ? localStorage.getItem(API_KEY_KEY) : null,
  setApiKey: (k: string) => typeof window !== "undefined" && localStorage.setItem(API_KEY_KEY, k),
  
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(API_KEY_KEY);
      window.location.href = "/auth/login";
    }
  },
  
  isLoggedIn: () => !!(typeof window !== "undefined" && localStorage.getItem(TOKEN_KEY)),
  
  getAuthHeaders: () => ({
    "Authorization": `Bearer ${auth.getToken() ?? ""}`,
    "Content-Type": "application/json"
  })
}
