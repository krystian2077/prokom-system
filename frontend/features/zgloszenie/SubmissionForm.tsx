"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { User, Smartphone, Truck, Package, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { api } from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";
import { useAuth } from "@/contexts/AuthContext";
import type {
  PublicSubmitPayload,
  PublicSubmitResponse,
  PublicSubmitClient,
  PublicSubmitDevice,
} from "@/types/repair";
import {
  DEVICE_CATEGORIES,
  DELIVERY_METHODS,
  RETURN_METHODS,
  CONTACT_PREFERENCES,
  HAMMER_GLASS_INTEREST,
} from "@/types/repair";

function flattenFirstError(obj: Record<string, unknown>): string | null {
  for (const v of Object.values(obj)) {
    if (Array.isArray(v) && v[0]) return String(v[0]);
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const nested = flattenFirstError(v as Record<string, unknown>);
      if (nested) return nested;
    }
  }
  return null;
}

const STEPS = [
  { id: 1, title: "Dane kontaktowe", icon: User },
  { id: 2, title: "Urządzenie", icon: Smartphone },
  { id: 3, title: "Dostarczenie i zwrot", icon: Truck },
  { id: 4, title: "Hammer Glass / akcesoria", icon: Package },
  { id: 5, title: "Podsumowanie", icon: CheckCircle },
];

const emptyClient: PublicSubmitClient = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  preferred_contact: "email",
  street: "",
  city: "",
  postal_code: "",
  country: "Polska",
};

const emptyDevice: PublicSubmitDevice = {
  category: "",
  brand_name: "",
  model_name: "",
  problem_description: "",
  serial_number: "",
  imei: "",
};

const validCategoryValues = DEVICE_CATEGORIES.map((c) => c.value);

interface ClientProfileForForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  preferred_contact: string;
}

