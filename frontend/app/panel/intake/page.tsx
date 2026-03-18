"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

const DEVICE_CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "phone", label: "Telefon" },
  { value: "tablet", label: "Tablet" },
  { value: "smartwatch", label: "Smartwatch" },
  { value: "laptop", label: "Laptop" },
  { value: "desktop", label: "Komputer" },
  { value: "printer", label: "Drukarka" },
  { value: "console", label: "Konsola" },
  { value: "data_recovery", label: "Odzyskiwanie danych" },
  { value: "other", label: "Inne" },
];

export default function IntakePage() {
  const { token } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deviceCategory, setDeviceCategory] = useState("phone");
  const [deviceModelName, setDeviceModelName] = useState("");
  const [problemDescription, setProblemDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        problem_description: problemDescription.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        device_category: deviceCategory,
        device_model_name: deviceModelName.trim() || undefined,
      };

      const res = await api.post<{ id: string; repair_number: string }>(`/repairs/quick-accept/`, payload, token);
      router.push(`/panel/repairs/${res.id}`);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Nie udało się przyjąć zgłoszenia.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#9ca3af]">Przyjęcie stacjonarne</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Szybkie przyjęcie</h1>
        <p className="mt-1 text-sm text-[#9ca3af]">
          Minimalny workflow wg backendu: klient + urządzenie + opis problemu. Potem uzupełnimy szczegóły w naprawie.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
        {error && <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-[#fca5a5]">{error}</div>}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Imię</div>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#dc1e1e]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Nazwisko</div>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#dc1e1e]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Telefon</div>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#dc1e1e]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">E-mail</div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#dc1e1e]" />
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Kategoria urządzenia</div>
            <select value={deviceCategory} onChange={(e) => setDeviceCategory(e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#dc1e1e]">
              {DEVICE_CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Model (opcjonalnie)</div>
            <input value={deviceModelName} onChange={(e) => setDeviceModelName(e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#dc1e1e]" placeholder="np. iPhone 15 Pro" />
          </div>
        </div>

        <div className="mt-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Opis problemu</div>
          <textarea
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            className="mt-1 w-full resize-none rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#dc1e1e]"
            rows={5}
            placeholder="Co dokładnie się dzieje? Objawy, zachowanie, cokolwiek co klient podał…"
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="submit" disabled={submitting} className="rounded-2xl bg-[#dc1e1e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b81818] disabled:opacity-60">
            {submitting ? "Przyjmuję…" : "Przyjmij zgłoszenie"}
          </button>
        </div>
      </form>
    </main>
  );
}

