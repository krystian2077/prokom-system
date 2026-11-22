import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { IconArrow, IconSearch } from "@/components/tech/icons";
import { SearchIcon } from "@/components/tech/rail-icons";
import { SearchPageActions } from "@/components/tech/search/SearchPageActions";
import { SearchPageMeasure } from "@/components/tech/search/SearchPageMeasure";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { buildSearchIndex } from "@/lib/tech/search/build-index";
import { highlight } from "@/lib/tech/search/engine";
import { MAX_QUERY, PAGE_GROUP_LIMIT, buildProvider } from "@/lib/tech/search/provider";
import { POPULAR_PHRASES, countCategories, resultsLabel } from "@/lib/tech/search/shortcuts";
import type { Crumb } from "@/lib/tech/seo";
import { PointCalls } from "@/components/tech/PointCalls";

type Props = { searchParams: { q?: string | string[] } };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Results of any phrase are not pages: never indexed, never in the sitemap. */
export const metadata: Metadata = {
  title: "Szukaj",
  description: "Wyszukiwarka strony PRO-KOM Tech: naprawy, urządzenia, punkty serwisowe, pytania i porady.",
  robots: { index: false, follow: true },
};

const CRUMBS: Crumb[] = [
  { name: "Start", path: "/" },
  { name: "Szukaj", path: "/szukaj" },
];

// One provider per server process: the index is the same for every request of a build.
let provider: ReturnType<typeof buildProvider> | null = null;
const getProvider = () => (provider ??= buildProvider(buildSearchIndex()));
const searchHref = (q: string) => `/szukaj?q=${encodeURIComponent(q)}`;

/**
 * `/szukaj?q=` — the search without JavaScript (a plain GET form) and the „Wszystkie wyniki”
 * page of the window: the same index and engine, results on the server, grouped, hit highlighted.
 */
export default function SearchPage({ searchParams }: Props) {
  const q = first(searchParams.q).trim().slice(0, MAX_QUERY);
  const p = getProvider();
  const groups = q ? p.query(q, PAGE_GROUP_LIMIT) : [];
  const total = q ? p.count(q) : 0;

  return (
    <div className="t-ui t-page t-szukaj">
      <section className="t-section--hero" id="szukaj">
        <div className="t-container">
          <div className="t-stage t-bhero">
            <Breadcrumbs items={CRUMBS} separator="/" />
            <h1 className="t-bhero__h1">
              Szukaj <span>na stronie PRO-KOM Tech</span>
            </h1>
            <form action="/szukaj" method="get" role="search" className="t-szukaj__form">
              <label className="t-search t-szukaj__field">
                <IconSearch />
                <span className="t-visually-hidden">Czego szukasz?</span>
                <input type="search" name="q" defaultValue={q} maxLength={MAX_QUERY} placeholder="Np. wymiana ekranu, laptop, status" autoComplete="off" enterKeyHint="search" />
              </label>
              <button type="submit" className="t-btn t-btn--acc t-btn--sm">
                Szukaj
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="t-section t-section--tight" id="wyniki">
        <div className="t-container">
          <div className="t-szukaj__body">
          {q ? (
            <p className="t-szukaj__count" role="status">
              {total ? (
                <>
                  {resultsLabel(total)} dla „<b>{q}</b>”
                </>
              ) : (
                <>
                  Nie znaleźliśmy „<b>{q}</b>”
                </>
              )}
            </p>
          ) : null}

          {groups.map((g) => (
            <section key={g.key} className="t-szukaj__group" aria-labelledby={`g-${g.key}`}>
              <h2 id={`g-${g.key}`} className="t-szukaj__title">
                {g.title}
              </h2>
              <ul className="t-szukaj__list">
                {g.results.map((r) => (
                  <li key={r.id}>
                    <Link href={r.href} className="t-szukaj__result">
                      <span className="t-sdlg__icon">
                        <SearchIcon icon={r.icon} />
                      </span>
                      <span className="t-sdlg__text">
                        <span className="t-sdlg__name">
                          {highlight(r.title, q).map((m, k) =>
                            m.hit ? (
                              <mark key={k} className="t-sdlg__hit">
                                {m.text}
                              </mark>
                            ) : (
                              m.text
                            ),
                          )}
                        </span>
                        {r.hint ? <span className="t-sdlg__hint">{r.hint}</span> : null}
                      </span>
                      <IconArrow className="t-sdlg__go" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {q && !total ? (
            <div className="t-szukaj__none">
              <p>Opisz usterkę w zgłoszeniu albo zadzwoń — podpowiemy, czy to naprawimy.</p>
              <div className="t-sdlg__noneactions">
                <PointCalls track="szukaj" size="sm" />
                <Link href={SUBMIT_HREF} className="t-btn t-btn--ghost t-btn--sm">
                  Zgłoś naprawę <IconArrow />
                </Link>
              </div>
            </div>
          ) : null}

          {!q || !total ? (
            <>
              <section className="t-szukaj__sec" aria-labelledby="szukaj-akcje">
                <h2 id="szukaj-akcje" className="t-szukaj__title">
                  Szybkie akcje
                </h2>
                <SearchPageActions />
              </section>
              <section className="t-szukaj__sec t-szukaj__popular" aria-labelledby="szukaj-popularne">
                <h2 id="szukaj-popularne" className="t-szukaj__title">
                  Najczęściej szukane
                </h2>
                <ul className="t-sdlg__chips">
                  {POPULAR_PHRASES.map((phrase) => (
                    <li key={phrase.label}>
                      <Link href={searchHref(phrase.query)} className="t-sdlg__chip">
                        <IconSearch size={14} strokeWidth={2.4} />
                        {phrase.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="t-szukaj__sec" aria-labelledby="szukaj-skroty">
                <h2 id="szukaj-skroty" className="t-szukaj__title">
                  Na skróty
                </h2>
                <ul className="t-szukaj__cats">
                  {countCategories(p).map((c) => (
                    <li key={c.key}>
                      <Link href={searchHref(c.query)} className="t-sdlg__cat">
                        <span className="t-sdlg__caticon">
                          <SearchIcon icon={c.icon} size={20} />
                        </span>
                        <span className="t-sdlg__text">
                          <span className="t-sdlg__catname">{c.label}</span>
                          <span className="t-sdlg__catcount">{resultsLabel(c.count)}</span>
                        </span>
                        <IconArrow className="t-sdlg__go" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : null}
          </div>
        </div>
      </section>
      {q ? <SearchPageMeasure length={q.length} results={total} /> : null}
    </div>
  );
}
