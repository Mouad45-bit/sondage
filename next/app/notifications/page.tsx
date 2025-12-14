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
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-5">
        <ProCard
          title="Notifications"
          subtitle={`${items.length} notification(s) • ${unreadCount} non lue(s)`}
          right={
            <button
              onClick={onMarkAll}
              disabled={items.length === 0 || unreadCount === 0}
              className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              Tout marquer comme lu
            </button>
          }
        >
          {toast && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {toast}
            </div>
          )}

          {items.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
              Aucune notification.
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {items.map((n) => (
                <div
                  key={n.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-zinc-500" />
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {kindLabel(n.kind)}
                        </div>

                        {!n.read ? (
                          <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                            Non lue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            Lue
                          </span>
                        )}
                      </div>

                      <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {n.kind === "OPENING" ? "Ouverture prévue :" : "Résultats disponibles après :"}{" "}
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {formatDate(n.atIso)}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-zinc-500">
                        Créée le {formatDate(n.createdAtIso)}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/poll/${n.pollId}`}
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                      >
                        Ouvrir
                      </Link>

                      <button
                        onClick={() => onMarkRead(n.id)}
                        disabled={n.read}
                        className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                      >
                        Marquer comme lue
                      </button>
                    </div>
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