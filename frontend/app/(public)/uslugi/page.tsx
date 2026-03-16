import { Unbounded, Plus_Jakarta_Sans } from "next/font/google";
import { UslugiContent } from "./UslugiContent";

const unbounded = Unbounded({ weight: ["700", "900"], subsets: ["latin"], variable: "--font-unbounded" });
const jakarta = Plus_Jakarta_Sans({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-plus-jakarta" });

export const metadata = {
  title: "Usługi napraw | Serwis elektroniki | PRO-KOM",
  description:
    "Usługi serwisowe — naprawa telefonów, laptopów, tabletów, drukarek i konsol. Wymiana wyświetlaczy, baterii, diagnostyka. Diagnoza tego samego dnia, gwarancja.",
};

export default function UslugiPage() {
  return (
    <div className={`${unbounded.variable} ${jakarta.variable}`}>
      <UslugiContent />
    </div>
  );
}
