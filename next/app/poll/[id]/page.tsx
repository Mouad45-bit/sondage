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
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border";
  if (s === "OPEN") return <span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700`}>OPEN</span>;
  if (s === "CLOSED") return <span className={`${base} border-zinc-200 bg-zinc-100 text-zinc-700`}>CLOSED</span>;
  return <span className={`${base} border-amber-200 bg-amber-50 text-amber-700`}>DRAFT</span>;
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
        // ✅ endpoint public, donc auth:false
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
      // ✅ backend: POST /api/polls/{pollId}/votes { optionIndex }
      await api(`/api/polls/${encodeURIComponent(poll.id)}/votes`, {
        method: "POST",
        auth: true,
        json: { optionIndex: selected },
      });

      setHasVotedLocal(true);
      setVoteMsg("Vote enregistré.");
    } catch (e: any) {
      // 409 => déjà voté
      setVoteMsg(e?.message || "Vote impossible.");
    } finally {
      setVoteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
          Chargement…
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || "Sondage introuvable."}
        </div>
      </div>
    );
  }

  const st = String(poll.status).toUpperCase();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-5">
      <ProCard
        title={poll.title}
        subtitle={poll.description || "—"}
        right={
          <div className="flex items-center gap-2">
            <StatusBadge status={st} />
            <button
              onClick={() => setFavorites(toggleFavorite(poll.id))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
              aria-label="Favori"
              title="Favori"
            >
              <Star className={`h-5 w-5 ${isFav ? "fill-zinc-900 text-zinc-900" : "text-zinc-600"}`} />
            </button>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-xs text-zinc-500">Ouverture</div>
            <div className="mt-1 font-medium">{formatDate(poll.dateStart)}</div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-xs text-zinc-500">Fermeture</div>
            <div className="mt-1 font-medium">{formatDate(poll.dateEnd)}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Options</div>
          <ul className="mt-2 space-y-2">
            {poll.options.map((opt, i) => (
              <li
                key={i}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
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
                className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Voir avancement
              </Link>
            )}

            {st === "CLOSED" && (
              <Link
                href={`/poll/${poll.id}/results`}
                className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Voir résultats
              </Link>
            )}

            {st === "DRAFT" && (
              <Link
                href={`/poll/${poll.id}/update`}
                className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
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
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">Participer</div>
                  {hasVotedLocal && (
                    <div className="inline-flex items-center gap-1 text-xs text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Vote fait
                    </div>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  {poll.options.map((opt, i) => (
                    <label
                      key={i}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                    >
                      <input
                        type="radio"
                        name="vote"
                        checked={selected === i}
                        onChange={() => setSelected(i)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>

                {voteMsg && (
                  <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{voteMsg}</div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={submitVote}
                    disabled={voteLoading}
                    className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {voteLoading ? "Envoi…" : "Voter"}
                  </button>

                  <Link
                    href={`/poll/${poll.id}/progress`}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    Voir avancement
                  </Link>

                  <button
                    onClick={() => {
                      if (!uid) return requireLogin(router, `/poll/${poll.id}`);
                      addReminder(poll.id, "RESULTS", poll.dateEnd);
                      setVoteMsg("Rappel résultats enregistré (local).");
                    }}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
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
                  className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Voir résultats
                </Link>
              </div>
            )}

            {st === "DRAFT" && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    addReminder(poll.id, "OPENING", poll.dateStart);
                    setVoteMsg("Rappel ouverture enregistré (local).");
                  }}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                >
                  Fixer rappel ouverture
                </button>
              </div>
            )}
          </div>
        )}
      </ProCard>
    </div>
  );
}