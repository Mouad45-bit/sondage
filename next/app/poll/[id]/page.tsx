// app/poll/[id]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { getUidFromToken } from "../../lib/jwt";
import { addReminder } from "../../lib/reminders";
import { getFavorites, toggleFavorite } from "../../lib/favorites";
import { ArrowLeft, CheckCircle2, Star, Trash2 } from "lucide-react";

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
    "h-6 inline-flex items-center rounded-full border px-2 py-0.5 text-sm font-semibold tracking-wide";
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

function requireLogin(router: ReturnType<typeof useRouter>, nextPath: string) {
  const next = encodeURIComponent(nextPath);
  router.push(`/auth/login?next=${next}`);
}

/** ✅ Texte “Actions” selon le statut + type user */
function getActionCopy(st: string, isOwner: boolean) {
  const status = st.toUpperCase();

  if (isOwner) {
    if (status === "OPEN")
      return {
        title: "Opened poll",
        desc: "You can consult the live progress. Results will be available once the poll is closed.",
      };
    if (status === "CLOSED")
      return {
        title: "Closed poll",
        desc: "You can consult the final results. This poll is finished and can no longer receive votes.",
      };
    return {
      title: "Draft poll",
      desc: "You can update this draft before opening. You can also cancel it if you no longer need it.",
    };
  }

  // Visitor
  if (status === "OPEN")
    return {
      title: "Opened poll",
      desc: "You can consult the progress or set a reminder to be notified when it's closed.",
    };
  if (status === "CLOSED")
    return {
      title: "Closed poll",
      desc: "You can consult the final results. This poll is finished and can no longer receive votes.",
    };
  return {
    title: "Draft poll",
    desc: "You can set a reminder to be notified when it's opened.",
  };
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
  const isOwner = useMemo(
    () => (poll ? uid === poll.authorId : false),
    [poll, uid]
  );

  // vote
  const [selected, setSelected] = useState<number | null>(null);
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteMsg, setVoteMsg] = useState<string | null>(null);
  const [hasVotedLocal, setHasVotedLocal] = useState(false);

  // cancel (owner draft)
  const [cancelLoading, setCancelLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ----- styles (mêmes que Dashboard) -----
  const btnPrimary =
    "cursor-pointer inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2 text-base font-semibold !text-white shadow-sm hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60";
  const btnGhost =
    "cursor-pointer inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60";
  const btnDanger =
    "cursor-pointer inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 disabled:opacity-60";

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  useEffect(() => {
    let t: any;
    if (toast) t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api<PollResponse>(
          `/api/polls/${encodeURIComponent(id)}`,
          { method: "GET", auth: false }
        );
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
        // @ts-ignore
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

  async function cancelDraftPoll() {
    if (!poll) return;

    if (!uid) {
      requireLogin(router, `/poll/${poll.id}`);
      return;
    }

    const ok = window.confirm(
      `Cancel this DRAFT poll?\n\n"${poll.title}"\n\nThis will permanently delete it.`
    );
    if (!ok) return;

    setCancelLoading(true);
    setError(null);

    try {
      await api<void>(`/api/polls/${encodeURIComponent(poll.id)}`, {
        method: "DELETE",
        auth: true,
      });

      setToast("Poll cancelled (deleted).");
      router.push("/polls");
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la suppression.");
    } finally {
      setCancelLoading(false);
    }
  }

  const st = String(poll?.status).toUpperCase();
  const canVoteInline = st === "OPEN" && !isOwner;

  const actionsCopy = useMemo(() => getActionCopy(st, isOwner), [st, isOwner]);

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

          <div className="flex md:flex-1 md:justify-end" />
        </div>

        {toast && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {toast}
          </div>
        )}

        {/* Details card */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl truncate uppercase font-semibold text-zinc-950">
              {poll.title}
            </h1>
            <div className="flex gap-3 items-center">
              <StatusBadge status={st} />
              <button
                onClick={() => setFavorites(toggleFavorite(poll.id))}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                aria-label="Favori"
                title="Favori"
                type="button"
              >
                <Star
                  className={`h-5 w-5 ${
                    isFav ? "fill-zinc-950 text-zinc-950" : "text-zinc-500"
                  }`}
                />
              </button>
            </div>
          </div>

          <p className="mb-3 text-lg text-zinc-600">
            {poll.description || "—"}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Dates */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
              <div className="text-base font-semibold uppercase tracking-[0.12em] text-zinc-600">
                period
              </div>
              <div className="mt-3 grid gap-3">
                <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                  <div className="text-sm text-zinc-500">Opening</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {formatDate(poll.dateStart)}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                  <div className="text-sm text-zinc-500">Closing</div>
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
                  <div className="text-base font-semibold uppercase tracking-[0.12em] text-zinc-600">
                    options
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">
                    {poll.options.length}{" "}
                    {poll.options.length > 1 ? "propositions" : "proposition"}
                  </p>
                </div>

                {canVoteInline && hasVotedLocal && (
                  <div className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Vote done
                  </div>
                )}
              </div>

              {canVoteInline ? (
                <>
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
                            className={[
                              "h-2 w-2 rounded-full",
                              active ? "bg-zinc-950" : "bg-zinc-200",
                            ].join(" ")}
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

                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={submitVote}
                      disabled={voteLoading}
                      className={btnPrimary}
                      type="button"
                    >
                      {voteLoading ? "Sending.." : "Vote"}
                    </button>
                  </div>
                </>
              ) : (
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
              )}
            </div>
          </div>
        </section>

        {/* Actions card */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-3">
            <h2 className="text-xl font-semibold text-zinc-950">Actions</h2>
            <p className="mt-1 text-base text-zinc-600">
              {isOwner ? "Owner" : "Visitor"}
            </p>
          </div>

          {/* ✅ Description dynamique (owner/visitor + status) */}
          <div className="mb-4 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
            <div className="text-sm font-semibold text-zinc-900">
              {actionsCopy.title}
            </div>
            <p className="mt-1 text-sm text-zinc-600">{actionsCopy.desc}</p>
          </div>

          {/* Owner buttons */}
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
                <>
                  <Link href={`/poll/${poll.id}/update`} className={btnPrimary}>
                    Update poll
                  </Link>

                  <button
                    type="button"
                    onClick={cancelDraftPoll}
                    disabled={cancelLoading}
                    className={btnDanger}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {cancelLoading ? "Cancelling.." : "Cancel poll"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Visitor buttons */}
          {!isOwner && (
            <div className="flex flex-wrap gap-2">
              {st === "OPEN" && (
                <>
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
                    type="button"
                  >
                    Fix results reminder
                  </button>
                </>
              )}

              {st === "CLOSED" && (
                <Link href={`/poll/${poll.id}/results`} className={btnPrimary}>
                  See results
                </Link>
              )}

              {st === "DRAFT" && (
                <button
                  onClick={() => {
                    addReminder(poll.id, "OPENING", poll.dateStart);
                    setVoteMsg("Opening reminder set (local).");
                  }}
                  className={btnGhost}
                  type="button"
                >
                  Set opening reminder
                </button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
