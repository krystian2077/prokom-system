import { Unbounded, Plus_Jakarta_Sans } from "next/font/google";
import { OfertaContent } from "./OfertaContent";
import "./oferta.css";

const unbounded = Unbounded({ weight: ["400", "700", "900"], subsets: ["latin"], variable: "--font-unbounded" });
const jakarta = Plus_Jakarta_Sans({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-plus-jakarta" });

export const metadata = {
  title: "Oferta | Sklep i sprzęt | PRO-KOM Rabka-Zdrój",
  description:
    "Najnowsze smartfony Samsung, iPhone, Xiaomi, tablety iPad i Galaxy Tab, laptopy poleasingowe i biznesowe, komputery, drukarki, gaming. Certyfikowany partner Amso. ul. Orkana 16B, Rabka-Zdrój.",
};

export default function OfertaPage() {
  return (
    <div className={`${unbounded.variable} ${jakarta.variable}`}>
      <OfertaContent />
    </div>
  );
}
