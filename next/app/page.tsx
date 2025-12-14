// app/page.tsx

import { AuthGuard } from "./components/AuthGuard";
import { ProCard } from "./components/ProCard";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <ProCard
        title="Dashboard"
        subtitle="Vue d’ensemble : sondages récents, statut, et activité."
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Contenu à venir…
        </p>
      </ProCard>
    </AuthGuard>
  );
}