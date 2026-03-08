import Link from "next/link";

const services = [
  { href: "/serwis-telefonow", label: "Serwis telefonów" },
  { href: "/serwis-tabletow", label: "Serwis tabletów" },
  { href: "/serwis-laptopow", label: "Serwis laptopów" },
  { href: "/serwis-komputerow", label: "Serwis komputerów" },
  { href: "/serwis-drukarek", label: "Serwis drukarek" },
  { href: "/serwis-konsol", label: "Serwis konsol" },
  { href: "/serwis-smartwatchy", label: "Smartwatche" },
  { href: "/hammer-glass", label: "Hammer Glass" },
  { href: "/akcesoria", label: "Akcesoria" },
];

const repairCategories = [
  { href: "/serwis-telefonow", label: "Telefony" },
  { href: "/serwis-tabletow", label: "Tablety" },
  { href: "/serwis-laptopow", label: "Laptopy" },
  { href: "/serwis-komputerow", label: "Komputery" },
  { href: "/serwis-drukarek", label: "Drukarki" },
  { href: "/serwis-konsol", label: "Konsole" },
];

const contact = [
  { href: "/kontakt", label: "Kontakt" },
  { href: "/faq", label: "FAQ" },
  { href: "/zgloszenie", label: "Zgłoś naprawę" },
];

const legal = [
  { href: "/regulamin", label: "Regulamin" },
  { href: "/polityka-prywatnosci", label: "Polityka prywatności" },
];

export function PublicFooter() {
  return (
    <footer className="bg-dark text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-2xl font-bold tracking-tight">PRO-KOM</p>
            <p className="mt-4 max-w-sm text-sm text-gray-400">
              Profesjonalny serwis elektroniki. Naprawy, Hammer Glass i akcesoria. Szybka diagnostyka i transparentne ceny.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Usługi</h3>
            <ul className="mt-4 space-y-3">
              {services.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Kategorie napraw</h3>
            <ul className="mt-4 space-y-3">
              {repairCategories.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Kontakt i legal</h3>
            <ul className="mt-4 space-y-3">
              {contact.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
              {legal.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} PRO-KOM. Wszelkie prawa zastrzeżone.
        </div>
      </div>
    </footer>
  );
}
