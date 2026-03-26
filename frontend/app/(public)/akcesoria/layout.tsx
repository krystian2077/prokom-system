import type { ReactNode } from "react";
import { BlogTeaser } from "@/components/blog/BlogTeaser";

export const metadata = {
  title: "Akcesoria GSM — ładowarki, etui, szkła, folie | PRO-KOM Rabka-Zdrój",
  description:
    "Akcesoria GSM dostępne od ręki w Rabce-Zdroju: ładowarki GaN, kable, powerbanki, etui, szkła hartowane, folie Hammer Glass i uchwyty samochodowe. Sklep PRO-KOM, ul. Orkana 16B.",
  alternates: {
    canonical: "https://pro-kom.eu/akcesoria",
  },
  openGraph: {
    title: "Akcesoria GSM — ładowarki, etui, szkła | PRO-KOM Rabka-Zdrój",
    description:
      "Ładowarki GaN, kable, powerbanki, etui i szkła hartowane dostępne od ręki. PRO-KOM, ul. Orkana 16B, Rabka-Zdrój.",
    url: "https://pro-kom.eu/akcesoria",
  },
};

export default function AkcesoriaLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}
      <div className="border-t border-gray-100 bg-white">
        <BlogTeaser
          category="Akcesoria GSM"
          limit={3}
          heading="Poradniki o akcesoriach"
        />
      </div>
    </>
  );
}

