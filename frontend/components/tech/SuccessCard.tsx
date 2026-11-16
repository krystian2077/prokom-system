"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { line, type ServicePoint } from "@/config/prokom";
import { trackHref, type DeviceCategory, type SubmitResponse } from "@/lib/tech/contract";
import { courierDestination, courierPageHref, courierPoints, courierWhereText } from "@/lib/tech/courier";
import { hoursSummary } from "@/lib/tech/hours";
import { pointAddress } from "@/lib/tech/point-format";
import { qrMatrix, qrPath, type QrMatrix } from "@/lib/tech/qr";
import { SITE_URL } from "@/lib/site-config";
import { IconArrow, IconCheck } from "./icons";
import { NavigateButtons } from "./NavigateButtons";
import { OpeningStatus } from "./OpeningStatus";
import { PrepChecklist } from "./PrepChecklist";

type Props = {
  response: SubmitResponse;
  deviceLabel: string;
  category: DeviceCategory | null;
  point: (ServicePoint & { draft?: boolean }) | null;
  courier: boolean;
  /** Courier drop-off: the salon the client chose in step 2 (null = list every salon). */
  courierPoint?: ServicePoint | null;
  /** Logged-in client: the backend points to /client/naprawy. */
  loggedIn: boolean;
  /** Slot for "Zapamiętaj na tym urządzeniu" (TD3 PR 3). */
  children?: ReactNode;
};

/** Next steps after sending (design T.Zgloszenie "Co dalej", without unconfirmed time promises — SPEC §8, §10). */
const NEXT_STEPS = [
  { t: "Diagnoza i wycena", s: "Po przyjęciu sprzętu sprawdzamy usterkę i przesyłamy wycenę." },
  { t: "Twoja decyzja", s: "Akceptujesz albo rezygnujesz bez konsekwencji." },
  { t: "Status online", s: "Po numerze zgłoszenia i 4 ostatnich cyfrach telefonu." },
];

const QUIET = 2;

