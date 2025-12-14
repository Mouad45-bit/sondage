// app/poll/[id]/page.tsx

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProCard } from "@/app/components/ProCard";
import { api } from "../../lib/api";
import { getUidFromToken } from "../../lib/jwt";
import { addReminder } from "../../lib/reminders";
import { getFavorites, toggleFavorite } from "../../lib/favorites";
import { CheckCircle2, Star } from "lucide-react";

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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Sondage
                </div>
                <div className="mt-1 text-sm font-medium text-zinc-900">Chargement…</div>
              </div>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
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
        <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error || "Sondage introuvable."}
          </div>
        </main>
      </div>
    );
  }

  const st = String(poll.status).toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8 space-y-5">
        {/* DETAILS */}
        <ProCard
          title={poll.title}
          subtitle={poll.description || "—"}
          right={
            <div className="flex items-center gap-2">
              <StatusBadge status={st} />
              <button
                onClick={() => setFavorites(toggleFavorite(poll.id))}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                aria-label="Favori"
                title="Favori"
              >
                <Star
                  className={`h-5 w-5 ${
                    isFav ? "fill-zinc-900 text-zinc-900" : "text-zinc-600"
                  }`}
                />
              </button>
            </div>
          }
        >
          {/* Dates */}
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Période
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-100 bg-white px-3 py-2">
                <div className="text-[11px] text-zinc-500">Ouverture</div>
                <div className="mt-1 text-sm font-medium text-zinc-900">
                  {formatDate(poll.dateStart)}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-100 bg-white px-3 py-2">
                <div className="text-[11px] text-zinc-500">Fermeture</div>
                <div className="mt-1 text-sm font-medium text-zinc-900">
                  {formatDate(poll.dateEnd)}
                </div>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Options
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {poll.options.length} proposition(s)
                </p>
              </div>
            </div>

            <ul className="mt-3 space-y-2">
              {poll.options.map((opt, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-zinc-100 bg-white px-3 py-2 text-sm text-zinc-700"
                >
                  {opt}
                </li>
              ))}
            </ul>
          </div>
        </ProCard>

        {/* ACTIONS */}
        <ProCard title="Actions" subtitle={isOwner ? "Propriétaire" : "Visiteur"}>
          {/* Owner */}
          {isOwner && (
            <div className="flex flex-wrap gap-2">
              {st === "OPEN" && (
                <Link
                  href={`/poll/${poll.id}/progress`}
                  className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
                >
                  Voir avancement
                </Link>
              )}

              {st === "CLOSED" && (
                <Link
                  href={`/poll/${poll.id}/results`}
                  className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
                >
                  Voir résultats
                </Link>
              )}

              {st === "DRAFT" && (
                <Link
                  href={`/poll/${poll.id}/update`}
                  className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
                >
                  Apporter modification
                </Link>
              )}
            </div>
          )}

          {/* Non-owner */}
          {!isOwner && (
            <div className="space-y-4">
              {st === "OPEN" && (
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        Participation
                      </div>
                      <div className="mt-1 text-sm font-medium text-zinc-900">
                        Choisis une option et valide ton vote
                      </div>
                    </div>

                    {hasVotedLocal && (
                      <div className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Vote fait
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
                              ? "border-zinc-900 ring-2 ring-zinc-200"
                              : "border-zinc-100 hover:bg-zinc-50",
                          ].join(" ")}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="vote"
                              checked={active}
                              onChange={() => setSelected(i)}
                              className="h-4 w-4 accent-zinc-900"
                            />
                            <span className="text-zinc-800">{opt}</span>
                          </div>

                          <span
                            className={[
                              "h-2 w-2 rounded-full",
                              active ? "bg-zinc-900" : "bg-zinc-200",
                            ].join(" ")}
                            aria-hidden
                          />
                        </label>
                      );
                    })}
                  </div>

                  {voteMsg && (
                    <div className="mt-3 text-sm text-zinc-600">{voteMsg}</div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={submitVote}
                      disabled={voteLoading}
                      className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60"
                    >
                      {voteLoading ? "Envoi…" : "Voter"}
                    </button>

                    <Link
                      href={`/poll/${poll.id}/progress`}
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                    >
                      Voir avancement
                    </Link>

                    <button
                      onClick={() => {
                        if (!uid) return requireLogin(router, `/poll/${poll.id}`);
                        addReminder(poll.id, "RESULTS", poll.dateEnd);
                        setVoteMsg("Rappel résultats enregistré (local).");
                      }}
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                    >
                      Fixer rappel résultats
                    </button>
                  </div>
                </div>
              )}

              {st === "CLOSED" && (
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/poll/${poll.id}/results`}
                    className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
                  >
                    Voir résultats
                  </Link>
                </div>
              )}

              {st === "DRAFT" && (
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                  <div className="text-sm font-medium text-zinc-900">Sondage en brouillon</div>
                  <p className="mt-1 text-sm text-zinc-600">
                    Tu peux enregistrer un rappel pour être notifié à l’ouverture.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        addReminder(poll.id, "OPENING", poll.dateStart);
                        setVoteMsg("Rappel ouverture enregistré (local).");
                      }}
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                    >
                      Fixer rappel ouverture
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </ProCard>
      </main>
    </div>
  );
}