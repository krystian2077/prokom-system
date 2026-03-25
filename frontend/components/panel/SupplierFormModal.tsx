"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { InventorySupplierDetail } from "@/types/inventory";
import { useStore } from "@/store";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial: InventorySupplierDetail | null;
  token: string | null;
  onClose: () => void;
  onSaved: () => void;
};

const emptyForm = (): Record<string, string | number | boolean> => ({
  name: "",
  nip: "",
  street: "",
  city: "",
  postal_code: "",
  country: "Polska",
  phone: "",
  email: "",
  website_url: "",
  average_delivery_days: "",
  notes: "",
  is_active: true,
});

export function SupplierFormModal({ open, mode, initial, token, onClose, onSaved }: Props) {
  const { addToast } = useStore();
  const [form, setForm] = useState<Record<string, string | number | boolean>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === "edit" && initial) {
      setForm({
        name: initial.name ?? "",
        nip: initial.nip ?? "",
        street: initial.street ?? "",
        city: initial.city ?? "",
        postal_code: initial.postal_code ?? "",
        country: initial.country ?? "Polska",
        phone: initial.phone ?? "",
        email: initial.email ?? "",
        website_url: initial.website_url ?? "",
        average_delivery_days:
          initial.average_delivery_days != null && initial.average_delivery_days !== undefined
            ? Number(initial.average_delivery_days)
            : "",
        notes: initial.notes ?? "",
        is_active: initial.is_active !== false,
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, mode, initial]);

  if (!open) return null;

  const set = (k: string, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const name = String(form.name ?? "").trim();
    if (!name) {
      setError("Nazwa jest wymagana.");
      return;
    }
    setSaving(true);
    setError(null);
    const avgRaw = form.average_delivery_days;
    const average_delivery_days =
      avgRaw === "" || avgRaw === undefined || avgRaw === null
        ? null
        : Math.max(0, Math.min(365, Number(avgRaw)));

    const payload: Record<string, unknown> = {
      name,
      nip: String(form.nip ?? "").trim() || "",
      street: String(form.street ?? "").trim() || "",
      city: String(form.city ?? "").trim() || "",
      postal_code: String(form.postal_code ?? "").trim() || "",
      country: String(form.country ?? "").trim() || "Polska",
      phone: String(form.phone ?? "").trim() || "",
      email: String(form.email ?? "").trim() || "",
      website_url: String(form.website_url ?? "").trim() || "",
      notes: String(form.notes ?? "").trim() || "",
      is_active: Boolean(form.is_active),
    };
    if (average_delivery_days != null && Number.isFinite(average_delivery_days)) {
      payload.average_delivery_days = average_delivery_days;
    } else {
      payload.average_delivery_days = null;
    }

    try {
      if (mode === "edit" && initial?.id) {
        await api.patch(`/inventory/suppliers/${initial.id}/`, payload, token);
      } else {
        await api.post(`/inventory/suppliers/`, payload, token);
      }
      addToast(mode === "edit" ? "Hurtownia zaktualizowana" : "Hurtownia dodana", "success");
      onSaved();
      onClose();
    } catch (ex) {
      const msg = ex instanceof Error ? ex.message : "Nie udało się zapisać.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[450] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[18px] border border-white/15 bg-[#0f1117] p-5 shadow-[0_20px_60px_rgba(0,0,0,.55)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Dostawca</div>
            <h2 className="mt-1 text-xl font-semibold text-white">{mode === "create" ? "Nowa hurtownia" : "Edycja hurtowni"}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#9ca3af] hover:bg-white/10"
          >
            Zamknij
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b93a8]">Nazwa *</label>
            <input
              value={String(form.name ?? "")}
              onChange={(e) => set("name", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#dc1e1e]"
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b93a8]">Telefon</label>
              <input
                value={String(form.phone ?? "")}
                onChange={(e) => set("phone", e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#dc1e1e]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b93a8]">E-mail</label>
              <input
                type="email"
                value={String(form.email ?? "")}
                onChange={(e) => set("email", e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#dc1e1e]"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b93a8]">Strona WWW</label>
            <input
              value={String(form.website_url ?? "")}
              onChange={(e) => set("website_url", e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#dc1e1e]"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b93a8]">Śr. czas dostawy (dni)</label>
            <input
              type="number"
              min={0}
              max={365}
              value={form.average_delivery_days === "" ? "" : String(form.average_delivery_days)}
              onChange={(e) => set("average_delivery_days", e.target.value === "" ? "" : Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#dc1e1e]"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b93a8]">NIP</label>
              <input
                value={String(form.nip ?? "")}
                onChange={(e) => set("nip", e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#dc1e1e]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b93a8]">Kraj</label>
              <input
                value={String(form.country ?? "")}
                onChange={(e) => set("country", e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#dc1e1e]"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b93a8]">Ulica</label>
            <input
              value={String(form.street ?? "")}
              onChange={(e) => set("street", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#dc1e1e]"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b93a8]">Kod pocztowy</label>
              <input
                value={String(form.postal_code ?? "")}
                onChange={(e) => set("postal_code", e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#dc1e1e]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b93a8]">Miasto</label>
              <input
                value={String(form.city ?? "")}
                onChange={(e) => set("city", e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#dc1e1e]"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b93a8]">Notatka wewnętrzna</label>
            <textarea
              value={String(form.notes ?? "")}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#dc1e1e]"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[#e5e7eb]">
            <input type="checkbox" checked={Boolean(form.is_active)} onChange={(e) => set("is_active", e.target.checked)} />
            Aktywny dostawca
          </label>

          {error ? <p className="text-sm text-[#fca5a5]">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] hover:bg-white/10 disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b81818] disabled:opacity-60"
            >
              {saving ? "Zapisuję…" : "Zapisz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
