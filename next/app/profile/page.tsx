// app/profile/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { AuthGuard } from "../components/AuthGuard";
import { ProCard } from "../components/ProCard";
import { logout } from "../lib/logout";

export default function ProfilePage() {
  const router = useRouter();

  async function onLogout() {
    await logout();
    router.replace("/auth/login");
  }

  return (
    <AuthGuard>
      <ProCard
        title="Profil"
        subtitle="Informations utilisateur."
        right={
          <button
            onClick={onLogout}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
          >
            Déconnexion
          </button>
        }
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          (On affichera le username après.)
        </p>
      </ProCard>
    </AuthGuard>
  );
}
