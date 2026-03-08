"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";

interface ClientProfile {
  id: string;
  client_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  preferred_contact: string;
  accepts_marketing: boolean;
  total_repairs?: number;
  total_spent?: string;
}

const CONTACT_OPTIONS = [
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefon" },
  { value: "sms", label: "SMS" },
];

export function ClientProfil() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    street: "",
    city: "",
    postal_code: "",
    country: "Polska",
    preferred_contact: "email",
    accepts_marketing: false,
  });

  useEffect(() => {
    if (!token) return;
    api
      .get<ClientProfile>("/clients/me/", token)
      .then((r) => {
        const p = r as ClientProfile;
        setProfile(p);
        setError(null);
        setForm({
          first_name: p.first_name || "",
          last_name: p.last_name || "",
          phone: p.phone || "",
          street: p.street || "",
          city: p.city || "",
          postal_code: p.postal_code || "",
          country: p.country || "Polska",
          preferred_contact: p.preferred_contact || "email",
          accepts_marketing: p.accepts_marketing ?? false,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Błąd ładowania."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const updated = await api.patch<ClientProfile>("/clients/me/", form, token);
      setProfile(updated as ClientProfile);
      setSaveSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Zapis nie powiódł się.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <p className="text-prokom-gray">Ładowanie…</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-prokom-black">Profil</h1>
      <p className="mt-2 text-prokom-gray">
        Edytuj swoje dane kontaktowe i adres.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="font-semibold text-prokom-black">Dane</h2>
          {profile?.client_number && (
            <p className="text-sm text-prokom-gray">Numer klienta: {profile.client_number}</p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail (tylko do odczytu)"
              value={profile?.email ?? ""}
              readOnly
              disabled
              className="opacity-80"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Imię"
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              />
              <Input
                label="Nazwisko"
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              />
            </div>
            <Input
              label="Telefon"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <Select
              label="Preferowany kontakt"
              options={CONTACT_OPTIONS}
              value={form.preferred_contact}
              onChange={(e) => setForm((f) => ({ ...f, preferred_contact: e.target.value }))}
            />
            <Input
              label="Ulica i numer"
              value={form.street}
              onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Miasto"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
              <Input
                label="Kod pocztowy"
                value={form.postal_code}
                onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
              />
            </div>
            <Input
              label="Kraj"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.accepts_marketing}
                onChange={(e) => setForm((f) => ({ ...f, accepts_marketing: e.target.checked }))}
                className="rounded border-gray-300 text-prokom-accent focus:ring-prokom-accent"
              />
              <span className="text-sm text-prokom-black">Akceptuję komunikację marketingową</span>
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {saveSuccess && <p className="text-sm text-green-600">Zapisano.</p>}
            <Button type="submit" disabled={saving}>
              {saving ? "Zapisywanie…" : "Zapisz zmiany"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {profile && (profile.total_repairs != null || profile.total_spent != null) && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <p className="text-sm text-prokom-gray">
              Liczba napraw: {profile.total_repairs ?? 0}
              {profile.total_spent != null && ` · Łączna kwota: ${profile.total_spent} zł`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
