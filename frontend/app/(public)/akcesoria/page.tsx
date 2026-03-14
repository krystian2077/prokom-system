 "use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Phone } from "lucide-react";

type Product = {
  id: string;
  slug: string;
  cat: string;
  name: string;
  desc: string;
  tags: string[];
  image: string;
  featured?: boolean;
};

type Category = {
  slug: string;
  label: string;
  emoji: string | null;
};

const PRODUCTS: Product[] = [
  // ŁADOWARKI
  {
    id: "gan100w",
    slug: "ladowarki",
    cat: "Ładowarka sieciowa",
    name: "GaN 100W — 3 porty",
    desc: "2× USB-C (65W+100W) + USB-A 22.5W. Ładuje laptopa, telefon i słuchawki jednocześnie. Technologia GaN — mała, wydajna, chłodna.",
    tags: ["GaN", "100W", "3 porty"],
    image: "/images/akcesoria-png/gan100w.png",
    featured: true,
  },
  {
    id: "gan20w",
    slug: "ladowarki",
    cat: "Ładowarka sieciowa",
    name: "GaN 20W USB-C",
    desc: "PD 20W. Kompatybilna z iPhone i Android.",
    tags: ["PD 20W"],
    image: "/images/akcesoria-png/gan20w.png",
  },
  {
    id: "gan25w",
    slug: "ladowarki",
    cat: "Ładowarka sieciowa",
    name: "GaN 25W PD",
    desc: "Szybka ładowarka GaN 25W do wszystkich popularnych smartfonów.",
    tags: ["GaN", "25W"],
    image: "/images/akcesoria-png/gan25w.png",
  },
  {
    id: "gan30w",
    slug: "ladowarki",
    cat: "Ładowarka sieciowa",
    name: "GaN 30W",
    desc: "USB-C + USB-A. Kompaktowa ładowarka do codziennego użytku.",
    tags: ["30W"],
    image: "/images/akcesoria-png/gan30w.png",
  },
  {
    id: "gan45w",
    slug: "ladowarki",
    cat: "Ładowarka sieciowa",
    name: "GaN 45W Dual",
    desc: "USB-C PD 45W + USB-A QC3.0. Kompaktowa.",
    tags: ["45W", "QC3"],
    image: "/images/akcesoria-png/gan45w.png",
  },
  {
    id: "gan65w",
    slug: "ladowarki",
    cat: "Ładowarka sieciowa",
    name: "GaN 65W Triple",
    desc: "3 porty GaN. Laptop + telefon + tablet.",
    tags: ["65W", "3 porty"],
    image: "/images/akcesoria-png/gan65w.png",
  },
  {
    id: "car-charger",
    slug: "ladowarki",
    cat: "Ładowarka samochodowa",
    name: "Ładowarka samochodowa z szybkim ładowaniem",
    desc: "USB-A QC3 + 2× USB-C PD. Podświetlany pierścień LED.",
    tags: ["65W", "3w1"],
    image: "/images/akcesoria/ładowarka-samochodowa.jpg",
  },
  {
    id: "car-charger-compact",
    slug: "ladowarki",
    cat: "Ładowarka samochodowa",
    name: "Ładowarka samochodowa kompaktowa",
    desc: "Podwójny port szybkiego ładowania w kompaktowej obudowie.",
    tags: ["QC", "Fast charge"],
    image: "/images/akcesoria/ładowarka-samochodowa2.jpg",
  },
  {
    id: "car-charger-magsafe",
    slug: "ladowarki",
    cat: "Ładowarka bezprzewodowa MagSafe",
    name: "Ładowarka Magsafe",
    desc: "Magnetyczna ładowarka MagSafe do iPhone. Stabilne ładowanie bezprzewodowe.",
    tags: ["MagSafe"],
    image: "/images/akcesoria/ładowarka-magsafe.jpg",
  },

  // POWERBANKI
  {
    id: "pb-magsafe",
    slug: "powerbank",
    cat: "Powerbank",
    name: "Powerbank MagSafe",
    desc: "Bezprzewodowe ładowanie MagSafe + USB-C. Wyświetlacz % naładowania.",
    tags: ["MagSafe", "LCD"],
    image: "/images/akcesoria-png/powerbankmagsafe.png",
  },
  {
    id: "pb-20k",
    slug: "powerbank",
    cat: "Powerbank",
    name: "Powerbank 20 000 mAh",
    desc: "QC3.0 + USB-C PD. 5–6 pełnych naładowań telefonu.",
    tags: ["20 000", "QC3"],
    image: "/images/akcesoria-png/powerbak.png",
  },
  {
    id: "pb-30k",
    slug: "powerbank",
    cat: "Powerbank",
    name: "Powerbank 30 000 mAh",
    desc: "3× USB-A + USB-C. Duża pojemność na podróże.",
    tags: ["30 000", "3×USB"],
    image: "/images/akcesoria-png/powerbank2.png",
  },
  {
    id: "pb-classic",
    slug: "powerbank",
    cat: "Powerbank",
    name: "Powerbank Classic",
    desc: "Smukły powerbank codziennego użytku. Idealny do plecaka lub torebki.",
    tags: ["Slim", "USB"],
    image: "/images/akcesoria/powerbank.jpg",
  },
  {
    id: "pb-compact",
    slug: "powerbank",
    cat: "Powerbank",
    name: "Powerbank kompaktowy",
    desc: "Kieszonkowy powerbank z dwoma portami USB. Idealny w podróży.",
    tags: ["Kieszonkowy", "2×USB"],
    image: "/images/akcesoria/powerbank2.jpg",
  },
  {
    id: "pb-highcap",
    slug: "powerbank",
    cat: "Powerbank",
    name: "Powerbank wysoka pojemność",
    desc: "Duża pojemność do ładowania kilku urządzeń jednocześnie.",
    tags: ["High capacity"],
    image: "/images/akcesoria/powerbank3.jpg",
  },
  {
    id: "pb-magsafe-slim",
    slug: "powerbank",
    cat: "Powerbank MagSafe",
    name: "Powerbank MagSafe Slim",
    desc: "Cienki powerbank MagSafe do iPhone. Łatwo mieści się w kieszeni.",
    tags: ["MagSafe", "Slim"],
    image: "/images/akcesoria/powerbank-magsafe.jpg",
  },
  {
    id: "pb-magsafe-2",
    slug: "powerbank",
    cat: "Powerbank MagSafe",
    name: "Powerbank MagSafe Pro",
    desc: "Mocny magnes, szybkie ładowanie bezprzewodowe i przewodowe.",
    tags: ["MagSafe", "Fast"],
    image: "/images/akcesoria/powerbank-maghsafe2.jpg",
  },
  {
    id: "pb-magsafe-3",
    slug: "powerbank",
    cat: "Powerbank MagSafe",
    name: "Powerbank MagSafe 3",
    desc: "Najnowsza generacja powerbanku z MagSafe i wyświetlaczem LED.",
    tags: ["MagSafe", "LED"],
    image: "/images/akcesoria/powerbak-magsafe3.jpg",
  },

  // ETUI
  {
    id: "etui-iphone",
    slug: "etui",
    cat: "Etui",
    name: "Etui MagSafe iPhone",
    desc: "Etui MagSafe do iPhone – różne kolory i warianty ochrony.",
    tags: ["MagSafe", "Transparent"],
    image: "/images/akcesoria-png/etui-iphone.png",
    featured: true,
  },
  {
    id: "etui-samsung",
    slug: "etui",
    cat: "Etui",
    name: "Etui MagSafe Samsung",
    desc: "Etui MagSafe do telefonów Samsung – ochrona i kompatybilność z akcesoriami MagSafe.",
    tags: ["Frosted", "Magnetic"],
    image: "/images/akcesoria-png/etui2.png",
    featured: true,
  },
  {
    id: "etui-slim",
    slug: "etui",
    cat: "Etui",
    name: "Etui kabura zamykane",
    desc: "Zamykane etui typu kabura – dostępne do różnych modeli telefonów.",
    tags: ["Slim"],
    image: "/images/akcesoria/etui.webp",
  },
  {
    id: "etui-color",
    slug: "etui",
    cat: "Etui",
    name: "Etui Silikonowe",
    desc: "Silikonowe etui w wielu kolorach, dopasowane do popularnych modeli telefonów.",
    tags: ["Kolorowe"],
    image: "/images/akcesoria/etui5.webp",
  },
  {
    id: "etui-wodoodporne",
    slug: "etui",
    cat: "Etui wodoodporne",
    name: "Etui wodoodporne",
    desc: "Uniwersalne etui wodoodporne – zabezpiecza telefon podczas wyjazdów i nad wodą.",
    tags: ["Wodoodporne"],
    image: "/images/akcesoria/etui-wodoodporne.jpg",
  },

  // OCHRONA EKRANU
  {
    id: "hammer-cut",
    slug: "ochrona",
    cat: "Folia ochronna",
    name: "Hammer Glass CUT",
    desc: "Folia wycinana laserowo na ploterze VersaBlade. 10 000+ modeli. Montaż w 5 minut w serwisie. Certyfikat PZH i RoHS.",
    tags: ["Ploter CUT", "PZH", "10k+ modeli"],
    image: "/images/akcesoria-png/foliawebp.png",
    featured: true,
  },
  {
    id: "szklo-hartowane",
    slug: "ochrona",
    cat: "Szkło hartowane",
    name: "Szkło hartowane uniwersalne",
    desc: "Klasyczne szkło hartowane do popularnych modeli telefonów.",
    tags: ["9H"],
    image: "/images/akcesoria/szkło-hartowane.webp",
  },
  {
    id: "oslona-aparatu",
    slug: "ochrona",
    cat: "Osłona aparatu",
    name: "Osłona aparatu",
    desc: "Dodatkowa ochrona wyspy aparatów przed zarysowaniami.",
    tags: ["Aparat"],
    image: "/images/akcesoria/osłona-aparatu.webp",
  },

  // UCHWYTY & STACJE
  {
    id: "uchwyt-magsafe",
    slug: "uchwyty",
    cat: "Uchwyt samochodowy",
    name: "Uchwyt MagSafe 15W",
    desc: "Dashboard + nawiew. 15W wireless.",
    tags: ["15W"],
    image: "/images/akcesoria-png/uchwyt.png",
  },
  {
    id: "uchwyt-uni",
    slug: "uchwyty",
    cat: "Uchwyt samochodowy",
    name: "Uchwyt samochodowy uniwersalny",
    desc: "Uniwersalny uchwyt na telefon w samochodzie – montaż na szybę, deskę lub kratkę nawiewu. Regulowany kąt i obrót.",
    tags: ["Uniwersalny"],
    image: "/images/akcesoria-png/uchwyt2.png",
  },
  {
    id: "uchwyt-basic",
    slug: "uchwyty",
    cat: "Uchwyt samochodowy",
    name: "Uchwyt samochodowy na kratkę",
    desc: "Magnetyczny uchwyt montowany na kratkę nawiewu. Kompatybilny z MagSafe; w zestawie pierścienie do telefonów bez wbudowanego magnesu.",
    tags: ["Kratka", "MagSafe"],
    image: "/images/akcesoria/uchwyt-samochodowy.jpg",
  },
  {
    id: "uchwyt-airvent",
    slug: "uchwyty",
    cat: "Uchwyt samochodowy",
    name: "Uchwyt samochodowy uniwersalny",
    desc: "Uniwersalny uchwyt na telefon do auta – różne sposoby montażu, dopasowanie do większości smartfonów.",
    tags: ["Uniwersalny"],
    image: "/images/akcesoria/uchwyt-samochodowe.jpg",
  },
  {
    id: "uchwyt-magsafe-car",
    slug: "uchwyty",
    cat: "Uchwyt samochodowy MagSafe",
    name: "Uchwyt samochodowy MagSafe",
    desc: "Magnetyczny uchwyt z obsługą MagSafe do iPhone.",
    tags: ["MagSafe"],
    image: "/images/akcesoria/uchwyt-samochodowy-magsafe.jpg",
  },
  {
    id: "stacja",
    slug: "ladowarki",
    cat: "Stacja ładowania",
    name: "Stacja do ładowania 3w1",
    desc: "Stacja 3w1 do ładowania telefonu, zegarka i słuchawek – idealna do biura lub na stolik nocny.",
    tags: ["3w1"],
    image: "/images/akcesoria-png/stacja-ładowania.png",
  },
  {
    id: "stacja-3in1-photo",
    slug: "ladowarki",
    cat: "Stacja ładowania",
    name: "Stacja ładowania do telefonu",
    desc: "Pojedyncza stacja do ładowania jednego telefonu – idealna na biurko lub stolik nocny.",
    tags: [],
    image: "/images/akcesoria/stacja-ładowania.jpg",
  },
  {
    id: "stacja-3",
    slug: "ladowarki",
    cat: "Stacja ładowania",
    name: "Stacja ładowania 3 urządzenia",
    desc: "Stacja z miejscem na telefon, zegarek i słuchawki.",
    tags: ["3‑in‑1"],
    image: "/images/akcesoria/stacja-ładowania3.jpg",
  },
  {
    id: "stacja-4",
    slug: "ladowarki",
    cat: "Stacja ładowania",
    name: "Stacja ładowania wielofunkcyjna",
    desc: "Rozbudowana stacja dokująca do kilku urządzeń.",
    tags: ["Multi"],
    image: "/images/akcesoria/stacja-ładowana4.jpg",
  },
  // KABLE & INNE
  {
    id: "usba-usbc",
    slug: "kable",
    cat: "Kabel",
    name: "Kabel USB-A → USB-C",
    desc: "1m, szybkie ładowanie + transfer danych. Wytrzymała guma.",
    tags: ["1m", "QC"],
    image: "/images/akcesoria-png/usba.png",
  },
  {
    id: "usbc-usbc",
    slug: "kable",
    cat: "Kabel",
    name: "Kabel USB-C → USB-C",
    desc: "Oplot nylonowy, 100W PD. MacBook, iPad, Android.",
    tags: ["100W", "Nylon"],
    image: "/images/akcesoria-png/USBC.png",
  },
  {
    id: "usba-lightning",
    slug: "kable",
    cat: "Kabel",
    name: "Kabel USB-A → Lightning",
    desc: "Klasyczny kabel Lightning do iPhone. Wzmocnione złącza.",
    tags: ["Lightning"],
    image: "/images/akcesoria/usba-lightning.jpg",
  },
  {
    id: "usbc-lightning",
    slug: "kable",
    cat: "Kabel",
    name: "Kabel USB-C → Lightning",
    desc: "Szybkie ładowanie i transfer danych dla urządzeń Apple.",
    tags: ["USB‑C", "Lightning"],
    image: "/images/akcesoria/usbc-lightning.jpg",
  },
  {
    id: "selfie",
    slug: "uchwyty",
    cat: "Akcesoria",
    name: "Selfie Stick Bluetooth",
    desc: "Do 100cm, pilot BT, obrotowy uchwyt 270°.",
    tags: ["BT", "100cm"],
    image: "/images/akcesoria-png/selfie-stick.png",
  },
  {
    id: "selfie-compact",
    slug: "uchwyty",
    cat: "Akcesoria",
    name: "Selfie Stick MagSafe",
    desc: "Selfie stick z mocowaniem MagSafe i funkcją tripodu. Pilot Bluetooth, kompaktowy do kieszeni.",
    tags: ["MagSafe", "Tripod"],
    image: "/images/akcesoria/selfiestick.jpg",
  },
  {
    id: "selfie-tripod",
    slug: "uchwyty",
    cat: "Akcesoria",
    name: "Selfie Stick z tripodem",
    desc: "Rozkładany tripod do stabilnych ujęć wideo i zdjęć.",
    tags: ["Tripod"],
    image: "/images/akcesoria/selfiestick2.jpg",
  },
  {
    id: "selfie-pro",
    slug: "uchwyty",
    cat: "Akcesoria",
    name: "Selfie Stick Pro",
    desc: "Zaawansowany selfie stick z wielostopniową regulacją.",
    tags: ["Pro"],
    image: "/images/akcesoria/selfiestick3.jpg",
  },
];

