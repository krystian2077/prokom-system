import ProfileSettingsPage from "@/components/panel/ProfileSettingsPage";

export const metadata = {
  title: "Mój profil | PRO-KOM Serwis",
  description: "Zarządzaj danymi konta i bezpieczeństwem panelu.",
};

export default function StaffProfilePage() {
  return <ProfileSettingsPage panelRole="staff" />;
}
