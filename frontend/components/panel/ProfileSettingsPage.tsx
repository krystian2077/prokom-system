"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BadgeCheck, CalendarDays, CircleCheckBig, Clock3, KeyRound, Mail, Phone, ShieldCheck, Sparkles, TriangleAlert, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

type PanelRole = "admin" | "staff";

type BannerState = { type: "ok" | "err"; text: string } | null;

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getInitials(fullName?: string | null, email?: string | null) {
  const source = (fullName || email || "?").trim();
  const parts = source.includes("@") ? [source.split("@")[0]] : source.split(/\s+/);
  const initials = parts
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "?";
}

function FieldRow({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "accent" | "success";
}) {
  const toneClass =
    tone === "accent"
      ? "border-[rgba(59,130,246,.28)] bg-[rgba(59,130,246,.08)] text-[var(--white)]"
      : tone === "success"
        ? "border-[rgba(34,197,94,.24)] bg-[rgba(34,197,94,.08)] text-[var(--white)]"
        : "border-[var(--border)] bg-[var(--row-hover)] text-[var(--white)]";

  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${toneClass}`}>
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[var(--ink2)]">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">{label}</div>
        <div className="mt-1 break-words text-sm font-medium leading-5 text-[var(--white)]">{value}</div>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[rgba(59,130,246,.22)] bg-[rgba(59,130,246,.10)] text-[var(--blue)] shadow-[0_0_24px_rgba(59,130,246,.12)]">
        <Sparkles size={18} />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink2)]">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">{title}</h2>
        <p className="mt-1 text-sm text-[var(--ink2)]">{description}</p>
      </div>
    </div>
  );
}

function ProfileSettingsPage({ panelRole }: { panelRole: PanelRole }) {
  const { token, user, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  const [banner, setBanner] = useState<BannerState>(null);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.first_name ?? "");
    setLastName(user.last_name ?? "");
    setPhone(user.phone ?? "");
  }, [user]);

  const effectiveRole = user?.role ?? panelRole;
  const isAdmin = effectiveRole === "admin";
  const roleLabel = isAdmin ? "Administrator" : "Pracownik";
  const panelLabel = isAdmin ? "Panel administratora" : "Panel pracownika";
  const profileName = user?.full_name?.trim() || [firstName, lastName].filter(Boolean).join(" ") || user?.email || "Mój profil";
  const initials = useMemo(() => getInitials(user?.full_name || profileName, user?.email), [profileName, user?.email, user?.full_name]);
  const emailVerified = user?.email_verified !== false;
  const accountActive = user?.is_active !== false;
  const lastLogin = formatDateTime(user?.last_login);
  const joinedAt = formatDateTime(user?.date_joined);
  const specialization = user?.staff_profile?.specialization_display || "Brak przypisanej specjalizacji";

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setBanner(null);
    try {
      await api.patch(
        "/accounts/me/",
        { first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim() },
        token,
      );
      await refreshUser();
      setBanner({ type: "ok", text: "Dane profilu zostały zapisane i odświeżone." });
    } catch (err) {
      setBanner({ type: "err", text: err instanceof Error ? err.message : "Nie udało się zapisać profilu." });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (newPwd !== newPwd2) {
      setBanner({ type: "err", text: "Powtórzone hasło jest inne niż nowe hasło." });
      return;
    }
    if (newPwd.length < 8) {
      setBanner({ type: "err", text: "Nowe hasło musi mieć co najmniej 8 znaków." });
      return;
    }
    setPwdSaving(true);
    setBanner(null);
    try {
      await api.post("/accounts/change-password/", { current_password: curPwd, new_password: newPwd }, token);
      setCurPwd("");
      setNewPwd("");
      setNewPwd2("");
      setBanner({ type: "ok", text: "Hasło zostało zmienione." });
    } catch (err) {
      setBanner({ type: "err", text: err instanceof Error ? err.message : "Nie udało się zmienić hasła." });
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--ink2)]">{panelLabel}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--white)] sm:text-4xl">Mój profil</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink2)] sm:text-[15px]">
            Zarządzaj danymi konta, bezpieczeństwem logowania i informacjami widocznymi w panelu.
          </p>
        </div>

        <div className="rounded-full border border-[rgba(59,130,246,.24)] bg-[rgba(59,130,246,.08)] px-4 py-2 text-sm font-semibold text-[var(--white)] shadow-[0_0_28px_rgba(59,130,246,.10)]">
          {roleLabel}
        </div>
      </div>

      {banner ? (
        <div
          className="mb-6 flex items-start gap-3 rounded-3xl border px-4 py-4 text-sm"
          aria-live="polite"
          style={{
            borderColor: banner.type === "ok" ? "rgba(34,197,94,.32)" : "rgba(248,113,113,.32)",
            background: banner.type === "ok" ? "rgba(34,197,94,.10)" : "rgba(248,113,113,.08)",
            color: banner.type === "ok" ? "#dcfce7" : "#fecaca",
          }}
        >
          <span className="mt-0.5">
            {banner.type === "ok" ? <CircleCheckBig size={18} /> : <TriangleAlert size={18} />}
          </span>
          <span className="font-medium">{banner.text}</span>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-24 h-fit overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(15,23,42,.92)_0%,rgba(15,23,42,.82)_100%)] shadow-[0_20px_60px_rgba(0,0,0,.20)]">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] border border-[rgba(59,130,246,.32)] bg-[radial-gradient(circle_at_top,rgba(96,165,250,.35),rgba(37,99,235,.88))] text-2xl font-bold text-white shadow-[0_18px_34px_rgba(59,130,246,.28)]">
                <span className="absolute inset-0 rounded-[28px] ring-1 ring-white/10" />
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-semibold text-[var(--white)]">{profileName}</h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(59,130,246,.22)] bg-[rgba(59,130,246,.10)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue)]">
                    <ShieldCheck size={12} />
                    {roleLabel}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-2 text-sm text-[var(--ink2)]">
                  <Mail size={14} />
                  <span className="truncate">{user?.email ?? "—"}</span>
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <FieldRow icon={<Mail size={16} />} label="E-mail" value={user?.email ?? "—"} tone="accent" />
              <FieldRow icon={<Phone size={16} />} label="Telefon" value={phone.trim() || user?.phone || "Brak numeru"} />
              <FieldRow
                icon={<BadgeCheck size={16} />}
                label="Weryfikacja"
                value={emailVerified ? "E-mail zweryfikowany" : "E-mail wymaga uwagi"}
                tone={emailVerified ? "success" : "default"}
              />
              <FieldRow
                icon={<Clock3 size={16} />}
                label="Ostatnie logowanie"
                value={lastLogin}
              />
            </div>

            <div className="mt-5 rounded-3xl border border-[var(--border)] bg-[rgba(255,255,255,.03)] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--white)]">
                <CalendarDays size={16} className="text-[var(--blue)]" />
                Informacje o koncie
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--ink2)]">Status</dt>
                  <dd className="font-medium text-[var(--white)]">{accountActive ? "Aktywne" : "Nieaktywne"}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--ink2)]">Dołączono</dt>
                  <dd className="font-medium text-[var(--white)]">{joinedAt}</dd>
                </div>
                {effectiveRole === "admin" ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--ink2)]">Specjalizacja</dt>
                    <dd className="max-w-[180px] truncate font-medium text-[var(--white)]">{specialization}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(17,24,39,.94)_0%,rgba(15,23,42,.92)_100%)] shadow-[0_20px_60px_rgba(0,0,0,.16)]">
            <div className="border-b border-[var(--border)] px-6 py-5">
              <SectionTitle
                eyebrow="Dane podstawowe"
                title="Profil kontaktowy"
                description="Dane widoczne w panelu i używane do identyfikacji konta."
              />
            </div>

            <form onSubmit={saveProfile} className="space-y-6 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">
                    Imię
                  </label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-3 text-sm text-[var(--white)] outline-none transition placeholder:text-[var(--ink2)] focus:border-[rgba(59,130,246,.65)] focus:ring-2 focus:ring-[rgba(59,130,246,.15)]"
                    autoComplete="given-name"
                    placeholder="Wpisz imię"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">
                    Nazwisko
                  </label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-3 text-sm text-[var(--white)] outline-none transition placeholder:text-[var(--ink2)] focus:border-[rgba(59,130,246,.65)] focus:ring-2 focus:ring-[rgba(59,130,246,.15)]"
                    autoComplete="family-name"
                    placeholder="Wpisz nazwisko"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">
                    Telefon
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-3 text-sm text-[var(--white)] outline-none transition placeholder:text-[var(--ink2)] focus:border-[rgba(59,130,246,.65)] focus:ring-2 focus:ring-[rgba(59,130,246,.15)]"
                    autoComplete="tel"
                    placeholder="+48 ..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">
                    Rola
                  </label>
                  <div className="flex h-[48px] items-center rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 text-sm font-medium text-[var(--white)]">
                    {roleLabel}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">
                  E-mail logowania
                </label>
                <input
                  value={user?.email ?? ""}
                  readOnly
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-3 text-sm text-[var(--ink2)] outline-none"
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-[var(--ink2)]">
                  Zapisz zmiany kontaktowe, aby profil w panelu był zawsze aktualny.
                </div>
                <button
                  type="submit"
                  disabled={saving || !token}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(59,130,246,.40)] bg-[linear-gradient(135deg,rgba(59,130,246,.34),rgba(37,99,235,.18))] px-5 py-3 text-sm font-semibold text-[var(--white)] shadow-[0_14px_34px_rgba(59,130,246,.16)] transition hover:border-[rgba(59,130,246,.58)] hover:bg-[linear-gradient(135deg,rgba(59,130,246,.44),rgba(37,99,235,.26))] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Sparkles size={16} />
                  {saving ? "Zapisywanie…" : "Zapisz zmiany"}
                </button>
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(17,24,39,.94)_0%,rgba(15,23,42,.92)_100%)] shadow-[0_20px_60px_rgba(0,0,0,.16)]">
            <div className="border-b border-[var(--border)] px-6 py-5">
              <SectionTitle
                eyebrow="Bezpieczeństwo"
                title="Zmiana hasła"
                description="Wprowadź aktualne hasło i ustaw nowe zgodne z zasadami bezpieczeństwa."
              />
            </div>

            <div className="grid gap-6 px-6 py-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <form onSubmit={changePassword} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">
                    Aktualne hasło
                  </label>
                  <input
                    type="password"
                    value={curPwd}
                    onChange={(e) => setCurPwd(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-3 text-sm text-[var(--white)] outline-none transition placeholder:text-[var(--ink2)] focus:border-[rgba(59,130,246,.65)] focus:ring-2 focus:ring-[rgba(59,130,246,.15)]"
                    autoComplete="current-password"
                    placeholder="Wpisz aktualne hasło"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">
                      Nowe hasło
                    </label>
                    <input
                      type="password"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-3 text-sm text-[var(--white)] outline-none transition placeholder:text-[var(--ink2)] focus:border-[rgba(59,130,246,.65)] focus:ring-2 focus:ring-[rgba(59,130,246,.15)]"
                      autoComplete="new-password"
                      placeholder="Min. 8 znaków"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">
                      Powtórz nowe hasło
                    </label>
                    <input
                      type="password"
                      value={newPwd2}
                      onChange={(e) => setNewPwd2(e.target.value)}
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-3 text-sm text-[var(--white)] outline-none transition placeholder:text-[var(--ink2)] focus:border-[rgba(59,130,246,.65)] focus:ring-2 focus:ring-[rgba(59,130,246,.15)]"
                      autoComplete="new-password"
                      placeholder="Powtórz nowe hasło"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-[var(--ink2)]">
                    Zalecamy użycie unikalnego hasła, którego nie stosujesz w innych systemach.
                  </div>
                  <button
                    type="submit"
                    disabled={pwdSaving || !token}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-5 py-3 text-sm font-semibold text-[var(--white)] transition hover:border-[var(--bb)] hover:bg-[var(--row-active)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <KeyRound size={16} />
                    {pwdSaving ? "Zmiana hasła…" : "Zmień hasło"}
                  </button>
                </div>
              </form>

              <div className="rounded-[24px] border border-[rgba(59,130,246,.18)] bg-[linear-gradient(180deg,rgba(59,130,246,.10)_0%,rgba(15,23,42,.24)_100%)] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--white)]">
                  <ShieldCheck size={16} className="text-[var(--blue)]" />
                  Szybki przegląd bezpieczeństwa
                </div>

                <ul className="mt-4 space-y-3 text-sm text-[var(--ink2)]">
                  <li className="flex items-start gap-2">
                    <UserRound size={15} className="mt-0.5 shrink-0 text-[var(--blue)]" />
                    <span>Spójne dane kontaktowe ułatwiają komunikację w panelu.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BadgeCheck size={15} className="mt-0.5 shrink-0 text-[var(--blue)]" />
                    <span>{emailVerified ? "Konto ma zweryfikowany e-mail i jest gotowe do pracy." : "Zweryfikuj e-mail, aby zwiększyć bezpieczeństwo konta."}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock3 size={15} className="mt-0.5 shrink-0 text-[var(--blue)]" />
                    <span>{lastLogin !== "—" ? `Ostatnie logowanie: ${lastLogin}` : "Brak danych o ostatnim logowaniu."}</span>
                  </li>
                </ul>

                <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,.03)] p-4 text-sm text-[var(--ink2)]">
                  Jeśli zauważysz nieautoryzowaną aktywność, zmień hasło i skontaktuj się z zespołem wsparcia.
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export { ProfileSettingsPage };
export default ProfileSettingsPage;



