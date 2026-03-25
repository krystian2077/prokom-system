"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/store";
import { ErrorState } from "@/components/ui/ErrorState";
import { StaffCardSkeleton } from "@/components/ui/Skeleton";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import type { StaffListItem, StaffHealthLevel, StaffProfile } from "@/types/staff";
import type { UserRole } from "@/types/auth";

function badgeForHealth(level: StaffHealthLevel | undefined) {
  if (level === "red") return "border-[#dc1e1e]/35 bg-[#dc1e1e]/15 text-[#ffb4b4]";
  if (level === "yellow") return "border-[#f59e0b]/35 bg-[#f59e0b]/15 text-[#ffe3b0]";
  if (level === "green") return "border-[#22c55e]/35 bg-[#22c55e]/15 text-[#bbf7d0]";
  return "border-white/10 bg-white/5 text-[#9ca3af]";
}

function healthLabel(level: StaffHealthLevel | undefined) {
  if (level === "red") return "Zły";
  if (level === "yellow") return "Uwaga";
  if (level === "green") return "OK";
  return "—";
}

type StaffForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  staff_profile: StaffProfile;
  password?: string;
};

function buildEmptyForm(currentRole: UserRole): StaffForm {
  return {
    first_name: "",
    last_name: "",
    email: "",
    role: currentRole,
    is_active: true,
    staff_profile: {
      specialization: "",
      calendar_color: "#3498db",
      display_name: "",
      is_visible_in_rankings: true,
      is_available: true,
      accepts_shipment_repairs: true,
    },
    password: "",
  };
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("pl-PL");
}

