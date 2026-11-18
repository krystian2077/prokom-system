import { SalonPage } from "@/components/tech/catalog/SalonPage";
import { pageMetadata } from "@/lib/tech/seo";

export const metadata = pageMetadata({
  title: "Salon Apple — iPhone, iPad, Mac i Watch",
  description: "iPhone, iPad, MacBook, iMac, Apple Watch i AirPods: dobierz model w 3 pytaniach, porównaj i wyślij zapytanie. Odbiór w Rabce-Zdroju lub Zakopanem.",
  path: "/apple",
});

export default function Page() {
  return <SalonPage brand="apple" />;
}
