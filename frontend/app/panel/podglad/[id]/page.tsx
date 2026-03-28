import { redirect } from "next/navigation";

/** Stary adres podglądu tylko do odczytu — każdy pracownik ma pełny widok w /panel/naprawy/. */
export default function PodgladNaprawyRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/panel/naprawy/${encodeURIComponent(params.id)}`);
}
