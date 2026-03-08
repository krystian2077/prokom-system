"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";

const reviews = [
  { name: "Anna K.", quote: "Szybko i profesjonalnie. Telefon naprawiony w 2 dni. Polecam.", stars: 5 },
  { name: "Piotr M.", quote: "Naprawa laptopa - diagnoza jasna, wycena od razu. Serwis na miejscu.", stars: 5 },
  { name: "Magdalena W.", quote: "Trzeci raz zglaszam sie do PRO-KOM. Zawsze solidnie.", stars: 5 },
  { name: "Tomasz S.", quote: "Wymiana baterii - wszystko OK, dziala jak nowy.", stars: 5 },
  { name: "Katarzyna L.", quote: "Tablet po zalaniu - udalo sie uratowac. Dziekuje.", stars: 5 },
];

export function Reviews() {
  return (
    <section className="bg-gray-50/50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-3xl font-bold tracking-tight text-dark sm:text-4xl"
        >
          Opinie klientów
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral"
        >
          Zobacz, co mówią o nas klienci.
        </motion.p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map(({ name, quote, stars }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * i }}
            >
              <PremiumCard>
                <Quote className="h-8 w-8 text-primary/30" />
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: stars }).map((_, j) => (
                    <Star key={j} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="mt-4 text-dark">{quote}</p>
                <p className="mt-4 font-semibold text-neutral">{name}</p>
              </PremiumCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
