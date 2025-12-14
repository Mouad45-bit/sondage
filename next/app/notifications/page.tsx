// app/notifications/page.tsx

import { AuthGuard } from "../components/AuthGuard";
import { ProCard } from "../components/ProCard";

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <ProCard
      title="Notifications"
      subtitle="Vos alertes et mises à jour récentes."
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Contenu à venir…
        </p>
      </ProCard>
    </AuthGuard>
  );
}