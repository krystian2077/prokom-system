import Link from "next/link";

/**
 * Headers of the client-rendered pages (/zgloszenie, /track). Shared by the client component and
 * the server Suspense fallback, so the HTML from the server already has the H1 and the lead (LCP, SEO)
 * and the swap after hydration does not change the layout. No hooks: usable on both sides.
 */
export function RepairFormHead() {
  return (
    <header className="t-zgl__head">
      <nav aria-label="Okruszki" className="t-crumbs">
        <Link href="/">Start</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Zgłoś naprawę</span>
      </nav>
      <h1>Zgłoś naprawę</h1>
      <p className="t-lead">Bez logowania, około minuty. Wycenę dostajesz po diagnozie, przed naprawą.</p>
    </header>
  );
}

export function TrackHead() {
  return (
    <div className="t-trk__title">
      <nav aria-label="Okruszki" className="t-crumbs">
        <Link href="/">Start</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Status naprawy</span>
      </nav>
      <h1>Status naprawy</h1>
    </div>
  );
}
