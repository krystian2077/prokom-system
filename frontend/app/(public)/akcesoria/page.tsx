import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export const metadata = {
  title: "Akcesoria GSM | PRO-KOM Serwis",
  description: "Ładowarki, kable, powerbanki, etui, uchwyty, słuchawki — dostępne od ręki w serwisie.",
};

const categories = [
  "Ładowarki",
  "Ładowarki GaN",
  "Kable",
  "Powerbanki",
  "Etui",
  "Szkła i folie",
  "Uchwyty",
  "Słuchawki",
  "Przejściówki",
  "Stacje ładowania",
];

export default function AkcesoriaPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <section className="border-b border-gray-100 pb-8">
        <h1 className="text-3xl font-bold text-prokom-black">Akcesoria GSM</h1>
        <p className="mt-4 text-prokom-gray">
          W serwisie dostępne od ręki: ładowarki, kable, powerbanki, etui, uchwyty, słuchawki.
          Główne marki, konkurencyjne ceny. Możesz dobrać akcesoria przy zgłoszeniu naprawy.
        </p>
        <Button href="/kontakt" size="lg" className="mt-6">
          Zapytaj o dostępność
        </Button>
      </section>
      <section className="py-8">
        <h2 className="text-xl font-semibold text-prokom-black">Kategorie</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat}><CardContent className="p-4">{cat}</CardContent></Card>
          ))}
        </div>
      </section>
      <section className="border-t border-gray-100 py-8">
        <p className="text-prokom-gray">
          Przy naprawie możemy zaproponować kabel, ładowarkę lub etui — dopasowane do Twojego urządzenia.
          Zaznacz w formularzu zgłoszenia opcję „Dobierzcie mi akcesoria”.
        </p>
        <Button href="/zgloszenie" variant="outline" size="md" className="mt-4">
          Zgłoś naprawę i dopytaj o akcesoria
        </Button>
      </section>
    </div>
  );
}
