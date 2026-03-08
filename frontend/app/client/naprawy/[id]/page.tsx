import { ClientNaprawyDetail } from "@/features/client-naprawy/ClientNaprawyDetail";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `Naprawa ${id} | PRO-KOM Serwis`,
    description: "Szczegóły naprawy.",
  };
}

export default async function ClientNaprawyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientNaprawyDetail repairId={id} />;
}
