// app/lib/api.ts
import { getToken, clearToken } from "./auth";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown, message = "Request failed") {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function readJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text || null;
  }
}

export async function api<T>(
  path: string,
  opts?: {
    method?: string;
    auth?: boolean;
    json?: any;   // ✅ nouveau (confort)
    body?: any;   // ✅ garde aussi body
  }
) {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  const url = baseUrl + path;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (opts?.auth) {
    const token = getToken(); // ✅ au lieu de localStorage direct
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const payload = opts?.json ?? opts?.body;

  const res = await fetch(url, {
    method: opts?.method ?? "GET",
    headers,
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  });

  if (!res.ok) {
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const body = await readJsonSafe(res);

    // message propre (évite d’afficher toute la page HTML)
    let msg = `HTTP ${res.status}`;
    if (ct.includes("application/json") && body && typeof body === "object") {
      // @ts-ignore
      msg = body.message || body.error || msg;
    } else if (typeof body === "string" && body.trim()) {
      // si HTML, on ne spam pas l'écran
      msg = body.includes("<html") ? `HTTP ${res.status}` : body;
    }

    // si ton backend invalide le token, tu peux forcer logout
    if (res.status === 401) {
      clearToken?.();
    }

    throw new ApiError(res.status, body, msg);
  }

  // 204 no content
  if (res.status === 204) return null as T;

  return (await res.json()) as T;
}