import type { FaqItem } from "@/lib/tech/seo";

/**
 * FAQ list from the design (`.faq` rows, numbered, first one open). Native <details>:
 * works without JavaScript, keyboard and screen readers get a real disclosure. With JS
 * the answer opens and closes smoothly (grid-template-rows, components/tech/MotionRoot.tsx).
 */
export function Faq({ items, openFirst = true, className }: { items: FaqItem[]; openFirst?: boolean; className?: string }) {
  return (
    <div className={`t-faq${className ? ` ${className}` : ""}`}>
      {items.map((f, i) => (
        <details key={f.q} className="t-faq__item" open={openFirst && i === 0}>
          <summary>
            <span className="t-faq__no">{String(i + 1).padStart(2, "0")}</span>
            <span className="t-faq__q">{f.q}</span>
            <span className="t-faq__toggle" aria-hidden="true" />
          </summary>
          <div className="t-faq__body">
            <div>
              <p className="t-faq__a">{f.a}</p>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
