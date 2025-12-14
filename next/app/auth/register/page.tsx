// app/auth/register/page.tsx

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../lib/api";
import { setToken } from "../../lib/auth";

type AuthResponse = { token: string };

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await api<AuthResponse>("/auth/register", {
        method: "POST",
        auth: false,
        json: { username, password },
      });

      setToken(res.token);
      router.replace("/");
    } catch (err: any) {
      setError(err?.message || "Inscription impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
        <h1 className="text-lg font-semibold">Créer un compte</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Username + mot de passe.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <label className="text-xs text-zinc-600 dark:text-zinc-400">Username</label>
            <input
              className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-950"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="text-xs text-zinc-600 dark:text-zinc-400">Mot de passe</label>
            <input
              type="password"
              className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-950"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <label className="text-xs text-zinc-600 dark:text-zinc-400">Confirmer</label>
            <input
              type="password"
              className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-950"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="h-10 w-full rounded-xl bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? "Création..." : "Créer le compte"}
          </button>
        </form>

        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Déjà un compte ?{" "}
          <Link href="/auth/login" className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}