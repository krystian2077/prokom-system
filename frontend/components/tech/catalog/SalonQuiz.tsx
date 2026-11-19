"use client";

import Link from "next/link";
import { useState } from "react";
import { addItem, makeItem } from "@/lib/tech/catalog/enquiry";
import type { CatalogModel, Quiz } from "@/lib/tech/catalog/types";
import { ModelVisual } from "./ModelVisual";
import { useEnquiry } from "./useEnquiry";

/** Ranking used on the server too (lib/tech/catalog → pickModels), repeated here on plain data. */
function rank(models: CatalogModel[], picked: string[]) {
  return models
    .map((m) => ({ m, score: picked.filter((t) => m.tags.includes(t)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.m.order - a.m.order)
    .slice(0, 3);
}

/** Why this model — the answers it matches, in plain words. */
function reasons(m: CatalogModel, quiz: Quiz, picked: string[]) {
  return quiz.questions.flatMap((q) => q.options.filter((o) => o.tags.some((t) => picked.includes(t) && m.tags.includes(t))).map((o) => o.label));
}

/**
 * „Dobierz w 3 pytaniach” (runda 18.11 v2 §3): three questions, one at a time, then 1–3 models with
 * why they fit and „Dodaj do zapytania”. No prices; „budżet” only as everyday / best.
 */
export function SalonQuiz({ quiz, models }: { quiz: Quiz; models: CatalogModel[] }) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [list, save] = useEnquiry();
  const [added, setAdded] = useState<string | null>(null);
  const done = step >= quiz.questions.length;
  const result = done ? rank(models, picked) : [];

  return (
    <div className="t-quiz" aria-live="polite">
      {!done ? (
        <div className="t-quiz__q">
          <span className="t-quiz__step">
            Pytanie {step + 1} z {quiz.questions.length}
          </span>
          <h3 className="t-quiz__title">{quiz.questions[step].q}</h3>
          <div className="t-quiz__opts">
            {quiz.questions[step].options.map((o) => (
              <button
                key={o.label}
                type="button"
                className="t-quiz__opt"
                onClick={() => {
                  setPicked([...picked, ...o.tags]);
                  setStep(step + 1);
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="t-quiz__res">
          <h3 className="t-quiz__title">{result.length ? "Pasują do Ciebie" : "Nie znaleźliśmy dopasowania — zobacz wszystkie modele niżej"}</h3>
          <ul className="t-quiz__list">
            {result.map(({ m }) => (
              <li key={m.slug} className="t-card t-quiz__pick">
                <ModelVisual model={m} decorative />
                <b>{m.name}</b>
                <span className="t-quiz__why">{reasons(m, quiz, picked).join(" · ")}</span>
                <span className="t-quiz__act">
                  <Link href={`/sprzedaz/${m.brand}/${m.slug}`} className="t-pbtn t-pbtn--outline t-pbtn--m">
                    Zobacz
                  </Link>
                  <button
                    type="button"
                    className="t-pbtn t-pbtn--acc t-pbtn--m"
                    onClick={() => {
                      save(addItem(list, makeItem(m, m.colors[0]?.key ?? null, m.storage[0]?.key ?? null)));
                      setAdded(m.slug);
                    }}
                  >
                    {added === m.slug ? "Dodano" : "Do zapytania"}
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="t-quiz__again"
            onClick={() => {
              setStep(0);
              setPicked([]);
              setAdded(null);
            }}
          >
            Zacznij od nowa
          </button>
        </div>
      )}
    </div>
  );
}
