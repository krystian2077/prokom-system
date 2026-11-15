import Link from "next/link";
import { REPAIRS_HREF, SUBMIT_HREF } from "@/lib/tech/nav";
import {
  IconArrow,
  IconCheck,
  IconPath,
  DeviceGlyph,
  type HomeIcon,
} from "../icons";
import type { DeviceIcon } from "@/lib/tech/nav";
import type { ArtKind } from "@/lib/tech/wizard-data";
import { StaticArt } from "../wizard/art/StaticArt";

const PHONE_LIST = [
  "Wymiana wyświetlacza i szybki",
  "Wymiana baterii",
  "Gniazdo ładowania USB-C i Lightning",
  "Naprawa po zalaniu",
];

/** Device cards use the wizard's illustrations (one angle, light and scale; calm screens). */
const PHOTO_CARDS: { t: string; s: string; href: string; art: ArtKind; crop: [number, number, number, number] }[] = [
  {
    t: "Serwis laptopów",
    s: "Matryca, klawiatura, czyszczenie, dysk SSD, płyta główna.",
    href: "/serwis-laptopow",
    art: "laptop",
    crop: [14, 14, 572, 364],
  },
  {
    t: "Serwis tabletów",
    s: "Ekran i dotyk, bateria, gniazdo, system.",
    href: "/serwis-tabletow",
    art: "tablet",
    crop: [16, 12, 412, 574],
  },
  {
    t: "Serwis komputerów",
    s: "Windows, dysk, RAM, czyszczenie, płyta główna.",
    href: "/serwis-komputerow",
    art: "pc",
    crop: [40, 16, 290, 560],
  },
  {
    t: "Serwis konsol",
    s: "HDMI, napęd, czyszczenie, dryf joysticka w padzie.",
    href: "/serwis-konsol",
    art: "console",
    crop: [86, 24, 514, 524],
  },
];

const ICON_CARDS: {
  t: string;
  s: string;
  href: string;
  device?: DeviceIcon;
  icon?: HomeIcon;
  soft?: boolean;
}[] = [
  {
    t: "Drukarki",
    s: "Głowice, podajnik papieru, sieć Wi-Fi.",
    href: "/serwis-drukarek",
    device: "printer",
  },
  {
    t: "Smartwatche",
    s: "Szkło, bateria, folia ochronna na wymiar.",
    href: "/serwis-smartwatchy",
    device: "watch",
  },
  {
    t: "Odzyskiwanie danych",
    s: "Z telefonu, dysku i pendrive’a.",
    href: "/odzyskiwanie-danych",
    device: "data",
  },
  {
    t: "Nie ma na liście?",
    s: "Zadzwoń albo opisz sprzęt w zgłoszeniu.",
    href: `${SUBMIT_HREF}?category=other`,
    icon: "help",
    soft: true,
  },
];

/** "Co naprawiamy" (design T.Main `#naprawy`). */
export function DeviceGrid() {
  return (
    <section
      id="naprawy"
      data-rail="Co naprawiamy"
      className="t-section t-section--alt t-ui"
      aria-labelledby="t-naprawy-h"
    >
      <div className="t-container">
        <div className="t-hd">
          <div className="t-hd__text">
            <span className="t-eyb">Naprawy</span>
            <h2 id="t-naprawy-h" className="t-h2">
              Co naprawiamy
            </h2>
            <p className="t-lead">
              Jeden serwis na telefon, laptop i resztę elektroniki w domu albo
              firmie. Każde urządzenie ma swoją stronę z listą napraw.
            </p>
          </div>
          <Link href={REPAIRS_HREF} className="t-lnk">
            Wszystkie naprawy
            <IconArrow size={16} strokeWidth={2.6} />
          </Link>
        </div>

        <div className="t-devices">
          <Link href="/serwis-telefonow" className="t-devices__phone">
            <span className="t-eyb t-eyb--dark">Najczęściej</span>
            <span className="t-devices__ptitle">Serwis telefonów</span>
            <p>
              Apple, Samsung, Xiaomi, Motorola, realme, Huawei. Ekran, bateria,
              gniazdo ładowania, zalanie.
            </p>
            <ul>
              {PHONE_LIST.map((p) => (
                <li key={p}>
                  <IconCheck size={16} />
                  {p}
                </li>
              ))}
            </ul>
            <span className="t-sbtn">
              Zobacz naprawy telefonów
              <IconArrow size={15} strokeWidth={2.6} />
            </span>
            <span className="t-devices__glow" aria-hidden="true" />
            <StaticArt kind="phone" crop={[32, 36, 418, 464]} uid="dgphone" className="t-devices__phart" />
          </Link>

          <div className="t-devices__more t-snap">
            {PHOTO_CARDS.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="t-card t-devices__photo"
              >
                <span className="t-h3">{c.t}</span>
                <span className="t-devices__desc">{c.s}</span>
                <span className="t-lnk t-lnk--sm">
                  Naprawy
                  <IconArrow size={14} strokeWidth={2.6} />
                </span>
                <StaticArt kind={c.art} crop={c.crop} uid={`dg${c.art}`} className={`t-devices__art t-devices__art--${c.art}`} />
              </Link>
            ))}
          </div>

          {ICON_CARDS.map((c) => (
            <Link
              key={c.t}
              href={c.href}
              className={`t-card t-devices__icon${c.soft ? " is-soft" : ""}`}
            >
              <span className="t-ico">
                {c.device ? (
                  <DeviceGlyph icon={c.device} size={22} />
                ) : (
                  <IconPath icon={c.icon ?? "help"} size={22} />
                )}
              </span>
              <span className="t-devices__itext">
                <span className="t-h3 t-h3--sm">{c.t}</span>
                <span className="t-devices__desc">{c.s}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
