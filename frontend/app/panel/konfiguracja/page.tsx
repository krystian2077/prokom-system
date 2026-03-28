"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Skeleton, StackedRowSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/store";

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type TermsDocumentTypeValue = "terms" | "privacy" | "other";

type TermsVersionItem = {
  id: number;
  code: string;
  version: string;
  document_type: TermsDocumentTypeValue;
  document_type_display: string;
  is_active: boolean;
  published_at?: string | null;
  created_at?: string;
};

type GdprRequestStatusValue = "pending" | "in_progress" | "completed" | "rejected";
type GdprRequestTypeValue = "export" | "deletion";

type GdprRequestAdminItem = {
  id: number;
  request_type: GdprRequestTypeValue;
  request_type_display: string;
  status: GdprRequestStatusValue;
  status_display: string;
  reason?: string;
  resolution_note?: string;
  requested_at: string;
  resolved_at?: string | null;
  client_full_name: string;
  client_email: string;
  handled_by_name?: string | null;
};

type BackupTypeValue = "database" | "media" | "full";
type BackupStatusValue = "started" | "success" | "failed";

type BackupLogItem = {
  id: number;
  backup_type: BackupTypeValue;
  backup_type_display: string;
  status: BackupStatusValue;
  status_display: string;
  storage_path: string;
  started_at: string;
  finished_at?: string | null;
  error_message?: string;
  triggered_by_name?: string | null;
};

type TabKey = "docs" | "gdpr" | "backups";

const statusBadgeClass: Record<string, string> = {
  pending: "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)]",
  in_progress: "border-[#f59e0b]/35 bg-[#f59e0b]/15 text-[#ffe3b0]",
  completed: "border-[#22c55e]/35 bg-[#22c55e]/15 text-[#bbf7d0]",
  rejected: "border-[#dc1e1e]/35 bg-[#dc1e1e]/15 text-[#ffb4b4]",
  success: "border-[#22c55e]/35 bg-[#22c55e]/15 text-[#bbf7d0]",
  failed: "border-[#dc1e1e]/35 bg-[#dc1e1e]/15 text-[#ffb4b4]",
  started: "border-[#3b82f6]/35 bg-[#3b82f6]/15 text-[#bcd6ff]",
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("pl-PL");
}

