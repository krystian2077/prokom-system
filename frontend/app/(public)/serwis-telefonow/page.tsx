import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export const metadata = {
  title: "Serwis telefonów | PRO-KOM Serwis",
  description: "Naprawa telefonów — wymiana wyświetlacza, baterii, gniazd, odzyskiwanie danych.",
};

export default function SerwisTelefonowPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <section className="border-b border-gray-100 pb-8">
        <h1 className="text-3xl font-bold text-prokom-black">Serwis telefonów</h1>
        <p className="mt-4 text-prokom-gray">
          Naprawiamy smartfony wszystkich marek: wymiana wyświetlacza, baterii, gniazd ładowania,
          naprawa po zalaniu, odzyskiwanie danych. Diagnoza i wycena bez zobowiązań.
        </p>
        <Button href="/zgloszenie" size="lg" className="mt-6">
          Zgłoś naprawę telefonu
        </Button>
      </section>
      <section className="py-8">
        <h2 className="text-xl font-semibold text-prokom-black">Typowe usterki</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card><CardContent className="p-4">Pęknięty / rozbity wyświetlacz</CardContent></Card>
          <Card><CardContent className="p-4">Wymiana baterii</CardContent></Card>
          <Card><CardContent className="p-4">Uszkodzone gniazdo ładowania</CardContent></Card>
          <Card><CardContent className="p-4">Naprawa po zalaniu</CardContent></Card>
          <Card><CardContent className="p-4">Problem z mikrofonem / głośnikiem</CardContent></Card>
          <Card><CardContent className="p-4">Odzyskiwanie danych</CardContent></Card>
        </div>
      </section>
      <section className="border-t border-gray-100 py-8">
        <h2 className="text-xl font-semibold text-prokom-black">Jak wygląda proces?</h2>
        <p className="mt-2 text-prokom-gray">
          Zgłaszasz usterkę (osobiście lub przez formularz) → diagnoza → wycena → Twoja decyzja →
          naprawa → odbiór. W razie wysyłki — podaj adres; przygotujemy paczkę i etykietę.
        </p>
        <Button href="/zgloszenie" variant="outline" size="md" className="mt-4">
          Zgłoś naprawę
        </Button>
      </section>
    </div>
  );
}
