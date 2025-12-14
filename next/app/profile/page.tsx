// app/profile/page.tsx

import { ProCard } from "../components/ProCard";

export default function ProfilePage() {
  return (
    <ProCard
      title="Profil"
      subtitle="Informations du compte et préférences."
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Contenu à venir…
      </p>
    </ProCard>
  );
}