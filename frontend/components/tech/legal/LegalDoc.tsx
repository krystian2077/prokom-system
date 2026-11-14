import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { JsonLd } from "@/components/tech/JsonLd";
import { breadcrumbJsonLd, type Crumb } from "@/lib/tech/seo";

/**
 * Legal document skin (/polityka-prywatnosci, /regulamin). The text itself is kept as it
 * was — changes to legal wording go through Krystian/lawyer (SPEC §10).
 */
export function LegalDoc({ title, path, version, children }: { title: string; path: string; version: string; children: ReactNode }) {
  const crumbs: Crumb[] = [
    { name: "Start", path: "/" },
    { name: title, path },
  ];
  return (
    <div className="t-ui t-page t-legaldoc">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <section className="t-section--hero" id="dokument" data-rail={title}>
        <div className="t-container">
          <div className="t-stage t-bhero">
            <Breadcrumbs items={crumbs} separator="/" />
            <h1 className="t-bhero__h1">{title}</h1>
            <p className="t-bhero__lead">Wersja obowiązująca od: {version}</p>
          </div>
        </div>
      </section>
      <section className="t-section t-section--tight" id="tresc" data-rail="Treść">
        <div className="t-container">
          <div className="t-legal-doc">{children}</div>
        </div>
      </section>
    </div>
  );
}

export function Section({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <section className="t-legal-doc__sec" id={id}>
      <h2>{title}</h2>
      <div className="t-legal-doc__body">{children}</div>
    </section>
  );
}

export function Li({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}

export function Ol({ children }: { children: ReactNode }) {
  return <ol>{children}</ol>;
}

/** Highlighted block (address, contact). */
export function Box({ children }: { children: ReactNode }) {
  return <p className="t-legal-doc__box">{children}</p>;
}
