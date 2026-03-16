"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useClientProfile } from "@/hooks/useClientProfile";
import { apiClientProfileToPanel, type ApiClientProfile } from "@/lib/panel-api";
import { apiMySummaryToDashboardStats, type ApiMySummary } from "@/lib/panel-api";
import { formatDate, formatMonthYear } from "@/lib/format";
import type { PreferredContact } from "@/types/panel";
import type { DashboardStats } from "@/types/panel";

const PREFERRED_CONTACT_OPTIONS: { value: PreferredContact; label: string }[] = [
  { value: "email", label: "E-mail" },
  { value: "telefon", label: "Telefon" },
  { value: "sms", label: "SMS" },
];

function toApiPreferredContact(v: PreferredContact): string {
  if (v === "telefon") return "phone";
  return v;
}

export function ClientProfil() {
  const { token, user } = useAuth();
  const { profile: profileFromHook, loading: profileLoading, refetch: refetchProfile } = useClientProfile();
  const readOnly = !user?.email_verified;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredContact, setPreferredContact] = useState<PreferredContact>("email");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("Polska");
  const [marketing, setMarketing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (profileFromHook) {
      setFirstName(profileFromHook.firstName);
      setLastName(profileFromHook.lastName);
      setPhone(profileFromHook.phone);
      setPreferredContact(profileFromHook.preferredContact);
      setStreet(profileFromHook.address.street);
      setCity(profileFromHook.address.city);
      setZip(profileFromHook.address.zip);
      setCountry(profileFromHook.address.country);
      setMarketing(profileFromHook.marketingConsent);
    }
  }, [profileFromHook]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    api
      .get<ApiMySummary>("/repairs/my-summary/", token)
      .then((data) => {
        if (!cancelled) setStats(apiMySummaryToDashboardStats(data as ApiMySummary));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const showToast = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const handleSaveContact = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      await api.patch<ApiClientProfile>(
        "/clients/me/",
        {
          first_name: firstName,
          last_name: lastName,
          phone,
          preferred_contact: toApiPreferredContact(preferredContact),
        },
        token
      );
      refetchProfile();
      showToast();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      await api.patch<ApiClientProfile>(
        "/clients/me/",
        { street, city, postal_code: zip, country },
        token
      );
      refetchProfile();
      showToast();
    } finally {
      setIsSaving(false);
    }
  };

  const profile = profileFromHook;

  if (profileLoading && !profile) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="panel-card h-fit p-6">
            <div className="skeleton mx-auto mb-4 h-20 w-20 rounded-full" />
            <div className="skeleton mb-2 h-5 w-3/4 rounded" />
            <div className="skeleton mb-4 h-4 w-full rounded" />
            <div className="skeleton h-10 w-full rounded" />
          </div>
          <div className="space-y-6">
            <div className="panel-card skeleton h-64" />
            <div className="panel-card skeleton h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-extrabold text-white" style={{ fontFamily: "var(--font-unbounded)", fontSize: "clamp(22px, 2.5vw, 28px)" }}>
          Profil
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {readOnly ? "Podgląd danych. Zweryfikuj e-mail, aby edytować." : "Edytuj swoje dane kontaktowe i ustawienia konta"}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Identity card (left) */}
        <div className="panel-card sticky top-24 h-fit p-6">
          {profile ? (
            <>
              <div
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ background: "linear-gradient(135deg, var(--red), var(--red-h))" }}
              >
                {profile.firstName?.[0]?.toUpperCase() ?? "?"}
              </div>
              <p className="text-center font-bold text-white" style={{ fontFamily: "var(--font-unbounded)" }}>
                {profile.firstName} {profile.lastName}
              </p>
              <p className="mt-1 text-center text-sm" style={{ color: "var(--ink2)" }}>
                {profile.email}
              </p>
              <div
                className="mx-auto mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={readOnly ? { background: "rgba(220,30,30,.15)", color: "var(--red)", border: "1px solid rgba(220,30,30,.3)" } : { background: "var(--green-l)", color: "var(--green)", border: "1px solid var(--green-b)" }}
              >
                {readOnly ? "⚠ E-MAIL NIEZWERYFIKOWANY" : "✓ KONTO AKTYWNE"}
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex justify-between">
                  <span style={{ color: "var(--muted)" }}>Naprawy łącznie</span>
                  <span className="text-white">{stats?.total ?? "–"}</span>
                </li>
                <li className="flex justify-between">
                  <span style={{ color: "var(--muted)" }}>Klient od</span>
                  <span className="text-white">{profile.createdAt ? formatMonthYear(profile.createdAt) : "–"}</span>
                </li>
                <li className="flex justify-between">
                  <span style={{ color: "var(--muted)" }}>Ostatnie zgłoszenie</span>
                  <span className="text-white">{profile.lastRepairAt ? formatDate(profile.lastRepairAt) : "–"}</span>
                </li>
                <li className="flex justify-between">
                  <span style={{ color: "var(--muted)" }}>Preferowany kontakt</span>
                  <span className="text-white">
                    {PREFERRED_CONTACT_OPTIONS.find((o) => o.value === preferredContact)?.label ?? "E-mail"}
                  </span>
                </li>
              </ul>
              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <p className="text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  Numer klienta
                </p>
                <p className="mt-1 font-mono text-sm text-white" style={{ fontFamily: "'Courier New', monospace" }}>
                  {profile.id}
                </p>
              </div>
            </>
          ) : (
            <div className="skeleton h-64 rounded-lg" />
          )}
        </div>

        {/* Form cards (right) */}
        <div className="space-y-6">
          {/* Dane kontaktowe */}
          <div className="panel-card">
            <div className="panel-card-header flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg" style={{ background: "var(--red-l)", border: "1px solid var(--red-border)" }}>
                👤
              </span>
              <div>
                <h2 className="font-bold text-white" style={{ fontFamily: "var(--font-unbounded)", fontSize: 13 }}>
                  Dane kontaktowe
                </h2>
                <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--muted)" }}>
                  Imię, nazwisko, telefon i preferowany sposób kontaktu
                </p>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase" style={{ color: "var(--muted)" }}>
                  E-mail
                </label>
                <input
                  type="email"
                  readOnly
                  value={profile?.email ?? ""}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--island3)] px-3 py-2.5 text-sm text-white read-only:opacity-80"
                />
                <p className="mt-1 text-[11px]" style={{ color: "var(--muted)" }}>tylko do odczytu</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase" style={{ color: "var(--muted)" }}>Imię</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    readOnly={readOnly}
                    disabled={readOnly}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--island3)] px-3 py-2.5 text-sm text-white disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase" style={{ color: "var(--muted)" }}>Nazwisko</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    readOnly={readOnly}
                    disabled={readOnly}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--island3)] px-3 py-2.5 text-sm text-white disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase" style={{ color: "var(--muted)" }}>Telefon</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  readOnly={readOnly}
                  disabled={readOnly}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--island3)] px-3 py-2.5 text-sm text-white disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase" style={{ color: "var(--muted)" }}>Preferowany kontakt</label>
                <select
                  value={preferredContact}
                  onChange={(e) => setPreferredContact(e.target.value as PreferredContact)}
                  disabled={readOnly}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--island3)] px-3 py-2.5 text-sm text-white disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {PREFERRED_CONTACT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {!readOnly && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveContact}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-60 hover:opacity-90"
                    style={{ background: "var(--red)" }}
                  >
                    ✓ Zapisz zmiany
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Adres dostawy */}
          <div className="panel-card">
            <div className="panel-card-header flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg" style={{ background: "var(--blue-l)", border: "1px solid var(--blue-b)" }}>
                📍
              </span>
              <div>
                <h2 className="font-bold text-white" style={{ fontFamily: "var(--font-unbounded)", fontSize: 13 }}>
                  Adres dostawy
                </h2>
                <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--muted)" }}>
                  Wykorzystywany przy wysyłce kurierskiej
                </p>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase" style={{ color: "var(--muted)" }}>Ulica i numer</label>
                <input
                  type="text"
                  placeholder="np. ul. Leśna 7/3"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  readOnly={readOnly}
                  disabled={readOnly}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--island3)] px-3 py-2.5 text-sm text-white placeholder:opacity-60 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase" style={{ color: "var(--muted)" }}>Miasto</label>
                  <input
                    type="text"
                    placeholder="np. Kraków"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    readOnly={readOnly}
                    disabled={readOnly}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--island3)] px-3 py-2.5 text-sm text-white placeholder:opacity-60 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase" style={{ color: "var(--muted)" }}>Kod pocztowy</label>
                  <input
                    type="text"
                    placeholder="00-000"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    readOnly={readOnly}
                    disabled={readOnly}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--island3)] px-3 py-2.5 text-sm text-white placeholder:opacity-60 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase" style={{ color: "var(--muted)" }}>Kraj</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  readOnly={readOnly}
                  disabled={readOnly}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--island3)] px-3 py-2.5 text-sm text-white disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>
              <p className="text-[11px]" style={{ color: "var(--muted)" }}>Adres używany przy zleceniach kurierskich</p>
              {!readOnly && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveAddress}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-60 hover:opacity-90"
                    style={{ background: "var(--red)" }}
                  >
                    ✓ Zapisz zmiany
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Hasło i bezpieczeństwo */}
          <div className="panel-card">
            <div className="panel-card-header flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg" style={{ background: "var(--amber-l)", border: "1px solid var(--amber-b)" }}>
                🔒
              </span>
              <div>
                <h2 className="font-bold text-white" style={{ fontFamily: "var(--font-unbounded)", fontSize: 13 }}>
                  Hasło i bezpieczeństwo
                </h2>
                <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--muted)" }}>
                  Zmiana hasła i zgody marketingowe
                </p>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <label className={`flex items-center gap-2 ${readOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={() => setMarketing(!marketing)}
                  disabled={readOnly}
                  className="rounded border-[var(--border)] bg-[var(--island3)] text-[var(--red)] focus:ring-[var(--red)] disabled:cursor-not-allowed"
                />
                <span className="text-sm" style={{ color: "var(--ink)" }}>Akceptuję komunikację marketingową</span>
              </label>

              {/* Zmiana hasła */}
              <div className="border-t border-[var(--border)] pt-4 mt-4 space-y-3">
                <p className="text-xs font-medium" style={{ color: "var(--ink)" }}>Zmiana hasła</p>
                {readOnly ? (
                  <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                    Zweryfikuj adres e-mail, aby odblokować zmianę hasła i preferencji.
                  </p>
                ) : (
                  <>
                    <div>
                      <label className="block text-[11px] mb-1" style={{ color: "var(--muted)" }}>Aktualne hasło</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(null); }}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="w-full rounded-lg border bg-[var(--island3)] px-3 py-2 text-sm text-white placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--red)]"
                        style={{ borderColor: "var(--border)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] mb-1" style={{ color: "var(--muted)" }}>Nowe hasło (min. 8 znaków)</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="w-full rounded-lg border bg-[var(--island3)] px-3 py-2 text-sm text-white placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--red)]"
                        style={{ borderColor: "var(--border)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] mb-1" style={{ color: "var(--muted)" }}>Powtórz nowe hasło</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="w-full rounded-lg border bg-[var(--island3)] px-3 py-2 text-sm text-white placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--red)]"
                        style={{ borderColor: "var(--border)" }}
                      />
                    </div>
                    {passwordError && <p className="text-[11px]" style={{ color: "var(--red)" }}>{passwordError}</p>}
                    {passwordSuccess && <p className="text-[11px]" style={{ color: "var(--green)" }}>Hasło zostało zmienione.</p>}
                  </>
                )}
              </div>

              {!readOnly && (
                <div className="flex flex-wrap items-center gap-3 justify-end pt-2">
                  {currentPassword || newPassword || confirmPassword ? (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!token) return;
                        setPasswordError(null);
                        setPasswordSuccess(false);
                        if (newPassword.length < 8) {
                          setPasswordError("Nowe hasło musi mieć co najmniej 8 znaków.");
                          return;
                        }
                        if (newPassword !== confirmPassword) {
                          setPasswordError("Nowe hasła nie są identyczne.");
                          return;
                        }
                        setIsChangingPassword(true);
                        try {
                          await api.post<{ detail: string }>("/accounts/change-password/", { current_password: currentPassword, new_password: newPassword }, token);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                          setPasswordSuccess(true);
                          setPasswordError(null);
                        } catch (e) {
                          setPasswordError(e instanceof Error ? e.message : "Nie udało się zmienić hasła.");
                        } finally {
                          setIsChangingPassword(false);
                        }
                      }}
                      disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                      className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-60 hover:opacity-90"
                      style={{ background: "var(--red)" }}
                    >
                      {isChangingPassword ? "Zapisywanie…" : "Zmień hasło"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!token) return;
                      setIsSaving(true);
                      try {
                        await api.patch<ApiClientProfile>("/clients/me/", { accepts_marketing: marketing }, token);
                        refetchProfile();
                        showToast();
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-60 hover:opacity-90"
                    style={{ background: "var(--red)" }}
                  >
                    ✓ Zapisz zmiany
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastVisible && (
        <div
          className="fixed bottom-7 right-7 z-[500] flex items-center gap-3 rounded-xl border border-[var(--green-b)] px-4 py-3 shadow-lg"
          style={{ background: "var(--island2)", animation: "saveSuccess .3s ease both" }}
        >
          <span className="text-xl">✅</span>
          <span className="text-sm font-medium text-white">Zmiany zostały zapisane</span>
        </div>
      )}
    </div>
  );
}