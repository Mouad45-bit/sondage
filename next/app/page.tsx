// app/page.tsx

import { ProCard } from "./components/ProCard";

export default function DashboardPage() {
  return (
    <ProCard
      title="Dashboard"
      subtitle="Vue d’ensemble : sondages récents, statut, et activité."
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Contenu à venir…
      </p>
    </ProCard>
  );
}