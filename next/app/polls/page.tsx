// app/polls/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "../components/AuthGuard";
import { api } from "../lib/api";
import { getUidFromToken } from "../lib/jwt";
import {
  Plus,
  Search,
  RefreshCcw,
  ChevronRight,
  ChevronLeft,
  Eye,
  Trash2,
} from "lucide-react";

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
  last?: boolean;
};

const PAGE_SIZE = 6;

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
  const [toast, setToast] = useState<string | null>(null);

  const [meta, setMeta] = useState<{ page: number; totalPages?: number }>({
    page: 0,
  });
  const [page, setPage] = useState(0);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let t: any;
    if (toast) t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchMyPolls(p = page) {
    setLoading(true);
    setError(null);

    try {
      const uid = getUidFromToken();
      if (!uid) {
        setPolls([]);
        setError("Token invalide: uid introuvable.");
        return;
      }

      const size = PAGE_SIZE;

      const res = await api<PageLike<PollResponse>>(
        `/api/polls/author/${encodeURIComponent(uid)}?page=${p}&size=${size}`,
        { method: "GET", auth: true }
      );

      setPolls(res.content || []);
      setMeta({ page: res.number ?? p, totalPages: res.totalPages });
    } catch (e: any) {
      setError(e?.message || "Erreur lors du chargement.");
      setPolls([]);
    } finally {
      setLoading(false);
    }
  }

  async function cancelPoll(poll: PollResponse) {
    const ok = window.confirm(
      `Cancel this DRAFT poll?\n\n"${poll.title}"\n\nThis will permanently delete it.`
    );
    if (!ok) return;

    setDeletingId(poll.id);
    setError(null);

    try {
      await api<void>(`/api/polls/${encodeURIComponent(poll.id)}`, {
        method: "DELETE",
        auth: true,
      });

      setToast("Poll cancelled (deleted).");

      // si on vient de supprimer le dernier item de la page, revenir à la page précédente
      if (polls.length === 1 && page > 0) {
        setPage((x) => Math.max(0, x - 1));
        return; // l'useEffect va refetch
      }

      // sinon refresh la même page
      fetchMyPolls(page);
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    fetchMyPolls(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return polls;
    return polls.filter((p) => (p.title || "").toLowerCase().includes(q));
  }, [polls, query]);

  const totalPages = meta.totalPages ?? 1;
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  // tokens
  const btnPrimary =
    "cursor-pointer inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold !text-white shadow-sm hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60";
  const btnDanger =
    "cursor-pointer inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 disabled:opacity-60";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-6xl px-4 py-2 space-y-4">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-center md:text-left text-2xl font-semibold uppercase tracking-[0.14em] text-zinc-600">
              my polls
            </div>

            <Link
              href="/create"
              className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2 font-semibold !text-white text-medium uppercase shadow-sm hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              create poll
            </Link>
          </div>

          {/* Filters card */}
          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-zinc-950">Filters</h2>

            <div className="grid gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white pl-3">
                  <Search className="h-4 w-4 text-zinc-500" />
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(0);
                    }}
                    placeholder="Search by title.."
                    className="h-10 w-full bg-transparent text-sm text-zinc-900 pl-3 outline-none placeholder:text-zinc-500"
                  />
                </div>

                <button
                  onClick={() => fetchMyPolls(page)}
                  className="cursor-pointer inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60"
                  disabled={loading}
                  type="button"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </button>
              </div>

              {toast && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {toast}
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </div>
              )}
            </div>
          </section>

          {/* Pagination */}
          {(meta.totalPages ?? 1) > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center md:justify-end">
                <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800">
                  {loading ? "Loading.." : `${filtered.length} displayed`}
                  {meta.totalPages !== undefined
                    ? ` · ${meta.totalPages} ${meta.totalPages > 1 ? "pages" : "page"}`
                    : ""}
                </span>
              </div>

              <div className="inline-flex items-center rounded-xl border border-zinc-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setPage((x) => Math.max(0, x - 1))}
                  disabled={!canPrev || loading}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-l-xl hover:bg-zinc-50 disabled:opacity-40"
                  aria-label="Previous page"
                  title="Previous page"
                >
                  <ChevronLeft className="h-5 w-5 text-zinc-700" />
                </button>

                <div className="px-3 text-xs font-semibold text-zinc-700">
                  Page {page + 1} / {totalPages}
                </div>

                <button
                  type="button"
                  onClick={() => setPage((x) => x + 1)}
                  disabled={!canNext || loading}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-r-xl hover:bg-zinc-50 disabled:opacity-40"
                  aria-label="Next page"
                  title="Next page"
                >
                  <ChevronRight className="h-5 w-5 text-zinc-700" />
                </button>
              </div>
            </div>
          )}

          {/* List */}
          <section className="grid gap-4 md:grid-cols-2">
            {!loading && filtered.length === 0 && (
              <div className="md:col-span-2 col-span-full rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
                No poll found.
              </div>
            )}

            {filtered.map((p) => {
              const st = String(p.status).toUpperCase();
              const isDraft = st === "DRAFT";

              return (
                <article
                  key={p.id}
                  className="h-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg truncate font-semibold text-zinc-950 uppercase">
                          {p.title}
                        </h3>
                        <StatusBadge status={st} />
                      </div>

                      {p.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-zinc-600 font-medium">
                          {p.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-col gap-x-4 gap-y-1 text-sm text-zinc-500">
                        <span>Opening: {formatDate(p.dateStart)}</span>
                        <span>Closing: {formatDate(p.dateEnd)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/poll/${p.id}`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                        aria-label="See details"
                        title="See details"
                      >
                        <Eye className="h-5 w-5 text-zinc-600" />
                      </Link>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {st === "OPEN" && (
                      <Link href={`/poll/${p.id}/progress`} className={btnPrimary}>
                        See progress
                      </Link>
                    )}

                    {st === "CLOSED" && (
                      <Link href={`/poll/${p.id}/results`} className={btnPrimary}>
                        See results
                      </Link>
                    )}

                    {isDraft && (
                      <>
                        <Link href={`/poll/${p.id}/update`} className={btnPrimary}>
                          Update poll
                        </Link>

                        <button
                          type="button"
                          onClick={() => cancelPoll(p)}
                          disabled={loading || deletingId === p.id}
                          className={btnDanger}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {deletingId === p.id ? "Cancelling.." : "Cancel poll"}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}