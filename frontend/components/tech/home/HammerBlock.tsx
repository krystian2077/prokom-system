import Image from "next/image";
import Link from "next/link";
import { claim } from "@/lib/tech/claims";
import { IconArrow } from "../icons";

/** Hammer Glass block (design T.Main `#hammer`). Numbers only when confirmed (SPEC §10). */
export function HammerBlock() {
  const minutes = claim("hgMinutes");
  const precision = claim("hgPrecision");
  const cut = claim("hgCutTime");
  const foils = claim("hgFoils");
  const stats = [
    { c: claim("hgModels"), l: "modeli w bazie" },
    { c: foils, l: "rodzajów folii" },
    { c: precision, l: "precyzja cięcia" },
  ].filter((s) => s.c) as { c: { text: string; draft: boolean }; l: string }[];
  return (
    <section id="hammer" data-rail="Hammer Glass" className="t-hammersec t-ui" aria-labelledby="t-hammer-h">
      <div className="t-container">
        <div className="t-hammer">
          <div className="t-hammer__text">
            <span className="t-eyb t-eyb--dark">Hammer Glass CUT · ploter w serwisie</span>
            <h2 id="t-hammer-h" className="t-h2 t-hammer__h">
              Folia wycięta pod Twój model.{" "}
              {minutes ? <span className={minutes.draft ? "t-draft" : undefined}>{minutes.text.replace(" 5 ", " 5 ")}</span> : null}
            </h2>
            <p className="t-lead t-hammer__lead">
              Wybierasz rodzaj folii, podajesz model, a ploter VersaBlade X Pro wycina ją
              {precision ? <span className={precision.draft ? "t-draft" : undefined}> z dokładnością {precision.text}</span> : " na miejscu"}. Zakładamy od ręki.
            </p>
            {stats.length ? (
              <div className="t-hammer__stats">
                {stats.map((s) => (
                  <span key={s.l} className={`t-hammer__stat${s.c.draft ? " t-draft" : ""}`}>
                    <b>{s.c.text}</b>
                    {s.l}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="t-hammer__actions">
              <Link href="/hammer-glass" className="t-sbtn t-sbtn--lg t-shine">
                Poznaj Hammer Glass
                <IconArrow size={17} strokeWidth={2.6} />
              </Link>
              <Link href="/hammer-glass#folie" className="t-sbtn t-sbtn--lg t-sbtn--ghost">
                {foils && !foils.draft ? `${foils.text} rodzajów folii` : "Rodzaje folii"}
              </Link>
            </div>
          </div>
          <div className="t-hammer__photo">
            <Image src="/tech/hammer/hg-ciecie.webp" alt="Ploter Hammer Glass wycina folię ochronną" fill sizes="(min-width: 1180px) 680px, 100vw" unoptimized />
            <span className="t-hammer__fade" aria-hidden="true" />
            {cut ? (
              <span className={`t-hammer__chip${cut.draft ? " t-draft" : ""}`}>
                <i aria-hidden="true" />
                {cut.text}
              </span>
            ) : null}
          </div>
          <Image className="t-hammer__float" src="/tech/hammer/hg-folie.webp" alt="Opakowania folii Hammer Glass" width={840} height={650} unoptimized />
        </div>
      </div>
    </section>
  );
}
