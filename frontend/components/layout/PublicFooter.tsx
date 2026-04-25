import Link from "next/link";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

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
  { href: "https://www.pro-kom.eu/index.php/firma", label: "O nas", external: true },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
  { href: "/obslugiwane-miejscowosci", label: "Obsługiwane miejscowości" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/polityka-prywatnosci", label: "Polityka prywatności" },
  { href: "/regulamin", label: "Regulamin" },
];

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white text-prokom-black lg:bg-[#050505] lg:text-white" style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}>

      {/* ═══════ MOBILE FOOTER ═══════ */}
      <div className="px-5 pb-[calc(env(safe-area-inset-bottom,0px)+88px)] pt-2 lg:hidden">
        {/* Divider line */}
        <div className="mb-6 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        {/* Brand block */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-[0_4px_14px_-3px_rgba(225,29,29,0.35)]">
            <span className="text-sm font-black text-white">PK</span>
          </div>
          <div>
            <p className="text-[15px] font-extrabold tracking-tight text-gray-900">PRO‑KOM</p>
            <p className="text-[11px] font-medium tracking-wide text-gray-400">SERWIS ELEKTRONIKI</p>
          </div>
        </div>

        {/* Contact cards */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <a
            href="tel:883200151"
            className="flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-gray-50/70 px-3.5 py-3 transition-all active:scale-[0.97]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Phone className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Telefon</p>
              <p className="text-[13px] font-bold text-gray-900">883 200 151</p>
            </div>
          </a>
          <a
            href="mailto:sklep@pro-kom.eu"
            className="flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-gray-50/70 px-3.5 py-3 transition-all active:scale-[0.97]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">E-mail</p>
              <p className="truncate text-[13px] font-bold text-gray-900">sklep@pro-kom.eu</p>
            </div>
          </a>
        </div>

        {/* Address + hours row */}
        <div className="mt-3 flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50/70 px-3.5 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
            <MapPin className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <p className="flex-1 text-[12px] leading-snug text-gray-500">
            <span className="font-semibold text-gray-700">ul. Orkana 16B</span>, Rabka‑Zdrój
          </p>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600">Pn–Pt 9–17</span>
          </span>
        </div>

        {/* Legal row */}
        <div className="mt-5 flex flex-col items-center gap-2.5">
          <div className="flex items-center gap-4 text-[11px] font-medium text-gray-400">
            <Link href="/polityka-prywatnosci" className="min-h-[44px] content-center transition-colors active:text-primary">
              Polityka prywatności
            </Link>
            <span className="h-3 w-px bg-gray-200" />
            <Link href="/regulamin" className="min-h-[44px] content-center transition-colors active:text-primary">
              Regulamin
            </Link>
            <span className="h-3 w-px bg-gray-200" />
            <Link href="/faq" className="min-h-[44px] content-center transition-colors active:text-primary">
              FAQ
            </Link>
          </div>
          <p className="text-[11px] text-gray-300">
            © {year} PRO‑KOM · Wszelkie prawa zastrzeżone
          </p>
        </div>
      </div>

      {/* ═══════ DESKTOP FOOTER ═══════ */}
      <div className="mx-auto hidden max-w-6xl px-5 sm:px-6 lg:block lg:px-8 lg:pb-8 lg:pt-12">
        <div className="border-b border-white/5 pb-10">
          <div className="grid gap-10 lg:grid-cols-4">
            {/* Brand column */}
            <div>
              <p className="text-2xl font-extrabold tracking-tight">PRO – KOM</p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
                Profesjonalny serwis elektroniki w Rabce‑Zdroju. Naprawiamy
                telefony, laptopy, tablety, drukarki i więcej. Szybko,
                uczciwie, z gwarancją.
              </p>
              <div className="mt-5 space-y-2 text-sm text-white/80">
                <p className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                    <Phone className="h-3.5 w-3.5" />
                  </span>
                  <a href="tel:883200151" className="transition-colors hover:text-primary">883 200 151</a>
                </p>
                <p className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                    <Mail className="h-3.5 w-3.5" />
                  </span>
                  <a href="mailto:sklep@pro-kom.eu" className="transition-colors hover:text-primary">sklep@pro-kom.eu</a>
                </p>
                <p className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                    <MapPin className="h-3.5 w-3.5" />
                  </span>
                  <span>ul. Orkana 16B, Rabka‑Zdrój</span>
                </p>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">Usługi</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {services.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-white/80 transition-colors hover:text-white">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Shop */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">Sklep</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {shop.map(({ href, label, badge }) => (
                  <li key={`${href}-${label}`} className="flex items-center gap-2">
                    <Link href={href} className="text-white/80 transition-colors hover:text-white">{label}</Link>
                    {badge && (
                      <span className="rounded-full bg-primary px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wide text-white">{badge}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Info */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">Informacje</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {info.map(({ href, label, external }) => (
                  <li key={href}>
                    {external ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-white/80 transition-colors hover:text-white">{label}</a>
                    ) : (
                      <Link href={href} className="text-white/80 transition-colors hover:text-white">{label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Desktop bottom bar */}
        <div className="mt-6 flex items-center justify-between gap-4 text-[12px] text-white/50">
          <p>© {year} <span className="font-semibold text-white">PRO‑KOM</span>. Wszelkie prawa zastrzeżone.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Otwarte Pn–Pt 9:00–17:00
            </span>
            <Link href="/polityka-prywatnosci" className="transition-colors hover:text-white">Polityka prywatności</Link>
            <Link href="/regulamin" className="transition-colors hover:text-white">Regulamin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
