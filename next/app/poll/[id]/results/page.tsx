// app/poll/[id]/results/page.tsx

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/app/components/AuthGuard";
import { api } from "../../../lib/api";
import { ArrowLeft, BarChart3, Eye } from "lucide-react";

type PollStatus = "DRAFT" | "OPEN" | "CLOSED";

type PollResponse = {
  id: string;
  title: string;
  description?: string | null;
  status: PollStatus | string;
  dateStart: string;
  dateEnd: string;
  options: string[];
  authorId: string;
};

type OptionStatsResponse = {
  index: number;
  label: string;
  votes: number;
  percentage: number;
};

type PollStatsResponse = {
  pollId: string;
  titre: string;
  description: string;
  status: PollStatus | string;
  totalVotes: number;
  options: OptionStatsResponse[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-sm font-semibold tracking-wide";
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

export default function PollResultsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [stats, setStats] = useState<PollStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [poll, setPoll] = useState<PollResponse | null>(null);

  // comme progress : on sépare error + info, et ça ne bloque pas l’UI
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const btnPrimary =
    "cursor-pointer inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold !text-white shadow-sm hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60";
  const btnGhost =
    "cursor-pointer inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60";

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setInfo(null);

      try {
        const p = await api<PollResponse>(
          `/api/polls/${encodeURIComponent(id)}`,
          {
            method: "GET",
            auth: false,
          }
        );
        setPoll(p);
      } catch (e: any) {
        setPoll(null);
        setError(e?.message || "Poll not found.");
        setLoading(false);
        return;
      }

      try {
        const s = await api<PollStatsResponse>(
          `/api/polls/${encodeURIComponent(id)}/results`,
          { method: "GET", auth: false }
        );
        setStats(s);
      } catch (e: any) {
        setStats(null);
        setInfo(
          'Si le backend renvoie 400/404 : vérifie @PathVariable("id") String pollId sur /results.'
        );
        setError(e?.message || "Impossible de charger les résultats.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const computedOptions = useMemo(() => {
    if (!stats) return [];
    const total = stats.totalVotes || 0;
    return (stats.options || []).map((o) => {
      const pct = total > 0 ? (o.votes * 100) / total : 0;
      return { ...o, computedPct: pct };
    });
  }, [stats]);

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-zinc-50">
          <main className="mx-auto max-w-6xl px-4 py-2 space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    results
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">Loading..</div>
                </div>
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
              </div>
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  // ⚠️ Ici: pas de "return" bloquant si stats est null

  const st = String(poll?.status || "—").toUpperCase();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-6xl px-4 py-2 space-y-4">
          {/* Header EXACTEMENT comme progress */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center md:flex-1">
              <button
                type="button"
                onClick={() => router.back()}
                className={btnGhost}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </button>
            </div>

            <div className="text-center text-2xl font-semibold uppercase tracking-[0.14em] text-zinc-600">
              results
            </div>

            <div className="flex md:flex-1 md:justify-end" />
          </div>

          {/* Card unique (comme progress) */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
            {/* Top row: title + badges */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="text-2xl uppercase font-semibold text-zinc-950 truncate">
                  {poll?.title ?? "—"}
                </div>
                <div className="mt-1 text-lg text-zinc-600 truncate">
                  {poll?.description ? poll.description : "—"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={st} />

                <Link
                  href={`/poll/${id}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                  aria-label="See details"
                  title="See details"
                >
                  <Eye className="h-5 w-5 text-zinc-600" />
                </Link>
              </div>
            </div>

            {/* Messages (comme progress) */}
            {info && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {info}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
                <div className="mt-2 text-xs text-red-600">
                  Si tu vois une erreur 400/404, corrige backend:{" "}
                  <span className="font-medium">
                    @PathVariable("id") String pollId
                  </span>{" "}
                  dans /results.
                </div>
              </div>
            )}

            {/* Results block (même bloc que progress) */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-2">
                  <BarChart3 className="mt-1 h-4 w-4 text-zinc-500" />
                  <div>
                    <div className="text-base font-semibold uppercase tracking-[0.12em] text-zinc-500">
                      final results
                    </div>
                    <div className="mt-1 text-xs text-zinc-600">
                      {stats
                        ? `${stats.totalVotes} ${
                            stats.totalVotes > 1 ? "votes" : "vote"
                          }`
                        : "no data available"}
                    </div>
                  </div>
                </div>
              </div>

              {!stats ? (
                <div className="mt-3 text-sm text-zinc-600">
                  Results data is not available at this time.
                </div>
              ) : computedOptions.length === 0 ? (
                <div className="mt-3 text-sm text-zinc-600">
                  No options available.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {computedOptions.map((o) => (
                    <div
                      key={o.index}
                      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-zinc-900">
                            {o.label}
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">
                            Option #{o.index + 1}
                          </div>
                        </div>

                        <div className="text-sm font-medium text-zinc-700">
                          {o.votes} vote(s) • {o.computedPct.toFixed(1)}%
                        </div>
                      </div>

                      <div className="mt-3 h-2 w-full rounded-full bg-zinc-100">
                        <div
                          className="h-2 rounded-full bg-zinc-900"
                          style={{ width: `${clamp(o.computedPct, 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}
