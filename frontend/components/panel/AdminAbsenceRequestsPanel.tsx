"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X, RefreshCw, CalendarClock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useStore } from "@/store";
import type { TeamAbsenceRequest } from "@/types/staff";

function fmtDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function AdminAbsenceRequestsPanel() {
  const { token, user } = useAuth();
  const addToast = useStore((s) => s.addToast);
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<TeamAbsenceRequest[]>([]);

  const load = useCallback(async () => {
    if (!token || !isAdmin) return;
    setLoading(true);
    try {
      const rows = await api.get<TeamAbsenceRequest[]>("/availability/requests/?status=pending", token);
      setPending(Array.isArray(rows) ? rows : []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać zgłoszeń.";
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, addToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (requestId: string, action: "approve" | "reject") => {
    if (!token) return;
    try {
      await api.post(`/availability/requests/${requestId}/${action}/`, {}, token);
      addToast(action === "approve" ? "Zgłoszenie zaakceptowane." : "Zgłoszenie odrzucone.", "success");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się wykonać decyzji.";
      addToast(msg, "error");
    }
  };

  if (!isAdmin) return null;

  return (
    <section className="mx-auto mt-5 max-w-[1450px] px-4">
      <div className="rounded-[2rem] border border-[#2b3550] bg-[#0d1526] p-5 shadow-[0_16px_50px_rgba(0,0,0,.25)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9fb4de]">Zgłoszenia nieobecności</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Oczekujące na decyzję</h2>
            <p className="mt-1 text-sm text-[#98a8c8]">Urlopy i dni wolne wysłane przez pracowników.</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Odśwież
          </button>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-[#7e8aa5]">
            Brak oczekujących zgłoszeń.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {pending.map((req) => (
              <div key={req.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{req.employee_name}</p>
                    <p className="mt-0.5 text-xs text-[#8ea2c8]">
                      {req.availability_type_display} · {fmtDate(req.start_date)} — {fmtDate(req.end_date)} · {req.days_count} dni
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                    <CalendarClock size={12} />
                    {req.status_display}
                  </span>
                </div>

                {req.note ? <p className="mt-3 text-sm text-[#d1d5db]">{req.note}</p> : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void decide(req.id, "approve")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/35 bg-emerald-500/12 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/18"
                  >
                    <Check size={14} />
                    Akceptuj
                  </button>
                  <button
                    type="button"
                    onClick={() => void decide(req.id, "reject")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/35 bg-rose-500/12 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/18"
                  >
                    <X size={14} />
                    Odrzuć
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

