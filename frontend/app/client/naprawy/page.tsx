import { ClientNaprawyList } from "@/features/client-naprawy/ClientNaprawyList";

export const metadata = {
  title: "Moje naprawy",
  description: "Lista Twoich napraw.",
};

export default function ClientNaprawyPage() {
  return <ClientNaprawyList />;
}