/** Draws the card as a PNG (logo text, number, QR, point and hours) — "Zapisz jako obraz". */
function drawCard(canvas: HTMLCanvasElement, number: string, qr: QrMatrix, pointLines: string[]): void {
  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const font = (w: number, s: number) => `${w} ${s}px Manrope, "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = "#F4F5F1";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(60, 60, W - 120, H - 120, 48);
  ctx.fill();
  ctx.fillStyle = "#121613";
  ctx.font = font(800, 54);
  ctx.fillText(line.name.toUpperCase(), 120, 170);
  ctx.fillStyle = "#D13A2E";
  ctx.fillRect(120, 192, 140, 8);
  ctx.fillStyle = "#4F5650";
  ctx.font = font(700, 34);
  ctx.fillText("Zgłoszenie naprawy", 120, 270);
  ctx.fillStyle = "#121613";
  ctx.font = font(800, number.length > 18 ? 58 : 68);
  ctx.fillText(number, 120, 350);
  // QR
  const box = 520;
  const n = qr.size + QUIET * 2;
  const cell = Math.floor(box / n);
  const x0 = (W - cell * n) / 2;
  const y0 = 410;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(x0, y0, cell * n, cell * n);
  ctx.fillStyle = "#121613";
  for (let r = 0; r < qr.size; r++) for (let c = 0; c < qr.size; c++) if (qr.dark(r, c)) ctx.fillRect(x0 + (c + QUIET) * cell, y0 + (r + QUIET) * cell, cell, cell);
  ctx.fillStyle = "#4F5650";
  ctx.font = font(700, 30);
  ctx.textAlign = "center";
  ctx.fillText(`Status: ${line.domain}/track`, W / 2, y0 + cell * n + 56);
  ctx.textAlign = "left";
  let y = y0 + cell * n + 140;
  pointLines.forEach((txt, i) => {
    ctx.fillStyle = i === 0 ? "#121613" : "#4F5650";
    ctx.font = font(i === 0 ? 800 : 600, i === 0 ? 38 : 30);
    ctx.fillText(txt, 120, y);
    y += i === 0 ? 52 : 44;
  });
}

/** Success screen after sending (SPEC §12.7, KONTRAKT §1.2). */
export function SuccessCard({ response, deviceLabel, category, point, courier, courierPoint = null, loggedIn, children }: Props) {
  const number = response.repair_number;
  const link = trackHref(number, SITE_URL);
  const qr = useMemo(() => qrMatrix(link), [link]);
  const path = useMemo(() => qrPath(qr, QUIET), [qr]);
  const [copied, setCopied] = useState<"" | "number" | "link">("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const copy = async (text: string, what: "number" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      window.setTimeout(() => setCopied(""), 2500);
    } catch {
      /* clipboard blocked — the number stays visible and selectable */
    }
  };

  const share = async () => {
    const data = { title: `Zgłoszenie ${number} · ${line.name}`, text: `Status naprawy ${number}`, url: link };
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(data);
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
      }
    }
    void copy(link, "link");
  };

  const pointLines = point ? [`${line.name} · ${point.name}`, [point.street, `${point.postal} ${point.city}`].filter(Boolean).join(", "), hoursSummary(point)].filter(Boolean) : [line.name, `Serwis: ${line.phoneDisplay}`];

  const saveImage = () => {
    const canvas = document.createElement("canvas");
    drawCard(canvas, number, qr, pointLines);
    const a = document.createElement("a");
    a.download = `zgloszenie-${number.replace(/[^\w-]+/g, "-")}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  const statusHref = loggedIn && response.tracking_url?.startsWith("/client") ? response.tracking_url : trackHref(number);

  return (
    <section className="t-success" aria-labelledby="t-success-title">
      <div className="t-success__main t-card">
        <span className="t-success__ok" aria-hidden="true">
          <IconCheck size={26} />
        </span>
        <h1 id="t-success-title" ref={headingRef} tabIndex={-1}>
          Zgłoszenie przyjęte
        </h1>
        {response.message ? <p className="t-lead">{response.message}</p> : null}

        <div className="t-success__ticket">
          <div className="t-success__number">
            <span className="t-label">Numer zgłoszenia</span>
            <b data-repair-number="">{number}</b>
            <span className="t-success__device">{deviceLabel}</span>
            <button type="button" className="t-btn t-btn--sm t-btn--ghost" onClick={() => copy(number, "number")}>
              {copied === "number" ? "Skopiowano" : "Kopiuj numer"}
            </button>
          </div>
          <figure className="t-success__qr">
            <svg viewBox={`0 0 ${qr.size + QUIET * 2} ${qr.size + QUIET * 2}`} role="img" aria-label={`Kod QR do statusu zgłoszenia ${number}`} shapeRendering="crispEdges">
              <rect width="100%" height="100%" fill="#fff" />
              <path d={path} fill="#121613" />
            </svg>
            <figcaption>Zeskanuj, żeby sprawdzić status</figcaption>
          </figure>
        </div>

        <div className="t-success__actions">
          <Link href={statusHref} className="t-btn t-btn--acc t-btn--shine">
            {loggedIn ? "Moje naprawy w koncie" : "Sprawdź status"} <IconArrow />
          </Link>
          <button type="button" className="t-btn t-btn--ghost" onClick={share}>
            {copied === "link" ? "Skopiowano link" : "Udostępnij"}
          </button>
          <button type="button" className="t-btn t-btn--ghost" onClick={saveImage}>
            Zapisz jako obraz
          </button>
        </div>
        <p className="t-success__hint">Status sprawdzisz po numerze zgłoszenia i 4 ostatnich cyfrach telefonu podanego w zgłoszeniu.</p>
        {children}
      </div>

      <div className="t-success__side">
        {point ? (
          <div className={`t-success__point t-dark${point.draft ? " t-draft" : ""}`}>
            <span className="t-eyebrow t-eyebrow--dark">Gdzie oddać sprzęt</span>
            <b className="t-success__pname">
              {line.name} · {point.name}
            </b>
            <span>{[point.street, `${point.postal} ${point.city}`].filter(Boolean).join(", ")}</span>
            <OpeningStatus points={[point]} variant="pill" skeletonCh={18} />
            <span className="t-success__hours">{hoursSummary(point)}</span>
            <NavigateButtons point={point} dark />
          </div>
        ) : courier ? (
          <div className="t-success__point t-dark">
            <span className="t-eyebrow t-eyebrow--dark">Wysyłka kurierem</span>
            {courierPoint ? (
              <>
                <span>
                  Możesz wysłać sprzęt {courierPoints().length > 1 ? "na adres wybranego salonu" : courierDestination([courierPoint])}. Numer zgłoszenia <b>{number}</b> włóż do paczki.
                </span>
                <b className="t-success__pname">
                  {line.name} · {courierPoint.name}
                </b>
                <span>{pointAddress(courierPoint)}</span>
                <span className="t-success__hours">Paczki odbieramy: {hoursSummary(courierPoint)}</span>
              </>
            ) : (
              <>
                <span>
                  {courierWhereText() ?? "Wyślij sprzęt kurierem na adres naszego salonu."} Numer zgłoszenia <b>{number}</b> włóż do paczki.
                </span>
                {courierPoints().map((p) => (
                  <span key={p.key} className="t-success__hours">
                    {line.name} — {p.name}: {pointAddress(p)}
                  </span>
                ))}
              </>
            )}
            {courierPageHref() ? (
              <Link href={courierPageHref()!} className="t-lnk t-lnk--sm">
                Jak spakować i wysłać
              </Link>
            ) : null}
          </div>
        ) : null}
        <PrepChecklist category={category} />
        <div className="t-success__next t-card">
          <span className="t-eyebrow">Co dalej</span>
          <ol>
            {NEXT_STEPS.map((s, i) => (
              <li key={s.t}>
                <span>{i + 1}</span>
                <p>
                  <b>{s.t}</b>
                  <br />
                  {s.s}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
