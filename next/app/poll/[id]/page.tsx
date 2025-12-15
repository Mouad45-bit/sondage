// app/poll/[id]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { getUidFromToken } from "../../lib/jwt";
import { addReminder } from "../../lib/reminders";
import { getFavorites, toggleFavorite } from "../../lib/favorites";
import { ArrowLeft, CheckCircle2, Star } from "lucide-react";

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

function requireLogin(router: ReturnType<typeof useRouter>, nextPath: string) {
  const next = encodeURIComponent(nextPath);
  router.push(`/auth/login?next=${next}`);
}

export default function PollDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [poll, setPoll] = useState<PollResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [favorites, setFavorites] = useState<string[]>([]);
  const isFav = useMemo(() => favorites.includes(id), [favorites, id]);

  const uid = useMemo(() => getUidFromToken(), []);
  const isOwner = useMemo(() => (poll ? uid === poll.authorId : false), [poll, uid]);

  // vote
  const [selected, setSelected] = useState<number | null>(null);
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteMsg, setVoteMsg] = useState<string | null>(null);
  const [hasVotedLocal, setHasVotedLocal] = useState(false);

  // ----- styles (mêmes que Dashboard) -----
  const btnPrimary =
    "cursor-pointer inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold !text-white shadow-sm hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60";
  const btnGhost =
    "cursor-pointer inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60";

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api<PollResponse>(`/api/polls/${encodeURIComponent(id)}`, {
          method: "GET",
          auth: false,
        });
        setPoll(data);
      } catch (e: any) {
        setError(e?.message || "Impossible de charger ce sondage.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function submitVote() {
    if (!poll) return;
    setVoteMsg(null);

    if (!uid) {
      requireLogin(router, `/poll/${poll.id}`);
      return;
    }
    if (selected === null) {
      setVoteMsg("Choisis une option.");
      return;
    }

    setVoteLoading(true);
    try {
      await api(`/api/polls/${encodeURIComponent(poll.id)}/votes`, {
        method: "POST",
        auth: true,
        json: { optionIndex: selected },
      });

      setHasVotedLocal(true);
      setVoteMsg("Vote enregistré.");
    } catch (e: any) {
      setVoteMsg(e?.message || "Vote impossible.");
    } finally {
      setVoteLoading(false);
    }
  }

  // ----- Loading / Error (même look Dashboard) -----
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-6xl px-4 py-2 space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  poll details
                </div>
                <div className="mt-1 text-sm text-zinc-600">Chargement…</div>
              </div>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="h-20 rounded-2xl bg-zinc-100" />
              <div className="h-20 rounded-2xl bg-zinc-100" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-10 rounded-xl bg-zinc-100" />
              <div className="h-10 rounded-xl bg-zinc-100" />
              <div className="h-10 rounded-xl bg-zinc-100" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-6xl px-4 py-2 space-y-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
            {error || "Sondage introuvable."}
          </div>
        </main>
      </div>
    );
  }

  const st = String(poll.status).toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-6xl px-4 py-2 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex items-center md:flex-1">
            <Link href="/" className={btnGhost} aria-label="Back" title="Back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
            </Link>
          </div>
          
          <div className="text-center text-2xl font-semibold uppercase tracking-[0.14em] text-zinc-600">
            poll details
          </div>
          
          <div className="flex items-center justify-center gap-2 md:flex-1 md:justify-end">
            <StatusBadge status={st} />
            <button
            onClick={() => setFavorites(toggleFavorite(poll.id))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
            aria-label="Favori"
            title="Favori"
            >
              <Star className={`h-5 w-5 ${isFav ? "fill-zinc-950 text-zinc-950" : "text-zinc-500"}`} />
            </button>
          </div>
        </div>

        {/* Details card */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-3">
            <h1 className="text-xl truncate uppercase font-semibold text-zinc-950">{poll.title}</h1>
            <p className="mt-1 text-base text-zinc-600">{poll.description || "—"}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Dates */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-600">
                period
              </div>
              <div className="mt-3 grid gap-3">
                <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                  <div className="text-[11px] text-zinc-500">Opening</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {formatDate(poll.dateStart)}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                  <div className="text-[11px] text-zinc-500">Closing</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {formatDate(poll.dateEnd)}
                  </div>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    options
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{poll.options.length}
                    { poll.options.length > 1 ? "propositions" : "proposition" }
                  </p>
                </div>
              </div>

              <ul className="mt-3 space-y-2">
                {poll.options.map((opt, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
                  >
                    {opt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Actions card */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-3">
            <h2 className="text-xl font-semibold text-zinc-950">Actions</h2>
            <p className="mt-1 text-base text-zinc-600">{isOwner ? "Owner" : "Visitor"}</p>
          </div>

          {/* Owner */}
          {isOwner && (
            <div className="flex flex-wrap gap-2">
              {st === "OPEN" && (
                <Link href={`/poll/${poll.id}/progress`} className={btnPrimary}>
                  See progress
                </Link>
              )}
              {st === "CLOSED" && (
                <Link href={`/poll/${poll.id}/results`} className={btnPrimary}>
                  See results
                </Link>
              )}
              {st === "DRAFT" && (
                <Link href={`/poll/${poll.id}/update`} className={btnPrimary}>
                  Update poll
                </Link>
              )}
            </div>
          )}

          {/* Non-owner */}
          {!isOwner && (
            <div className="space-y-4">
              {st === "OPEN" && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-600">
                        participation
                      </div>
                      <div className="mt-1 text-sm font-semibold text-zinc-900">
                        Choose an option and validate your vote
                      </div>
                    </div>

                    {hasVotedLocal && (
                      <div className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Vote done
                      </div>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    {poll.options.map((opt, i) => {
                      const active = selected === i;
                      return (
                        <label
                          key={i}
                          className={[
                            "flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2 text-sm transition",
                            active
                              ? "border-zinc-950 ring-2 ring-zinc-300"
                              : "border-zinc-200 hover:bg-zinc-50",
                          ].join(" ")}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="vote"
                              checked={active}
                              onChange={() => setSelected(i)}
                              className="h-4 w-4 accent-zinc-950"
                            />
                            <span className="text-zinc-800">{opt}</span>
                          </div>

                          <span
                            className={["h-2 w-2 rounded-full", active ? "bg-zinc-950" : "bg-zinc-200"].join(" ")}
                            aria-hidden
                          />
                        </label>
                      );
                    })}
                  </div>

                  {voteMsg && (
                    <div className="mt-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                      {voteMsg}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={submitVote} disabled={voteLoading} className={btnPrimary}>
                      {voteLoading ? "Sending.." : "Vote"}
                    </button>

                    <Link href={`/poll/${poll.id}/progress`} className={btnGhost}>
                      See progress
                    </Link>

                    <button
                      onClick={() => {
                        if (!uid) return requireLogin(router, `/poll/${poll.id}`);
                        addReminder(poll.id, "RESULTS", poll.dateEnd);
                        setVoteMsg("Results reminder set (local).");
                      }}
                      className={btnGhost}
                    >
                      Fix results reminder
                    </button>
                  </div>
                </div>
              )}

              {st === "CLOSED" && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                  <div className="text-sm font-semibold text-zinc-900">Draft poll</div>
                  <p className="mt-1 text-sm text-zinc-600">
                    You can set a reminder to be notified when it's opened.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/poll/${poll.id}/results`} className={btnPrimary}>
                    See results
                    </Link>
                  </div>
                </div>
              )}

              {st === "DRAFT" && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                  <div className="text-sm font-semibold text-zinc-900">Draft poll</div>
                  <p className="mt-1 text-sm text-zinc-600">
                    You can set a reminder to be notified when it's opened.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        addReminder(poll.id, "OPENING", poll.dateStart);
                        setVoteMsg("Opening reminder set (local).");
                      }}
                      className={btnGhost}
                    >
                      Set opening reminder
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}