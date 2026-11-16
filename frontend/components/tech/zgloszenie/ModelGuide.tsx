import type { DeviceCategory } from "@/lib/tech/contract";
import { guideSteps, helperGuides, stepPath, type HelperField } from "@/lib/tech/model-helper";
import { HelperScene } from "./HelperScene";

/** Groups of the static guide: the same content as the form helper (one source). */
const GROUPS: { title: string; field: HelperField; category: DeviceCategory }[] = [
  { title: "Telefon", field: "model", category: "phone" },
  { title: "Tablet", field: "model", category: "tablet" },
  { title: "Smartwatch", field: "model", category: "smartwatch" },
  { title: "Laptop", field: "model", category: "laptop" },
  { title: "Komputer", field: "model", category: "desktop" },
  { title: "Konsola", field: "model", category: "console" },
  { title: "Drukarka", field: "model", category: "printer" },
  { title: "IMEI telefonu", field: "imei", category: "phone" },
];

/**
 * "Jak sprawdzić model" on /jak-przygotowac-sprzet#model: the no-JS target of the
 * helper link in /zgloszenie, and a reference for anyone preparing a device.
 * Each card shows the steps and the screen (or sticker) with the answer.
 */
export function ModelGuide() {
  return (
    <div className="t-mguide">
      <div className="t-mguide__head">
        <h2>Jak sprawdzić model i IMEI</h2>
        <p>Model wpisujesz w zgłoszeniu, IMEI albo numer seryjny jest opcjonalny. Tu znajdziesz, gdzie ich szukać.</p>
      </div>
      <div className="t-mguide__grid">
        {GROUPS.flatMap((g) => {
          const guides = helperGuides(g.field, g.category);
          return guides.map((guide) => {
            const steps = guideSteps(guide, null);
            const answer = steps[steps.length - 1];
            return (
              <article key={`${g.title}-${guide.id}`} className="t-mguide__card">
                <h3>{guides.length > 1 ? `${g.title}: ${guide.tab}` : g.title}</h3>
                <div className="t-mguide__art">
                  <HelperScene scene={answer.scene} />
                </div>
                <ol className="t-mguide__steps">
                  {steps.map((s) => (
                    <li key={s.title}>
                      <b>{s.title}</b>
                      {s.text ? <span>{s.text}</span> : null}
                    </li>
                  ))}
                </ol>
                {guide.variants ? (
                  <>
                    <h4>Ścieżka według marki</h4>
                    <ul className="t-mguide__variants">
                      {guide.variants.map((v) => (
                        <li key={v.id}>
                          <b>{v.label}:</b> {stepPath(v.steps).join(" › ")}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {guide.tips?.map((t) => (
                  <p key={t} className="t-mguide__tip">
                    {t}
                  </p>
                ))}
              </article>
            );
          });
        })}
      </div>
    </div>
  );
}
