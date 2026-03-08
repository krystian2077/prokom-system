"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";

export default function ClientLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/client/dashboard";
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.ok) {
      router.push(returnUrl);
      return;
    }
    setError(result.error || "Nieprawidłowy e-mail lub hasło.");
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold text-prokom-black">
            Logowanie — Panel klienta
          </h1>
          <p className="mt-1 text-sm text-prokom-gray">
            Zaloguj się, aby zobaczyć swoje naprawy i profil.
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
              label="Hasło"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Logowanie…" : "Zaloguj się"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-prokom-gray">
            Nie masz konta?{" "}
            <Link href="/client/rejestracja" className="text-prokom-accent hover:underline">
              Zarejestruj się
            </Link>
          </p>
          <p className="mt-2 text-center">
            <Link href="/" className="text-sm text-prokom-accent hover:underline">
              Wróć na stronę główną
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
