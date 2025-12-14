// app/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "./components/AuthGuard";
import { ProCard } from "./components/ProCard";
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
  dateEnd: string;   // ISO
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
  // input type="datetime-local" => "YYYY-MM-DDTHH:mm"
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
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border";
  if (s === "OPEN") return <span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700`}>OPEN</span>;
  if (s === "CLOSED") return <span className={`${base} border-zinc-200 bg-zinc-100 text-zinc-700`}>CLOSED</span>;
  return <span className={`${base} border-amber-200 bg-amber-50 text-amber-700`}>DRAFT</span>;
}

export default function DashboardPage() {
  // UI state (editable)
  const [status, setStatus] = useState<StatusFilter>("all");
  const [searchMode, setSearchMode] = useState<SearchMode>("title");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState(""); // datetime-local
  const [to, setTo] = useState("");   // datetime-local

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
  const [meta, setMeta] = useState<{ page: number; totalPages?: number; hasNext?: boolean }>({ page: 0 });
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
        // Slice côté backend, mais on récupère "content" pareil
        path = `/api/polls/search?author=${encodeURIComponent(applied.query.trim())}&page=${page}&size=${size}`;
      }
      // 3) Status filter
      else if (applied.status === "open") {
        path = `/api/polls/status/OPEN?page=${page}&size=${size}`;
      } else if (applied.status === "closed") {
        path = `/api/polls/status/CLOSED?page=${page}&size=${size}`;
      } else if (applied.status === "draft") {
        path = `/api/polls/status/DRAFT?page=${page}&size=${size}`;
      } else {
        path = `/api/polls?page=${page}&size=${size}`;
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

  return (
    <AuthGuard>
      <div className="space-y-5">
        <ProCard
          title="Dashboard"
          subtitle="Liste des sondages, filtres, recherche et actions rapides."
          right={
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
              Create poll
            </Link>
          }
        >
          {/* Filters */}
          <div className="grid gap-3 md:grid-cols-12">
            {/* status */}
            <div className="md:col-span-6">
              <div className="flex flex-wrap gap-2">
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
                    className={[
                      "rounded-xl border px-3 py-2 text-sm transition-colors",
                      status === key
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* search */}
            <div className="md:col-span-6">
              <div className="flex gap-2">
                <div className="flex w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <Search className="h-4 w-4 text-zinc-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchMode === "title" ? "Rechercher par titre…" : "Rechercher par auteur…"}
                    className="h-10 w-full bg-transparent text-sm outline-none"
                  />
                </div>

                <select
                  value={searchMode}
                  onChange={(e) => setSearchMode(e.target.value as SearchMode)}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                >
                  <option value="title">Titre</option>
                  <option value="author">Auteur</option>
                </select>
              </div>
            </div>

            {/* dates */}
            <div className="md:col-span-12">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Calendar className="h-4 w-4" />
                  Filtrer par dates (overlap)
                </div>

                <div className="flex flex-1 flex-col gap-2 md:flex-row">
                  <input
                    type="datetime-local"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="h-10 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  />
                  <input
                    type="datetime-local"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="h-10 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={applyFilters}
                    className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
                  >
                    Appliquer
                  </button>
                  <button
                    onClick={resetFilters}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            {loading ? "Chargement…" : `${filtered.length} sondage(s) affiché(s).`}
            {meta.totalPages !== undefined ? ` (pages: ${meta.totalPages})` : ""}
          </div>

          {toast && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {toast}
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </ProCard>

        {/* List */}
        <div className="grid gap-4">
          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
              Aucun sondage trouvé.
            </div>
          )}

          {filtered.map((p) => {
            const fav = favorites.includes(p.id);
            const st = String(p.status).toUpperCase();

            return (
              <div
                key={p.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {p.title}
                      </h3>
                      <StatusBadge status={st} />
                    </div>

                    {p.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {p.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span>Ouverture: {formatDate(p.dateStart)}</span>
                      <span>Fermeture: {formatDate(p.dateEnd)}</span>
                    </div>
                  </div>

                  {/* favorite */}
                  <button
                    onClick={() => {
                      const next = toggleFavorite(p.id);
                      setFavorites(next);
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
                    aria-label="Favori"
                    title="Favori"
                  >
                    <Star className={`h-5 w-5 ${fav ? "fill-zinc-900 text-zinc-900" : "text-zinc-600"}`} />
                  </button>
                </div>

                {/* actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/poll/${p.id}`}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    Voir informations
                  </Link>

                  {st === "OPEN" && (
                    <>
                      <Link
                        href={`/poll/${p.id}`}
                        className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                      >
                        Participer
                      </Link>
                      <Link
                        href={`/poll/${p.id}/progress`}
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                      >
                        Voir avancement
                      </Link>
                      <button
                        onClick={() => {
                          addReminder(p.id, "RESULTS", p.dateEnd);
                          setToast("Rappel résultats enregistré (local).");
                        }}
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                      >
                        Fixer rappel résultats
                      </button>
                    </>
                  )}

                  {st === "CLOSED" && (
                    <Link
                      href={`/poll/${p.id}/results`}
                      className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                    >
                      Voir résultats
                    </Link>
                  )}

                  {st === "DRAFT" && (
                    <button
                      onClick={() => {
                        addReminder(p.id, "OPENING", p.dateStart);
                        setToast("Rappel ouverture enregistré (local).");
                      }}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                    >
                      Fixer rappel ouverture
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AuthGuard>
  );
}