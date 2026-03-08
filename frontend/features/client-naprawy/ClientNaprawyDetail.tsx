"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

interface RepairDetail {
  id: string;
  repair_number: string;
  status: string;
  status_display: string;
  public_status?: string;
  device_name?: string;
  problem_description?: string;
  created_at: string;
  estimated_completion_date?: string | null;
  quote_sent_at?: string | null;
  is_waiting_for_client_decision?: boolean;
  estimated_cost?: string | null;
}

export function ClientNaprawyDetail({ repairId }: { repairId: string }) {
  const { token } = useAuth();
  const [repair, setRepair] = useState<RepairDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quoteSubmitting, setQuoteSubmitting] = useState<"accept" | "reject" | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const refetchRepair = () => {
    if (!token) return;
    api
      .get<RepairDetail>(`/repairs/${repairId}/`, token)
      .then((r) => setRepair(r as RepairDetail))
      .catch(() => {});
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    api
      .get<RepairDetail>(`/repairs/${repairId}/`, token)
      .then((r) => setRepair(r as RepairDetail))
      .catch((e) => setError(e instanceof Error ? e.message : "Błąd ładowania."))
      .finally(() => setLoading(false));
  }, [token, repairId]);

  const handleQuoteRespond = async (action: "accept" | "reject") => {
    if (!token) return;
    setQuoteError(null);
    setQuoteSubmitting(action);
    try {
      await api.post(`/repairs/${repairId}/quote-respond/`, { action, comment: "" }, token);
      refetchRepair();
    } catch (e) {
      setQuoteError(e instanceof Error ? e.message : "Wystąpił błąd.");
    } finally {
      setQuoteSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <p className="text-prokom-gray">Ładowanie…</p>
      </div>
    );
  }

  if (error || !repair) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <p className="text-red-600">{error || "Nie znaleziono naprawy."}</p>
        <Link href="/client/naprawy" className="mt-4 inline-block text-sm text-prokom-accent hover:underline">
          Wróć do listy napraw
        </Link>
      </div>
    );
  }

  const showQuoteActions = repair.status === "quote_sent" || repair.is_waiting_for_client_decision;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/client/naprawy" className="text-sm text-prokom-accent hover:underline">
        ← Wróć do listy napraw
      </Link>

      <div className="mt-6">
        <h1 className="text-2xl font-bold text-prokom-black">{repair.repair_number}</h1>
        <p className="mt-1 text-prokom-gray">{repair.status_display}</p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="font-semibold text-prokom-black">Szczegóły</h2>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="text-prokom-gray">Urządzenie:</span> {repair.device_name ?? "—"}</p>
          <p><span className="text-prokom-gray">Opis problemu:</span> {repair.problem_description ?? "—"}</p>
          <p><span className="text-prokom-gray">Data przyjęcia:</span> {repair.created_at ? new Date(repair.created_at).toLocaleDateString("pl-PL") : "—"}</p>
          {repair.estimated_completion_date && (
            <p><span className="text-prokom-gray">Szacowany termin:</span> {new Date(repair.estimated_completion_date).toLocaleDateString("pl-PL")}</p>
          )}
          {repair.estimated_cost != null && repair.estimated_cost !== "" && (
            <p><span className="text-prokom-gray">Szacowana kwota:</span> {repair.estimated_cost} zł</p>
          )}
        </CardContent>
      </Card>

      {showQuoteActions && (
        <Card className="mt-6 border-prokom-accent/30">
          <CardHeader>
            <h2 className="font-semibold text-prokom-black">Wycena do zaakceptowania</h2>
            <p className="text-sm text-prokom-gray">Zaakceptuj lub odrzuć wycenę od serwisu.</p>
          </CardHeader>
          <CardContent>
            {quoteError && <p className="mb-2 text-sm text-red-600">{quoteError}</p>}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => handleQuoteRespond("accept")}
                disabled={!!quoteSubmitting}
              >
                {quoteSubmitting === "accept" ? "Wysyłanie…" : "Zaakceptuj wycenę"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuoteRespond("reject")}
                disabled={!!quoteSubmitting}
              >
                {quoteSubmitting === "reject" ? "Wysyłanie…" : "Odrzuć wycenę"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <h2 className="font-semibold text-prokom-black">Wiadomości</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-prokom-gray">
            Historia wiadomości z serwisem — w następnym kroku. Masz pytanie? Skontaktuj się telefonicznie lub e-mailem.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
