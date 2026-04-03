import { ProfileSettingsPage } from "@/components/panel/ProfileSettingsPage";

export const metadata = {
  title: "Mój profil | Panel administratora | PRO-KOM Serwis",
  description: "Zarządzaj danymi administratora i ustawieniami bezpieczeństwa.",
};

export default function AdminProfilePage() {
  return <ProfileSettingsPage panelRole="admin" />;
}
