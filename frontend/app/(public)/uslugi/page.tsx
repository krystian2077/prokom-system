import { Unbounded, Plus_Jakarta_Sans } from "next/font/google";
import { SITE_URL } from "@/lib/site-config";
import { UslugiContent } from "./UslugiContent";
import { BlogTeaser } from "@/components/blog/BlogTeaser";

const unbounded = Unbounded({ weight: ["700", "900"], subsets: ["latin"], variable: "--font-unbounded" });
const jakarta = Plus_Jakarta_Sans({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-plus-jakarta" });

export const metadata = {
  title: "Serwis telefonów i elektroniki — Usługi napraw | PRO-KOM Rabka-Zdrój",
  description:
    "Naprawa telefonów, laptopów, tabletów i smartwatchy w Rabce-Zdroju. Wymiana ekranu, baterii, gniazda ładowania, diagnostyka. Bezpłatna wycena. Obsługujemy klientów z Rabki-Zdroju, Mszany Dolnej, Jordanowa i okolic.",
  alternates: {
    canonical: `${SITE_URL}/uslugi`,
  },
  openGraph: {
    title: "Serwis telefonów i elektroniki | PRO-KOM Rabka-Zdrój",
    description:
      "Naprawa telefonów, laptopów, tabletów w Rabce-Zdroju. Bezpłatna diagnoza, szybka realizacja.",
    url: `${SITE_URL}/uslugi`,
  },
};

export default function UslugiPage() {
  return (
    <div className={`${unbounded.variable} ${jakarta.variable}`}>
      <UslugiContent />
      <div className="border-t border-gray-100">
        <BlogTeaser
          category="Naprawa telefonów"
          limit={3}
          heading="Poradniki serwisowe"
        />
      </div>
    </div>
  );
}
