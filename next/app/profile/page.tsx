// app/profile/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "../components/AuthGuard";
import { ProCard } from "../components/ProCard";
import { api } from "../lib/api";
import { getUidFromToken } from "../lib/jwt";
import { logout } from "../lib/logout";

type UserResponse = {
  id: string;
  username: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const uid = useMemo(() => getUidFromToken(), []);

  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        if (!uid) {
          setUser(null);
          setError("Token invalide : uid introuvable.");
          return;
        }
        // backend: GET /api/users/{id}
        const u = await api<UserResponse>(`/api/users/${encodeURIComponent(uid)}`, {
          method: "GET",
          auth: false, // endpoint public chez toi
        });
        setUser(u);
      } catch (e: any) {
        setError(e?.message || "Impossible de charger le profil.");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uid]);

  async function onLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/auth/login");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <AuthGuard>
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-5">
        <ProCard
          title="Profil"
          subtitle="Informations utilisateur."
          right={
            <button
              onClick={onLogout}
              disabled={loggingOut}
              className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {loggingOut ? "Déconnexion…" : "Déconnexion"}
            </button>
          }
        >
          {loading && (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Chargement…</div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && user && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-xs text-zinc-500">Username</div>
                <div className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">{user.username}</div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-xs text-zinc-500">User ID</div>
                <div className="mt-1 font-mono text-xs text-zinc-700 dark:text-zinc-200">{user.id}</div>
              </div>
            </div>
          )}
        </ProCard>
      </div>
    </AuthGuard>
  );
}