const CATEGORIES: Category[] = [
  { slug: "all", label: "Wszystko", emoji: null },
  { slug: "ladowarki", label: "Ładowarki", emoji: "⚡" },
  { slug: "powerbank", label: "Powerbanki", emoji: "🔋" },
  { slug: "etui", label: "Etui", emoji: "📱" },
  { slug: "ochrona", label: "Ochrona ekranu", emoji: "🛡" },
  { slug: "uchwyty", label: "Uchwyty / Selfie stick", emoji: "🚗" },
  { slug: "kable", label: "Kable", emoji: "🔌" },
];

function getProductById(id: string): Product {
  const p = PRODUCTS.find((item) => item.id === id);
  if (!p) {
    throw new Error(`Product with id "${id}" not found`);
  }
  return p;
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article className={`pcard ${product.featured ? "pcard-wide" : ""}`}>
      <div className="pcard-img">
        <Image
          src={product.image}
          alt={product.name}
          width={220}
          height={220}
          loading="lazy"
        />
      </div>
      <div className="pcard-body">
        <p className="mb-1 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#dc1e1e]">
          {product.cat}
        </p>
        <h3 className="mb-1.5 text-[12px] font-bold tracking-[-0.01em] text-[#0d0d0d]">
          {product.name}
        </h3>
        <p className="mb-3 text-[12px] leading-[1.65] text-[#888]">
          {product.desc}
        </p>
        <div className="flex flex-wrap gap-[5px] text-[9.5px]">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-[6px] border border-[#e5e5e3] bg-[#f4f4f2] px-2 py-[3px] font-semibold text-[#666]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function ShowcaseCard({
  product,
  labelOverride,
}: {
  product: Product;
  labelOverride?: string;
}) {
  const label =
    labelOverride ?? product.name.split("—")[0].trim().split("|")[0].trim();

  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-6 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.45)] transition-all duration-200 hover:-translate-y-2 hover:border-[rgba(220,30,30,0.25)]">
      <div className="flex flex-col items-center gap-3">
        <Image
          src={product.image}
          alt={product.name}
          width={120}
          height={120}
          priority
          className="drop-shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
        />
        <span className="text-[11px] font-semibold text-[#e5e5e5] text-center">
          {label}
        </span>
      </div>
    </div>
  );
}

