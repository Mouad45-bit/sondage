// app/auth/login/page.tsx

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { api } from "../../lib/api";
import { setToken } from "../../lib/auth";

type AuthResponse = { token: string };

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api<AuthResponse>("/auth/login", {
        method: "POST",
        auth: false,
        json: { username, password },
      });
      setToken(res.token);
      router.replace(next);
    } catch (err: any) {
      setError(err?.message || "Connexion impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:p-7">
            {/* Header */}
            <div className="text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <span className="text-sm font-semibold text-zinc-900">NS</span>
              </div>

              <h1 className="mt-4 text-lg font-semibold text-zinc-900">
                Connexion
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                Connecte-toi avec ton username.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Username
                </label>
                <input
                  className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Mot de passe
                </label>
                <input
                  type="password"
                  className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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
                className="h-11 w-full rounded-xl bg-zinc-950 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>

              <div className="text-center text-xs text-zinc-500">
                En te connectant, tu accèdes aux actions privées (création, vote,
                avancement).
              </div>
            </form>

            {/* Footer */}
            <div className="mt-6 border-t border-zinc-100 pt-5 text-center">
              <p className="text-sm text-zinc-600">
                Pas de compte ?{" "}
                <Link
                  href="/auth/register"
                  className="font-medium text-zinc-900 hover:underline"
                >
                  Créer un compte
                </Link>
              </p>
            </div>
          </div>

          {/* Bottom small link */}
          <div className="mt-4 text-center text-xs text-zinc-500">
            <Link href="/" className="hover:underline">
              ← Retour au dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
