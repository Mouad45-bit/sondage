// app/auth/login/page.tsx
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "../../lib/api";
import { setToken } from "../../lib/auth";
import { LogIn, Shield, AlertTriangle } from "lucide-react";

type AuthResponse = { token: string };

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // same design tokens as register/dashboard pages
  const btnPrimary =
    "cursor-pointer inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-70 disabled:cursor-not-allowed";
  const btnGhost =
    "cursor-pointer inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-70 disabled:cursor-not-allowed";
  const inputBase =
    "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200";

  const canSubmit = useMemo(() => {
    if (!username.trim()) return false;
    if (!password) return false;
    return true;
  }, [username, password]);

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
    <div className="max-h-screen bg-zinc-50">
      <div className="flex justify-center mx-auto max-w-6xl px-4 pb-0">
        <div className="w-full max-w-2xl space-y-4">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-left text-2xl font-semibold uppercase tracking-[0.14em] text-zinc-600">
              login
            </div>

            <Link href="/auth/register" className={btnGhost + " h-11 w-full sm:w-auto"}>
              Don&apos;t have an account ?&nbsp;<span className="uppercase">Register</span>
            </Link>
          </div>

          {/* Main card */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <h2 className="text-xl font-semibold text-zinc-950">
                Sign in
              </h2>
            </div>

            {/* Mini info */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white">
                  <Shield className="h-5 w-5 text-zinc-700" />
                </span>
                <div>
                  <div className="text-base font-semibold uppercase tracking-[0.12em] text-zinc-600">
                    access
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">
                    Login to create polls, vote, and view progress.
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="mt-4 grid gap-4">
              <div>
                <label className="text-sm uppercase font-semibold text-zinc-700">
                  Username
                </label>
                <input
                  className={"mt-1 " + inputBase}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label className="text-sm uppercase font-semibold text-zinc-700">
                  Password
                </label>
                <input
                  type="password"
                  className={"mt-1 " + inputBase}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    <div>
                      <div className="font-semibold">Login failed</div>
                      <div className="mt-1">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-3 flex sm:flex-row items-center justify-center">
                <button
                  disabled={loading || !canSubmit}
                  className={btnPrimary + " h-11 w-full sm:w-auto"}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {loading ? "Signing in.." : "Log in"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}