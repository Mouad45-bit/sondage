// app/poll/[id]/progress/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/app/components/AuthGuard";
import { api } from "../../../lib/api";
import { getUidFromToken } from "../../../lib/jwt";
import { addReminder } from "../../../lib/reminders";
import { ArrowLeft, Clock, BarChart3, Eye } from "lucide-react";

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

// ✅ on enlève LOGIN, on garde seulement le “gate vote”
type ProgressGate = null | "VOTE";

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
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s)
    return { pct: 0, label: "—" };

  const pct = clamp(((now - s) / (e - s)) * 100, 0, 100);

  const totalMs = e - s;
  const remainingMs = clamp(e - now, 0, totalMs);

  const h = (ms: number) => Math.floor(ms / 3_600_000);
  const m = (ms: number) => Math.floor((ms % 3_600_000) / 60_000);

  const label =
    now < s
      ? `Starts in ${h(s - now)}h ${m(s - now)}m`
      : now > e
      ? `Completed`
      : `Remaining ${h(remainingMs)}h ${m(remainingMs)}m`;

  return { pct, label };
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-sm font-semibold tracking-wide";
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

export default function PollProgressPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const uid = useMemo(() => getUidFromToken(), []);
  const [poll, setPoll] = useState<PollResponse | null>(null);

  const [stats, setStats] = useState<PollStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ gate “vote requis” + vraie erreur technique
  const [progressGate, setProgressGate] = useState<ProgressGate>(null);
  const [progressError, setProgressError] = useState<string | null>(null);

  // erreur uniquement poll
  const [pollError, setPollError] = useState<string | null>(null);

  const isOwner = useMemo(() => (poll ? uid === poll.authorId : false), [poll, uid]);

  // ✅ utile: “a déjà voté” = stats disponibles (vu que backend bloque sinon)
  const hasVoted = !!stats;

  const btnPrimary =
    "cursor-pointer inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold !text-white shadow-sm hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60";
  const btnGhost =
    "cursor-pointer inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60";

  useEffect(() => {
    async function load() {
      setLoading(true);
      setPollError(null);
      setProgressGate(null);
      setProgressError(null);
      setStats(null);

      try {
        // 1) poll: public
        const p = await api<PollResponse>(`/api/polls/${encodeURIComponent(id)}`, {
          method: "GET",
          auth: false,
        });
        setPoll(p);

        // 2) progress: backend impose "vote d'abord"
        try {
          const s = await api<PollStatsResponse>(
            `/api/polls/${encodeURIComponent(id)}/progress`,
            { method: "GET", auth: true }
          );
          setStats(s);
          setProgressGate(null);
          setProgressError(null);
        } catch (e: any) {
          const status = e?.status;

          // ✅ on ignore “LOGIN” pour le moment : si 401/403 -> on explique "vote"
          if (status === 401 || status === 403) {
            setProgressGate("VOTE");
            setProgressError(null);
          } else {
            setProgressGate(null);
            setProgressError(e?.message || "Impossible de charger l’avancement.");
          }

          setStats(null);
        }
      } catch (e: any) {
        setPoll(null);
        setPollError(e?.message || "Poll not found.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const timeBar = useMemo(() => {
    if (!poll) return { pct: 0, label: "—" };
    return computeTimeProgress(poll.dateStart, poll.dateEnd);
  }, [poll]);

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
        <div className="min-h-screen bg-zinc-50">
          <main className="mx-auto max-w-6xl px-4 py-2 space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    progress
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

  if (pollError || !poll) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-zinc-50">
          <main className="mx-auto max-w-6xl px-4 py-2 space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              {pollError || "Poll not found."}
            </div>
            <button onClick={() => router.back()} className={btnGhost} type="button">
              Back
            </button>
          </main>
        </div>
      </AuthGuard>
    );
  }

  const st = String(poll.status).toUpperCase();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-6xl px-4 py-2 space-y-4">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center md:flex-1">
              <button type="button" onClick={() => router.back()} className={btnGhost}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </button>
            </div>

            <div className="text-center text-2xl font-semibold uppercase tracking-[0.14em] text-zinc-600">
              progress
            </div>

            <div className="flex md:flex-1 md:justify-end" />
          </div>

          {/* Card */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
            {/* Top row */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="text-2xl uppercase font-semibold text-zinc-950 truncate">
                  {poll.title}
                </div>
                <div className="mt-1 text-lg text-zinc-600 truncate">
                  {poll.description ? poll.description : "—"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={st} />
                {stats && (
                  <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                    {stats.totalVotes} vote(s)
                  </span>
                )}
                <Link
                  href={`/poll/${poll.id}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                  aria-label="See details"
                  title="See details"
                >
                  <Eye className="h-5 w-5 text-zinc-600" />
                </Link>
              </div>
            </div>

            {/* Time progress */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <Clock className="mt-1 h-4 w-4 text-zinc-500" />
                  <div>
                    <div className="text-base font-semibold uppercase tracking-[0.12em] text-zinc-500">
                      time progress
                    </div>
                    <div className="mt-1 text-xs text-zinc-600">
                      {formatDate(poll.dateStart)} → {formatDate(poll.dateEnd)}
                    </div>
                  </div>
                </div>

                <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                  {timeBar.label}
                </span>
              </div>

              <div className="mt-3 h-2 w-full rounded-full bg-zinc-200/60">
                <div className="h-2 rounded-full bg-zinc-900" style={{ width: `${timeBar.pct}%` }} />
              </div>

              <div className="mt-2 text-xs text-zinc-500">{Math.round(timeBar.pct)}%</div>
            </div>

            {/* Gate message (vote requis) */}
            {progressGate === "VOTE" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <div className="font-semibold">Progress locked</div>
                <div className="mt-1">
                  You must <span className="font-semibold">vote</span> to view “results so far”.
                </div>
                <div className="mt-3">
                  <Link href={`/poll/${poll.id}`} className={btnPrimary}>
                    Participate
                  </Link>
                </div>
              </div>
            )}

            {/* True progress error */}
            {progressError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {progressError}
              </div>
            )}

            {/* ✅ RESULTS SO FAR: affiché UNIQUEMENT si déjà voté (stats exist) */}
            {hasVoted && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-2">
                    <BarChart3 className="mt-1 h-4 w-4 text-zinc-500" />
                    <div>
                      <div className="text-base font-semibold uppercase tracking-[0.12em] text-zinc-500">
                        results so far
                      </div>
                      <div className="mt-1 text-xs text-zinc-600">
                        {stats
                          ? `${stats.totalVotes} ${stats.totalVotes > 1 ? "votes" : "vote"}`
                          : "—"}
                      </div>
                    </div>
                  </div>

                  {!isOwner && (
                    <button
                      onClick={() => addReminder(poll.id, "RESULTS", poll.dateEnd)}
                      className={btnPrimary}
                      type="button"
                    >
                      Set results reminder
                    </button>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  {optionsComputed.map((o) => (
                    <div
                      key={o.index}
                      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-zinc-900">{o.label}</div>
                          <div className="mt-1 text-xs text-zinc-500">Option #{o.index + 1}</div>
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
              </div>
            )}
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}
