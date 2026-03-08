"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";

const contactItems = [
  { icon: MapPin, label: "Adres", value: "ul. Przykładowa 1, 00-001 Warszawa" },
  { icon: Phone, label: "Telefon", value: "+48 123 456 789" },
  { icon: Mail, label: "E-mail", value: "kontakt@prokom.pl" },
  { icon: Clock, label: "Godziny", value: "Pn–Pt 9:00–18:00, Sb 10:00–14:00" },
];

export function Contact() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-3xl font-bold tracking-tight text-dark sm:text-4xl"
        >
          Kontakt
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral"
        >
          Odwiedz nas lub napisz – chętnie pomożemy.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mt-12 max-w-2xl rounded-3xl border border-gray-200 bg-white p-8 shadow-card"
        >
          <div className="space-y-6">
            {contactItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral">{label}</p>
                  <p className="mt-1 font-medium text-dark">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <PremiumButton href="/zgloszenie" variant="primary" size="md">
              Zgłoś naprawę
            </PremiumButton>
            <PremiumButton href="/kontakt" variant="outline" size="md">
              Więcej informacji
            </PremiumButton>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-card"
        >
          <div className="relative aspect-[2/1] w-full min-h-[200px]">
            <Image
              src="/images/unnamed.webp"
              alt="Siedziba PRO-KOM — zapraszamy"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark/50 to-transparent" />
            <p className="absolute bottom-4 left-4 right-4 text-left text-sm font-medium text-white drop-shadow">
              Zapraszamy do naszego serwisu.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
