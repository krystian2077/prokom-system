import { line, servicePoints } from "@/config/prokom";
import { publishedPoints } from "@/lib/tech/points";
import { hoursRows, pointAddress, pointPhoneDisplay } from "@/lib/tech/point-format";
import { IconPhoneCall, IconPin } from "../icons";
import { IconMail } from "./account-icons";

/**
 * Service contact for the client account — only from config/prokom.ts (SPEC §5):
 * line phone and e-mail, published points with address and hours.
 */
export function ServiceContact({ compact = false }: { compact?: boolean }) {
  const points = publishedPoints(servicePoints);
  return (
    <div className={`t-ck-contact${compact ? " t-ck-contact--compact" : ""}`}>
      <div className="t-ck-contact__lines">
        <a href={`tel:${line.phone.replace(/\s/g, "")}`} className="t-ck-contact__line">
          <span className="t-ck-contact__ico" aria-hidden="true">
            <IconPhoneCall size={17} />
          </span>
          <span>
            <span className="t-ck-contact__k">Telefon</span>
            <strong>{line.phoneDisplay}</strong>
          </span>
        </a>
        <a href={`mailto:${line.email}`} className="t-ck-contact__line">
          <span className="t-ck-contact__ico" aria-hidden="true">
            <IconMail size={17} />
          </span>
          <span>
            <span className="t-ck-contact__k">E-mail</span>
            <strong>{line.email}</strong>
          </span>
        </a>
      </div>
      <ul className="t-ck-contact__points">
        {points.map((p) => (
          <li key={p.key}>
            <span className="t-ck-contact__ico t-ck-contact__ico--pin" aria-hidden="true">
              <IconPin size={17} />
            </span>
            <span>
              <strong>{p.name}</strong>
              <span>{pointAddress(p)}</span>
              <span className="t-ck-contact__hours">
                {hoursRows(p)
                  .filter((r) => r.open)
                  .map((r) => `${r.label} ${r.value}`)
                  .join(" · ")}
              </span>
              {p.phone ? <span>tel. {pointPhoneDisplay(p)}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
