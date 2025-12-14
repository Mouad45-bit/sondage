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
        // ✅ endpoint public
        const s = await api<PollStatsResponse>(`/api/polls/${encodeURIComponent(id)}/results`, {
          method: "GET",
          auth: false,
        });
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
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
          Chargement…
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || "Résultats indisponibles."}
          <div className="mt-2 text-xs text-red-600">
            Si tu vois une erreur 400/404 : corrige backend `@PathVariable("id") String pollId` sur `/results`.
          </div>
        </div>
        <Link
          href={`/poll/${id}`}
          className="inline-flex rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
        >
          Retour au sondage
        </Link>
      </div>
    );
  }

  const st = String(stats.status).toUpperCase();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-5">
      <ProCard
        title="Résultats définitifs"
        subtitle={`${stats.titre} • ${st}`}
        right={
          <Link
            href={`/poll/${id}`}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
          >
            Retour détails
          </Link>
        }
      >
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {stats.description || "—"}
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xs text-zinc-500">Total des votes</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {stats.totalVotes}
          </div>
        </div>
      </ProCard>

      <ProCard title="Répartition" subtitle="Votes par option">
        {computedOptions.length === 0 ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Aucune option.
          </div>
        ) : (
          <div className="space-y-3">
            {computedOptions.map((o) => (
              <div
                key={o.index}
                className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {o.label}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {o.votes} vote(s) • {o.pct.toFixed(1)}%
                  </div>
                </div>

                <div className="mt-3 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900">
                  <div
                    className="h-2 rounded-full bg-zinc-900 dark:bg-zinc-50"
                    style={{ width: `${clamp(o.pct, 0, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </ProCard>
    </div>
  );
}