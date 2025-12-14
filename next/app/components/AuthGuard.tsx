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
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
          Vérification…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}