export default function AkcesoriaPage() {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Scroll reveal – obserwujemy także nowe sekcje po zmianie filtra
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06 }
    );

    document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => {
      if (!el.classList.contains("visible")) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [activeFilter]);

  const getProductsBySlug = (slug: string) =>
    PRODUCTS.filter((p) => p.slug === slug);

  return (
    <div className="min-h-[100vh] bg-[#f4f4f2]">
      {/* HERO */}
      <section className="akcesoria-hero bg-[#0d0e10] pt-[120px] pb-20">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-12 px-6 sm:px-[52px] lg:grid lg:grid-cols-[auto_1fr] lg:items-end lg:gap-20">
          {/* Left */}
          <div className="animate-fade-up space-y-6">
            <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6b7280]">
              <span className="h-px w-6 rounded-full bg-[#6b7280]" />
              Sklep PRO-KOM
            </div>
            <h1
              className="font-sans text-white font-extrabold leading-[1.02] tracking-tight"
              style={{ fontSize: "clamp(38px,5.2vw,72px)" }}
            >
              Akces
              <span className="text-[#dc1e1e]">oria</span>
            </h1>
            <p className="max-w-[380px] text-[15px] leading-[1.8] text-[#9ca3af]">
              Ładowarki, etui, folie i gadżety od sprawdzonych marek. Dostępne
              od ręki w serwisie przy ul. Orkana 16B.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-[#cccccc]">
              {["⚡ GaN", "🛡 Hammer Glass", "🔋 MagSafe", "📱 Etui"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-[14px] py-[6px]"
                  >
                    {chip}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Right showcase */}
          <div className="animate-fade-up-d hidden md:flex flex-col gap-3">
            {/* Rząd 1 */}
            <div className="flex gap-3">
              <ShowcaseCard
                product={getProductById("gan100w")}
                labelOverride="GaN 100W"
              />
              <ShowcaseCard
                product={getProductById("pb-magsafe")}
                labelOverride="Powerbank MagSafe"
              />
              <ShowcaseCard
                product={getProductById("etui-iphone")}
                labelOverride="Etui MagSafe"
              />
            </div>
            {/* Rząd 2 */}
            <div className="flex gap-3">
              <ShowcaseCard
                product={getProductById("uchwyt-magsafe")}
                labelOverride="Uchwyt MagSafe 15W"
              />
              <ShowcaseCard
                product={getProductById("stacja")}
                labelOverride="Stacja 3‑in‑1 Apple"
              />
            </div>
          </div>
        </div>
      </section>

      {/* BAND */}
      <section className="border-b border-[#e5e5e3] bg-white">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 border-l border-[#e5e5e3] sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: "⚡",
              title: "Szybkie ładowanie",
              text: "GaN, QC3, PD, MagSafe",
            },
            {
              icon: "🛡",
              title: "Hammer Glass CUT",
              text: "10 000+ modeli telefonów",
            },
            {
              icon: "📦",
              title: "Od ręki w serwisie",
              text: "ul. Orkana 16B, Rabka-Zdrój",
            },
            {
              icon: "💬",
              title: "Doradzimy w wyborze",
              text: "883 200 151",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-4 border-r border-[#e5e5e3] px-8 py-7"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[rgba(220,30,30,0.12)] bg-[#fff0f0] text-[18px]">
                <span>{item.icon}</span>
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#0d0d0d]">
                  {item.title}
                </p>
                <p className="mt-1 text-[12px] text-[#888]">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FILTER BAR — na mobile przewijanie w poziomie, padding żeby nic nie było ucięte */}
      <div className="sticky top-16 z-[400] mt-4 border-b border-[#e5e5e3] bg-white/95 backdrop-blur sm:mt-6">
        <div
          className="akcesoria-categories-scroll mx-auto max-w-[1280px] overflow-x-auto py-3 sm:overflow-visible sm:px-[52px]"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex min-w-max items-center justify-start gap-3 px-4 sm:min-w-0 sm:justify-center sm:px-0">
            {CATEGORIES.map((cat) => {
              const active = activeFilter === cat.slug;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setActiveFilter(cat.slug)}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2.5 text-[13px] font-semibold transition-colors sm:px-[22px] sm:py-[9px] sm:text-[14px] ${
                    active
                      ? "border-[#0d0d0d] bg-[#0d0d0d] text-white"
                      : "border-transparent bg-transparent text-[#888] hover:bg-[#f0f0ee] hover:text-[#0d0d0d]"
                  }`}
                >
                  {cat.emoji && <span className="mr-1.5">{cat.emoji}</span>}
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PRODUCT SECTIONS */}
      <section className="bg-[#f4f4f2] pb-24 pt-10">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-[52px]">
          {/* Ładowarki */}
          {(activeFilter === "all" || activeFilter === "ladowarki") && (
            <div className="cat-block reveal">
              <CategoryHeader
                label="ŁADOWARKI"
                count={getProductsBySlug("ladowarki").length}
              />
              <div className="grid gap-3 lg:grid-cols-[1.8fr,1fr,1fr]">
                {getProductsBySlug("ladowarki")
                  .slice(0, 3)
                  .map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {getProductsBySlug("ladowarki")
                  .slice(3)
                  .map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
              </div>
            </div>
          )}

          {/* Powerbanki */}
          {(activeFilter === "all" || activeFilter === "powerbank") && (
            <div className="cat-block reveal mt-10">
              <CategoryHeader
                label="POWERBANKI"
                count={getProductsBySlug("powerbank").length}
              />
              <div className="grid gap-3 md:grid-cols-3">
                {getProductsBySlug("powerbank").map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}

          {/* Etui */}
          {(activeFilter === "all" || activeFilter === "etui") && (
            <div className="cat-block reveal mt-10">
              <CategoryHeader
                label="ETUI"
                count={getProductsBySlug("etui").length}
              />
              <div className="grid gap-3 md:grid-cols-2">
                {getProductsBySlug("etui").map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}

          {/* Ochrona ekranu */}
          {(activeFilter === "all" || activeFilter === "ochrona") && (
            <div className="cat-block reveal mt-10">
              <CategoryHeader
                label="OCHRONA EKRANU"
                count={getProductsBySlug("ochrona").length}
              />
              <div className="grid gap-3 md:grid-cols-2">
                {getProductsBySlug("ochrona").map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}

          {/* Uchwyty / Selfie stick */}
          {(activeFilter === "all" || activeFilter === "uchwyty") && (
            <div className="cat-block reveal mt-10">
              <CategoryHeader
                label="UCHWYTY / SELFIE STICK"
                count={getProductsBySlug("uchwyty").length}
              />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {getProductsBySlug("uchwyty").map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}

          {/* Kable & inne */}
          {(activeFilter === "all" || activeFilter === "kable") && (
            <div className="cat-block reveal mt-10">
              <CategoryHeader
                label="KABLE"
                count={getProductsBySlug("kable").length}
              />
              <div className="grid gap-3 md:grid-cols-3">
                {getProductsBySlug("kable").map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA DARK */}
      <section className="relative bg-[#0d0e10] py-20">
        <div
          className="pointer-events-none absolute left-[-100px] top-1/2 h-[500px] w-[500px] -translate-y-1/2"
          style={{
            background:
              "radial-gradient(ellipse, rgba(220,30,30,0.07), transparent 65%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-4 sm:px-[52px] lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2a2d34]">
              Serwis + Sklep w jednym miejscu
            </p>
            <h2
              className="font-bold leading-tight tracking-tight text-white"
              style={{ fontSize: "clamp(24px,3.2vw,40px)" }}
            >
              Nie wiesz co wybrać?{" "}
              <span className="text-[#dc1e1e]">Pomożemy.</span>
            </h2>
            <p className="mt-3 max-w-[480px] text-[14px] leading-[1.75] text-[#3a3d44]">
              Doradzimy w wyborze akcesoriów, sprawdzimy kompatybilność z Twoim
              urządzeniem i zamówimy co potrzebujesz. Zapraszamy do serwisu lub
              zadzwoń.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:flex-col lg:items-end">
            <Link
              href="tel:883200151"
              className="inline-flex items-center gap-2 rounded-[13px] bg-[#dc1e1e] px-[26px] py-[13px] text-[13px] font-bold text-white shadow-[0_4px_18px_rgba(220,30,30,0.3)] transition-transform duration-150 hover:-translate-y-[1px]"
            >
              <Phone className="h-[14px] w-[14px]" />
              Zadzwoń: 883 200 151
            </Link>
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 rounded-[13px] border border-white/10 bg-white/[0.05] px-[26px] py-[13px] text-[13px] font-bold text-[#888] transition-colors duration-150 hover:border-white/18 hover:text-[#ccc]"
            >
              Odwiedź nas w serwisie
              <ArrowRight className="h-[12px] w-[12px]" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function CategoryHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="mb-6 flex items-baseline gap-4">
      <span className="text-[13px] font-black tracking-[-0.01em] text-[#0d0d0d]">
        {label}
      </span>
      <div className="h-px flex-1 bg-[#e5e5e3]" />
      <span className="text-[12px] text-[#888]">
        {count} {count === 1 ? "produkt" : "produkty"}
      </span>
    </div>
  );
}
