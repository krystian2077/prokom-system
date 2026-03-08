"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import type { RepairListItem } from "@/types/repair-client";

export function ClientNaprawyList() {
  const { token } = useAuth();
  const [list, setList] = useState<RepairListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<{ results: RepairListItem[] } | RepairListItem[]>("/repairs/", token)
      .then((res) => {
        if (!cancelled) {
          const arr = res && typeof res === "object" && "results" in res ? (res as { results: RepairListItem[] }).results : Array.isArray(res) ? res : [];
          setList(arr);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Błąd ładowania.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <p className="text-prokom-gray">Ładowanie…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <p className="text-red-600">{error}</p>
        <Button href="/client/naprawy" variant="outline" size="sm" className="mt-4">
          Odśwież
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-prokom-black">Moje naprawy</h1>
      <p className="mt-2 text-prokom-gray">
        Lista Twoich zgłoszeń. Kliknij, aby zobaczyć szczegóły.
      </p>

      {list.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="p-6">
            <p className="text-prokom-gray">Brak napraw do wyświetlenia.</p>
            <Button href="/zgloszenie" variant="outline" size="sm" className="mt-4">
              Zgłoś naprawę
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-prokom-black">
                  Numer
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-prokom-black">
                  Urządzenie
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-prokom-black">
                  Status
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-prokom-black">
                  Data przyjęcia
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-prokom-black">
                  Akcja
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 font-medium">{r.repair_number}</td>
                  <td className="border border-gray-200 px-3 py-2">{r.device_name}</td>
                  <td className="border border-gray-200 px-3 py-2">{r.status_display}</td>
                  <td className="border border-gray-200 px-3 py-2 text-sm text-prokom-gray">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString("pl-PL") : "—"}
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    <Link
                      href={`/client/naprawy/${r.id}`}
                      className="text-sm text-prokom-accent hover:underline"
                    >
                      Szczegóły
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <Button href="/zgloszenie" variant="outline" size="sm">
          Zgłoś naprawę
        </Button>
      </div>
    </div>
  );
}
