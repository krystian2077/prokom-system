import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { buildSalesNav } from "@/lib/tech/catalog/sales-nav";
import { ENQUIRY_HREF, SALES_HREF } from "@/lib/tech/catalog/nav";
import { IconArrow } from "../icons";

/**
 * Home page „Sprzedaż” (Krystian 19.11: the offer nicely on the home page, premium). Same language as
 * the Hammer Glass stage: dark scene, red light, large product shots. Two ways into the brand
 * salons, the newest models and the whole catalogue. No prices — „wyślij zapytanie”.
 */
export function SalesSection() {
  const sales = buildSalesNav(6);
  return (
    <section id="sprzedaz" data-rail="Sprzedaż" className="t-hsalesec t-ui" aria-labelledby="t-hsales-h">
      <div className="t-container">
        <div className="t-hsales">
          <div className="t-hsales__text">
            <span className="t-eyb t-eyb--dark">Sprzedaż · Apple i Samsung</span>
            <h2 id="t-hsales-h" className="t-h2 t-hsales__h">
              Nowy telefon, tablet albo laptop? <span>Wybierz go u nas.</span>
            </h2>
            <p className="t-lead t-hsales__lead">
              iPhone, iPad, Mac, Apple Watch, AirPods i cała seria Galaxy. Wybierasz model, kolor i pamięć, wysyłasz zapytanie — odpowiadamy z ceną i dostępnością, a sprzęt odbierasz w salonie w Rabce-Zdroju albo w Zakopanem.
            </p>
            <ul className="t-hsales__facts">
              <li>
                <b>{sales.count}</b> modeli w katalogu
              </li>
              <li>
                <b>2</b> salony marek
              </li>
              <li>
                <b>bez</b> logowania i płatności
              </li>
            </ul>
            <div className="t-hsales__actions">
              <Link href={SALES_HREF} className="t-sbtn t-sbtn--lg t-shine">
                Zobacz cały katalog
                <IconArrow size={17} strokeWidth={2.6} />
              </Link>
              <Link href={ENQUIRY_HREF} className="t-sbtn t-sbtn--lg t-sbtn--ghost">
                Twoje zapytanie
              </Link>
            </div>
          </div>
          <div className="t-hsales__salons">
            {sales.salons.map((s, i) => (
              <Link key={s.brand} href={s.href} className={`t-hsalon t-hsalon--${s.brand}`} style={{ "--i": i } as CSSProperties}>
                <span className="t-hsalon__kick">Salon</span>
                <b className="t-hsalon__title">{s.title}</b>
                <span className="t-hsalon__depts">{s.departments.slice(0, 4).map((d) => d.label.replace(/ i iPad mini$/, "")).join(" · ")}</span>
                <span className="t-hsalon__go">
                  Wejdź <IconArrow size={15} />
                </span>
                {s.img ? (
                  <span className={`t-hsalon__img${s.transparent ? " is-cutout" : ""}`} style={s.bg ? ({ "--photo-bg": s.bg } as CSSProperties) : undefined}>
                    <Image src={s.img} alt="" width={360} height={360} sizes="(min-width: 1180px) 260px, 40vw" />
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
          {sales.newest.length ? (
            <div className="t-hsales__new">
              <span className="t-hsales__newt">Nowości</span>
              <ul className="t-hsales__strip">
                {sales.newest.map((m) => (
                  <li key={m.href}>
                    <Link href={m.href} className="t-hnew">
                      <span className={`t-hnew__img${m.transparent ? " is-cutout" : ""}`} style={m.bg ? ({ "--photo-bg": m.bg } as CSSProperties) : undefined}>
                        {m.img ? <Image src={m.img} alt="" width={160} height={160} sizes="120px" /> : null}
                      </span>
                      <span className="t-hnew__name">{m.name}</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href={SALES_HREF} className="t-hnew t-hnew--all">
                    <span className="t-hnew__allico" aria-hidden="true">
                      <IconArrow size={22} strokeWidth={2.4} />
                    </span>
                    <span className="t-hnew__name">Cały katalog</span>
                  </Link>
                </li>
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
