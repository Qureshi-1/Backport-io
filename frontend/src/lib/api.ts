import { auth } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backport-io.onrender.com";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const headers = {
    ...auth.getAuthHeaders(),
    ...(options.headers || {})
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    auth.logout();
    throw new Error("Unauthorized");
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.detail || "API Error");
    return data;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API Error");
  }
  return res;
}
