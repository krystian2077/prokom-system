import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Serwis konsol | PRO-KOM Serwis",
  description: "Naprawa konsol do gier.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-prokom-black">Serwis konsol</h1>
      <p className="mt-4 text-prokom-gray">Naprawa konsol — PlayStation, Xbox i inne.</p>
      <Button href="/zgloszenie" size="lg" className="mt-6">Zgłoś naprawę</Button>
    </div>
  );
}
