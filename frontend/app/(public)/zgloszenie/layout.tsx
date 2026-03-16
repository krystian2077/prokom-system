import type { ReactNode } from "react";

export const metadata = {
  title: "Zgłoś naprawę | PRO-KOM Serwis",
  description: "Wypełnij formularz zgłoszenia naprawy w 5 krokach. Skontaktujemy się w celu potwierdzenia.",
};

export default function ZgloszenieLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
