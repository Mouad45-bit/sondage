// app/notifications/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "../components/AuthGuard";
import { ProCard } from "../components/ProCard";
import {
  listReminders,
  markAllRemindersRead,
  markReminderRead,
  type Reminder,
} from "../lib/reminders";
import { Bell, CheckCircle2 } from "lucide-react";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function kindLabel(kind: Reminder["kind"]) {
  return kind === "OPENING" ? "Rappel ouverture" : "Rappel résultats";
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setItems(listReminders());
  }, []);

  useEffect(() => {
    let t: any;
    if (toast) t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const unreadCount = useMemo(() => items.filter((r) => !r.read).length, [items]);

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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-6xl px-4 py-6 md:py-8 space-y-5">
          <ProCard
            title="Notifications"
            subtitle={`${items.length} notification(s) • ${unreadCount} non lue(s)`}
            right={
              <button
                onClick={onMarkAll}
                disabled={items.length === 0 || unreadCount === 0}
                className="inline-flex items-center justify-center rounded-xl bg-zinc-950 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Tout marquer comme lu
              </button>
            }
          >
            {toast && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {toast}
              </div>
            )}

            {items.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
                Aucune notification.
              </div>
            ) : (
              <section className="space-y-3">
                {items.map((n) => (
                  <article
                    key={n.id}
                    className={[
                      "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm",
                      !n.read ? "ring-1 ring-zinc-100" : "",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      {/* Left */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50">
                            <Bell className="h-4 w-4 text-zinc-700" />
                          </span>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="truncate text-sm font-semibold text-zinc-900">
                                {kindLabel(n.kind)}
                              </div>

                              {!n.read ? (
                                <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                                  Non lue
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Lue
                                </span>
                              )}
                            </div>

                            <div className="mt-1 text-xs text-zinc-500">
                              Créée le {formatDate(n.createdAtIso)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-3 text-sm text-zinc-700">
                          {n.kind === "OPENING"
                            ? "Ouverture prévue :"
                            : "Résultats disponibles après :"}{" "}
                          <span className="font-semibold text-zinc-900">
                            {formatDate(n.atIso)}
                          </span>
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex flex-col gap-2 sm:flex-row md:flex-col md:items-end">
                        <Link
                          href={`/poll/${n.pollId}`}
                          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                        >
                          Ouvrir
                        </Link>

                        <button
                          onClick={() => onMarkRead(n.id)}
                          disabled={n.read}
                          className="inline-flex items-center justify-center rounded-xl bg-zinc-950 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Marquer comme lue
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </ProCard>
        </main>
      </div>
    </AuthGuard>
  );
}