import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export const metadata = {
  title: "Kontakt | PRO-KOM Serwis",
  description: "Skontaktuj się z PRO-KOM Serwis — telefon, e-mail, adres.",
};

export default function KontaktPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-prokom-black">Kontakt</h1>
      <p className="mt-4 text-prokom-gray">
        Masz pytanie lub chcesz umówić wizytę? Napisz lub zadzwoń.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-gray-100 px-4 py-3">
            <h2 className="font-semibold text-prokom-black">Telefon</h2>
          </CardHeader>
          <CardContent className="p-4">
            <a href="tel:+48123456789" className="text-prokom-accent hover:underline">
              +48 123 456 789
            </a>
            <p className="mt-1 text-sm text-prokom-gray">(podmień na prawdziwy numer)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b border-gray-100 px-4 py-3">
            <h2 className="font-semibold text-prokom-black">E-mail</h2>
          </CardHeader>
          <CardContent className="p-4">
            <a href="mailto:serwis@prokom.pl" className="text-prokom-accent hover:underline">
              serwis@prokom.pl
            </a>
            <p className="mt-1 text-sm text-prokom-gray">(podmień na prawdziwy adres)</p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardHeader className="border-b border-gray-100 px-4 py-3">
            <h2 className="font-semibold text-prokom-black">Adres serwisu</h2>
          </CardHeader>
          <CardContent className="p-4">
            <p>ul. Przykładowa 1</p>
            <p>00-001 Miasto</p>
            <p className="mt-1 text-sm text-prokom-gray">Godziny otwarcia: do uzupełnienia</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <p className="text-prokom-gray">
          Zgłoszenie naprawy możesz też wysłać przez{" "}
          <a href="/zgloszenie" className="text-prokom-accent hover:underline">formularz online</a>.
        </p>
      </div>
    </div>
  );
}
