// app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "./components/AuthGuard";
import { api } from "./lib/api";
import { getFavorites, toggleFavorite } from "./lib/favorites";
import { addReminder } from "./lib/reminders";
import {
  Calendar,
  Plus,
  Search,
  Star,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
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
  totalElements?: number;
  number?: number;
  size?: number;
  last?: boolean;
  first?: boolean;
  hasNext?: boolean; // Slice
};

type StatusFilter = "open" | "closed" | "draft" | "favorites" | "all";
type SearchMode = "title" | "author";

const PAGE_SIZE = 6;

function toIsoSeconds(datetimeLocal: string) {
  if (!datetimeLocal) return "";
  return datetimeLocal.length === 16 ? `${datetimeLocal}:00` : datetimeLocal;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide";
  if (s === "OPEN")
    return (
      <span
        className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700`}
      >
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

export default function DashboardPage() {
  // UI state (editable)
  const [status, setStatus] = useState<StatusFilter>("all");
  const [searchMode, setSearchMode] = useState<SearchMode>("title");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState(""); // datetime-local
  const [to, setTo] = useState(""); // datetime-local
  const [page, setPage] = useState(0);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [data, setData] = useState<PollResponse[]>([]);
  const [meta, setMeta] = useState<{
    page: number;
    totalPages?: number;
    hasNext?: boolean;
  }>({
    page: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  useEffect(() => {
    let t: any;
    if (toast) t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    if (status !== "favorites") return data;
    return data.filter((p) => favorites.includes(p.id));
  }, [data, status, favorites]);

  async function fetchPolls() {
    setLoading(true);
    setError(null);

    try {
      const size = PAGE_SIZE;
      const p = page;

      const hasDateRange = !!from && !!to;
      const hasQuery = debouncedQuery.trim().length > 0;

      let path = `/api/polls?page=${p}&size=${size}`;

      // 1) Date filter -> overlapped
      if (hasDateRange) {
        const fromIso = encodeURIComponent(toIsoSeconds(from));
        const toIso = encodeURIComponent(toIsoSeconds(to));
        path = `/api/polls/overlapped?from=${fromIso}&to=${toIso}&page=${p}&size=${size}`;
      }
      // 2) Search
      else if (hasQuery && searchMode === "title") {
        path = `/api/polls/search?title=${encodeURIComponent(
          debouncedQuery.trim()
        )}&page=${p}&size=${size}`;
      } else if (hasQuery && searchMode === "author") {
        path = `/api/polls/search?author=${encodeURIComponent(
          debouncedQuery.trim()
        )}&page=${p}&size=${size}`;
      }
      // 3) Status filter
      else if (status === "open") {
        path = `/api/polls/status/OPEN?page=${p}&size=${size}`;
      } else if (status === "closed") {
        path = `/api/polls/status/CLOSED?page=${p}&size=${size}`;
      } else if (status === "draft") {
        path = `/api/polls/status/DRAFT?page=${p}&size=${size}`;
      }

      const res = await api<PageLike<PollResponse>>(path, {
        method: "GET",
        auth: true,
      });
      setData(res.content || []);
      setMeta({
        page: res.number ?? 0,
        totalPages: res.totalPages,
        hasNext: res.hasNext ?? res.last === false,
      });
    } catch (e: any) {
      setError(e?.message || "Erreur lors du chargement.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, searchMode, debouncedQuery, from, to, page]);

  function resetFilters() {
    setStatus("all");
    setSearchMode("title");
    setQuery("");
    setFrom("");
    setTo("");
    setPage(0);
  }

  const pillBase =
    "rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300";
  const pillActive = "bg-zinc-950 text-white shadow-sm";
  const pillIdle = "bg-transparent text-zinc-700 hover:bg-zinc-100";

  const inputBase =
    "h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-zinc-300";

  const btnPrimary =
    "cursor-pointer inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2 font-semibold !text-white shadow-sm hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60";
  const btnGhost =
    "cursor-pointer inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60";

  const totalPages = meta.totalPages ?? 1;
  const canPrev = page > 0;
  const canNext =
    meta.totalPages !== undefined ? page < totalPages - 1 : !!meta.hasNext;

  const showPagination =
    !loading && filtered.length > 0 && (meta.totalPages ?? 1) > 1;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-6xl px-4 py-2 space-y-4">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-center md:text-left text-2xl font-semibold uppercase tracking-[0.14em] text-zinc-600 uppercase">
              all polls
            </div>
            <Link
              href="/create"
              className={btnPrimary + " text-medium uppercase"}
            >
              <Plus className="mr-2 h-4 w-4" />
              create poll
            </Link>
          </div>

          {/* Filters */}
          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">Filters</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Status, search and date range.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {/* Status pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <div className="inline-flex items-center gap-0.5 rounded-full border border-zinc-200 bg-white p-1">
                  {(
                    [
                      ["all", "All"],
                      ["open", "Open"],
                      ["closed", "Closed"],
                      ["draft", "Draft"],
                      ["favorites", "Favorites"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setStatus(key);
                        setPage(0);
                      }}
                      className={
                        [pillBase, status === key ? pillActive : pillIdle].join(
                          " "
                        ) + " cursor-pointer"
                      }
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div className="grid gap-2 md:grid-cols-12 md:items-center">
                <div className="md:col-span-10">
                  <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white pl-3">
                    <Search className="h-4 w-4 text-zinc-500" />
                    <input
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(0);
                      }}
                      placeholder={
                        searchMode === "title"
                          ? "Search by title.."
                          : "Search by author.."
                      }
                      className="h-10 w-full bg-transparent text-sm text-zinc-900 pl-3 outline-none placeholder:text-zinc-500"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <select
                    value={searchMode}
                    onChange={(e) => {
                      setSearchMode(e.target.value as SearchMode);
                      setPage(0);
                    }}
                    className={inputBase}
                  >
                    <option value="title">Title</option>
                    <option value="author">Author</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                    <Calendar className="h-4 w-4 text-zinc-500" />
                    Filter by dates
                  </div>

                  <div className="flex flex-1 flex-col gap-2 md:flex-row">
                    <input
                      type="datetime-local"
                      value={from}
                      onChange={(e) => {
                        setFrom(e.target.value);
                        setPage(0);
                      }}
                      className={inputBase}
                    />
                    <input
                      type="datetime-local"
                      value={to}
                      onChange={(e) => {
                        setFrom(e.target.value);
                        setPage(0);
                      }}
                      className={inputBase}
                    />
                  </div>

                  <button
                    onClick={resetFilters}
                    className="cursor-pointer inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60"
                    type="button"
                    disabled={loading}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Reset
                  </button>
                </div>
              </div>

              {/* Toast / Error */}
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

          {/* Pagination */}
          {showPagination && (
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center md:justify-end">
                <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800">
                  {loading ? "Loading.." : `${filtered.length} displayed`}
                  {meta.totalPages !== undefined
                    ? ` · ${meta.totalPages} ${
                        meta.totalPages > 1 ? "pages" : "page"
                      }`
                    : ""}
                </span>
              </div>

              <div className="inline-flex items-center rounded-xl border border-zinc-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setPage((x) => Math.max(0, x - 1))}
                  disabled={!canPrev || loading}
                  className="cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-l-xl hover:bg-zinc-50 disabled:opacity-40 disabled:pointer-events-none disabled:cursor-default"
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
                  className="cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-r-xl hover:bg-zinc-50 disabled:opacity-40 disabled:pointer-events-none disabled:cursor-default"
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
              <div className="col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
                No poll found.
              </div>
            )}

            {filtered.map((p) => {
              const fav = favorites.includes(p.id);
              const st = String(p.status).toUpperCase();

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

                      <button
                        type="button"
                        onClick={() => setFavorites(toggleFavorite(p.id))}
                        className="cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                        aria-label="Favorite"
                        title="Favorite"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            fav
                              ? "fill-zinc-950 text-zinc-950"
                              : "text-zinc-500"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {st === "OPEN" && (
                      <>
                        <Link
                          href={`/poll/${p.id}`}
                          className={btnPrimary + " text-sm"}
                        >
                          Participate
                        </Link>
                        <Link
                          href={`/poll/${p.id}/progress`}
                          className={btnGhost}
                        >
                          See progress
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            addReminder(p.id, "RESULTS", p.dateEnd);
                            setToast("Rappel résultats enregistré (local).");
                          }}
                          className={btnGhost}
                        >
                          Set reminder results
                        </button>
                      </>
                    )}

                    {st === "CLOSED" && (
                      <Link
                        href={`/poll/${p.id}/results`}
                        className={btnPrimary + " text-sm"}
                      >
                        See results
                      </Link>
                    )}

                    {st === "DRAFT" && (
                      <button
                        type="button"
                        onClick={() => {
                          addReminder(p.id, "OPENING", p.dateStart);
                          setToast("Rappel ouverture enregistré (local).");
                        }}
                        className={btnGhost}
                      >
                        Set reminder opening
                      </button>
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
