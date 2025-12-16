// app/notifications/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "../components/AuthGuard";
import {
  listReminders,
  markAllRemindersRead,
  markReminderRead,
  type Reminder,
} from "../lib/reminders";
import { api } from "../lib/api";
import {
  Bell,
  CheckCircle2,
  Dot,
  MailOpen,
  Mail,
  ArrowRight,
  CircleX,
} from "lucide-react";

type PollMini = { title: string; description?: string | null };

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function kindLabel(kind: Reminder["kind"]) {
  return kind === "OPENING" ? "Rappel ouverture" : "Rappel résultats";
}

function KindBadge({ kind }: { kind: Reminder["kind"] }) {
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide";
  if (kind === "OPENING") {
    return (
      <span
        className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700`}
      >
        OPENING
      </span>
    );
  }
  return (
    <span className={`${base} border-sky-200 bg-sky-100 text-sky-700`}>
      RESULTS
    </span>
  );
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [pollInfoById, setPollInfoById] = useState<Record<string, PollMini>>(
    {}
  );

  useEffect(() => {
    setItems(listReminders());
  }, []);

  useEffect(() => {
    const uniquePollIds = Array.from(new Set(items.map((x) => x.pollId)));

    // ne fetch que ce qui manque
    const missing = uniquePollIds.filter((pid) => !pollInfoById[pid]);
    if (missing.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        const results = await Promise.allSettled(
          missing.map(async (pid) => {
            const p = await api<{ title: string; description?: string | null }>(
              `/api/polls/${encodeURIComponent(pid)}`,
              { method: "GET", auth: false }
            );
            return { pid, title: p.title, description: p.description ?? null };
          })
        );

        if (cancelled) return;

        setPollInfoById((prev) => {
          const next = { ...prev };
          for (const r of results) {
            if (r.status === "fulfilled") {
              next[r.value.pid] = {
                title: r.value.title,
                description: r.value.description,
              };
            }
          }
          return next;
        });
      } catch {
        // silencieux: reminders restent affichés même si poll fetch échoue
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items, pollInfoById]);

  useEffect(() => {
    let t: any;
    if (toast) t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const unreadCount = useMemo(
    () => items.filter((r) => !r.read).length,
    [items]
  );

  function onMarkRead(id: string) {
    const next = markReminderRead(id);
    setItems(next);
    setToast("Notification marquée comme lue.");
  }

  function onMarkAll() {
    const next = markAllRemindersRead();
    setItems(next);
    setToast("Toutes les notifications sont marquées comme lues.");
  }

  // styles comme Dashboard
  const btnPrimary =
    "cursor-pointer inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-6xl px-4 py-2 space-y-4">
          {/* Header (look dashboard) */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-center md:text-left text-2xl font-semibold uppercase tracking-[0.14em] text-zinc-600">
              notifications
            </div>

            <div className="flex items-center justify-center gap-2 md:justify-end">
              <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                {items.length} total <Dot className="h-4 w-4" /> {unreadCount}{" "}
                unread
              </span>

              <button
                onClick={onMarkAll}
                disabled={items.length === 0 || unreadCount === 0}
                className={btnPrimary}
              >
                <MailOpen className="mr-2 h-4 w-4" />
                Mark all read
              </button>
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {toast}
            </div>
          )}

          {/* Filters-like card (dashboard style) */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">
                  Overview
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Reminders stored locally
                </p>
              </div>

              <div className="flex items-center justify-center md:justify-end">
                <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
                  {items.length === 0
                    ? "No notifications"
                    : `${items.length} displayed`}
                </span>
              </div>
            </div>

            {/* Empty state */}
            {items.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
                Aucune notification.
              </div>
            ) : (
              <section className="grid gap-4">
                {items.map((n) => (
                  <article
                    key={n.id}
                    className={[
                      "h-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md",
                      !n.read ? "ring-1 ring-zinc-100" : "",
                    ].join(" ")}
                  >
                    {/* top row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700">
                            <Bell className="h-5 w-5 text-zinc-600" />
                          </span>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="truncate text-sm font-semibold text-zinc-950">
                                {kindLabel(n.kind)}
                              </div>

                              <KindBadge kind={n.kind} />

                              {!n.read ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                                  <CircleX className="h-4 w-4" />
                                  UNREAD
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                  <CheckCircle2 className="h-4 w-4" />
                                  READ
                                </span>
                              )}
                            </div>

                            <div className="mt-1 text-xs text-zinc-500">
                              Created: {formatDate(n.createdAtIso)}
                            </div>
                          </div>
                        </div>

                        {/* body */}
                        <div className="mt-4 mx-auto w-full">
                          <div className="grid gap-3 md:grid-cols-[minmax(0,420px)_minmax(0,420px)]">
                            {/* Poll info (title + description) */}
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                                Poll
                              </div>

                              <div className="mt-2">
                                <div className="truncate text-sm font-semibold text-zinc-950">
                                  {pollInfoById[n.pollId]?.title ??
                                    "Loading poll…"}
                                </div>

                                <div className="mt-1 line-clamp-2 text-sm text-zinc-600">
                                  {pollInfoById[n.pollId]?.description ?? "—"}
                                </div>
                              </div>
                            </div>

                            {/* Schedule */}
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                                Schedule
                              </div>
                              <div className="mt-2 text-sm text-zinc-700">
                                {n.kind === "OPENING"
                                  ? "Planned opening :"
                                  : "Results after :"}{" "}
                                <span className="font-semibold text-zinc-950">
                                  {formatDate(n.atIso)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* right actions */}
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/poll/${n.pollId}`}
                          className="cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                          aria-label="Open poll"
                          title="Open poll"
                        >
                          <ArrowRight className="h-5 w-5 text-zinc-600" />
                        </Link>

                        <button
                          onClick={() => onMarkRead(n.id)}
                          disabled={n.read}
                          className="cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-sm hover:bg-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed"
                          aria-label="Mark as read"
                          title="Mark as read"
                        >
                          <Mail className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}
