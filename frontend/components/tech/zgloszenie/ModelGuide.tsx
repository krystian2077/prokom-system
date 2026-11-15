import type { DeviceCategory } from "@/lib/tech/contract";
import { helperGuides, type HelperField } from "@/lib/tech/model-helper";
import { HelperArt } from "./HelperArt";

/** Groups of the static guide: the same content as the form helper (one source). */
const GROUPS: { title: string; field: HelperField; category: DeviceCategory }[] = [
  { title: "Telefon i tablet", field: "model", category: "phone" },
  { title: "Smartwatch", field: "model", category: "smartwatch" },
  { title: "Laptop i komputer", field: "model", category: "laptop" },
  { title: "Konsola", field: "model", category: "console" },
  { title: "Drukarka", field: "model", category: "printer" },
  { title: "IMEI telefonu", field: "imei", category: "phone" },
];

/**
 * "Jak sprawdzić model" on /jak-przygotowac-sprzet#model: the no-JS target of the
 * helper link in /zgloszenie, and a reference for anyone preparing a device.
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
          return guides.map((guide) => (
            <article key={`${g.title}-${guide.id}`} className="t-mguide__card">
              <h3>{guides.length > 1 ? `${g.title}: ${guide.tab}` : g.title}</h3>
              <HelperArt art={guide.art} steps={guide.path?.length ?? guide.variants?.[1]?.path.length ?? 0} />
              {guide.path ? (
                <ol className="t-help__path" aria-label="Ścieżka">
                  {guide.path.map((p, i) => (
                    <li key={p}>
                      <span aria-hidden="true">{i + 1}</span>
                      {p}
                    </li>
                  ))}
                </ol>
              ) : null}
              <div className="t-help__lines">
                {guide.lines.map((l) => (
                  <p key={l}>{l}</p>
                ))}
              </div>
              {guide.variants ? (
                <>
                  <h4>Ścieżka według marki</h4>
                  <ul className="t-mguide__variants">
                    {guide.variants.map((v) => (
                      <li key={v.id}>
                        <b>{v.label}:</b> {v.path.join(" › ")}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </article>
          ));
        })}
      </div>
    </div>
  );
}
