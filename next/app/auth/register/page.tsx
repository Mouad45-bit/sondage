// app/auth/register/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "../../lib/api";
import { setToken } from "../../lib/auth";
import { UserPlus, ArrowLeft, Dot, Shield, AlertTriangle } from "lucide-react";

type AuthResponse = { token: string };

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // same design tokens as dashboard pages
  const btnPrimary =
    "cursor-pointer inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-70 disabled:cursor-not-allowed";
  const btnGhost =
    "cursor-pointer inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-70 disabled:cursor-not-allowed";
  const inputBase =
    "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200";

  const canSubmit = useMemo(() => {
    if (!username.trim()) return false;
    if (!password) return false;
    if (!confirm) return false;
    if (password !== confirm) return false;
    return true;
  }, [username, password, confirm]);

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
    <div className="max-h-screen bg-zinc-50">
      <div className="flex justify-center mx-auto max-w-6xl px-4 pb-0">
        <div className="w-full max-w-2xl space-y-4">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-left text-2xl font-semibold uppercase tracking-[0.14em] text-zinc-600">
              register
            </div>
            <Link
              href="/auth/login"
              className={btnGhost + " h-11 w-full sm:w-auto"}
            >
              Already have an account ?&nbsp;<span className="uppercase">Log in</span>
            </Link>
          </div>

          {/* Main card (like Filters card) */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <h2 className="text-xl font-semibold text-zinc-950">
                Create an account
              </h2>
            </div>

            {/* Mini info (like your dashboard sub-blocks) */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white">
                  <Shield className="h-5 w-5 text-zinc-700" />
                </span>
                <div>
                  <div className="text-base font-semibold uppercase tracking-[0.12em] text-zinc-600">
                    account
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">
                    Your account is used to create polls, vote, and view
                    progress.
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="mt-4 grid gap-4">
              <div className="flex flex-col gap-1">
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
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm uppercase font-semibold text-zinc-700">
                  Confirm password
                </label>
                <input
                  type="password"
                  className={"mt-1 " + inputBase}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              {/* Hint box (same visual language) */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  rules
                </div>
                <div className="mt-2 text-sm text-zinc-600">
                  Passwords must match before creation.
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    <div>
                      <div className="font-semibold">
                        Inscription impossible
                      </div>
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
                  <UserPlus className="mr-2 h-4 w-4" />
                  {loading ? "Creating.." : "Create an account"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
