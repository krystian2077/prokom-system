"use client";

import { motion } from "framer-motion";
import {
  Smartphone,
  Battery,
  Zap,
  Droplets,
  Camera,
  Volume2,
  Stethoscope,
} from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";

const services = [
  {
    title: "Wymiana wyświetlacza",
    description: "Szybka wymiana ekranu na oryginalny lub wysokiej jakości zamiennik.",
    icon: Smartphone,
  },
  {
    title: "Wymiana baterii",
    description: "Przywróć pełną żywotność baterii i czas pracy urządzenia.",
    icon: Battery,
  },
  {
    title: "Naprawa portu ładowania",
    description: "Naprawa uszkodzonego portu USB/ Lightning — ładowanie i synchronizacja.",
    icon: Zap,
  },
  {
    title: "Naprawa po zalaniu",
    description: "Czyszczenie i diagnostyka po kontakcie z wodą lub innymi płynami.",
    icon: Droplets,
  },
  {
    title: "Naprawa aparatu",
    description: "Wymiana lub naprawa modułu aparatu i obiektywów.",
    icon: Camera,
  },
  {
    title: "Naprawa głośnika",
    description: "Wymiana głośnika, mikrofonu lub gniazda słuchawkowego.",
    icon: Volume2,
  },
  {
    title: "Diagnostyka",
    description: "Bezpłatna lub niskokosztowa diagnostyka przed naprawą.",
    icon: Stethoscope,
  },
];

export function Services() {
  return (
    <section className="bg-gray-50/50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-3xl font-bold tracking-tight text-dark sm:text-4xl"
        >
          Usługi naprawcze
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral"
        >
          Kompleksowa naprawa telefonów, tabletów i laptopów.
        </motion.p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ title, description, icon: Icon }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * i }}
            >
              <PremiumCard>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-dark">{title}</h3>
                <p className="mt-2 text-sm text-neutral">{description}</p>
              </PremiumCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
