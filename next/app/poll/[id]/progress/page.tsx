// app/poll/[id]/progress/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/app/components/AuthGuard";
import { ProCard } from "@/app/components/ProCard";
import { api } from "../../../lib/api";
import { getUidFromToken } from "../../../lib/jwt";
import { addReminder } from "../../../lib/reminders";

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
  percentage: number; // ⚠️ chez toi, elle est souvent à 0 à cause d'un bug backend
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

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function computeTimeProgress(startIso: string, endIso: string) {
  const now = Date.now();
  const s = new Date(startIso).getTime();
  const e = new Date(endIso).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return { pct: 0, label: "—" };

  const pct = clamp(((now - s) / (e - s)) * 100, 0, 100);

  const totalMs = e - s;
  const elapsedMs = clamp(now - s, 0, totalMs);
  const remainingMs = clamp(e - now, 0, totalMs);

  const h = (ms: number) => Math.floor(ms / 3_600_000);
  const m = (ms: number) => Math.floor((ms % 3_600_000) / 60_000);

  const label =
    now < s
      ? `Démarre dans ${h(s - now)}h ${m(s - now)}m`
      : now > e
      ? `Terminé`
      : `Restant ${h(remainingMs)}h ${m(remainingMs)}m`;

  return { pct, label };
}

export default function PollProgressPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const uid = useMemo(() => getUidFromToken(), []);
  const [poll, setPoll] = useState<PollResponse | null>(null);

  const [stats, setStats] = useState<PollStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isOwner = useMemo(() => (poll ? uid === poll.authorId : false), [poll, uid]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setInfo(null);

      try {
        // 1) Poll details (public)
        const p = await api<PollResponse>(`/api/polls/${encodeURIComponent(id)}`, {
          method: "GET",
          auth: false,
        });
        setPoll(p);

        // 2) Progress (auth required)
        // ⚠️ backend: OPEN + user must have voted (sinon 403)
        const s = await api<PollStatsResponse>(`/api/polls/${encodeURIComponent(id)}/progress`, {
          method: "GET",
          auth: true,
        });
        setStats(s);
      } catch (e: any) {
        const msg = e?.message || "Impossible de charger l’avancement.";

        // UX propre si owner (backend limitation)
        if (isOwner) {
          setInfo(
            "Backend: l’avancement est autorisé uniquement pour un utilisateur qui a voté. " +
            "Pour le propriétaire, il faut ajuster le backend (autoriser authorId)."
          );
        }

        setError(msg);
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const timeBar = useMemo(() => {
    if (!poll) return { pct: 0, label: "—" };
    return computeTimeProgress(poll.dateStart, poll.dateEnd);
  }, [poll]);

  // ✅ Fix client si "percentage" backend est à 0 : on calcule depuis votes/totalVotes
  const optionsComputed = useMemo(() => {
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
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
            Chargement…
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!poll) {
    return (
      <AuthGuard>
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Sondage introuvable.
          </div>
        </div>
      </AuthGuard>
    );
  }

  const st = String(poll.status).toUpperCase();

  return (
    <AuthGuard>
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-5">
        <ProCard
          title="Avancement sondage"
          subtitle={`${poll.title} • ${st}`}
          right={
            <Link
              href={`/poll/${poll.id}`}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
            >
              Retour détails
            </Link>
          }
        >
          {/* Time progress */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Temps écoulé
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {formatDate(poll.dateStart)} → {formatDate(poll.dateEnd)}
                </div>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">{timeBar.label}</div>
            </div>

            <div className="mt-3 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900">
              <div
                className="h-2 rounded-full bg-zinc-900 dark:bg-zinc-50"
                style={{ width: `${timeBar.pct}%` }}
              />
            </div>

            <div className="mt-2 text-xs text-zinc-500">{Math.round(timeBar.pct)}%</div>
          </div>

          {/* Messages */}
          {info && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {info}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
              <div className="mt-2 text-xs text-red-600">
                Si tu vois une erreur 400/404, corrige backend: `@PathVariable(&quot;id&quot;) String pollId` dans `/progress`.
              </div>
            </div>
          )}
        </ProCard>

        {/* Stats block */}
        <ProCard
          title="Résultat jusqu’à présent"
          subtitle={
            stats
              ? `${stats.totalVotes} vote(s) • visible ${isOwner ? "propriétaire" : "participant"}`
              : "Non disponible"
          }
          right={
            !isOwner && (
              <button
                onClick={() => {
                  addReminder(poll.id, "RESULTS", poll.dateEnd);
                }}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              >
                Fixer rappel résultats
              </button>
            )
          }
        >
          {!stats ? (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Aucune donnée d’avancement pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {optionsComputed.map((o) => (
                <div key={o.index} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {o.label}
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      {o.votes} vote(s) • {o.computedPct.toFixed(1)}%
                    </div>
                  </div>

                  <div className="mt-3 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900">
                    <div
                      className="h-2 rounded-full bg-zinc-900 dark:bg-zinc-50"
                      style={{ width: `${clamp(o.computedPct, 0, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ProCard>
      </div>
    </AuthGuard>
  );
}
