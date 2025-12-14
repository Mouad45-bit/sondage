// app/lib/logout.ts

import { api } from "./api";
import { clearToken } from "./auth";

export async function logout() {
  try {
    //
    await api<void>("/auth/logout", { method: "POST", auth: true });
  } finally {
    //
    clearToken();
  }
}
