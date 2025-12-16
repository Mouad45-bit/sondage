"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/app/components/AuthGuard";
import { api } from "../../../lib/api";
import { getUidFromToken } from "../../../lib/jwt";
import {
  ArrowLeft,
  Calendar,
  ListChecks,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

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

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function toIsoSeconds(datetimeLocal: string) {
  if (!datetimeLocal) return "";
  return datetimeLocal.length === 16 ? `${datetimeLocal}:00` : datetimeLocal;
}

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

export default function PollUpdatePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const uid = useMemo(() => getUidFromToken(), []);
  const [poll, setPoll] = useState<PollResponse | null>(null);

  // champs éditables
  const [description, setDescription] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const isOwner = useMemo(
    () => (poll ? uid === poll.authorId : false),
    [poll, uid]
  );
  const status = useMemo(() => String(poll?.status || "").toUpperCase(), [poll]);

  // ----- styles: EXACTEMENT comme Create -----
  const inputBase =
    "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-zinc-300";
  const textareaBase =
    "min-h-[60px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-zinc-300";

  const btnPrimary =
    "cursor-pointer inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold !text-white shadow-sm hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60";
  const btnGhost =
    "cursor-pointer inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-60";

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setOkMsg(null);

      try {
        const p = await api<PollResponse>(`/api/polls/${encodeURIComponent(id)}`, {
          method: "GET",
          auth: false,
        });
        setPoll(p);

        setDescription(p.description || "");
        setDateStart(toDatetimeLocalValue(p.dateStart));
        setDateEnd(toDatetimeLocalValue(p.dateEnd));
        setOptions(p.options && p.options.length >= 2 ? p.options : ["", ""]);
      } catch (e: any) {
        setError(e?.message || "Impossible de charger le sondage.");
        setPoll(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

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
    if (!poll) return "Sondage introuvable.";
    if (!isOwner) return "Accès refusé : vous n’êtes pas propriétaire.";
    if (status !== "DRAFT")
      return "Modification autorisée uniquement pour les sondages DRAFT.";

    if (!dateStart || !dateEnd) return "dateStart et dateEnd sont obligatoires.";

    const startMs = new Date(toIsoSeconds(dateStart)).getTime();
    const endMs = new Date(toIsoSeconds(dateEnd)).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return "Dates invalides.";
    if (startMs >= endMs) return "dateStart doit être avant dateEnd.";

    const minStart = Date.now() + 3600_000;
    if (startMs < minStart) return "dateStart doit être au moins 1h à partir de maintenant.";

    const cleaned = options.map((s) => s.trim()).filter((s) => s.length > 0);
    if (cleaned.length < 2) return "Il faut au moins 2 options non vides.";
    if (cleaned.some((s) => s.length > 80)) return "Chaque option doit faire максимум 80 caractères.";

    return null;
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);

    const localErr = validateLocal();
    if (localErr) return setError(localErr);

    setSaving(true);
    try {
      const payload = {
        description: description.trim() ? description.trim() : null,
        dateStart: toIsoSeconds(dateStart),
        dateEnd: toIsoSeconds(dateEnd),
        options: options.map((s) => s.trim()).filter((s) => s.length > 0),
      };

      await api(`/api/polls/${encodeURIComponent(id)}`, {
        method: "PATCH",
        auth: true,
        json: payload,
      });

      setOkMsg("Modifications enregistrées.");
      setTimeout(() => router.replace(`/poll/${id}`), 500);
    } catch (e: any) {
      setError(e?.message || "Échec de la modification.");
    } finally {
      setSaving(false);
    }
  }

  const cleanedCount = useMemo(
    () => options.map((s) => s.trim()).filter((s) => s.length > 0).length,
    [options]
  );

  // ---- states (on garde tes screens, mais on peut garder simple)
  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-zinc-50">
          <main className="mx-auto max-w-6xl px-4 py-2 space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    update poll
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">Chargement…</div>
                </div>
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
              </div>
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  if (!poll) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-zinc-50">
          <main className="mx-auto max-w-6xl px-4 py-2 space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              {error || "Sondage introuvable."}
            </div>
            <Link href="/polls" className={btnGhost}>
              Back to polls
            </Link>
          </main>
        </div>
      </AuthGuard>
    );
  }

  if (!isOwner || status !== "DRAFT") {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-zinc-50">
          <main className="mx-auto max-w-6xl px-4 py-2 space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
              {!isOwner
                ? "Accès refusé : vous n’êtes pas propriétaire de ce sondage."
                : "Modification autorisée uniquement pour les sondages DRAFT."}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/poll/${poll.id}`} className={btnPrimary}>
                Back to details
              </Link>
              <Link href="/polls" className={btnGhost}>
                My polls
              </Link>
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-6xl px-4 py-2 space-y-4">
          {/* Header: EXACTEMENT comme Create */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center md:flex-1">
              <button type="button" onClick={() => router.back()} className={btnGhost}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </button>
            </div>

            <div className="text-center text-2xl font-semibold uppercase tracking-[0.14em] text-zinc-600">
              update poll
            </div>

            <div className="flex md:flex-1 md:justify-end" />
          </div>

          {/* Card unique (même look que Create) */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <form onSubmit={onSave} className="space-y-4">
              {/* Title + Description : même grille que Create */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="text-base font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Title
                  </div>
                  <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2 text-sm text-zinc-900">
                    {poll.title}
                  </div>
                  <div className="flex justify-end mr-2">
                    <p className="mt-2 text-xs text-zinc-500">
                      Title is not editable
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
                    placeholder="(Optional)"
                  />
                  <div className="flex justify-end mr-2">
                    <p className="mt-1 text-xs text-zinc-500">Optional</p>
                  </div>
                </div>
              </div>

              {/* Dates : même bloc que Create */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 h-4 w-4 text-zinc-500" />
                  <div>
                    <div className="text-base font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Period
                    </div>
                    <div className="mt-1 text-xs text-zinc-600">
                      dateStart must be &gt; now + 1 hour
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Current: {formatDate(poll.dateStart)} → {formatDate(poll.dateEnd)}
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

              {/* Options : même bloc que Create */}
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

                  <button type="button" onClick={addOption} className={btnGhost}>
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

              {/* Toasts */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
              {okMsg && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {okMsg}
                </div>
              )}

              {/* Footer right badges like Create */}
              <div className="flex md:flex-1 md:justify-end">
                <div className="flex items-center gap-2">
                  <StatusBadge status={status} />
                  <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                    {cleanedCount} {cleanedCount <= 1 ? "option" : "options"}
                  </span>
                </div>
              </div>

              {/* Actions like Create */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button disabled={saving} className={btnPrimary + " h-11 px-5"}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving.." : "Save changes"}
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