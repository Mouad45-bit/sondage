// app/profile/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "../components/AuthGuard";
import { ProCard } from "../components/ProCard";
import { api } from "../lib/api";
import { getUidFromToken } from "../lib/jwt";
import { logout } from "../lib/logout";
import { UserCircle2, LogOut, AlertTriangle } from "lucide-react";

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
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-6xl px-4 py-6 md:py-8 space-y-5">
          <ProCard
            title="Profil"
            subtitle="Informations utilisateur."
            right={
              <button
                onClick={onLogout}
                disabled={loggingOut}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? "Déconnexion…" : "Déconnexion"}
              </button>
            }
          >
            {/* Header mini */}
            <div className="mb-4 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm border border-zinc-100">
                    <UserCircle2 className="h-5 w-5 text-zinc-700" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Compte
                    </div>
                    <div className="mt-0.5 text-sm text-zinc-700">
                      Détails du profil et identifiants.
                    </div>
                  </div>
                </div>

                <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-medium text-zinc-700">
                  {loading ? "Chargement" : error ? "Erreur" : "Actif"}
                </span>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
                Chargement…
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <div>
                    <div className="font-semibold">Impossible de charger le profil</div>
                    <div className="mt-1 text-sm">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            {!loading && !error && user && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Username
                  </div>
                  <div className="mt-2 text-lg font-semibold text-zinc-900">
                    {user.username}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Identifiant affiché dans l’application.
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    User ID
                  </div>
                  <div className="mt-2 rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-2">
                    <div className="font-mono text-xs text-zinc-700 break-all">
                      {user.id}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    UUID utilisé par l’API backend.
                  </div>
                </div>
              </div>
            )}
          </ProCard>
        </main>
      </div>
    </AuthGuard>
  );
}