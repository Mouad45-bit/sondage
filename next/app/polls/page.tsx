// app/polls/page.tsx

import { AuthGuard } from "../components/AuthGuard";
import { ProCard } from "../components/ProCard";

export default function MyPollsPage() {
  return (
    <AuthGuard>
      <ProCard
      title="Mes sondages"
      subtitle="Gérer, filtrer et suivre vos sondages."
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Contenu à venir…
        </p>
      </ProCard>
    </AuthGuard>
  );
}