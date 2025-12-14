// app/lib/reminders.ts

export type ReminderKind = "OPENING" | "RESULTS";

export type Reminder = {
  id: string;
  pollId: string;
  kind: ReminderKind;
  atIso: string;
  createdAtIso: string;
  read: boolean;
};

const REMINDERS_KEY = "nosql_reminders";

function uid() {
  return (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function listReminders(): Reminder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    return raw ? (JSON.parse(raw) as Reminder[]) : [];
  } catch {
    return [];
  }
}

export function addReminder(pollId: string, kind: ReminderKind, atIso: string) {
  const existing = listReminders();
  const item: Reminder = {
    id: uid(),
    pollId,
    kind,
    atIso,
    createdAtIso: new Date().toISOString(),
    read: false,
  };
  const next = [item, ...existing];
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(next));
  return item;
}

function saveReminders(next: Reminder[]) {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(next));
}

export function markReminderRead(id: string): Reminder[] {
  const next = listReminders().map((r) => (r.id === id ? { ...r, read: true } : r));
  saveReminders(next);
  return next;
}

export function markAllRemindersRead(): Reminder[] {
  const next = listReminders().map((r) => ({ ...r, read: true }));
  saveReminders(next);
  return next;
}