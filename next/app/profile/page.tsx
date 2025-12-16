// app/profile/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "../components/AuthGuard";
import { api } from "../lib/api";
import { getUidFromToken } from "../lib/jwt";
import { logout } from "../lib/logout";
import { UserCircle2, LogOut, AlertTriangle, Dot } from "lucide-react";

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

  // styles (mêmes que tes pages dashboard)
  const btnPrimary =
    "cursor-pointer inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white uppercase shadow-sm hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-70 disabled:cursor-not-allowed";
  const btnGhost =
    "cursor-pointer inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-70 disabled:cursor-not-allowed";

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
        const u = await api<UserResponse>(
          `/api/users/${encodeURIComponent(uid)}`,
          {
            method: "GET",
            auth: false, // endpoint public chez toi
          }
        );
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

  const statusLabel = loading ? "Loading.." : error ? "Error" : "Active";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-6xl px-4 py-2 space-y-4">
          {/* Header (dashboard style) */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-center md:text-left text-2xl font-semibold uppercase tracking-[0.14em] text-zinc-600">
              profile
            </div>

            <button
              onClick={onLogout}
              disabled={loggingOut}
              className={btnPrimary}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {loggingOut ? "Logging out.." : "Logout"}
            </button>
          </div>

          {/* Card (comme Filters) */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">
                  Overview
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  User informations
                </p>
              </div>
            </div>

            {/* Mini header (identique aux autres pages) */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white">
                    <UserCircle2 className="h-5 w-5 text-zinc-700" />
                  </span>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                      Account
                    </div>
                    <div className="mt-1 text-sm text-zinc-600">
                      Profile details & identifiers.
                    </div>
                  </div>
                </div>

                <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-semibold text-zinc-700">
                  {statusLabel}
                </span>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
                Chargement…
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <div>
                    <div className="font-semibold">
                      Impossible de charger le profil
                    </div>
                    <div className="mt-1 text-sm">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty state (pas d’erreur, mais user null) */}
            {!loading && !error && !user && (
              <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
                Aucun utilisateur à afficher.
              </div>
            )}

            {/* Content */}
            {!loading && !error && user && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    Username
                  </div>
                  <div className="mt-2 text-lg font-semibold text-zinc-900">
                    {user.username}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Identifier displayed in the application.
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    User ID
                  </div>
                  <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2">
                    <div className="font-mono text-xs text-zinc-700 break-all">
                      {user.id}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    UUID used by the backend API.
                  </div>
                </div>

                {/* Actions secondary (optionnel, même style) */}
                <div className="md:col-span-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => router.refresh()}
                    className={btnGhost}
                    disabled={loading}
                  >
                    Refresh page
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}
