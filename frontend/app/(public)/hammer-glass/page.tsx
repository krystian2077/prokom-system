import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export const metadata = {
  title: "Hammer Glass | PRO-KOM Serwis",
  description: "Szkła i folie Hammer Glass — montaż od ręki w serwisie. Dobierz folię do urządzenia.",
};

export default function HammerGlassPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <section className="rounded-lg bg-gradient-to-br from-prokom-gray to-prokom-black py-12 text-white">
        <h1 className="text-3xl font-bold sm:text-4xl">Hammer Glass</h1>
        <p className="mt-4 max-w-xl text-gray-200">
          Szkła i folie premium — lepsza ochrona niż zwykłe szkło. Montaż od ręki w serwisie.
          Dobierz folię do swojego urządzenia.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Button href="/zgloszenie" size="lg" className="bg-prokom-accent text-white hover:bg-red-700">
            Zgłoś naprawę i dopytaj o Hammer Glass
          </Button>
          <Button href="/kontakt" variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
            Kontakt
          </Button>
        </div>
      </section>
      <section className="py-10">
        <h2 className="text-2xl font-semibold text-prokom-black">Dlaczego Hammer Glass?</h2>
        <p className="mt-2 text-prokom-gray">
          Wyższa odporność na zarysowania i uderzenia, czytelny ekran, łatwiejsze utrzymanie czystości.
          Oferujemy m.in. Active Shield, Cristal Shield, Prime Protector, wersje Matt i Privacy.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["Active Shield", "Cristal Shield", "Prime Protector", "Watch Armour", "Tablet Armour"].map((name) => (
            <Card key={name}><CardContent className="p-4 font-medium">{name}</CardContent></Card>
          ))}
        </div>
      </section>
      <section className="border-t border-gray-100 py-8">
        <h2 className="text-xl font-semibold text-prokom-black">Montaż w serwisie</h2>
        <p className="mt-2 text-prokom-gray">
          Możesz przyjść z urządzeniem — dobierzemy folię i zamontujemy od ręki. Ceny od … zł w zależności od modelu.
        </p>
        <Button href="/kontakt" variant="outline" size="md" className="mt-4">
          Zapytaj o cenę i dostępność
        </Button>
      </section>
    </div>
  );
}
