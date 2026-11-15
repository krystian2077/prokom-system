import Link from "next/link";
import { formatDate, truncate } from "@/lib/format";
import { formatPrice, type Repair } from "@/types/panel";
import { IconChevronRight } from "../icons";
import { DeviceBadge, Skel, StatusPill } from "./AccountUi";

export function repairTitle(repair: Repair, max: number): string {
  const device = [repair.deviceBrand, repair.deviceModel].filter(Boolean).join(" ") || repair.deviceModel;
  return truncate(repair.problemDescription ? `${device} – ${repair.problemDescription}` : device, max);
}

/** One repair in a list (dashboard and "Moje naprawy"): device, number, date, status, cost. */
export function RepairRow({ repair, statusLabel }: { repair: Repair; statusLabel?: string | null }) {
  const courier = repair.deliveryMethod === "kurier" || repair.pickupMethod === "kurier";
  return (
    <li>
      <Link href={`/client/naprawy/${repair.id}`} className="t-ck-row">
        <DeviceBadge category={repair.deviceCategory} />
        <span className="t-ck-row__main">
          <span className="t-ck-row__title">{repairTitle(repair, 64)}</span>
          <span className="t-ck-row__meta">
            <span className="t-ck-ref">{repair.repairNumber}</span>
            <span aria-hidden="true">·</span>
            <span>Przyjęto {formatDate(repair.createdAt)}</span>
            {courier ? <span className="t-ck-tag">Kurier</span> : null}
          </span>
        </span>
        <span className="t-ck-row__side">
          <StatusPill status={repair.status} label={statusLabel} />
          <span className="t-ck-row__price">{formatPrice(repair.totalPrice)}</span>
        </span>
        <IconChevronRight size={18} className="t-ck-row__go" />
      </Link>
    </li>
  );
}

export function RepairRowsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="t-ck-rows" aria-busy="true" aria-label="Ładowanie napraw">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <div className="t-ck-row t-ck-row--skel">
            <Skel w={48} h={48} r={14} />
            <span className="t-ck-row__main">
              <Skel w="70%" h={15} />
              <Skel w="40%" h={12} />
            </span>
            <span className="t-ck-row__side">
              <Skel w={110} h={26} r={999} />
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
