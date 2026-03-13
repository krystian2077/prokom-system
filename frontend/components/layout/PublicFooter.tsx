import Link from "next/link";

const services = [
  { href: "/uslugi", label: "Naprawa telefonów" },
  { href: "/serwis-laptopow", label: "Naprawa laptopów" },
  { href: "/serwis-tabletow", label: "Naprawa tabletów" },
  { href: "/serwis-drukarek", label: "Naprawa drukarek" },
  { href: "/serwis-konsol", label: "Naprawa konsol" },
  { href: "/serwis-komputerow", label: "Komputery stacjonarne" },
];

const shop = [
  { href: "/akcesoria", label: "Akcesoria GSM" },
  { href: "/akcesoria", label: "Ładowarki i kable" },
  { href: "/akcesoria", label: "Etui i ochrona" },
  { href: "/hammer-glass", label: "Hammer Glass CUT", badge: "Nowość" },
  { href: "/hammer-glass", label: "Folie ochronne" },
];

const info = [
  { href: "/o-nas", label: "O nas" },
  { href: "/faq", label: "FAQ" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/polityka-prywatnosci", label: "Polityka prywatności" },
  { href: "/regulamin", label: "Regulamin" },
];

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#050505] text-white">
      <div className="mx-auto max-w-6xl px-4 pb-6 pt-12 sm:px-6 lg:px-8">
        {/* Górny układ kolumnowy */}
        <div className="border-b border-white/5 pb-8 lg:pb-10">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            {/* Kolumna opisowa */}
            <div>
              <p className="text-xl font-extrabold tracking-tight sm:text-2xl">
                PRO – KOM
              </p>
              <p className="mt-3 max-w-xs text-sm text-white/70">
                Profesjonalny serwis elektroniki w Rabce‑Zdroju. Naprawiamy
                telefony, laptopy, tablety, drukarki i więcej. Szybko,
                uczciwie, z gwarancją.
              </p>
              <div className="mt-5 space-y-2 text-sm text-white/80">
                <p className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-primary">
                    <span className="text-xs">📞</span>
                  </span>
                  <a
                    href="tel:883200151"
                    className="hover:text-primary transition-colors"
                  >
                    883 200 151
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-primary">
                    <span className="text-xs">✉️</span>
                  </span>
                  <a
                    href="mailto:sklep@pro-kom.eu"
                    className="hover:text-primary transition-colors"
                  >
                    sklep@pro-kom.eu
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-primary">
                    <span className="text-xs">📍</span>
                  </span>
                  <span>ul. Orkana 16B, Rabka‑Zdrój</span>
                </p>
              </div>
            </div>

            {/* Kolumna: Usługi */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
                Usługi
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {services.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-white/80 transition-colors hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Kolumna: Sklep */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
                Sklep
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {shop.map(({ href, label, badge }) => (
                  <li key={`${href}-${label}`} className="flex items-center gap-2">
                    <Link
                      href={href}
                      className="text-white/80 transition-colors hover:text-white"
                    >
                      {label}
                    </Link>
                    {badge && (
                      <span className="rounded-full bg-primary px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wide text-white">
                        {badge}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Kolumna: Informacje */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
                Informacje
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {info.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-white/80 transition-colors hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Dolny pasek */}
        <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-4 text-[12px] text-white/50 sm:flex-row">
          <p className="order-2 sm:order-1">
            © {year}{" "}
            <span className="font-semibold text-white">PRO‑KOM</span>. Wszelkie
            prawa zastrzeżone.
          </p>

          <div className="order-1 flex flex-wrap items-center gap-3 sm:order-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Otwarte Pn–Pt 9:00–17:00
            </span>
            <div className="flex items-center gap-3">
              <Link
                href="/polityka-prywatnosci"
                className="hover:text-white transition-colors"
              >
                Polityka prywatności
              </Link>
              <Link
                href="/regulamin"
                className="hover:text-white transition-colors"
              >
                Regulamin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