export default function TeamAdminPage() {
  const { user, token } = useAuth();
  const addToast = useStore((s) => s.addToast);
  const { confirm } = useConfirm();
  const isAdmin = user?.role === "admin";
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<StaffListItem[]>([]);

  const [search, setSearch] = useState("");

  const roleFilter = searchParams.get("role") ?? "";
  const isActiveFilter = searchParams.get("active") ?? "";
  const specializationFilter = searchParams.get("spec") ?? "";
  const [specInput, setSpecInput] = useState(specializationFilter);
  const specDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSpecInput(specializationFilter);
  }, [specializationFilter]);

  useEffect(
    () => () => {
      if (specDebounceRef.current) clearTimeout(specDebounceRef.current);
    },
    [],
  );

  const replaceQuery = (mutate: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(searchParams.toString());
    mutate(p);
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  };

  const setRoleInUrl = (value: string) => {
    replaceQuery((p) => {
      if (!value) p.delete("role");
      else p.set("role", value);
    });
  };

  const setActiveInUrl = (value: string) => {
    replaceQuery((p) => {
      if (!value) p.delete("active");
      else p.set("active", value);
    });
  };

  const queueSpecInUrl = (raw: string) => {
    if (specDebounceRef.current) clearTimeout(specDebounceRef.current);
    specDebounceRef.current = setTimeout(() => {
      specDebounceRef.current = null;
      const p = new URLSearchParams(searchParamsRef.current.toString());
      const v = raw.trim();
      if (!v) p.delete("spec");
      else p.set("spec", v);
      const q = p.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    }, 400);
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [activeStaffId, setActiveStaffId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffForm>(() => buildEmptyForm("staff"));
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [resetAction, setResetAction] = useState<"generate" | "send_link">("generate");
  const [resetCustomPassword, setResetCustomPassword] = useState<string>("");
  const [resetResult, setResetResult] = useState<string | null>(null);
  const [resetSending, setResetSending] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const qs: string[] = [];
      if (roleFilter) qs.push(`role=${encodeURIComponent(roleFilter)}`);
      if (isActiveFilter) qs.push(`is_active=${encodeURIComponent(isActiveFilter)}`);
      if (specializationFilter) qs.push(`specialization=${encodeURIComponent(specializationFilter)}`);
      const url = `/accounts/staff/${qs.length ? `?${qs.join("&")}` : ""}`;
      const res = await api.get<StaffListItem[]>(url, token);
      setItems(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać listy pracowników.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !isAdmin) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin, roleFilter, isActiveFilter, specializationFilter]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((s) => {
      const hay = `${s.full_name ?? ""} ${s.email ?? ""} ${s.role_display ?? ""} ${s.staff_profile?.specialization_display ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, search]);

  const openCreate = () => {
    setModalMode("create");
    setActiveStaffId(null);
    setForm(buildEmptyForm("staff"));
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (s: StaffListItem) => {
    setModalMode("edit");
    setActiveStaffId(s.id);
    setForm({
      first_name: s.first_name ?? "",
      last_name: s.last_name ?? "",
      email: s.email ?? "",
      phone: (s as unknown as { phone?: string }).phone ?? "",
      role: (s.role as UserRole) ?? "staff",
      is_active: Boolean(s.is_active),
      staff_profile: {
        specialization: s.staff_profile?.specialization ?? "",
        calendar_color: s.staff_profile?.calendar_color ?? "#3498db",
        display_name: s.staff_profile?.display_name ?? "",
        is_visible_in_rankings: Boolean(s.staff_profile?.is_visible_in_rankings),
        is_available: Boolean(s.staff_profile?.is_available),
        accepts_shipment_repairs: Boolean(s.staff_profile?.accepts_shipment_repairs),
      },
      password: "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const submitForm = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!token) return;
    if (!isAdmin) return;
    if (!modalOpen) return;

    setFormError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone?.trim() ?? "",
        role: form.role,
        is_active: form.is_active,
      };

      payload.specialization = form.staff_profile.specialization ?? "";
      payload.calendar_color = form.staff_profile.calendar_color ?? "#3498db";
      payload.display_name = form.staff_profile.display_name ?? "";
      payload.is_visible_in_rankings = form.staff_profile.is_visible_in_rankings ?? true;
      payload.is_available = form.staff_profile.is_available ?? true;
      payload.accepts_shipment_repairs = form.staff_profile.accepts_shipment_repairs ?? true;

      if (modalMode === "create") {
        if (form.role === "admin") {
          const pw = form.password?.trim();
          if (!pw) throw new Error("Hasło jest wymagane przy tworzeniu administratora.");
          payload.password = pw;
        } else if (form.password?.trim()) {
          payload.password = form.password.trim();
        }

        await api.post("/accounts/staff/", payload, token);
      } else {
        if (!activeStaffId) throw new Error("Brak ID pracownika.");
        await api.patch(`/accounts/staff/${activeStaffId}/update/`, payload, token);
      }

      setModalOpen(false);
      addToast(modalMode === "create" ? "Pracownik dodany." : "Dane zaktualizowane.", "success");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się zapisać pracownika.";
      setFormError(msg);
      addToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openReset = (staffId: string) => {
    setResetTargetId(staffId);
    setResetAction("generate");
    setResetCustomPassword("");
    setResetResult(null);
    setResetModalOpen(true);
  };

  const submitReset = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!token) return;
    if (!resetTargetId) return;
    setResetSending(true);
    setResetResult(null);
    try {
      const body: Record<string, unknown> = { action: resetAction };
      if (resetAction === "generate" && resetCustomPassword.trim()) body.new_password = resetCustomPassword.trim();
      const res = await api.post<{ message?: string; temporary_password?: string; token_created?: boolean }>(
        `/accounts/staff/${resetTargetId}/reset-password/`,
        body,
        token,
      );
      if (resetAction === "generate") {
        const tmp = res.temporary_password;
        setResetResult(tmp ? `Tymczasowe haslo: ${tmp}` : res.message ?? "Wygenerowano hasło.");
      } else {
        setResetResult(res.message ?? "Wysłano link do resetu.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się zresetować hasła.";
      setResetResult(msg);
    } finally {
      setResetSending(false);
    }
  };

  const toggleActive = async (staffId: string, next: boolean) => {
    if (!token) return;
    if (!next) {
      const ok = await confirm({
        title: "Zablokować konto?",
        description: "Pracownik straci dostęp do systemu. Operację można cofnąć, klikając „Aktywuj".",
        confirmLabel: "Tak, zablokuj",
        variant: "danger",
      });
      if (!ok) return;
    }
    try {
      if (next) await api.post(`/accounts/staff/${staffId}/activate/`, {}, token);
      else await api.post(`/accounts/staff/${staffId}/deactivate/`, {}, token);
      addToast(next ? "Konto aktywowane." : "Konto zablokowane.", "success");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się zmienić statusu konta.";
      setError(msg);
      addToast(msg, "error");
    }
  };

  if (!isAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Panel Admina</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Zespół i pracownicy</h1>
        <p className="mt-1 text-sm text-[#9ca3af]">Lista pracowników, edycja profilu, reset hasła i blokada kont.</p>
      </header>

      <div className="mb-5 rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-full md:w-[420px]">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Szukaj</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Imię, nazwisko, e-mail, specjalizacja…"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-[#6b7280]"
            />
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[220px]">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Rola</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleInUrl(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="">Wszystkie</option>
                <option value="admin">Administrator</option>
                <option value="staff">Pracownik</option>
              </select>
            </div>

            <div className="w-[180px]">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Aktywne</label>
              <select
                value={isActiveFilter}
                onChange={(e) => setActiveInUrl(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="">Wszystkie</option>
                <option value="true">Tak</option>
                <option value="false">Nie</option>
              </select>
            </div>

            <div className="w-[220px]">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Specjalizacja</label>
              <input
                value={specInput}
                onChange={(e) => {
                  setSpecInput(e.target.value);
                  queueSpecInUrl(e.target.value);
                }}
                placeholder="np. serwis drukarek…"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-[#6b7280]"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
          >
            Odśwież
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b61717]"
          >
            Dodaj pracownika
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4">
          <ErrorState error={new Error(error)} onRetry={() => void load()} title="Błąd pobierania zespołu" />
        </div>
      ) : null}
      {loading ? (
        <StaffCardSkeleton count={6} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <div key={s.id} className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{s.full_name}</p>
                  <p className="mt-1 text-sm text-[#9ca3af] truncate">{s.email}</p>
                  <p className="mt-2 text-sm text-[#9ca3af]">
                    Rola: <span className="text-white font-semibold">{(s as unknown as { role_display?: string }).role_display ?? s.role}</span>
                  </p>
                  <p className="mt-1 text-sm text-[#9ca3af]">
                    Spec: <span className="text-white font-semibold">{s.staff_profile?.specialization_display ?? "—"}</span>
                  </p>
                  <p className="mt-1 text-sm text-[#9ca3af]">
                    Dostępny: <span className="text-white font-semibold">{s.is_active ? "Tak" : "Nie"}</span>
                  </p>
                </div>
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badgeForHealth(s.health_score_level)}`}>
                  {healthLabel(s.health_score_level)}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-xs uppercase tracking-[0.12em] text-[#9ca3af]">Akcje</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
                  >
                    Edytuj
                  </button>
                  <button
                    type="button"
                    onClick={() => openReset(s.id)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
                  >
                    Reset hasła
                  </button>
                  {s.is_active ? (
                    <button
                      type="button"
                      onClick={() => void toggleActive(s.id, false)}
                      className="rounded-xl border border-[#dc1e1e]/30 bg-[#dc1e1e]/10 px-3 py-2 text-xs font-semibold text-[#ffb4b4] transition hover:bg-[#dc1e1e]/15"
                    >
                      Zablokuj
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void toggleActive(s.id, true)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
                    >
                      Aktywuj
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 text-xs text-[#9ca3af]">
                {s.last_login ? `Ostatnio: ${formatDateTime(s.last_login)}` : "Ostatnio: —"}
              </div>
            </div>
          ))}
          {filtered.length === 0 ? (
            <p className="text-sm text-[#6b7280]">Brak wyników.</p>
          ) : null}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0c0d12] shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">{modalMode === "create" ? "Dodaj" : "Edytuj"}</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {modalMode === "create" ? "Nowego pracownika" : "Profil pracownika"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
              >
                Zamknij
              </button>
            </div>

            <form onSubmit={submitForm} className="p-4">
              {formError ? <p className="mb-3 text-sm text-[#fca5a5]">{formError}</p> : null}

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Imię</label>
                  <input
                    value={form.first_name}
                    onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Nazwisko</label>
                  <input
                    value={form.last_name}
                    onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">E-mail</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Telefon (opcjonalnie)</label>
                  <input
                    value={form.phone ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Rola</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  >
                    <option value="staff">Pracownik</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Aktywne</label>
                  <select
                    value={String(form.is_active)}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value === "true" }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  >
                    <option value="true">Tak</option>
                    <option value="false">Nie</option>
                  </select>
                </div>

                <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Profil pracownika (staff_profile)</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Specjalizacja</label>
                      <input
                        value={form.staff_profile.specialization ?? ""}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            staff_profile: { ...p.staff_profile, specialization: e.target.value },
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Kolor</label>
                      <input
                        value={form.staff_profile.calendar_color ?? ""}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            staff_profile: { ...p.staff_profile, calendar_color: e.target.value },
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Nazwa w UI (opcjonalnie)</label>
                      <input
                        value={form.staff_profile.display_name ?? ""}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            staff_profile: { ...p.staff_profile, display_name: e.target.value },
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#e5e7eb]">
                        <input
                          type="checkbox"
                          checked={Boolean(form.staff_profile.is_visible_in_rankings)}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              staff_profile: { ...p.staff_profile, is_visible_in_rankings: e.target.checked },
                            }))
                          }
                          className="h-4 w-4"
                        />
                        Widoczny w rankingach
                      </label>
                    </div>
                    <div>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#e5e7eb]">
                        <input
                          type="checkbox"
                          checked={Boolean(form.staff_profile.is_available)}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              staff_profile: { ...p.staff_profile, is_available: e.target.checked },
                            }))
                          }
                          className="h-4 w-4"
                        />
                        Dostępny do przypisań
                      </label>
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#e5e7eb]">
                        <input
                          type="checkbox"
                          checked={Boolean(form.staff_profile.accepts_shipment_repairs)}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              staff_profile: { ...p.staff_profile, accepts_shipment_repairs: e.target.checked },
                            }))
                          }
                          className="h-4 w-4"
                        />
                        Przyjmuje naprawy wysyłkowe
                      </label>
                    </div>
                  </div>
                </div>

                {modalMode === "create" && form.role === "admin" ? (
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                      Hasło (dla administratora)
                    </label>
                    <input
                      value={form.password ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                      type="password"
                      required
                    />
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b61717] disabled:opacity-60"
                >
                  {submitting ? "Zapisuję…" : "Zapisz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetModalOpen && resetTargetId && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#0c0d12] shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Reset hasła</p>
                <p className="mt-1 text-lg font-semibold text-white">Dla wybranego pracownika</p>
              </div>
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
              >
                Zamknij
              </button>
            </div>

            <form onSubmit={submitReset} className="p-4 space-y-4">
              {resetResult ? <p className="text-sm text-white whitespace-pre-wrap">{resetResult}</p> : null}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Akcja</label>
                <select
                  value={resetAction}
                  onChange={(e) => setResetAction(e.target.value as "generate" | "send_link")}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                >
                  <option value="generate">Wygeneruj tymczasowe hasło</option>
                  <option value="send_link">Wyślij link do resetu</option>
                </select>
              </div>

              {resetAction === "generate" ? (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                    Nowe hasło (opcjonalnie)
                  </label>
                  <input
                    value={resetCustomPassword}
                    onChange={(e) => setResetCustomPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                    type="password"
                    placeholder="Jeśli puste, system wygeneruje"
                  />
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={resetSending}
                  className="rounded-xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b61717] disabled:opacity-60"
                >
                  {resetSending ? "Wykonuję…" : "Wykonaj"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
