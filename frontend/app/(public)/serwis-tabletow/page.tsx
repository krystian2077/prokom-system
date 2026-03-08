import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Serwis tabletów | PRO-KOM Serwis",
  description: "Naprawa tabletów — wyświetlacz, bateria, gniazdo ładowania.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-prokom-black">Serwis tabletów</h1>
      <p className="mt-4 text-prokom-gray">Naprawiamy tablety wszystkich marek. Diagnoza i wycena bez zobowiązań.</p>
      <Button href="/zgloszenie" size="lg" className="mt-6">Zgłoś naprawę</Button>
    </div>
  );
}
