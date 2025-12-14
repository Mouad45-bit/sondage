// app/poll/[id]/results/page.tsx

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProCard } from "@/app/components/ProCard";
import { api } from "../../../lib/api";

type PollStatus = "DRAFT" | "OPEN" | "CLOSED";

type OptionStatsResponse = {
  index: number;
  label: string;
  votes: number;
  percentage: number; // ⚠️ backend peut être faux → on recalcule
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

export default function PollResultsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [stats, setStats] = useState<PollStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const s = await api<PollStatsResponse>(
          `/api/polls/${encodeURIComponent(id)}/results`,
          { method: "GET", auth: false }
        );
        setStats(s);
      } catch (e: any) {
        setError(e?.message || "Impossible de charger les résultats.");
        setStats(null);
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
      return { ...o, pct };
    });
  }, [stats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                  Résultats
                </div>
                <div className="mt-1 text-sm font-medium text-zinc-900">
                  Chargement…
                </div>
              </div>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
            </div>
            <div className="mt-6 space-y-3">
              <div className="h-3 w-2/3 rounded-full bg-zinc-100" />
              <div className="h-3 w-5/6 rounded-full bg-zinc-100" />
              <div className="h-3 w-1/2 rounded-full bg-zinc-100" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-6xl px-4 py-6 md:py-8 space-y-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error || "Résultats indisponibles."}
            <div className="mt-2 text-xs text-red-600">
              Si tu vois une erreur 400/404 : corrige backend{" "}
              <span className="font-medium">
                @PathVariable(&quot;id&quot;) String pollId
              </span>{" "}
              sur /results.
            </div>
          </div>

          <Link
            href={`/poll/${id}`}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            Retour au sondage
          </Link>
        </main>
      </div>
    );
  }

  const st = String(stats.status).toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8 space-y-5">
        <ProCard
          title="Résultats définitifs"
          subtitle={`${stats.titre} • ${st}`}
          right={
            <Link
              href={`/poll/${id}`}
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              Retour détails
            </Link>
          }
        >
          <div className="text-sm text-zinc-600">{stats.description || "—"}</div>

          <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Total des votes
                </div>
                <div className="mt-1 text-3xl font-semibold text-zinc-900">
                  {stats.totalVotes}
                </div>
              </div>

              <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-medium text-zinc-700">
                Statut: {st}
              </span>
            </div>
          </div>
        </ProCard>

        <ProCard title="Répartition" subtitle="Votes par option">
          {computedOptions.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
              Aucune option.
            </div>
          ) : (
            <section className="space-y-3">
              {computedOptions.map((o) => (
                <article
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
                      {o.votes} vote(s) • {o.pct.toFixed(1)}%
                    </div>
                  </div>

                  <div className="mt-3 h-2 w-full rounded-full bg-zinc-100">
                    <div
                      className="h-2 rounded-full bg-zinc-900"
                      style={{ width: `${clamp(o.pct, 0, 100)}%` }}
                    />
                  </div>
                </article>
              ))}
            </section>
          )}
        </ProCard>
      </main>
    </div>
  );
}