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

export default function PollUpdatePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const uid = useMemo(() => getUidFromToken(), []);
  const [poll, setPoll] = useState<PollResponse | null>(null);

  const [description, setDescription] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
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
    if (status !== "DRAFT") return "Modification autorisée uniquement pour les sondages DRAFT.";

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
    if (localErr) {
      setError(localErr);
      return;
    }

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

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-zinc-50">
          <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Modification
                  </div>
                  <div className="mt-1 text-sm font-medium text-zinc-900">Chargement…</div>
                </div>
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
              </div>
              <div className="mt-6 space-y-3">
                <div className="h-3 w-2/3 rounded-full bg-zinc-100" />
                <div className="h-10 w-full rounded-xl bg-zinc-100" />
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="h-10 rounded-xl bg-zinc-100" />
                  <div className="h-10 rounded-xl bg-zinc-100" />
                </div>
                <div className="h-10 w-full rounded-xl bg-zinc-100" />
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
          <main className="mx-auto max-w-6xl px-4 py-6 md:py-8 space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              {error || "Sondage introuvable."}
            </div>
            <Link
              href="/polls"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              Retour à mes sondages
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
          <main className="mx-auto max-w-6xl px-4 py-6 md:py-8 space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
              {!isOwner
                ? "Accès refusé : vous n’êtes pas propriétaire de ce sondage."
                : "Modification autorisée uniquement pour les sondages DRAFT."}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/poll/${poll.id}`}
                className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
              >
                Retour détails
              </Link>
              <Link
                href="/polls"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
              >
                Mes sondages
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
        <main className="mx-auto max-w-6xl px-4 py-6 md:py-8 space-y-5">
          <ProCard
            title="Modifier le sondage"
            subtitle={`${poll.title} • DRAFT`}
            right={
              <Link
                href={`/poll/${poll.id}`}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
              >
                Retour détails
              </Link>
            }
          >
            <div className="mt-1 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Informations actuelles
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <div className="rounded-xl border border-zinc-100 bg-white px-3 py-2">
                  <div className="text-[11px] text-zinc-500">Ouverture</div>
                  <div className="text-sm font-medium text-zinc-900">{formatDate(poll.dateStart)}</div>
                </div>
                <div className="rounded-xl border border-zinc-100 bg-white px-3 py-2">
                  <div className="text-[11px] text-zinc-500">Fermeture</div>
                  <div className="text-sm font-medium text-zinc-900">{formatDate(poll.dateEnd)}</div>
                </div>
              </div>
            </div>

            <form onSubmit={onSave} className="mt-5 space-y-5">
              {/* Description */}
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <div className="mb-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Description
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">Optionnel, visible sur la page du sondage.</p>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[110px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
                  placeholder="(Optionnel)"
                />
              </div>

              {/* Dates */}
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <div className="mb-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Période
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">dateStart doit être ≥ maintenant + 1h.</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-zinc-600">Ouverture (dateStart)</label>
                    <input
                      type="datetime-local"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-600">Fermeture (dateEnd)</label>
                    <input
                      type="datetime-local"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Options
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">Minimum 2 • Chaque option ≤ 80 caractères.</p>
                  </div>

                  <button
                    type="button"
                    onClick={addOption}
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        className="h-10 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
                        placeholder={`Option ${i + 1}`}
                        maxLength={80}
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        disabled={options.length <= 2}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-40"
                        title="Supprimer"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}
              {okMsg && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  {okMsg}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>

                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          </ProCard>
        </main>
      </div>
    </AuthGuard>
  );
}
