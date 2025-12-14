// app/polls/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "../components/AuthGuard";
import { ProCard } from "../components/ProCard";
import { api } from "../lib/api";
import { getUidFromToken } from "../lib/jwt";
import { Plus, Search, RefreshCcw, ArrowRight } from "lucide-react";

type PollStatus = "DRAFT" | "OPEN" | "CLOSED";

type PollResponse = {
  id: string;
  title: string;
  description?: string | null;
  status: PollStatus | string;
  dateStart: string; // ISO
  dateEnd: string; // ISO
  options: string[];
  authorId: string;
};

type PageLike<T> = {
  content: T[];
  totalPages?: number;
  number?: number;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border";
  if (s === "OPEN")
    return (
      <span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700`}>
        OPEN
      </span>
    );
  if (s === "CLOSED")
    return (
      <span className={`${base} border-zinc-200 bg-zinc-100 text-zinc-700`}>
        CLOSED
      </span>
    );
  return (
    <span className={`${base} border-amber-200 bg-amber-50 text-amber-700`}>
      DRAFT
    </span>
  );
}

export default function MyPollsPage() {
  const [query, setQuery] = useState("");
  const [polls, setPolls] = useState<PollResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ page: number; totalPages?: number }>({ page: 0 });

  async function fetchMyPolls() {
    setLoading(true);
    setError(null);

    try {
      const uid = getUidFromToken();
      if (!uid) {
        setPolls([]);
        setError("Token invalide: uid introuvable.");
        return;
      }

      const page = 0;
      const size = 20;

      const res = await api<PageLike<PollResponse>>(
        `/api/polls/author/${encodeURIComponent(uid)}?page=${page}&size=${size}`,
        { method: "GET", auth: true }
      );

      setPolls(res.content || []);
      setMeta({ page: res.number ?? 0, totalPages: res.totalPages });
    } catch (e: any) {
      setError(e?.message || "Erreur lors du chargement.");
      setPolls([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMyPolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return polls;
    return polls.filter((p) => (p.title || "").toLowerCase().includes(q));
  }, [polls, query]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-6xl px-4 py-6 md:py-8 space-y-5">
          <ProCard
            title="Mes sondages"
            subtitle="Tous les sondages dont vous êtes propriétaire."
            right={
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4" />
                Create poll
              </Link>
            }
          >
            {/* Search + refresh block (zinc-50 like your dashboard style) */}
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                {/* Search */}
                <div className="flex w-full items-center gap-2 rounded-xl border border-zinc-100 bg-white px-3">
                  <Search className="h-4 w-4 text-zinc-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher par titre…"
                    className="h-10 w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                  />
                </div>

                {/* Refresh */}
                <button
                  onClick={fetchMyPolls}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Rafraîchir
                </button>
              </div>

              {/* Meta */}
              <div className="mt-3 text-sm text-zinc-600">
                {loading ? "Chargement…" : `${filtered.length} sondage(s).`}
                {meta.totalPages !== undefined ? ` (pages: ${meta.totalPages})` : ""}
              </div>

              {/* Error */}
              {error && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </ProCard>

          {/* list */}
          <div className="grid gap-4">
            {!loading && filtered.length === 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
                Aucun sondage.
              </div>
            )}

            {filtered.map((p) => {
              const st = String(p.status).toUpperCase();

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-zinc-900">
                          {p.title}
                        </h3>
                        <StatusBadge status={st} />
                      </div>

                      {p.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                          {p.description}
                        </p>
                      )}

                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-2">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                            Ouverture
                          </div>
                          <div className="mt-1 text-sm text-zinc-800">
                            {formatDate(p.dateStart)}
                          </div>
                        </div>

                        <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-2">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                            Fermeture
                          </div>
                          <div className="mt-1 text-sm text-zinc-800">
                            {formatDate(p.dateEnd)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/poll/${p.id}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                    >
                      Détails
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* quick actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/poll/${p.id}`}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                    >
                      Voir informations
                    </Link>

                    {st === "OPEN" && (
                      <Link
                        href={`/poll/${p.id}/progress`}
                        className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
                      >
                        Voir avancement
                      </Link>
                    )}

                    {st === "CLOSED" && (
                      <Link
                        href={`/poll/${p.id}/results`}
                        className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
                      >
                        Voir résultats
                      </Link>
                    )}

                    {st === "DRAFT" && (
                      <Link
                        href={`/poll/${p.id}/update`}
                        className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
                      >
                        Apporter modification
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}