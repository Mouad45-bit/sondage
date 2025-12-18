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

export async function api<T>(path: string, opts?: { method?: string; auth?: boolean; body?: any }) {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  const url = baseUrl + path;

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (opts?.auth) {
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: opts?.method ?? "GET",
    headers,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    // essaie de lire le message backend
    let msg = "Erreur API";
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await res.json();
        msg = j?.message || j?.error || JSON.stringify(j);
      } else {
        const t = await res.text();
        if (t) msg = t;
      }
    } catch {}

    const err: any = new Error(msg);
    err.status = res.status;
    throw err;
  }

  return (await res.json()) as T;
}
