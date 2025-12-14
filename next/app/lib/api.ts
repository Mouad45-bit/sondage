// app/lib/auth.ts

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
  options: RequestInit & { json?: any; auth?: boolean } = {}
): Promise<T> {
  const { json, auth = true, headers, ...rest } = options;

  //
  const finalHeaders = new Headers(headers);

  if (json !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`/backend${path}`, {
    ...rest,
    headers: finalHeaders,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  const body = await readJsonSafe(res);

  if (!res.ok) {
    if (res.status === 401) clearToken();
    throw new ApiError(res.status, body, (body as any)?.message || "Erreur API");
  }

  return body as T;
}