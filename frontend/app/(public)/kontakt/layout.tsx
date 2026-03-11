import { ReactNode } from "react";

export const metadata = {
  title: "Kontakt | PRO-KOM Serwis",
  description:
    "Skontaktuj się z PRO-KOM Serwis — telefon, e-mail, adres. Rabka-Zdrój.",
};

export default function KontaktLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-full w-full">{children}</div>;
}
