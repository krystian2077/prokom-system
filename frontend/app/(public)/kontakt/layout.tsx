import { ReactNode } from "react";

export const metadata = {
  title: "Kontakt — PRO-KOM Serwis | ul. Orkana 16B, Rabka-Zdrój",
  description:
    "Skontaktuj się z PRO-KOM Serwis w Rabce-Zdroju. Adres: ul. Orkana 16B, 34-700 Rabka-Zdrój. Tel: 883 200 151. Pon–Pt 9–17, Sob 9–14. Naprawa telefonów, akcesoria GSM.",
  alternates: {
    canonical: "https://pro-kom.eu/kontakt",
  },
};

export default function KontaktLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-full w-full">{children}</div>;
}
