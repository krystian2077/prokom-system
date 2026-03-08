import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Serwis laptopów | PRO-KOM Serwis",
  description: "Naprawa laptopów — ekran, klawiatura, zasilanie, czyszczenie.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-prokom-black">Serwis laptopów</h1>
      <p className="mt-4 text-prokom-gray">Naprawiamy laptopy — wymiana matrycy, klawiatury, czyszczenie, diagnostyka.</p>
      <Button href="/zgloszenie" size="lg" className="mt-6">Zgłoś naprawę</Button>
    </div>
  );
}
