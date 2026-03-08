import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Odzyskiwanie danych | PRO-KOM Serwis",
  description: "Odzyskiwanie danych z dysków, telefonów, nośników.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-prokom-black">Odzyskiwanie danych</h1>
      <p className="mt-4 text-prokom-gray">Odzyskiwanie danych z dysków, telefonów, kart pamięci. Oferta indywidualna po wstępnej diagnozie.</p>
      <Button href="/zgloszenie" size="lg" className="mt-6">Zgłoś zapytanie</Button>
    </div>
  );
}
