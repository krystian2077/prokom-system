"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { Certificate } from "@/lib/tech/certificates";

/**
 * Certificate thumbnails; a click opens the full document in a native <dialog> (focus trap, Esc,
 * backdrop click closes). Partner statuses are labelled with their years — history, not current.
 */
export function CertGallery({ items }: { items: Certificate[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<Certificate | null>(null);
  const show = (c: Certificate) => {
    setOpen(c);
    requestAnimationFrame(() => ref.current?.showModal());
  };
  return (
    <>
      <ul className="t-certs" aria-label="Certyfikaty i szkolenia" data-t-reveal="">
        {items.map((c) => (
          <li key={c.key} className="t-cert">
            <button type="button" className="t-cert__thumb" onClick={() => show(c)} aria-label={`Powiększ dokument: ${c.title}, ${c.period}`}>
              <Image src={c.image.thumb} alt="" width={c.image.thumbWidth} height={c.image.thumbHeight} sizes="(min-width: 1024px) 260px, 45vw" />
              <span className="t-cert__zoom" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="M16 16l4.5 4.5M11 8.5v5M8.5 11h5" />
                </svg>
              </span>
            </button>
            <div className="t-cert__body">
              <span className={`t-cert__chip t-cert__chip--${c.kind}`}>
                {c.kind === "status" ? `Status partnerski · ${c.period}` : `Szkolenie · ${c.period}`}
              </span>
              <b className="t-cert__title">{c.title}</b>
              <span className="t-cert__scope">{c.scope}</span>
            </div>
          </li>
        ))}
      </ul>
      <dialog
        ref={ref}
        className="t-certdlg"
        aria-label={open ? `${open.title}, ${open.period}` : "Certyfikat"}
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
        onClose={() => setOpen(null)}
      >
        {open ? (
          <figure className="t-certdlg__fig">
            <Image src={open.image.src} alt={`${open.title} — dokument (${open.period})`} width={open.image.width} height={open.image.height} sizes="(min-width: 1024px) 1000px, 94vw" />
            <figcaption>
              <b>{open.title}</b> · {open.scope} · {open.period}
            </figcaption>
          </figure>
        ) : null}
        <form method="dialog">
          <button type="submit" className="t-certdlg__close" aria-label="Zamknij podgląd">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </form>
      </dialog>
    </>
  );
}
