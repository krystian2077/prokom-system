import Link from "next/link";
import { courierPageHref } from "@/lib/tech/courier";
import { IconArrow, IconPath } from "../icons";

/**
 * "Nie możesz przyjechać? Wyślij kurierem" (SPEC §12.10 linking). Renders only once
 * /naprawa-kurierem is published (courierService.published) — no dead link before that.
 */
export function CourierTeaser({ className }: { className?: string }) {
  const href = courierPageHref();
  if (!href) return null;
  return (
    <Link href={href} className={`t-card t-courier-tile${className ? ` ${className}` : ""}`}>
      <span className="t-ico" aria-hidden="true">
        <IconPath icon="truck" size={22} />
      </span>
      <span className="t-courier-tile__txt">
        <b>Nie możesz przyjechać? Wyślij kurierem</b>
        <span>Zgłoś naprawę online, nadaj paczkę dowolnym kurierem, a sprzęt wróci na Twój adres.</span>
      </span>
      <IconArrow size={18} strokeWidth={2.6} className="t-courier-tile__arrow" />
    </Link>
  );
}
