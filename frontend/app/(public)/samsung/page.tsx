import { SalonPage } from "@/components/tech/catalog/SalonPage";
import { pageMetadata } from "@/lib/tech/seo";

export const metadata = pageMetadata({
  title: "Salon Samsung — Galaxy S, Z, A, Tab i Watch",
  description: "Galaxy S26, składane Galaxy Z, Galaxy A, tablety, zegarki i słuchawki: dobierz model, porównaj i wyślij zapytanie. Odbiór w Rabce-Zdroju lub Zakopanem.",
  path: "/samsung",
});

export default function Page() {
  return <SalonPage brand="samsung" />;
}
