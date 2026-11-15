"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useClientProfile } from "@/hooks/useClientProfile";
import { type ApiClientProfile } from "@/lib/panel-api";
import { apiMySummaryToDashboardStats, type ApiMySummary } from "@/lib/panel-api";
import { formatDate, formatMonthYear } from "@/lib/format";
import type { PreferredContact } from "@/types/panel";
import type { DashboardStats } from "@/types/panel";
import { IconCheck, IconPin, IconUser } from "@/components/tech/icons";
import { IconKey } from "@/components/tech/account/account-icons";
import { AuthAlert, PasswordField } from "@/components/tech/account/AuthParts";
import { KeyValue, PageHead, Panel, Skel } from "@/components/tech/account/AccountUi";

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
    api
      .get<ApiMySummary>("/repairs/my-summary/", token)
      .then((data) => {
        if (!cancelled) setStats(apiMySummaryToDashboardStats(data as ApiMySummary));
      })
      .catch(() => {});
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
      <div className="t-ck-page" aria-busy="true">
        <Skel w={220} h={36} r={10} />
        <div className="t-ck-profgrid">
          <Skel h={360} r={28} />
          <div className="t-ck-stack t-ck-stack--l">
            <Skel h={300} r={28} />
            <Skel h={300} r={28} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="t-ck-page">
      <PageHead
        eyebrow="Profil"
        title="Profil"
        lead={readOnly ? "Podgląd danych. Zweryfikuj e-mail, aby edytować." : "Edytuj swoje dane kontaktowe i ustawienia konta"}
      />

      <div className="t-ck-profgrid">
        {/* Identity card */}
        <aside className="t-ck-card t-ck-id">
          {profile ? (
            <>
              <span className="t-ck-avatar t-ck-avatar--l" aria-hidden="true">
                {profile.firstName?.[0]?.toUpperCase() ?? "?"}
              </span>
              <p className="t-ck-id__name">
                {profile.firstName} {profile.lastName}
              </p>
              <p className="t-ck-id__mail">{profile.email}</p>
              <span className={`t-ck-pill ${readOnly ? "t-ck-pill--wait" : "t-ck-pill--ready"}`}>
                <i aria-hidden="true" />
                {readOnly ? "E-mail niezweryfikowany" : "Konto aktywne"}
              </span>
              <dl className="t-ck-kvs">
                <KeyValue label="Naprawy łącznie">{stats?.total ?? "–"}</KeyValue>
                <KeyValue label="Klient od">{profile.createdAt ? formatMonthYear(profile.createdAt) : "–"}</KeyValue>
                <KeyValue label="Ostatnie zgłoszenie">{profile.lastRepairAt ? formatDate(profile.lastRepairAt) : "–"}</KeyValue>
                <KeyValue label="Preferowany kontakt">
                  {PREFERRED_CONTACT_OPTIONS.find((o) => o.value === preferredContact)?.label ?? "E-mail"}
                </KeyValue>
              </dl>
              <div className="t-ck-id__num">
                <span className="t-ck-k">Numer klienta</span>
                <p className="t-ck-ref">{profile.id}</p>
              </div>
            </>
          ) : (
            <Skel h={260} r={20} />
          )}
        </aside>

        <div className="t-ck-stack t-ck-stack--l">
          {/* Dane kontaktowe */}
          <Panel title="Dane kontaktowe" desc="Imię, nazwisko, telefon i preferowany sposób kontaktu" icon={<IconUser size={18} />}>
            <div className="t-ck-form">
              <div className="t-ck-field">
                <label htmlFor="pf-email">E-mail</label>
                <input id="pf-email" type="email" readOnly value={profile?.email ?? ""} aria-describedby="pf-email-hint" />
                <span className="t-ck-field__hint" id="pf-email-hint">
                  tylko do odczytu
                </span>
              </div>
              <div className="t-ck-grid2">
                <div className="t-ck-field">
                  <label htmlFor="pf-fname">Imię</label>
                  <input id="pf-fname" type="text" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} readOnly={readOnly} disabled={readOnly} />
                </div>
                <div className="t-ck-field">
                  <label htmlFor="pf-lname">Nazwisko</label>
                  <input id="pf-lname" type="text" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} readOnly={readOnly} disabled={readOnly} />
                </div>
              </div>
              <div className="t-ck-field">
                <label htmlFor="pf-phone">Telefon</label>
                <input id="pf-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} readOnly={readOnly} disabled={readOnly} />
              </div>
              <div className="t-ck-field">
                <label htmlFor="pf-contact">Preferowany kontakt</label>
                <select id="pf-contact" value={preferredContact} onChange={(e) => setPreferredContact(e.target.value as PreferredContact)} disabled={readOnly}>
                  {PREFERRED_CONTACT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {!readOnly && (
                <div className="t-ck-actions t-ck-actions--desk">
                  <button type="button" onClick={handleSaveContact} disabled={isSaving} className="t-pbtn t-pbtn--acc t-pbtn--m">
                    <IconCheck size={16} strokeWidth={2.8} />
                    Zapisz zmiany
                  </button>
                </div>
              )}
            </div>
          </Panel>

          {/* Adres dostawy */}
          <Panel title="Adres dostawy" desc="Wykorzystywany przy wysyłce kurierskiej" icon={<IconPin size={18} />}>
            <div className="t-ck-form">
              <div className="t-ck-field">
                <label htmlFor="pf-street">Ulica i numer</label>
                <input id="pf-street" type="text" autoComplete="street-address" placeholder="np. ul. Leśna 7/3" value={street} onChange={(e) => setStreet(e.target.value)} readOnly={readOnly} disabled={readOnly} />
              </div>
              <div className="t-ck-grid2">
                <div className="t-ck-field">
                  <label htmlFor="pf-city">Miasto</label>
                  <input id="pf-city" type="text" autoComplete="address-level2" placeholder="np. Kraków" value={city} onChange={(e) => setCity(e.target.value)} readOnly={readOnly} disabled={readOnly} />
                </div>
                <div className="t-ck-field">
                  <label htmlFor="pf-zip">Kod pocztowy</label>
                  <input id="pf-zip" type="text" autoComplete="postal-code" inputMode="numeric" placeholder="00-000" value={zip} onChange={(e) => setZip(e.target.value)} readOnly={readOnly} disabled={readOnly} />
                </div>
              </div>
              <div className="t-ck-field">
                <label htmlFor="pf-country">Kraj</label>
                <input id="pf-country" type="text" autoComplete="country-name" value={country} onChange={(e) => setCountry(e.target.value)} readOnly={readOnly} disabled={readOnly} />
                <span className="t-ck-field__hint">Adres używany przy zleceniach kurierskich</span>
              </div>
              {!readOnly && (
                <div className="t-ck-actions t-ck-actions--desk">
                  <button type="button" onClick={handleSaveAddress} disabled={isSaving} className="t-pbtn t-pbtn--acc t-pbtn--m">
                    <IconCheck size={16} strokeWidth={2.8} />
                    Zapisz zmiany
                  </button>
                </div>
              )}
            </div>
          </Panel>

          {/* Hasło i bezpieczeństwo */}
          <Panel title="Hasło i bezpieczeństwo" desc="Zmiana hasła i zgody marketingowe" icon={<IconKey size={18} />}>
            <div className="t-ck-form">
              <label className={`t-ck-check${readOnly ? " is-off" : ""}`}>
                <input type="checkbox" checked={marketing} onChange={() => setMarketing(!marketing)} disabled={readOnly} />
                <span>Akceptuję komunikację marketingową</span>
              </label>

              <div className="t-ck-subsection">
                <p className="t-ck-k">Zmiana hasła</p>
                {readOnly ? (
                  <p className="t-ck-note">Zweryfikuj adres e-mail, aby odblokować zmianę hasła i preferencji.</p>
                ) : (
                  <div className="t-ck-form">
                    <PasswordField
                      id="pf-current"
                      label="Aktualne hasło"
                      value={currentPassword}
                      onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(null); }}
                      placeholder="Twoje obecne hasło"
                      autoComplete="current-password"
                    />
                    <PasswordField
                      id="pf-new"
                      label="Nowe hasło"
                      hint="Co najmniej 8 znaków."
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
                      placeholder="Min. 8 znaków"
                      autoComplete="new-password"
                    />
                    <PasswordField
                      id="pf-confirm"
                      label="Powtórz nowe hasło"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
                      placeholder="Wpisz hasło jeszcze raz"
                      autoComplete="new-password"
                    />
                    {passwordError && <AuthAlert>{passwordError}</AuthAlert>}
                    {passwordSuccess && <AuthAlert tone="ok">Hasło zostało zmienione.</AuthAlert>}
                  </div>
                )}
              </div>

              {!readOnly && (
                <div className="t-ck-actions">
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
                      className="t-pbtn t-pbtn--outline t-pbtn--m"
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
                    className="t-pbtn t-pbtn--acc t-pbtn--m"
                  >
                    <IconCheck size={16} strokeWidth={2.8} />
                    Zapisz zmiany
                  </button>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* Toast */}
      {toastVisible && (
        <div className="t-ck-toast" role="status">
          <span className="t-ck-toast__ico" aria-hidden="true">
            <IconCheck size={16} strokeWidth={2.8} />
          </span>
          Zmiany zostały zapisane
        </div>
      )}
      {!readOnly && (
        <div className="t-ck-savebar">
          <div className="t-ck-savebar__in">
            <button type="button" onClick={handleSaveContact} disabled={isSaving} className="t-pbtn t-pbtn--acc">
              Zapisz kontakt
            </button>
            <button type="button" onClick={handleSaveAddress} disabled={isSaving} className="t-pbtn t-pbtn--outline">
              Zapisz adres
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
