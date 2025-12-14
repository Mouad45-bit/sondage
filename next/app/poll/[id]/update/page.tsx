// app/poll/[id]/update/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/app/components/AuthGuard";
import { ProCard } from "@/app/components/ProCard";
import { api } from "../../../lib/api";
import { getUidFromToken } from "../../../lib/jwt";
import { Plus, Save, Trash2 } from "lucide-react";

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
  // ISO -> "YYYY-MM-DDTHH:mm" pour input datetime-local
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoSeconds(datetimeLocal: string) {
  // "YYYY-MM-DDTHH:mm" => "YYYY-MM-DDTHH:mm:00" (LocalDateTime backend)
  if (!datetimeLocal) return "";
  return datetimeLocal.length === 16 ? `${datetimeLocal}:00` : datetimeLocal;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export default function PollUpdatePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const uid = useMemo(() => getUidFromToken(), []);
  const [poll, setPoll] = useState<PollResponse | null>(null);

  // form
  const [description, setDescription] = useState("");
  const [dateStart, setDateStart] = useState(""); // datetime-local
  const [dateEnd, setDateEnd] = useState("");     // datetime-local
  const [options, setOptions] = useState<string[]>(["", ""]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const isOwner = useMemo(() => (poll ? uid === poll.authorId : false), [poll, uid]);
  const status = useMemo(() => String(poll?.status || "").toUpperCase(), [poll]);

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

        // init form from poll
        setDescription(p.description || "");
        setDateStart(toDatetimeLocalValue(p.dateStart));
        setDateEnd(toDatetimeLocalValue(p.dateEnd));
        setOptions((p.options && p.options.length >= 2) ? p.options : ["", ""]);
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
    if (status !== "DRAFT") return "Modification autorisée uniquement pour les sondages DRAFT.";

    // dates
    if (!dateStart || !dateEnd) return "dateStart et dateEnd sont obligatoires.";
    const startMs = new Date(toIsoSeconds(dateStart)).getTime();
    const endMs = new Date(toIsoSeconds(dateEnd)).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return "Dates invalides.";
    if (startMs >= endMs) return "dateStart doit être avant dateEnd.";

    // backend: dateStart >= now + 1h
    const minStart = Date.now() + 3600_000;
    if (startMs < minStart) return "dateStart doit être au moins 1h à partir de maintenant.";

    // options
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
    if (localErr) {
      setError(localErr);
      return;
    }

    setSaving(true);
    try {
      // ✅ UpdatePollRequest : description, dateStart, dateEnd, options
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
      // retour détails après petit délai
      setTimeout(() => router.replace(`/poll/${id}`), 500);
    } catch (e: any) {
      setError(e?.message || "Échec de la modification.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
            Chargement…
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!poll) {
    return (
      <AuthGuard>
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error || "Sondage introuvable."}
          </div>
          <Link
            href="/polls"
            className="inline-flex rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
          >
            Retour à mes sondages
          </Link>
        </div>
      </AuthGuard>
    );
  }

  // blocage UI si pas owner / pas draft
  if (!isOwner || status !== "DRAFT") {
    return (
      <AuthGuard>
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            {!isOwner
              ? "Accès refusé : vous n’êtes pas propriétaire de ce sondage."
              : "Modification autorisée uniquement pour les sondages DRAFT."}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/poll/${poll.id}`}
              className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Retour détails
            </Link>
            <Link
              href="/polls"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
            >
              Mes sondages
            </Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-5">
        <ProCard
          title="Modifier le sondage"
          subtitle={`${poll.title} • DRAFT`}
          right={
            <Link
              href={`/poll/${poll.id}`}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
            >
              Retour détails
            </Link>
          }
        >
          <div className="text-xs text-zinc-500">
            Ouverture actuelle : {formatDate(poll.dateStart)} • Fermeture actuelle : {formatDate(poll.dateEnd)}
          </div>

          <form onSubmit={onSave} className="mt-5 space-y-5">
            {/* Description */}
            <div>
              <label className="text-xs text-zinc-600 dark:text-zinc-400">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 min-h-[90px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-950"
                placeholder="(Optionnel)"
              />
            </div>

            {/* Dates */}
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-zinc-600 dark:text-zinc-400">Ouverture (dateStart)</label>
                <input
                  type="datetime-local"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  required
                />
                <p className="mt-1 text-xs text-zinc-500">Doit être ≥ maintenant + 1h.</p>
              </div>

              <div>
                <label className="text-xs text-zinc-600 dark:text-zinc-400">Fermeture (dateEnd)</label>
                <input
                  type="datetime-local"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  required
                />
              </div>
            </div>

            {/* Options */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-600 dark:text-zinc-400">Options (min 2)</label>
                <button
                  type="button"
                  onClick={addOption}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      className="h-10 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-950"
                      placeholder={`Option ${i + 1}`}
                      maxLength={80}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      disabled={options.length <= 2}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                      title="Supprimer"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-zinc-500">Chaque option ≤ 80 caractères.</p>
            </div>

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

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              >
                Annuler
              </button>
            </div>
          </form>
        </ProCard>
      </div>
    </AuthGuard>
  );
}