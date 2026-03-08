import { Suspense } from "react";
import { SubmissionForm } from "@/features/zgloszenie/SubmissionForm";

export const metadata = {
  title: "Zgłoś naprawę | PRO-KOM Serwis",
  description: "Wypełnij formularz zgłoszenia naprawy. Skontaktujemy się w celu potwierdzenia.",
};

export default function ZgloszeniePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-prokom-black sm:text-3xl">
        Zgłoś naprawę online
      </h1>
      <p className="mt-2 text-prokom-gray">
        Wypełnij kolejne kroki. Po wysłaniu skontaktujemy się w celu potwierdzenia lub po diagnozie.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="animate-pulse rounded-xl bg-gray-100 h-96" />}>
          <SubmissionForm />
        </Suspense>
      </div>
    </div>
  );
}
