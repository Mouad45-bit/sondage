// app/create/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthGuard } from "@/app/components/AuthGuard";
import { api } from "../lib/api";
import { Plus, Trash2, ArrowLeft, Calendar, ListChecks } from "lucide-react";

type PollStatus = "DRAFT" | "OPEN" | "CLOSED";

type PollResponse = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  dateStart: string;
  dateEnd: string;
  options: string[];
  authorId: string;
};

function genId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toIsoSeconds(datetimeLocal: string) {
  if (!datetimeLocal) return "";
  return datetimeLocal.length === 16 ? `${datetimeLocal}:00` : datetimeLocal;
}

function nowPlusHoursLocal(h: number) {
  const d = new Date(Date.now() + h * 3600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide";
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

export default function CreatePollPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const defaultStart = useMemo(() => nowPlusHoursLocal(2), []);
  const defaultEnd = useMemo(() => nowPlusHoursLocal(3), []);

  const [dateStart, setDateStart] = useState(defaultStart);
  const [dateEnd, setDateEnd] = useState(defaultEnd);

  const [options, setOptions] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewStatus = useMemo<PollStatus>(() => {
    const start = new Date(toIsoSeconds(dateStart)).getTime();
    const end = new Date(toIsoSeconds(dateEnd)).getTime();
    const now = Date.now();

    // si dates invalides ou start >= end => on reste en DRAFT (preview)
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end)
      return "DRAFT";

    if (now < start) return "DRAFT";
    if (now > end) return "CLOSED";
    return "OPEN";
  }, [dateStart, dateEnd]);

  // ----- styles (comme Dashboard) -----
  const inputBase =
    "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-zinc-300";
  const textareaBase =
    "min-h-[60px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-zinc-300";

  const btnPrimary =
    "cursor-pointer inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold !text-white shadow-sm hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60";
  const btnGhost =
    "cursor-pointer inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60";

  function updateOption(i: number, value: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }

  function addOption() {
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(i: number) {
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function validateLocal() {
    if (title.trim().length < 3)
      return "Le titre doit contenir au moins 3 caractères.";
    if (!dateStart || !dateEnd)
      return "dateStart et dateEnd sont obligatoires.";
    if (
      new Date(toIsoSeconds(dateStart)).getTime() >=
      new Date(toIsoSeconds(dateEnd)).getTime()
    ) {
      return "dateStart doit être avant dateEnd.";
    }

    const minStart = Date.now() + 3600_000;
    if (new Date(toIsoSeconds(dateStart)).getTime() < minStart) {
      return "dateStart doit être au moins 1h à partir de maintenant.";
    }

    const cleaned = options.map((s) => s.trim()).filter((s) => s.length > 0);
    if (cleaned.length < 2) return "Il faut au moins 2 options non vides.";
    if (cleaned.some((s) => s.length > 80))
      return "Chaque option doit faire максимум 80 caractères.";

    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const localErr = validateLocal();
    if (localErr) {
      setError(localErr);
      return;
    }

    const payload = {
      id: genId(),
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      dateStart: toIsoSeconds(dateStart),
      dateEnd: toIsoSeconds(dateEnd),
      options: options.map((s) => s.trim()).filter((s) => s.length > 0),
    };

    setLoading(true);
    try {
      const created = await api<PollResponse>("/api/polls", {
        method: "POST",
        auth: true,
        json: payload,
      });

      router.replace(`/poll/${created.id}`);
    } catch (err: any) {
      setError(err?.message || "Création impossible.");
    } finally {
      setLoading(false);
    }
  }

  const cleanedCount = useMemo(
    () => options.map((s) => s.trim()).filter((s) => s.length > 0).length,
    [options]
  );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-6xl px-4 py-2 space-y-4">
          {/* Header (dashboard style) */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center md:flex-1">
              <button
                type="button"
                onClick={() => router.back()}
                className={btnGhost}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </button>
            </div>

            <div className="text-center text-2xl font-semibold uppercase tracking-[0.14em] text-zinc-600">
              create poll
            </div>

            <div className="flex md:flex-1 md:justify-end" />
          </div>

          {/* Form card */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Title + Description (dashboard-like blocks) */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="text-base font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Title
                  </div>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={"mt-2 " + inputBase}
                    placeholder="Example: Where to hold the class trip?"
                    required
                  />
                  <div className="flex justify-end mr-2">
                    <p className="mt-2 text-xs text-zinc-500">
                      Minimum 3 characters
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="text-base font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Description
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={"mt-2 " + textareaBase}
                    placeholder="Context, rules, etc."
                  />
                  <div className="flex justify-end mr-2">
                    <p className="mt-1 text-xs text-zinc-500">Optional</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 h-4 w-4 text-zinc-500" />
                  <div>
                    <div className="text-base font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Period
                    </div>
                    <div className="mt-1 text-xs text-zinc-600">
                      The opening must be &gt; now + 1 hour
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-zinc-700">
                      Opening
                    </label>
                    <input
                      type="datetime-local"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      className={"mt-1 " + inputBase}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-zinc-700">
                      Closing
                    </label>
                    <input
                      type="datetime-local"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className={"mt-1 " + inputBase}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-2">
                    <ListChecks className="mt-0.5 h-4 w-4 text-zinc-500" />
                    <div>
                      <div className="text-base font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        Options
                      </div>
                      <div className="mt-1 text-xs text-zinc-600">
                        Minimum 2 · each option &lt; 80 characters.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addOption}
                    className={btnGhost}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add option
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        className={"flex-1 " + inputBase}
                        placeholder={`Option ${i + 1}`}
                        maxLength={80}
                      />

                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        disabled={options.length <= 2}
                        className="cursor-pointer inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Remove"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex md:flex-1 md:justify-end">
                <div className="flex items-center gap-2">
                  <StatusBadge status={previewStatus} />
                  <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                    {cleanedCount}{" "}
                    {cleanedCount === 1 || cleanedCount === 0
                      ? "option"
                      : "options"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  disabled={loading}
                  className={btnPrimary + " h-11 px-5"}
                >
                  {loading ? "Creating.." : "Create poll"}
                </button>

                <button
                  type="button"
                  onClick={() => router.back()}
                  className={btnGhost + " h-11 px-5"}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}
