import { Unbounded, Plus_Jakarta_Sans } from "next/font/google";
import { SITE_URL } from "@/lib/site-config";
import { OfertaContent } from "./OfertaContent";
import { BlogTeaser } from "@/components/blog/BlogTeaser";
import "./oferta.css";

const unbounded = Unbounded({ weight: ["400", "700", "900"], subsets: ["latin"], variable: "--font-unbounded" });
const jakarta = Plus_Jakarta_Sans({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-plus-jakarta" });

export const metadata = {
  title: "Oferta — Sklep GSM i sprzęt elektroniczny | PRO-KOM Rabka-Zdrój",
  description:
    "Sklep GSM w Rabce-Zdroju: smartfony Samsung, iPhone, Xiaomi, tablety iPad i Galaxy Tab, laptopy poleasingowe i biznesowe. Certyfikowany partner Amso. ul. Orkana 16B. Akcesoria, szkła, folie i etui dostępne od ręki.",
  alternates: {
    canonical: `${SITE_URL}/oferta`,
  },
  openGraph: {
    title: "Oferta sklep GSM i elektronika | PRO-KOM Rabka-Zdrój",
    description:
      "Smartfony, tablety, laptopy i akcesoria GSM w Rabce-Zdroju. ul. Orkana 16B.",
    url: `${SITE_URL}/oferta`,
  },
};

export default function OfertaPage() {
  return (
    <div className={`${unbounded.variable} ${jakarta.variable}`}>
      <OfertaContent />
      <BlogTeaser
        categories={["Laptopy", "Sprzęt biznesowy", "Poleasing", "Gaming"]}
        heading="Poradniki zakupowe i techniczne"
        limit={3}
      />
    </div>
  );
}
