"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote } from "lucide-react";

const REVIEWS = [
  {
    name: "Radosław Kijak",
    text: "Pełen profesjonalizm. Punkt przyjemny w odbiorze, ekipa merytorycznie przygotowana i z uśmiechem wychodzi do klienta. Usługa wykonana, szybko, sprawnie i niezwykle atrakcyjnie cenowo. Poza tym duży wybór telefonów i sprzętu komputerowego. Zdecydowanie najlepszy taki salon w jakim miałem okazję być. Polecam.",
  },
  {
    name: "Maciej Gaździcki",
    text: "Świetna, fachowa, bardzo prokliencka i po ludzku życzliwa obsługa. Szybko i sprawnie zajmują się powierzonymi im sprawami. Uratują stary sprzęt, doradzą nowy. Nie robią problemów, autentycznie chcą pomóc. 10/10, 5/5. Gorąco polecam.",
  },
  {
    name: "Andrzej Bednarczyk",
    text: "Polecam firmę PRO-KOM która zatrudnia wykwalifikowanych pracowników. Sprzęt który oferują jest najwyższej jakości. Polecam również serwisowanie telefonów w tym sklepie.",
  },
  {
    name: "Aneta Ch",
    text: "Wielkie dzięki za pomoc w uruchomieniu iphona mojej Mamy. Dopiero w tym sklepie uzyskałam fachową i profesjonalną pomoc. PRO-KOM stanął na wysokości zadania i szybko poradził sobie z moim problemem. Na podkreślenie zasługuje życzliwość i chęć pomocy ze strony pracowników. Super!!!",
  },
  {
    name: "Dawid Biel",
    text: "Przyjemna atmosfera, miłe osoby. Umieją doradzić i znają się na robocie. Oferują również profesjonalną naprawę urządzeń. Duży asortyment produktów. Ogólnie dobra lokalizacja w centrum Rabki. Polecam.",
  },
  {
    name: "Mateusz Chryc",
    text: "Fachowa pomoc, szybka konfiguracja urządzeń mobilnych, drukarek oraz sieci jak i naprawa ich, dużo cierpliwości do klientów, duży wybór akcesoriów.",
  },
  {
    name: "Kuba Koscielniak",
    text: "Pełen profesjonalizm. Panowie uratowali mój telefon błyskawicznie. Jeśli potrzebujecie profesjonalnej i miłej obsługi to bardzo serdecznie polecam.",
  },
  {
    name: "Marcin Nowak",
    text: "Szybka i profesjonalna obsługa oraz fajna, miła atmosfera. Sklep na 5 gwiazdek :)",
  },
  {
    name: "Michał Kotarba",
    text: "Pełna profeska pod względem wiedzy serwisowej. Polecam, jeśli chodzi o kwestie napraw laptopów oraz drukarek.",
  },
  {
    name: "Agata Klag",
    text: "Bardzo miły i pomocny Pan uratował mi dziś telefon. Profesjonalna obsługa na najwyższym poziomie.",
  },
  {
    name: "Szymon",
    text: "Bardzo dobra firma, szybka obsługa, pomoc w każdej dziedzinie.",
  },
  {
    name: "Mateusz Drobny",
    text: "No jest fajnie, dobre chłopaki, fajnie robią i dobrze robią. Co wam będę gadać jest petarda!",
  },
  {
    name: "Paweł Dziadowiec",
    text: "Bardzo dobra obsługa i ceny na poziomie.",
  },
  {
    name: "Ula Wójtowicz",
    text: "Panowie tam pracujący są bardzo pomocni, miałam problem z telefonem i udało się problem rozwiązać dzięki pomocy tych Panów. Ja od lat tam zaglądam i jestem zadowolona z obsługi. Polecam z całego serca.",
  },
];

const ROTATE_INTERVAL_MS = 5500;

export function Reviews() {
  const [index, setIndex] = useState(0);
  const review = REVIEWS[index];

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % REVIEWS.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="bg-[#fafafa] py-12 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-4 text-4xl font-extrabold tracking-tight text-dark sm:text-5xl"
        >
          <span className="text-primary">Zaufanie</span> klientów to nasza najlepsza rekomendacja
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="mx-auto mt-6 max-w-2xl text-center text-lg text-[#666] sm:mt-8"
        >
          Setki zadowolonych klientów potwierdzają jakość naszego serwisu — sprawdź opinie osób, które skorzystały z naszych usług.
        </motion.p>

        <div className="relative mt-14 min-h-[280px] sm:min-h-[320px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{
                duration: 0.45,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="rounded-2xl border border-[#e8e8e8] bg-white p-8 shadow-lg sm:p-10"
              style={{
                boxShadow: "0 4px 6px rgba(0,0,0,.04), 0 20px 48px rgba(0,0,0,.08)",
              }}
            >
              <Quote className="h-10 w-10 text-[#dc1e1e]/25" aria-hidden />
              <div className="mt-4 flex gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className="h-5 w-5 fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                ))}
              </div>
              <blockquote className="mt-5 text-lg leading-relaxed text-[#333] sm:text-xl" style={{ lineHeight: 1.7 }}>
                „{review.text}”
              </blockquote>
              <footer className="mt-6 flex items-center gap-3">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#dc1e1e]/10 font-syne text-lg font-bold text-[#dc1e1e]"
                  aria-hidden
                >
                  {review.name.charAt(0)}
                </span>
                <cite className="not-italic font-semibold text-[#0f0f0f]">
                  {review.name}
                </cite>
              </footer>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="mt-8 flex justify-center gap-2">
          {REVIEWS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: index === i ? 24 : 8,
                backgroundColor: index === i ? "#dc1e1e" : "#d1d5db",
              }}
              aria-label={`Opinia ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
