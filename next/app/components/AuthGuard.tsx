// app/components/AuthGuard.tsx

"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "../lib/auth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/auth/login?next=${next}`);
      return;
    }
    setOk(true);
  }, [router, pathname]);

  if (!ok) {
    return (
      <div className="min-h-[60vh] bg-zinc-50">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                  Sécurité
                </div>
                <div className="mt-1 text-sm font-medium text-zinc-900">
                  Vérification de session…
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  Redirection vers la connexion si nécessaire.
                </div>
              </div>

              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
            </div>

            {/* Skeleton */}
            <div className="mt-6 space-y-3">
              <div className="h-3 w-2/3 rounded-full bg-zinc-100" />
              <div className="h-3 w-5/6 rounded-full bg-zinc-100" />
              <div className="h-3 w-1/2 rounded-full bg-zinc-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}