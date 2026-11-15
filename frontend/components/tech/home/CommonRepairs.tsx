import Image from "next/image";
import Link from "next/link";
import { line } from "@/config/prokom";
import { claim } from "@/lib/tech/claims";
import { submitHref } from "@/lib/tech/wizard-data";
import { IconArrow, IconPath, type HomeIcon } from "../icons";
import { BrandLogo } from "../BrandLogo";

const BRANDS = ["Apple", "Samsung", "Xiaomi", "Motorola", "realme", "Huawei"];

const REST: { t: string; s: string; icon: HomeIcon; fault?: string; tag?: string; soft?: boolean }[] = [
  { t: "Wymiana baterii", s: "Telefon szybko się rozładowuje albo się nagrzewa.", icon: "batt", fault: "Bateria" },
  { t: "Gniazdo ładowania", s: "USB-C albo Lightning: nie ładuje, kabel wypada.", icon: "plug", fault: "Nie ładuje" },
  { t: "Tylna klapka i obudowa", s: "Pęknięte plecki, wygięta ramka, przyciski.", icon: "back", fault: "Przyciski i obudowa" },
  { t: "Głośnik i mikrofon", s: "Rozmówca Cię nie słyszy, dźwięk trzeszczy.", icon: "spk", fault: "Głośnik lub mikrofon" },
  { t: "Naprawa po zalaniu", s: "Nie włączaj i nie ładuj. Przynieś jak najszybciej.", icon: "drop", fault: "Po zalaniu", tag: "pilne" },
  { t: "Inna usterka?", s: `Opisz ją w zgłoszeniu albo zadzwoń: ${line.phoneDisplay}.`, icon: "help", soft: true },
];

/** "Najczęstsze naprawy telefonów" (design T.Main `#usterki`). */
export function CommonRepairs() {
  const quick = claim("quickRepair");
  return (
    <section id="usterki" data-rail="Najczęstsze naprawy" className="t-section t-ui" aria-labelledby="t-usterki-h">
      <div className="t-container">
        <div className="t-hd">
          <div className="t-hd__text">
            <span className="t-eyb">Telefony</span>
            <h2 id="t-usterki-h" className="t-h2">
              Najczęstsze naprawy telefonów
            </h2>
          </div>
          <ul className="t-brandchips" aria-label="Marki telefonów">
            {BRANDS.map((b) => (
              <li key={b} className="t-brandchip">
                <BrandLogo brand={b} />
              </li>
            ))}
          </ul>
        </div>

        <div className="t-fix">
          <Link href={submitHref("phone", "Pęknięty ekran")} className="t-fix__top" data-track="zgloszenie_start" data-track-zrodlo="przycisk">
            <span className="t-fix__glow" aria-hidden="true" />
            <Image className="t-fix__ph" src="/tech/urzadzenia/samsung.webp" alt="" width={454} height={549} unoptimized />
            <span className="t-fix__body">
              <span className="t-fix__row">
                <span className="t-eyb t-eyb--dark">Najczęściej</span>
                {quick ? <span className={`t-fix__pill${quick.draft ? " t-draft" : ""}`}>{quick.text}</span> : null}
              </span>
              <span className="t-fix__title">
                Wymiana
                <br />
                wyświetlacza
              </span>
              <span className="t-fix__desc">Pęknięta szybka, brak obrazu albo dotyku.</span>
              <span className="t-sbtn t-shine">
                Zgłoś tę naprawę
                <IconArrow size={16} strokeWidth={2.6} />
              </span>
            </span>
          </Link>
          <div className="t-fix__grid">
            {REST.map((f) => (
              <Link key={f.t} href={submitHref("phone", f.fault)} className={`t-card t-fix__card${f.soft ? " is-soft" : ""}`}>
                <span className="t-ico t-ico--lg">
                  <IconPath icon={f.icon} size={24} />
                </span>
                <span className="t-fix__ctext">
                  <span className="t-fix__ctitle">
                    <span className="t-h3 t-h3--sm">{f.t}</span>
                    {f.tag ? <span className="t-tag">{f.tag}</span> : null}
                  </span>
                  <span className="t-fix__cdesc">{f.s}</span>
                </span>
                <span className="t-fix__arrow" aria-hidden="true">
                  <IconArrow size={16} strokeWidth={2.6} />
                </span>
              </Link>
            ))}
          </div>
        </div>
        <p className="t-fix__note">Cenę podajemy po diagnozie, przed rozpoczęciem pracy. Możesz zrezygnować bez konsekwencji.</p>
      </div>
    </section>
  );
}
