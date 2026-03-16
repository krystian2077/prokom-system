"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

export default function ClientRejestracjaPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postal_code, setPostalCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await register({
      email,
      password,
      first_name,
      last_name,
      phone,
      street: street || undefined,
      city: city || undefined,
      postal_code: postal_code || undefined,
    });
    setSubmitting(false);
    if (result.ok && result.email) {
      router.push(`/client/verify-email?email=${encodeURIComponent(result.email)}`);
      return;
    }
    setError(result.error || "Rejestracja nie powiodła się.");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold text-prokom-black">
            Rejestracja — Panel klienta
          </h1>
          <p className="mt-1 text-sm text-prokom-gray">
            Załóż konto, aby śledzić naprawy i zarządzać profilem.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Hasło (min. 8 znaków)"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Imię"
                name="first_name"
                autoComplete="given-name"
                value={first_name}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Nazwisko"
                name="last_name"
                autoComplete="family-name"
                value={last_name}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <Input
              label="Telefon (np. 123456789 lub +48 123 456 789)"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Input
              label="Ulica i numer (opcjonalnie)"
              name="street"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Miasto"
                name="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <Input
                label="Kod pocztowy"
                name="postal_code"
                value={postal_code}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>
            {error && <ErrorMessage message={error} className="mb-3" />}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Rejestracja…" : "Zarejestruj się"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-prokom-gray">
            Masz już konto?{" "}
            <Link href="/client/login" className="text-prokom-accent hover:underline">
              Zaloguj się
            </Link>
          </p>
          <p className="mt-2 text-center">
            <Link href="/" className="text-sm text-prokom-gray hover:underline">
              Wróć na stronę główną
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
