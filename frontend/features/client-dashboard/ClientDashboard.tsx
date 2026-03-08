"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import type { MySummaryResponse } from "@/types/repair-client";

export function ClientDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<MySummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<MySummaryResponse>("/repairs/my-summary/", token)
      .then((res) => {
        if (!cancelled) setData(res as MySummaryResponse);
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
        <Button href="/client/dashboard" variant="outline" size="sm" className="mt-4">
          Odśwież
        </Button>
      </div>
    );
  }

  const by_status = data?.by_status ?? {};
  const activeCount =
    (data?.count ?? 0) -
    (by_status["picked_up"] ?? 0) -
    (by_status["shipped"] ?? 0) -
    (by_status["delivered"] ?? 0) -
    (by_status["cancelled"] ?? 0) -
    (by_status["unrepairable"] ?? 0) -
    (by_status["abandoned"] ?? 0);
  const readyForPickup = by_status["ready_for_pickup"] ?? 0;
  const waitingForDecision = by_status["quote_sent"] ?? 0;
  const latest = data?.latest_repairs ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-prokom-black">Dashboard</h1>
      <p className="mt-2 text-prokom-gray">
        Podsumowanie Twoich napraw.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-prokom-gray">Aktywne naprawy</p>
            <p className="text-2xl font-semibold text-prokom-black">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-prokom-gray">Gotowe do odbioru</p>
            <p className="text-2xl font-semibold text-prokom-black">{readyForPickup}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-prokom-gray">Oczekujące na decyzję</p>
            <p className="text-2xl font-semibold text-prokom-black">{waitingForDecision}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-prokom-gray">Wszystkie naprawy</p>
            <p className="text-2xl font-semibold text-prokom-black">{data?.count ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-prokom-black">Ostatnie naprawy</h2>
        {latest.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="p-6">
              <p className="text-prokom-gray">Brak napraw. Zgłoś usterkę, aby rozpocząć.</p>
              <Button href="/zgloszenie" variant="outline" size="sm" className="mt-4">
                Zgłoś naprawę
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="mt-4 space-y-2">
            {latest.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/client/naprawy/${r.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <span className="font-medium text-prokom-black">{r.repair_number}</span>
                  <span className="ml-2 text-prokom-gray">— {r.device_name}</span>
                  <span className="ml-2 text-sm text-prokom-gray">({r.status_display})</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex flex-wrap gap-4">
          <Button href="/client/naprawy" variant="outline" size="sm">
            Wszystkie naprawy
          </Button>
          <Button href="/client/profil" variant="outline" size="sm">
            Profil
          </Button>
          <Button href="/zgloszenie" variant="ghost" size="sm">
            Zgłoś naprawę
          </Button>
        </div>
      </div>
    </div>
  );
}