export function SubmissionForm() {
  const searchParams = useSearchParams();
  const { token, user: authUser, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [client, setClient] = useState<PublicSubmitClient>(emptyClient);
  const [device, setDevice] = useState<PublicSubmitDevice>(emptyDevice);

  useEffect(() => {
    const category = searchParams.get("category");
    if (category && validCategoryValues.includes(category as (typeof validCategoryValues)[number])) {
      setDevice((d) => ({ ...d, category }));
    }
  }, [searchParams]);

  const prefillDoneRef = useRef(false);

  // 1) Od razu uzupełnij z obiektu user (AuthContext) — imię, nazwisko, email, telefon
  useEffect(() => {
    if (authLoading || !authUser || authUser.role !== "client" || prefillDoneRef.current) return;
    setClient((prev) => ({
      ...prev,
      first_name: authUser.first_name ?? "",
      last_name: authUser.last_name ?? "",
      email: authUser.email ?? "",
      phone: authUser.phone ?? "",
    }));
    prefillDoneRef.current = true;
  }, [authUser, authLoading]);

  // 2) Uzupełnij pełny profil z /clients/me/ (adres, preferowany kontakt) gdy jest token
  useEffect(() => {
    if (!token || authLoading) return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await api.get<ClientProfileForForm>("/clients/me/", token);
        if (cancelled || !profile) return;
        setClient((prev) => ({
          ...prev,
          first_name: profile.first_name ?? prev.first_name,
          last_name: profile.last_name ?? prev.last_name,
          email: profile.email ?? prev.email,
          phone: profile.phone ?? prev.phone,
          preferred_contact: (profile.preferred_contact as PublicSubmitClient["preferred_contact"]) || prev.preferred_contact,
          street: profile.street ?? "",
          city: profile.city ?? "",
          postal_code: profile.postal_code ?? "",
          country: profile.country ?? "Polska",
        }));
      } catch {
        // Brak profilu klienta lub błąd sieci — dane z authUser już są w formularzu
      }
    })();
    return () => { cancelled = true; };
  }, [token, authLoading]);
  const [deliveryMethod, setDeliveryMethod] = useState("in_person");
  const [returnMethod, setReturnMethod] = useState("in_person");
  const [deliveryStreet, setDeliveryStreet] = useState("");
  const [deliveryHouseNumber, setDeliveryHouseNumber] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryPostalCode, setDeliveryPostalCode] = useState("");
  const [hammerGlassInterest, setHammerGlassInterest] = useState<string | null>(null);
  const [accessoryChooseForMe, setAccessoryChooseForMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PublicSubmitResponse | null>(null);

  const updateClient = (key: keyof PublicSubmitClient, value: string) => {
    setClient((c) => ({ ...c, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: "" }));
  };

  const updateDevice = (key: keyof PublicSubmitDevice, value: string | null) => {
    setDevice((d) => ({ ...d, [key]: value ?? "" }));
    setFieldErrors((e) => ({ ...e, [key]: "" }));
  };

  const validateStep1 = (): boolean => {
    const err: Record<string, string> = {};
    if (!client.first_name.trim()) err.client_first_name = "Podaj imię.";
    if (!client.last_name.trim()) err.client_last_name = "Podaj nazwisko.";
    if (!client.email.trim()) err.client_email = "Podaj adres e-mail.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) err.client_email = "Nieprawidłowy e-mail.";
    if (!client.phone.trim()) err.client_phone = "Podaj numer telefonu.";
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateStep2 = (): boolean => {
    const err: Record<string, string> = {};
    if (!device.category) err.device_category = "Wybierz kategorię urządzenia.";
    if (!device.problem_description.trim()) err.device_problem_description = "Opisz problem.";
    const needsModel = ["phone", "tablet", "smartwatch"].includes(device.category);
    if (needsModel && !(device.brand_name || "").trim()) err.device_brand_name = "Podaj markę urządzenia.";
    if (needsModel && !(device.model_name || "").trim()) err.device_model_name = "Podaj model urządzenia.";
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateStep3 = (): boolean => {
    if (deliveryMethod !== "in_person") {
      const err: Record<string, string> = {};
      if (!deliveryStreet.trim()) err.delivery_street = "Podaj ulicę.";
      if (!deliveryCity.trim()) err.delivery_city = "Podaj miasto.";
      setFieldErrors(err);
      return Object.keys(err).length === 0;
    }
    setFieldErrors({});
    return true;
  };

  const next = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setSubmitError(null);
    setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const back = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setSubmitError(null);
    setLoading(true);
    const payload: PublicSubmitPayload = {
      client: {
        ...client,
        preferred_contact: client.preferred_contact || "email",
        street: client.street || "",
        city: client.city || "",
        postal_code: client.postal_code || "",
        country: client.country || "Polska",
      },
      device: {
        ...device,
        brand_name: device.brand_name || "",
        model_name: device.model_name || "",
        serial_number: device.serial_number || "",
        imei: device.imei || "",
      },
      delivery_method: deliveryMethod as PublicSubmitPayload["delivery_method"],
      return_method: returnMethod as PublicSubmitPayload["return_method"],
      delivery_street: deliveryStreet || "",
      delivery_house_number: deliveryHouseNumber || "",
      delivery_city: deliveryCity || "",
      delivery_postal_code: deliveryPostalCode || "",
      delivery_country: "Polska",
      hammer_glass_interest: hammerGlassInterest || undefined,
      accessory_interest: [],
      accessory_choose_for_me: accessoryChooseForMe,
    };
    try {
      const authToken = token ?? getStoredToken();
      const res = await api.post<PublicSubmitResponse>("/repairs/submit/", payload, authToken ?? undefined);
      setResult(res as PublicSubmitResponse);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Wystąpił błąd. Spróbuj ponownie.";
      let errText = msg;
      const trimmed = msg.trim();
      if ((trimmed.startsWith("{") || trimmed.startsWith("[")) && trimmed.length < 2000) {
        try {
          const parsed = JSON.parse(msg) as Record<string, unknown>;
          if (parsed && typeof parsed === "object") {
            const d = (parsed as { detail?: string }).detail;
            if (typeof d === "string") errText = d;
            else errText = flattenFirstError(parsed) || msg;
          }
        } catch {
          /* zostaw msg */
        }
      }
      setSubmitError(errText.length > 500 ? `${errText.slice(0, 500)}…` : errText);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <PremiumCard hover={false} className="mx-auto max-w-lg p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <CheckCircle className="h-10 w-10" />
        </motion.div>
        <h2 className="mt-6 text-xl font-semibold text-dark">Zgłoszenie przyjęte</h2>
        <p className="mt-2 text-neutral">{result.message}</p>
        <p className="mt-2 font-mono font-medium text-dark">Numer: {result.repair_number}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {result.tracking_url && (
            <PremiumButton href={result.tracking_url} variant="outline" size="md">
              Śledź status naprawy
            </PremiumButton>
          )}
          <PremiumButton href="/" variant="ghost" size="md">
            Wróć na stronę główną
          </PremiumButton>
        </div>
      </PremiumCard>
    );
  }

  const progressPercent = (step / STEPS.length) * 100;
  const currentStepMeta = STEPS[step - 1];
  const StepIcon = currentStepMeta.icon;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="mt-4 flex justify-between">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className={`flex flex-col items-center gap-1 ${
                  step >= s.id ? "text-primary" : "text-neutral"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    step >= s.id ? "border-primary bg-primary/10" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="hidden text-xs font-medium sm:block">{s.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      <PremiumCard hover={false} className="p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <StepIcon className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-dark">{currentStepMeta.title}</h2>
        </div>
        <div className="space-y-4">
          {/* Step 1: Client */}
          {step === 1 && (
            <>
              <Input
                label="Imię"
                name="first_name"
                value={client.first_name}
                onChange={(e) => updateClient("first_name", e.target.value)}
                error={fieldErrors.client_first_name}
                required
              />
              <Input
                label="Nazwisko"
                name="last_name"
                value={client.last_name}
                onChange={(e) => updateClient("last_name", e.target.value)}
                error={fieldErrors.client_last_name}
                required
              />
              <Input
                label="E-mail"
                name="email"
                type="email"
                value={client.email}
                onChange={(e) => updateClient("email", e.target.value)}
                error={fieldErrors.client_email}
                required
              />
              <Input
                label="Telefon"
                name="phone"
                type="tel"
                value={client.phone}
                onChange={(e) => updateClient("phone", e.target.value)}
                error={fieldErrors.client_phone}
                required
              />
              <Select
                label="Preferowany kontakt"
                options={CONTACT_PREFERENCES.map((c) => ({ value: c.value, label: c.label }))}
                value={client.preferred_contact || "email"}
                onChange={(e) => updateClient("preferred_contact", e.target.value)}
              />
              <Input
                label="Ulica i numer (opcjonalnie)"
                name="street"
                value={client.street || ""}
                onChange={(e) => updateClient("street", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Miasto"
                  name="city"
                  value={client.city || ""}
                  onChange={(e) => updateClient("city", e.target.value)}
                />
                <Input
                  label="Kod pocztowy"
                  name="postal_code"
                  value={client.postal_code || ""}
                  onChange={(e) => updateClient("postal_code", e.target.value)}
                />
              </div>
            </>
          )}

          {/* Step 2: Device */}
          {step === 2 && (
            <>
              <Select
                label="Kategoria urządzenia"
                options={DEVICE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
                placeholder="Wybierz..."
                value={device.category}
                onChange={(e) => updateDevice("category", e.target.value)}
                error={fieldErrors.device_category}
              />
              <Input
                label="Marka urządzenia (np. Apple, Samsung, Dell)"
                name="brand_name"
                value={device.brand_name || ""}
                onChange={(e) => updateDevice("brand_name", e.target.value)}
                error={fieldErrors.device_brand_name}
              />
              <Input
                label="Model urządzenia (np. iPhone 14, Galaxy S23, Latitude 5520)"
                name="model_name"
                value={device.model_name || ""}
                onChange={(e) => updateDevice("model_name", e.target.value)}
                error={fieldErrors.device_model_name}
              />
              <Textarea
                label="Opis problemu"
                name="problem_description"
                value={device.problem_description}
                onChange={(e) => updateDevice("problem_description", e.target.value)}
                error={fieldErrors.device_problem_description}
                placeholder="Opisz usterkę, co się dzieje z urządzeniem..."
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Numer seryjny (opcjonalnie)"
                  name="serial_number"
                  value={device.serial_number || ""}
                  onChange={(e) => updateDevice("serial_number", e.target.value)}
                />
                <Input
                  label="IMEI (opcjonalnie)"
                  name="imei"
                  value={device.imei || ""}
                  onChange={(e) => updateDevice("imei", e.target.value)}
                />
              </div>
            </>
          )}

          {/* Step 3: Delivery */}
          {step === 3 && (
            <>
              <Select
                label="Jak dostarczysz urządzenie?"
                options={DELIVERY_METHODS.map((d) => ({ value: d.value, label: d.label }))}
                value={deliveryMethod}
                onChange={(e) => {
                  setDeliveryMethod(e.target.value);
                  setFieldErrors((err) => ({ ...err, delivery_street: "", delivery_city: "" }));
                }}
              />
              {deliveryMethod !== "in_person" && (
                <>
                  <Input
                    label="Ulica (adres wysyłki)"
                    value={deliveryStreet}
                    onChange={(e) => setDeliveryStreet(e.target.value)}
                    error={fieldErrors.delivery_street}
                  />
                  <Input
                    label="Numer domu / lokalu"
                    value={deliveryHouseNumber}
                    onChange={(e) => setDeliveryHouseNumber(e.target.value)}
                    placeholder="np. 26, 12/5"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Miasto"
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      error={fieldErrors.delivery_city}
                    />
                    <Input
                      label="Kod pocztowy"
                      value={deliveryPostalCode}
                      onChange={(e) => setDeliveryPostalCode(e.target.value)}
                    />
                  </div>
                </>
              )}
              <Select
                label="Jak chcesz odebrać urządzenie?"
                options={RETURN_METHODS.map((r) => ({ value: r.value, label: r.label }))}
                value={returnMethod}
                onChange={(e) => setReturnMethod(e.target.value)}
              />
            </>
          )}

          {/* Step 4: Hammer Glass / accessories */}
          {step === 4 && (
            <>
              <Select
                label="Zainteresowanie szkłem / folią Hammer Glass"
                options={HAMMER_GLASS_INTEREST.map((h) => ({ value: h.value, label: h.label }))}
                placeholder="Wybierz (opcjonalnie)"
                value={hammerGlassInterest ?? ""}
                onChange={(e) => setHammerGlassInterest(e.target.value || null)}
              />
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={accessoryChooseForMe}
                  onChange={(e) => setAccessoryChooseForMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-dark">Dobierzcie mi akcesoria (kabel, ładowarka, etui itd.)</span>
              </label>
            </>
          )}

          {/* Step 5: Summary */}
          {step === 5 && (
            <div className="space-y-3 text-sm">
              <p><strong>Kontakt:</strong> {client.first_name} {client.last_name}, {client.email}, {client.phone}</p>
              <p><strong>Urządzenie:</strong> {DEVICE_CATEGORIES.find((c) => c.value === device.category)?.label ?? device.category} — {[device.brand_name, device.model_name].filter(Boolean).join(" ") || "—"}</p>
              <p><strong>Problem:</strong> {device.problem_description}</p>
              <p><strong>Dostawa:</strong> {DELIVERY_METHODS.find((d) => d.value === deliveryMethod)?.label}, <strong>Zwrot:</strong> {RETURN_METHODS.find((r) => r.value === returnMethod)?.label}</p>
              {hammerGlassInterest && (
                <p><strong>Hammer Glass:</strong> {HAMMER_GLASS_INTEREST.find((h) => h.value === hammerGlassInterest)?.label}</p>
              )}
              {submitError && <p className="text-red-600">{submitError}</p>}
            </div>
          )}

          {/* Navigation */}
          {submitError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{submitError}</p>
          )}
          <div className="flex justify-between gap-4 pt-6">
            <PremiumButton
              type="button"
              variant="ghost"
              onClick={back}
              disabled={step === 1}
            >
              Wstecz
            </PremiumButton>
            {step < STEPS.length ? (
              <PremiumButton type="button" variant="primary" onClick={next}>
                Dalej
              </PremiumButton>
            ) : (
              <PremiumButton
                type="button"
                variant="primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Wysyłanie…" : "Wyślij zgłoszenie"}
              </PremiumButton>
            )}
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}
