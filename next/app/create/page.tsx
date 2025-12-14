// app/create/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthGuard } from "@/app/components/AuthGuard";
import { ProCard } from "@/app/components/ProCard";
import { api } from "../lib/api";
import { Plus, Trash2 } from "lucide-react";

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
  return (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toIsoSeconds(datetimeLocal: string) {
  // "YYYY-MM-DDTHH:mm" => "YYYY-MM-DDTHH:mm:00" (LocalDateTime côté backend)
  if (!datetimeLocal) return "";
  return datetimeLocal.length === 16 ? `${datetimeLocal}:00` : datetimeLocal;
}

function nowPlusHoursLocal(h: number) {
  const d = new Date(Date.now() + h * 3600_000);
  // format for input datetime-local: YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CreatePollPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // default: start +1h30, end +2h30 (safe with backend >= +1h)
  const defaultStart = useMemo(() => nowPlusHoursLocal(2), []);
  const defaultEnd = useMemo(() => nowPlusHoursLocal(3), []);

  const [dateStart, setDateStart] = useState(defaultStart);
  const [dateEnd, setDateEnd] = useState(defaultEnd);

  const [options, setOptions] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (title.trim().length < 3) return "Le titre doit contenir au moins 3 caractères.";
    if (!dateStart || !dateEnd) return "dateStart et dateEnd sont obligatoires.";
    if (new Date(toIsoSeconds(dateStart)).getTime() >= new Date(toIsoSeconds(dateEnd)).getTime()) {
      return "dateStart doit être avant dateEnd.";
    }

    // backend: dateStart >= now + 1h
    const minStart = Date.now() + 3600_000;
    if (new Date(toIsoSeconds(dateStart)).getTime() < minStart) {
      return "dateStart doit être au moins 1h à partir de maintenant.";
    }

    const cleaned = options.map((s) => s.trim()).filter((s) => s.length > 0);
    if (cleaned.length < 2) return "Il faut au moins 2 options non vides.";
    if (cleaned.some((s) => s.length > 80)) return "Chaque option doit faire максимум 80 caractères.";

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
      // ✅ requis par DTO (@NotBlank) même si ton service l’ignore
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

  return (
    <AuthGuard>
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-5">
        <ProCard title="Créer un sondage" subtitle="Définis le titre, la période et les options.">
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="text-xs text-zinc-600 dark:text-zinc-400">Titre</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-950"
                placeholder="Ex: Où faire la sortie de classe ?"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-zinc-600 dark:text-zinc-400">Description (optionnel)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 min-h-[90px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-950"
                placeholder="Contexte, règles, etc."
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

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                disabled={loading}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {loading ? "Création…" : "Créer le sondage"}
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