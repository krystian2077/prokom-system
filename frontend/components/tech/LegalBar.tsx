import Link from "next/link";
import { company } from "@/config/prokom";
import { legalLinks } from "@/lib/tech/nav";
import { IconArrowUp } from "./icons";

/** Legal strip at the very bottom (design T.Stopka). */
export function LegalBar() {
  const year = new Date().getFullYear();
  return (
    <div className="t-legal">
      <div className="t-legal__info">
        <span className="t-legal__strong">
          © {year} {company.name} · {company.hq.street}, {company.hq.postal} {company.hq.city} · NIP {company.nip}
        </span>
        <span>
          <Link href="/regulamin" data-t-inline="">
            Regulamin serwisu
          </Link>{" "}
          · Logotypy i nazwy producentów należą do ich właścicieli
        </span>
      </div>
      <nav aria-label="Informacje prawne" className="t-legal__nav">
        {legalLinks.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
        <a href="#top" className="t-legal__top">
          Do góry
          <IconArrowUp />
        </a>
      </nav>
    </div>
  );
}
