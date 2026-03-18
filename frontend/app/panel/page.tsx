import { redirect } from "next/navigation";

export default function PanelRootPage() {
  // Domyślnie przenosimy do dashboardu pracownika.
  redirect("/panel/dashboard");
}

