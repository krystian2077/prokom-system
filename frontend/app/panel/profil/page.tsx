"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

export default function StaffProfilePage() {
  const { token, user, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.first_name ?? "");
    setLastName(user.last_name ?? "");
    setPhone(user.phone ?? "");
  }, [user]);

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
      setBanner({ type: "ok", text: "Zapisano dane profilu." });
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
      setBanner({ type: "err", text: "Powtórzenie nowego hasła jest inne niż nowe hasło." });
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
    <main className="mx-auto min-h-screen max-w-[640px] px-4 py-8">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">
          {user?.role === "admin" ? "Administrator" : "Pracownik"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--white)]">Mój profil</h1>
        <p className="mt-1 text-sm text-[var(--ink2)]">Imię, nazwisko, telefon oraz zmiana hasła do panelu.</p>
      </header>

      {banner ? (
        <div
          className="mb-6 rounded-2xl border px-4 py-3 text-sm font-medium"
          style={{
            borderColor: banner.type === "ok" ? "rgba(34,197,94,.35)" : "rgba(248,113,113,.35)",
            background: banner.type === "ok" ? "rgba(34,197,94,.10)" : "rgba(248,113,113,.08)",
            color: banner.type === "ok" ? "#bbf7d0" : "#fecaca",
          }}
        >
          {banner.text}
        </div>
      ) : null}

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-6" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)" }}>
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Dane konta</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">E-mail logowania: {user?.email ?? "—"}</p>

        <form onSubmit={saveProfile} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink2)]">Imię</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[rgba(59,130,246,.55)]"
              autoComplete="given-name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink2)]">Nazwisko</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[rgba(59,130,246,.55)]"
              autoComplete="family-name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink2)]">Telefon</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[rgba(59,130,246,.55)]"
              autoComplete="tel"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !token}
            className="w-full rounded-2xl border border-[rgba(59,130,246,.45)] bg-[rgba(59,130,246,.16)] py-2.5 text-sm font-semibold text-[var(--white)] transition hover:bg-[rgba(59,130,246,.24)] disabled:opacity-50"
          >
            {saving ? "Zapisywanie…" : "Zapisz dane"}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-6" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)" }}>
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Zmiana hasła</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">Podaj aktualne hasło i nowe (min. 8 znaków).</p>

        <form onSubmit={changePassword} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink2)]">Aktualne hasło</label>
            <input
              type="password"
              value={curPwd}
              onChange={(e) => setCurPwd(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[rgba(59,130,246,.55)]"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink2)]">Nowe hasło</label>
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[rgba(59,130,246,.55)]"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink2)]">Powtórz nowe hasło</label>
            <input
              type="password"
              value={newPwd2}
              onChange={(e) => setNewPwd2(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[rgba(59,130,246,.55)]"
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={pwdSaving || !token}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] py-2.5 text-sm font-semibold text-[#e5e7eb] transition hover:bg-[var(--row-active)] disabled:opacity-50"
          >
            {pwdSaving ? "Zmiana hasła…" : "Zmień hasło"}
          </button>
        </form>
      </section>
    </main>
  );
}