function ConfigAdminPageInner() {
  const { user, token } = useAuth();
  const addToast = useStore((s) => s.addToast);
  const isAdmin = user?.role === "admin";
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab = useMemo<TabKey>(() => {
    const t = searchParams.get("tab");
    if (t === "gdpr" || t === "backups") return t;
    return "docs";
  }, [searchParams]);

  const setTab = (k: TabKey) => {
    const p = new URLSearchParams(searchParams.toString());
    if (k === "docs") p.delete("tab");
    else p.set("tab", k);
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  };

  // DOCUMENTS
  const [docs, setDocs] = useState<TermsVersionItem[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [settingActiveId, setSettingActiveId] = useState<number | null>(null);

  // GDPR requests
  const [gdprLoading, setGdprLoading] = useState(false);
  const [gdprError, setGdprError] = useState<string | null>(null);
  const [gdprPage, setGdprPage] = useState(1);
  const [gdprCount, setGdprCount] = useState(0);
  const [gdprItems, setGdprItems] = useState<GdprRequestAdminItem[]>([]);
  const [gdprNext, setGdprNext] = useState<string | null>(null);
  const [gdprPrev, setGdprPrev] = useState<string | null>(null);
  const [gdprRequestType, setGdprRequestType] = useState<string>("");
  const [gdprStatus, setGdprStatus] = useState<string>("");
  const [gdprSearch, setGdprSearch] = useState<string>("");
  const gdprPageSize = 25;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"completed" | "rejected">("completed");
  const [modalTargetId, setModalTargetId] = useState<number | null>(null);
  const [modalNote, setModalNote] = useState<string>("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Backups
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [backupsError, setBackupsError] = useState<string | null>(null);
  const [backupsItems, setBackupsItems] = useState<BackupLogItem[]>([]);
  const [backupsCount, setBackupsCount] = useState(0);
  const [backupsPage, setBackupsPage] = useState(1);
  const [backupsNext, setBackupsNext] = useState<string | null>(null);
  const [backupsPrev, setBackupsPrev] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<string>("");
  const [backupType, setBackupType] = useState<string>("");
  const backupsPageSize = 25;

  const canRequest = Boolean(token && user && isAdmin);

  const loadDocs = async () => {
    if (!token) return;
    setDocsLoading(true);
    setDocsError(null);
    try {
      const res = await api.get<{ results: TermsVersionItem[] }>(`/compliance/admin/terms-versions/`, token);
      setDocs(res.results ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać dokumentów.";
      setDocsError(msg);
    } finally {
      setDocsLoading(false);
    }
  };

  const loadGdpr = async () => {
    if (!token) return;
    setGdprLoading(true);
    setGdprError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(gdprPage));
      params.set("page_size", String(gdprPageSize));
      if (gdprRequestType) params.set("request_type", gdprRequestType);
      if (gdprStatus) params.set("status", gdprStatus);
      if (gdprSearch.trim()) params.set("search", gdprSearch.trim());
      const url = `/compliance/admin/gdpr-requests/?${params.toString()}`;
      const res = await api.get<PaginatedResponse<GdprRequestAdminItem>>(url, token);
      setGdprItems(res.results ?? []);
      setGdprCount(res.count ?? 0);
      setGdprNext(res.next ?? null);
      setGdprPrev(res.previous ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać wniosków RODO.";
      setGdprError(msg);
    } finally {
      setGdprLoading(false);
    }
  };

  const loadBackups = async () => {
    if (!token) return;
    setBackupsLoading(true);
    setBackupsError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(backupsPage));
      params.set("page_size", String(backupsPageSize));
      if (backupStatus) params.set("status", backupStatus);
      if (backupType) params.set("backup_type", backupType);
      const url = `/compliance/admin/backup-logs/?${params.toString()}`;
      const res = await api.get<PaginatedResponse<BackupLogItem>>(url, token);
      setBackupsItems(res.results ?? []);
      setBackupsCount(res.count ?? 0);
      setBackupsNext(res.next ?? null);
      setBackupsPrev(res.previous ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać logów backupu.";
      setBackupsError(msg);
    } finally {
      setBackupsLoading(false);
    }
  };

  const gdprPageCount = useMemo(() => Math.max(1, Math.ceil(gdprCount / gdprPageSize)), [gdprCount]);
  const backupsPageCount = useMemo(
    () => Math.max(1, Math.ceil(backupsCount / backupsPageSize)),
    [backupsCount],
  );

  const openDecisionModal = (id: number, mode: "completed" | "rejected") => {
    setModalTargetId(id);
    setModalMode(mode);
    setModalNote("");
    setModalError(null);
    setModalOpen(true);
  };

  const submitDecision = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!token) return;
    if (!modalTargetId) return;
    setModalSubmitting(true);
    setModalError(null);
    try {
      await api.patch(
        `/compliance/admin/gdpr-requests/${modalTargetId}/update/`,
        {
          status: modalMode,
          resolution_note: modalNote,
        },
        token,
      );
      setModalOpen(false);
      addToast("Wniosek RODO zaktualizowany.", "success");
      await loadGdpr();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się zaktualizować wniosku.";
      setModalError(msg);
      addToast(msg, "error");
    } finally {
      setModalSubmitting(false);
    }
  };

  const setActiveDoc = async (id: number) => {
    if (!token) return;
    setSettingActiveId(id);
    try {
      await api.post(`/compliance/admin/terms-versions/${id}/set-active/`, {}, token);
      addToast("Dokument ustawiony jako aktywny.", "success");
      await loadDocs();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się ustawić dokumentu jako aktywnego.";
      setDocsError(msg);
      addToast(msg, "error");
    } finally {
      setSettingActiveId(null);
    }
  };

  useEffect(() => {
    if (!canRequest) return;
    void loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRequest]);

  useEffect(() => {
    if (!canRequest) return;
    if (tab === "gdpr") void loadGdpr();
    if (tab === "backups") void loadBackups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tab,
    canRequest,
    gdprPage,
    gdprRequestType,
    gdprStatus,
    gdprSearch,
    backupsPage,
    backupStatus,
    backupType,
  ]);

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
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--ink2)]">Panel Admina</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--white)]">Konfiguracja i RODO</h1>
        <p className="mt-1 text-sm text-[var(--ink2)]">
          Dokumenty (regulamin/polityka), obsługa wniosków RODO i logi backupów.
        </p>
      </header>

      <div className="mb-5 rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["docs", "Dokumenty"],
                ["gdpr", "Wnioski RODO"],
                ["backups", "Backupy"],
              ] as Array<[TabKey, string]>
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  tab === k
                    ? "border-white/20 bg-[var(--row-active)] text-[var(--white)]"
                    : "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] hover:bg-[var(--row-active)] hover:text-[var(--white)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {tab === "docs" ? (
              <button
                type="button"
                onClick={() => void loadDocs()}
                disabled={docsLoading}
                className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)] disabled:opacity-60"
              >
                Odśwież
              </button>
            ) : null}
            {tab === "gdpr" ? (
              <button
                type="button"
                onClick={() => void loadGdpr()}
                disabled={gdprLoading}
                className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)] disabled:opacity-60"
              >
                Odśwież
              </button>
            ) : null}
            {tab === "backups" ? (
              <button
                type="button"
                onClick={() => void loadBackups()}
                disabled={backupsLoading}
                className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)] disabled:opacity-60"
              >
                Odśwież
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {tab === "docs" ? (
        <>
          {docsError ? <p className="mb-4 text-sm text-[#fca5a5]">{docsError}</p> : null}
          {docsLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-3 w-full max-w-xs" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {docs.map((d) => (
                <div key={d.id} className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">Dokument</p>
                      <p className="mt-1 truncate text-lg font-semibold text-[var(--white)]">
                        {d.code} v{d.version}
                      </p>
                      <p className="mt-1 text-sm text-[var(--ink2)]">{d.document_type_display}</p>
                      <p className="mt-2 text-xs text-[var(--ink2)]">Opublikowano: {fmtDate(d.published_at)}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${
                        d.is_active
                          ? "border-[#22c55e]/35 bg-[#22c55e]/15 text-[#bbf7d0]"
                          : "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)]"
                      }`}
                    >
                      {d.is_active ? "Aktywny" : "Nieaktywny"}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => void setActiveDoc(d.id)}
                      disabled={d.is_active || settingActiveId === d.id}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        d.is_active
                          ? "border border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] opacity-70 cursor-not-allowed"
                          : "border border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] hover:bg-[var(--row-active)] hover:text-[var(--white)] disabled:opacity-60"
                      }`}
                    >
                      {d.is_active
                        ? "Aktywny"
                        : settingActiveId === d.id
                          ? "Ustawiam…"
                          : "Ustaw aktywny"}
                    </button>
                  </div>
                </div>
              ))}

              {docs.length === 0 ? (
                <div className="col-span-full rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-6 text-sm text-[var(--ink2)]">
                  Brak dokumentów.
                </div>
              ) : null}
            </div>
          )}
        </>
      ) : null}

      {tab === "gdpr" ? (
        <>
          {gdprError ? <p className="mb-4 text-sm text-[#fca5a5]">{gdprError}</p> : null}

          <div className="mb-5 rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="w-full md:w-[340px]">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
                  Szukaj
                </label>
                <input
                  value={gdprSearch}
                  onChange={(e) => setGdprSearch(e.target.value)}
                  placeholder="Imię, nazwisko, email…"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm text-[var(--white)] placeholder:text-[var(--muted)]"
                />
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="w-[220px]">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
                    Typ
                  </label>
                  <select
                    value={gdprRequestType}
                    onChange={(e) => setGdprRequestType(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)]"
                  >
                    <option value="">Wszystkie</option>
                    <option value="export">Eksport danych</option>
                    <option value="deletion">Usunięcie konta</option>
                  </select>
                </div>

                <div className="w-[220px]">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
                    Status
                  </label>
                  <select
                    value={gdprStatus}
                    onChange={(e) => setGdprStatus(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)]"
                  >
                    <option value="">Wszystkie</option>
                    <option value="pending">Oczekuje</option>
                    <option value="in_progress">W realizacji</option>
                    <option value="completed">Zrealizowano</option>
                    <option value="rejected">Odrzucono</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {gdprLoading ? (
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
              <StackedRowSkeleton rows={8} />
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--ink2)]">
                  Wyniki: <span className="text-[var(--white)] font-semibold">{gdprItems.length}</span> z{" "}
                  <span className="text-[var(--white)] font-semibold">{gdprCount}</span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGdprPage((p) => Math.max(1, p - 1))}
                    disabled={gdprPage <= 1}
                    className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)] disabled:opacity-60"
                  >
                    ← Poprzednie
                  </button>
                  <span className="text-sm text-[var(--ink2)]">
                    Strona <span className="text-[var(--white)] font-semibold">{gdprPage}</span> / {gdprPageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGdprPage((p) => Math.min(gdprPageCount, p + 1))}
                    disabled={gdprPage >= gdprPageCount}
                    className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)] disabled:opacity-60"
                  >
                    Następne →
                  </button>
                </div>
              </div>

              <div className="divide-y divide-[var(--border)] rounded-3xl border border-[var(--border)] bg-[var(--s1)]">
                {gdprItems.map((it) => (
                  <div key={it.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">Wniosek</p>
                      <p className="mt-1 truncate text-lg font-semibold text-[var(--white)]">{it.client_full_name}</p>
                      <p className="mt-1 text-sm text-[var(--ink2)]">{it.client_email}</p>
                      <p className="mt-2 text-xs text-[var(--ink2)]">
                        Utworzono: {fmtDate(it.requested_at)}
                        {it.resolved_at ? ` · Rozstrzygnięto: ${fmtDate(it.resolved_at)}` : ""}
                      </p>
                      {it.reason ? <p className="mt-2 whitespace-pre-wrap text-sm text-[#e5e7eb]">Powód: {it.reason}</p> : null}
                      {it.resolution_note ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-[#e5e7eb]">Notatka: {it.resolution_note}</p>
                      ) : null}
                    </div>

                    <div className="flex w-full flex-col items-end gap-3 md:w-[340px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${
                            statusBadgeClass[it.status] ?? "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)]"
                          }`}
                        >
                          {it.status_display}
                        </span>
                        <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--row-hover)] px-3 py-1 text-[11px] font-semibold text-[var(--ink2)]">
                          {it.request_type_display}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openDecisionModal(it.id, "completed")}
                          disabled={it.status === "completed" || it.status === "rejected"}
                          className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-xs font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)] disabled:opacity-60"
                        >
                          Zakończ
                        </button>
                        <button
                          type="button"
                          onClick={() => openDecisionModal(it.id, "rejected")}
                          disabled={it.status === "completed" || it.status === "rejected"}
                          className="rounded-xl border border-[#dc1e1e]/30 bg-[#dc1e1e]/10 px-3 py-2 text-xs font-semibold text-[#ffb4b4] transition hover:bg-[#dc1e1e]/15 disabled:opacity-60"
                        >
                          Odrzuć
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {gdprItems.length === 0 ? <div className="p-6 text-sm text-[var(--ink2)]">Brak wniosków.</div> : null}
              </div>
            </>
          )}
        </>
      ) : null}

      {tab === "backups" ? (
        <>
          {backupsError ? <p className="mb-4 text-sm text-[#fca5a5]">{backupsError}</p> : null}

          <div className="mb-5 rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-[220px]">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
                    Typ backupu
                  </label>
                  <select
                    value={backupType}
                    onChange={(e) => setBackupType(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)]"
                  >
                    <option value="">Wszystkie</option>
                    <option value="database">Baza danych</option>
                    <option value="media">Media</option>
                    <option value="full">Pełny</option>
                  </select>
                </div>

                <div className="w-[220px]">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
                    Status
                  </label>
                  <select
                    value={backupStatus}
                    onChange={(e) => setBackupStatus(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)]"
                  >
                    <option value="">Wszystkie</option>
                    <option value="started">Rozpoczęto</option>
                    <option value="success">Sukces</option>
                    <option value="failed">Błąd</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {backupsLoading ? (
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
              <StackedRowSkeleton rows={8} />
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--ink2)]">
                  Wyniki: <span className="text-[var(--white)] font-semibold">{backupsItems.length}</span> z{" "}
                  <span className="text-[var(--white)] font-semibold">{backupsCount}</span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBackupsPage((p) => Math.max(1, p - 1))}
                    disabled={backupsPage <= 1}
                    className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)] disabled:opacity-60"
                  >
                    ← Poprzednie
                  </button>
                  <span className="text-sm text-[var(--ink2)]">
                    Strona <span className="text-[var(--white)] font-semibold">{backupsPage}</span> / {backupsPageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBackupsPage((p) => Math.min(backupsPageCount, p + 1))}
                    disabled={backupsPage >= backupsPageCount}
                    className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)] disabled:opacity-60"
                  >
                    Następne →
                  </button>
                </div>
              </div>

              <div className="divide-y divide-[var(--border)] rounded-3xl border border-[var(--border)] bg-[var(--s1)]">
                {backupsItems.map((it) => (
                  <div key={it.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">Backup</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--white)]">{it.backup_type_display}</p>
                      <p className="mt-2 text-xs text-[var(--ink2)]">
                        Start: {fmtDate(it.started_at)}
                        {it.finished_at ? ` · Koniec: ${fmtDate(it.finished_at)}` : ""}
                      </p>
                      {it.triggered_by_name ? <p className="mt-1 text-xs text-[var(--ink2)]">Wywołał: {it.triggered_by_name}</p> : null}
                      {it.error_message ? <p className="mt-2 whitespace-pre-wrap text-sm text-[#ffb4b4]">Błąd: {it.error_message}</p> : null}
                    </div>

                    <div className="flex flex-col items-end gap-2 md:w-[240px]">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${
                          statusBadgeClass[it.status] ?? "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)]"
                        }`}
                      >
                        {it.status_display}
                      </span>
                      {it.storage_path ? (
                        <p className="break-all text-right text-xs text-[var(--ink2)]">{it.storage_path}</p>
                      ) : null}
                    </div>
                  </div>
                ))}

                {backupsItems.length === 0 ? <div className="p-6 text-sm text-[var(--ink2)]">Brak logów backupów.</div> : null}
              </div>
            </>
          )}
        </>
      ) : null}

      {modalOpen && modalTargetId && (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--s1)] shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">RODO</p>
                <p className="mt-1 text-lg font-semibold text-[var(--white)]">
                  {modalMode === "completed" ? "Zakończ wniosek" : "Odrzuć wniosek"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
              >
                Zamknij
              </button>
            </div>

            <form onSubmit={submitDecision} className="space-y-4 p-4">
              {modalError ? <p className="whitespace-pre-wrap text-sm text-[#fca5a5]">{modalError}</p> : null}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
                  Notatka (resolution note)
                </label>
                <textarea
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  className="min-h-[120px] w-full resize-y rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm text-[var(--white)] placeholder:text-[var(--muted)]"
                  placeholder="Opis rozstrzygnięcia, uwagi wewnętrzne, decyzja…"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="rounded-xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b61717] disabled:opacity-60"
                >
                  {modalSubmitting
                    ? "Zapisuję…"
                    : modalMode === "completed"
                      ? "Zakończ"
                      : "Odrzuć"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ConfigAdminPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
          <Skeleton className="mb-6 h-9 w-80" />
          <div className="mb-5 rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
            <StackedRowSkeleton rows={8} />
          </div>
        </main>
      }
    >
      <ConfigAdminPageInner />
    </Suspense>
  );
}
