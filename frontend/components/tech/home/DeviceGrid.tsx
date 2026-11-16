import Image from "next/image";
import Link from "next/link";
import { REPAIRS_HREF, SUBMIT_HREF } from "@/lib/tech/nav";
import { IconArrow, IconCheck, IconPath } from "../icons";
import type { ArtKind } from "@/lib/tech/wizard-data";
import { StaticArt } from "../wizard/art/StaticArt";

const PHONE_LIST = [
  "Wymiana wyświetlacza i szybki",
  "Wymiana baterii",
  "Gniazdo ładowania USB-C i Lightning",
  "Naprawa po zalaniu",
];

/**
 * Real device photos (prototype, rights: PRO-KOM — config/media-zrodla.json), each trimmed to its
 * silhouette (scripts/tech/glowna-kadry.py, never upscaled) and anchored bottom-right in its card.
 */
type Photo = { src: string; w: number; h: number };
const PHOTOS = {
  iphone: { src: "/tech/urzadzenia/kadr-iphone.webp", w: 399, h: 494 },
  laptop: { src: "/tech/urzadzenia/kadr-laptop.webp", w: 608, h: 414 },
  tablet: { src: "/tech/urzadzenia/kadr-tablet.webp", w: 519, h: 592 },
  pc: { src: "/tech/urzadzenia/kadr-komputer.webp", w: 350, h: 640 },
  console: { src: "/tech/urzadzenia/kadr-konsola.webp", w: 548, h: 640 },
  printer: { src: "/tech/urzadzenia/kadr-drukarka.webp", w: 551, h: 279 },
} satisfies Record<string, Photo>;

const PHOTO_CARDS: { t: string; s: string; href: string; key: "laptop" | "tablet" | "pc" | "console" }[] = [
  { t: "Serwis laptopów", s: "Matryca, klawiatura, czyszczenie, dysk SSD, płyta główna.", href: "/serwis-laptopow", key: "laptop" },
  { t: "Serwis tabletów", s: "Ekran i dotyk, bateria, gniazdo, system.", href: "/serwis-tabletow", key: "tablet" },
  { t: "Serwis komputerów", s: "Windows, dysk, RAM, czyszczenie, płyta główna.", href: "/serwis-komputerow", key: "pc" },
  { t: "Serwis konsol", s: "HDMI, napęd, czyszczenie, dryf joysticka w padzie.", href: "/serwis-konsol", key: "console" },
];

/**
 * Smaller cards: a photo where we have one (printer); smartwatch and data recovery have no photo,
 * so they keep the wizard illustration, lit and shadowed like the photos (`.t-devices__media`).
 */
const SMALL_CARDS: {
  t: string;
  s: string;
  href: string;
  key: string;
  photo?: Photo;
  art?: { kind: ArtKind; crop: [number, number, number, number] };
  soft?: boolean;
}[] = [
  { t: "Drukarki", s: "Głowice, podajnik papieru, sieć Wi-Fi.", href: "/serwis-drukarek", key: "printer", photo: PHOTOS.printer },
  { t: "Smartwatche", s: "Szkło, bateria, folia ochronna na wymiar.", href: "/serwis-smartwatchy", key: "watch", art: { kind: "watch", crop: [88, 0, 236, 480] } },
  { t: "Odzyskiwanie danych", s: "Z telefonu, dysku i pendrive’a.", href: "/odzyskiwanie-danych", key: "data", art: { kind: "data", crop: [34, 32, 430, 320] } },
  { t: "Nie ma na liście?", s: "Zadzwoń albo opisz sprzęt w zgłoszeniu.", href: `${SUBMIT_HREF}?category=other`, key: "other", soft: true },
];

function DevicePhoto({ photo, className }: { photo: Photo; className: string }) {
  return (
    <span className={`t-devices__media ${className}`} aria-hidden="true">
      <Image src={photo.src} alt="" width={photo.w} height={photo.h} unoptimized />
    </span>
  );
}

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
            <DevicePhoto photo={PHOTOS.iphone} className="t-devices__phart" />
          </Link>

          <div className="t-devices__more t-snap">
            {PHOTO_CARDS.map((c) => (
              <Link key={c.href} href={c.href} className={`t-card t-devices__photo t-devices__photo--${c.key}`}>
                <span className="t-h3">{c.t}</span>
                <span className="t-devices__desc">{c.s}</span>
                <span className="t-lnk t-lnk--sm">
                  Naprawy
                  <IconArrow size={14} strokeWidth={2.6} />
                </span>
                <DevicePhoto photo={PHOTOS[c.key]} className={`t-devices__art t-devices__art--${c.key}`} />
              </Link>
            ))}
          </div>

          {SMALL_CARDS.map((c) => (
            <Link key={c.key} href={c.href} className={`t-card t-devices__icon t-devices__icon--${c.key}${c.soft ? " is-soft" : ""}`}>
              {c.soft ? (
                <span className="t-ico">
                  <IconPath icon="help" size={22} />
                </span>
              ) : null}
              <span className="t-devices__itext">
                <span className="t-h3 t-h3--sm">{c.t}</span>
                <span className="t-devices__desc">{c.s}</span>
              </span>
              {c.photo ? <DevicePhoto photo={c.photo} className="t-devices__thumb" /> : null}
              {c.art ? (
                <span className="t-devices__media t-devices__thumb t-devices__thumb--art" aria-hidden="true">
                  <StaticArt kind={c.art.kind} crop={c.art.crop} uid={`dg${c.key}`} className="t-devices__sart" />
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
