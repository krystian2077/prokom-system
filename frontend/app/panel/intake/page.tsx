"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

const DEVICE_CATEGORY_OPTIONS: Array<{ value: string; label: string; icon: string }> = [
  { value: "phone", label: "Telefon", icon: "📱" },
  { value: "laptop", label: "Laptop", icon: "💻" },
  { value: "tablet", label: "Tablet", icon: "📟" },
  { value: "desktop", label: "Komputer", icon: "🖥" },
  { value: "printer", label: "Drukarka", icon: "🖨" },
  { value: "console", label: "Konsola", icon: "🎮" },
  { value: "smartwatch", label: "Smartwatch", icon: "⌚" },
  { value: "data_recovery", label: "Odzyskiwanie danych", icon: "💾" },
  { value: "other", label: "Inne", icon: "🧩" },
];

type IntakeStep = 1 | 2 | 3 | 4;

export default function IntakePage() {
  const { token } = useAuth();
  const router = useRouter();
  const modelRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<IntakeStep>(1);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deviceCategory, setDeviceCategory] = useState("phone");
  const [serviceType, setServiceType] = useState("");
  const [deviceModelName, setDeviceModelName] = useState("");
  const [problemDescription, setProblemDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryLabel = useMemo(
    () => DEVICE_CATEGORY_OPTIONS.find((c) => c.value === deviceCategory)?.label ?? "—",
    [deviceCategory],
  );

  const canGoStep2 = Boolean(firstName.trim() && lastName.trim() && phone.trim());
  const canGoStep3 = Boolean(deviceCategory && serviceType.trim());
  const canGoStep4 = Boolean(deviceModelName.trim() && problemDescription.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        problem_description: [
          serviceType.trim() ? `Zakres usługi: ${serviceType.trim()}` : "",
          problemDescription.trim(),
        ]
          .filter(Boolean)
          .join("\n\n"),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        device_category: deviceCategory,
        device_model_name: deviceModelName.trim() || undefined,
      };

      const res = await api.post<{ id: string; repair_number: string }>(`/repairs/quick-accept/`, payload, token);
      router.push(`/panel/naprawy/${res.id}`);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Nie udało się przyjąć zgłoszenia.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepPill = (n: IntakeStep, label: string) => (
    <button
      type="button"
      onClick={() => setStep(n)}
      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
        step === n
          ? "border-[#3b82f6]/45 bg-[#3b82f6]/15 text-white"
          : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#9ca3af]">Przyjęcie stacjonarne</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Szybkie przyjęcie</h1>
        <p className="mt-1 text-sm text-[#9ca3af]">
          4 kroki: klient → kategoria i usługa → urządzenie → podsumowanie.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {stepPill(1, "Krok 1")}
          {stepPill(2, "Krok 2")}
          {stepPill(3, "Krok 3")}
          {stepPill(4, "Krok 4")}
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-12">
        <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5 lg:col-span-8">
          {error && <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-[#fca5a5]">{error}</div>}

          {step === 1 ? (
            <>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">Krok 1</div>
              <h2 className="mt-1 text-lg font-semibold text-white">Dane klienta</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Imię</div>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b82f6]" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Nazwisko</div>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b82f6]" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Telefon</div>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b82f6]" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">E-mail (opcjonalnie)</div>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b82f6]" />
                </div>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">Krok 2</div>
              <h2 className="mt-1 text-lg font-semibold text-white">Kategoria i zakres usługi</h2>
              <div className="mt-4 grid grid-cols-3 gap-[7px]">
                {DEVICE_CATEGORY_OPTIONS.map((c) => (
                  <motion.button
                    key={c.value}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => {
                      setDeviceCategory(c.value);
                      setTimeout(() => modelRef.current?.focus(), 200);
                    }}
                    className={`rounded-[9px] border-[1.5px] p-[9px_7px] text-center transition-all duration-150 ${
                      deviceCategory === c.value
                        ? "border-[#3b82f6] bg-[#3b82f6]/10"
                        : "border-[var(--faint)] bg-[var(--s3)] hover:border-[var(--border2)]"
                    }`}
                  >
                    <div className="mb-1 text-[17px]">{c.icon}</div>
                    <div className={`text-[11px] font-semibold ${deviceCategory === c.value ? "text-[#3b82f6]" : "text-[var(--muted)]"}`}>
                      {c.label}
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-4 py-3 text-sm text-[#bfdbfe]">
                💡 Wpisz zakres naprawy ręcznie — pełna swoboda opisu
              </div>
              <div className="mt-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Typ usługi</div>
                <input
                  type="text"
                  name="service_type"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder="Np. wymiana ekranu OLED + diagnostyka baterii"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b82f6]"
                />
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">Krok 3</div>
              <h2 className="mt-1 text-lg font-semibold text-white">Urządzenie i problem</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Model urządzenia</div>
                  <input
                    ref={modelRef}
                    value={deviceModelName}
                    onChange={(e) => setDeviceModelName(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b82f6]"
                    placeholder="np. iPhone 15 Pro"
                  />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Opis problemu</div>
                  <textarea
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    className="mt-1 w-full resize-none rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b82f6]"
                    rows={5}
                    placeholder="Co dokładnie się dzieje? Objawy, zachowanie, cokolwiek co klient podał…"
                  />
                </div>
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">Krok 4</div>
              <h2 className="mt-1 text-lg font-semibold text-white">Podsumowanie i zapis</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[#111318] p-4">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-[#8b93a8]">Klient</div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {firstName} {lastName}
                  </div>
                  <div className="mt-1 text-xs text-[#9ca3af]">{phone}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#111318] p-4">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-[#8b93a8]">Urządzenie</div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {categoryLabel} · {deviceModelName || "—"}
                  </div>
                  <div className="mt-1 text-xs text-[#9ca3af]">{serviceType || "—"}</div>
                </div>
              </div>
              <div className="mt-3 rounded-2xl border border-white/10 bg-[#111318] p-4">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[#8b93a8]">Opis problemu</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-[#e5e7eb]">{problemDescription || "—"}</div>
              </div>
            </>
          ) : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as IntakeStep) : s))}
              disabled={step === 1}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              Wstecz
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s < 4 ? ((s + 1) as IntakeStep) : s))}
                disabled={
                  (step === 1 && !canGoStep2) ||
                  (step === 2 && !canGoStep3) ||
                  (step === 3 && !canGoStep4)
                }
                className="rounded-2xl bg-[#3b82f6] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2563eb] disabled:opacity-60"
              >
                Dalej
              </button>
            ) : (
              <button type="submit" disabled={submitting} className="rounded-2xl bg-[#dc1e1e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b81818] disabled:opacity-60">
                {submitting ? "Przyjmuję…" : "Przyjmij zgłoszenie"}
              </button>
            )}
          </div>
        </section>

        <aside className="rounded-3xl border border-white/10 bg-[#0f1117] p-5 lg:col-span-4">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">Podgląd zgłoszenia</div>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#8b93a8]">Klient</div>
              <div className="mt-1 text-sm font-semibold text-white">
                {firstName || "—"} {lastName || ""}
              </div>
              <div className="mt-1 text-xs text-[#9ca3af]">{phone || "Brak telefonu"}</div>
              <div className="mt-1 text-xs text-[#9ca3af]">{email || "Brak e-maila"}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#8b93a8]">Urządzenie</div>
              <div className="mt-1 text-sm font-semibold text-white">{categoryLabel}</div>
              <div className="mt-1 text-xs text-[#9ca3af]">{deviceModelName || "Model niepodany"}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#8b93a8]">Zakres usługi</div>
              <div className="mt-1 text-sm text-[#e5e7eb]">{serviceType || "Brak opisu"}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#8b93a8]">Problem</div>
              <div className="mt-1 line-clamp-5 text-sm text-[#e5e7eb]">{problemDescription || "Brak opisu problemu"}</div>
            </div>
          </div>
        </aside>
      </form>
    </main>
  );
}

