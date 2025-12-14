// app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "./components/AuthGuard";
import { api } from "./lib/api";
import { getFavorites, toggleFavorite } from "./lib/favorites";
import { addReminder } from "./lib/reminders";
import { Calendar, Plus, Search, Star } from "lucide-react";

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

export default function DashboardPage() {
  // UI state (editable)
  const [status, setStatus] = useState<StatusFilter>("all");
  const [searchMode, setSearchMode] = useState<SearchMode>("title");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState(""); // datetime-local
  const [to, setTo] = useState(""); // datetime-local

  // Applied state (déclenche fetch)
  const [applied, setApplied] = useState({
    status: "all" as StatusFilter,
    searchMode: "title" as SearchMode,
    query: "",
    from: "",
    to: "",
  });

  const [favorites, setFavorites] = useState<string[]>([]);
  const [data, setData] = useState<PollResponse[]>([]);
  const [meta, setMeta] = useState<{ page: number; totalPages?: number; hasNext?: boolean }>({
    page: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  useEffect(() => {
    let t: any;
    if (toast) t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    if (applied.status !== "favorites") return data;
    return data.filter((p) => favorites.includes(p.id));
  }, [data, applied.status, favorites]);

  async function fetchPolls() {
    setLoading(true);
    setError(null);

    try {
      const size = 20;
      const page = 0;

      const hasDateRange = !!applied.from && !!applied.to;
      const hasQuery = applied.query.trim().length > 0;

      let path = `/api/polls?page=${page}&size=${size}`;

      // 1) Date filter -> overlapped
      if (hasDateRange) {
        const fromIso = encodeURIComponent(toIsoSeconds(applied.from));
        const toIso = encodeURIComponent(toIsoSeconds(applied.to));
        path = `/api/polls/overlapped?from=${fromIso}&to=${toIso}&page=${page}&size=${size}`;
      }
      // 2) Search
      else if (hasQuery && applied.searchMode === "title") {
        path = `/api/polls/search?title=${encodeURIComponent(applied.query.trim())}&page=${page}&size=${size}`;
      } else if (hasQuery && applied.searchMode === "author") {
        path = `/api/polls/search?author=${encodeURIComponent(applied.query.trim())}&page=${page}&size=${size}`;
      }
      // 3) Status filter
      else if (applied.status === "open") {
        path = `/api/polls/status/OPEN?page=${page}&size=${size}`;
      } else if (applied.status === "closed") {
        path = `/api/polls/status/CLOSED?page=${page}&size=${size}`;
      } else if (applied.status === "draft") {
        path = `/api/polls/status/DRAFT?page=${page}&size=${size}`;
      }

      const res = await api<PageLike<PollResponse>>(path, { method: "GET", auth: true });
      setData(res.content || []);
      setMeta({
        page: res.number ?? 0,
        totalPages: res.totalPages,
        hasNext: res.hasNext,
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
  }, [applied]);

  function applyFilters() {
    setApplied({ status, searchMode, query, from, to });
  }

  function resetFilters() {
    setStatus("all");
    setSearchMode("title");
    setQuery("");
    setFrom("");
    setTo("");
    setApplied({ status: "all", searchMode: "title", query: "", from: "", to: "" });
  }

  const pillBase =
    "rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300";
  const pillActive = "bg-zinc-950 text-white shadow-sm";
  const pillIdle = "bg-transparent text-zinc-700 hover:bg-zinc-100";

  const inputBase =
    "h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-300";

  const btnPrimary =
    "inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold !text-white shadow-sm hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60";
  const btnGhost =
    "inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-6xl px-4 py-2 space-y-4">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-center md:text-left text-2xl font-semibold uppercase tracking-[0.16em] text-zinc-600 uppercase">
              Tous sondages
            </div>
            <Link href="/create" className={btnPrimary}>
            <Plus className="mr-2 h-4 w-4" />
            Create poll
            </Link>
          </div>

          {/* Filters */}
          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-950">Filtres</h2>
                <p className="mt-1 text-[12px] text-zinc-600">
                  Statut, recherche et intervalle de dates.
                </p>
              </div>

              <div className="flex items-center justify-center md:justify-end">
                <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold text-zinc-700">
                  {loading ? "Chargement…" : `${filtered.length} affiché(s)`}
                  {meta.totalPages !== undefined ? ` · pages ${meta.totalPages}` : ""}
                </span>
              </div>
            </div>

            <div className="grid gap-4">
              {/* Status pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <div className="inline-flex items-center gap-0.5 rounded-full border border-zinc-200 bg-white p-1">
                  {(
                    [
                      ["all", "Tous"],
                      ["open", "Open"],
                      ["closed", "Closed"],
                      ["draft", "Draft"],
                      ["favorites", "Favorites"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setStatus(key)}
                      className={[pillBase, status === key ? pillActive : pillIdle].join(" ")}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div className="grid gap-2 md:grid-cols-12 md:items-center">
                <div className="md:col-span-9">
                  <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3">
                    <Search className="h-4 w-4 text-zinc-500" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={searchMode === "title" ? "Rechercher par titre…" : "Rechercher par auteur…"}
                      className="h-10 w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                    />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <select
                    value={searchMode}
                    onChange={(e) => setSearchMode(e.target.value as SearchMode)}
                    className={inputBase}
                  >
                    <option value="title">Titre</option>
                    <option value="author">Auteur</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                    <Calendar className="h-4 w-4 text-zinc-500" />
                    Filtrer par dates
                  </div>

                  <div className="flex flex-1 flex-col gap-2 md:flex-row">
                    <input
                      type="datetime-local"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className={inputBase}
                    />
                    <input
                      type="datetime-local"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className={inputBase}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={applyFilters} className={btnPrimary} type="button">
                      Appliquer
                    </button>
                    <button onClick={resetFilters} className={btnGhost} type="button">
                      Reset
                    </button>
                  </div>
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

          {/* List */}
          <section className="grid gap-4">
            {!loading && filtered.length === 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
                Aucun sondage trouvé.
              </div>
            )}

            {filtered.map((p) => {
              const fav = favorites.includes(p.id);
              const st = String(p.status).toUpperCase();

              return (
                <article
                  key={p.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-zinc-950">
                          {p.title}
                        </h3>
                        <StatusBadge status={st} />
                      </div>

                      {p.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                          {p.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                        <span>Ouverture: {formatDate(p.dateStart)}</span>
                        <span>Fermeture: {formatDate(p.dateEnd)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFavorites(toggleFavorite(p.id))}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                      aria-label="Favori"
                      title="Favori"
                    >
                      <Star
                        className={`h-5 w-5 ${fav ? "fill-zinc-950 text-zinc-950" : "text-zinc-500"}`}
                      />
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/poll/${p.id}`} className={btnGhost}>
                      Voir informations
                    </Link>

                    {st === "OPEN" && (
                      <>
                        <Link href={`/poll/${p.id}`} className={btnPrimary}>
                          Participer
                        </Link>
                        <Link href={`/poll/${p.id}/progress`} className={btnGhost}>
                          Voir avancement
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            addReminder(p.id, "RESULTS", p.dateEnd);
                            setToast("Rappel résultats enregistré (local).");
                          }}
                          className={btnGhost}
                        >
                          Fixer rappel résultats
                        </button>
                      </>
                    )}

                    {st === "CLOSED" && (
                      <Link href={`/poll/${p.id}/results`} className={btnPrimary}>
                        Voir résultats
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
                        Fixer rappel ouverture
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
