/**
 * PRO-KOM — centralny klient API do backendu Django.
 * Bazowy URL z NEXT_PUBLIC_API_URL (np. http://localhost:8000).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_V1 = `${API_BASE}/api/v1`;

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiOptions extends RequestInit {
  method?: ApiMethod;
  token?: string | null;
}

/** Bezpieczne parsowanie JSON — nigdy nie rzuca wyjątku. */
function safeJsonParse<T = unknown>(text: string): T | null {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  if (trimmed[0] !== "{" && trimmed[0] !== "[") return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function request<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = "GET", token, headers: customHeaders, ...rest } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...customHeaders,
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Token ${token}`;
  }

  const url = path.startsWith("http") ? path : `${API_V1}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { method, headers, ...rest });

  if (!res.ok) {
    const errBody = await res.text();
    const j = safeJsonParse<{ detail?: string; message?: string }>(errBody);
    const message = j?.detail ?? j?.message ?? (errBody && errBody.length < 500 ? errBody : null) ?? `HTTP ${res.status}`;
    throw new Error(message);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  const parsed = safeJsonParse<T>(text);
  return (parsed ?? undefined) as T;
}

export const api = {
  get: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "GET", token }),

  post: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined, token }),

  patch: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined, token }),

  put: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined, token }),

  delete: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "DELETE", token }),
};

export { API_BASE, API_V1 };
