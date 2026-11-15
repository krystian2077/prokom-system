import type { ReactNode } from "react";
import type { HelperArt as Art } from "@/lib/tech/model-helper";

/**
 * Small Tech-style illustrations of the "Jak sprawdzić model" guides: a path of mini
 * screens (numbered like the path chips under it), the *#06# dialer, or where the
 * sticker is on the device. No screenshots of real interfaces, no brand logos.
 * Pure SVG (works in server components); colours come from tech-form.css classes.
 */

const W = 300;
const H = 132;

/** One mini phone screen with list rows; `hi` = highlighted row. */
function PhoneScreen({ x, n, hi, last }: { x: number; n: number; hi: number; last: boolean }) {
  const w = 62;
  const h = 112;
  const y = 10;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect className="t-hart__frame" width={w} height={h} rx="12" />
      <rect className="t-hart__notch" x={w / 2 - 9} y="5" width="18" height="4" rx="2" />
      <rect className="t-hart__title" x="8" y="17" width={n === 1 ? 30 : 24} height="5" rx="2.5" />
      {[0, 1, 2, 3, 4].map((r) => {
        const ry = 30 + r * 15;
        const on = r === hi;
        return (
          <g key={r}>
            <rect className={on ? "t-hart__row is-hi" : "t-hart__row"} x="6" y={ry} width={w - 12} height="11" rx="4" />
            <rect className={on ? "t-hart__line is-hi" : "t-hart__line"} x="11" y={ry + 4} width={on ? 22 : 16 + ((r * 7) % 12)} height="3" rx="1.5" />
            {on && last ? <rect className="t-hart__tag" x={w - 26} y={ry + 3} width="15" height="5" rx="2.5" /> : <path className="t-hart__chev" d={`M${w - 13} ${ry + 3.5}l2.5 2-2.5 2`} />}
          </g>
        );
      })}
      <circle className="t-hart__num" cx={w - 2} cy="2" r="9" />
      <text className="t-hart__numt" x={w - 2} y="5.5" textAnchor="middle">
        {n}
      </text>
    </g>
  );
}

/** One mini desktop window (Windows / Mac path). */
function DesktopScreen({ x, n, last }: { x: number; n: number; last: boolean }) {
  const w = 110;
  const h = 76;
  return (
    <g transform={`translate(${x} 14)`}>
      <rect className="t-hart__frame" width={w} height={h} rx="8" />
      <path className="t-hart__stand" d={`M${w / 2 - 12} ${h + 18}h24M${w / 2} ${h}v18`} />
      <rect className="t-hart__title" x="8" y="8" width="26" height="5" rx="2.5" />
      {last ? (
        <>
          <rect className="t-hart__row is-hi" x="8" y="22" width={w - 16} height="22" rx="5" />
          <rect className="t-hart__line is-hi" x="14" y="28" width="46" height="4" rx="2" />
          <rect className="t-hart__tag" x="14" y="35" width="30" height="4" rx="2" />
          <rect className="t-hart__row" x="8" y="50" width={w - 16} height="9" rx="3" />
          <rect className="t-hart__row" x="8" y="62" width={w - 40} height="7" rx="3" />
        </>
      ) : (
        <>
          <rect className="t-hart__row" x="8" y="22" width="26" height="46" rx="4" />
          {[0, 1, 2].map((r) => (
            <rect key={r} className={r === 1 ? "t-hart__row is-hi" : "t-hart__row"} x="40" y={22 + r * 16} width={w - 48} height="12" rx="4" />
          ))}
        </>
      )}
      <circle className="t-hart__num" cx={w - 2} cy="2" r="9" />
      <text className="t-hart__numt" x={w - 2} y="5.5" textAnchor="middle">
        {n}
      </text>
    </g>
  );
}

function Arrow({ x, y }: { x: number; y: number }) {
  return <path className="t-hart__arrow" d={`M${x} ${y}h16m-5-5 5 5-5 5`} />;
}

function Screens({ steps, frame }: { steps: number; frame: "phone" | "watch" | "desktop" | "tv" }) {
  const n = Math.max(1, Math.min(steps, frame === "desktop" ? 2 : 3));
  const sw = frame === "desktop" ? 110 : 62;
  const gap = 34;
  const total = n * sw + (n - 1) * gap;
  const x0 = (W - total) / 2;
  const out: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (sw + gap);
    const last = i === n - 1;
    out.push(frame === "desktop" ? <DesktopScreen key={i} x={x} n={i + 1} last={last} /> : <PhoneScreen key={i} x={x} n={i + 1} hi={last ? 1 : i === 0 ? 3 : 0} last={last} />);
    if (!last) out.push(<Arrow key={`a${i}`} x={x + sw + 9} y={frame === "desktop" ? 52 : 66} />);
  }
  return <>{out}</>;
}

function Dialer() {
  const x = 104;
  return (
    <>
      <g transform={`translate(${x} 6)`}>
        <rect className="t-hart__frame" width="92" height="122" rx="16" />
        <rect className="t-hart__notch" x="37" y="6" width="18" height="4" rx="2" />
        <text className="t-hart__code" x="46" y="32" textAnchor="middle">
          *#06#
        </text>
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2].map((c) => <circle key={`${r}${c}`} className={r === 3 && c !== 1 ? "t-hart__key is-hi" : "t-hart__key"} cx={22 + c * 24} cy={50 + r * 17} r="6.5" />),
        )}
      </g>
      <g transform="translate(206 38)">
        <rect className="t-hart__card" width="78" height="40" rx="9" />
        <rect className="t-hart__line" x="9" y="9" width="24" height="4" rx="2" />
        <rect className="t-hart__tag" x="9" y="19" width="58" height="5" rx="2.5" />
        <rect className="t-hart__line" x="9" y="28" width="40" height="4" rx="2" />
      </g>
    </>
  );
}

/** Sticker with a barcode, highlighted with a magnifier ring. */
function Sticker({ x, y, w = 56, h = 30 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect className="t-hart__sticker" width={w} height={h} rx="4" />
      <rect className="t-hart__line is-hi" x="6" y="6" width={w * 0.45} height="3.5" rx="1.75" />
      <rect className="t-hart__line" x="6" y="12.5" width={w * 0.3} height="3" rx="1.5" />
      <path className="t-hart__barcode" d={Array.from({ length: Math.floor((w - 12) / 3.2) }, (_, i) => `M${6 + i * 3.2} ${h - 10}v${i % 3 === 0 ? 6 : 5}`).join("")} />
      <circle className="t-hart__ring" cx={w / 2} cy={h / 2} r={Math.max(w, h) * 0.62} />
    </g>
  );
}

function StickerOn({ on }: { on: Extract<Art, { kind: "sticker" }>["on"] }) {
  switch (on) {
    case "laptop":
      return (
        <>
          <rect className="t-hart__frame" x="60" y="18" width="180" height="100" rx="12" />
          {[78, 222].map((cx) => [34, 102].map((cy) => <circle key={`${cx}${cy}`} className="t-hart__foot" cx={cx} cy={cy} r="5" />))}
          <path className="t-hart__vent" d="M96 36h50M96 44h50M96 52h50" />
          <Sticker x={160} y={74} />
        </>
      );
    case "desktop":
      return (
        <>
          <rect className="t-hart__frame" x="104" y="8" width="92" height="118" rx="8" />
          <path className="t-hart__vent" d="M118 22h28M118 30h28M118 38h28" />
          <circle className="t-hart__foot" cx="174" cy="30" r="7" />
          <Sticker x={122} y={76} w={52} />
        </>
      );
    case "printer":
      return (
        <>
          <path className="t-hart__frame" d="M92 30h116v-14a4 4 0 0 0-4-4H96a4 4 0 0 0-4 4z" />
          <rect className="t-hart__frame" x="64" y="30" width="172" height="78" rx="12" />
          <rect className="t-hart__row" x="96" y="108" width="108" height="12" rx="3" />
          <rect className="t-hart__foot" x="80" y="44" width="30" height="10" rx="3" />
          <Sticker x={152} y={62} w={60} />
        </>
      );
    case "console":
      return (
        <>
          <rect className="t-hart__frame" x="50" y="34" width="200" height="70" rx="14" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} className="t-hart__foot" x={70 + i * 16} y="48" width="10" height="7" rx="2" />
          ))}
          <path className="t-hart__vent" d="M70 88h60" />
          <Sticker x={164} y={52} w={58} />
        </>
      );
    case "watch":
      return (
        <>
          <rect className="t-hart__row" x="128" y="4" width="44" height="22" rx="6" />
          <rect className="t-hart__row" x="128" y="106" width="44" height="22" rx="6" />
          <circle className="t-hart__frame" cx="150" cy="66" r="46" />
          <circle className="t-hart__row" cx="150" cy="66" r="22" />
          <path className="t-hart__engrave" d="M120 52h18M162 52h18M122 82h16M162 82h16M132 98h36" />
          <circle className="t-hart__ring" cx="150" cy="90" r="22" />
        </>
      );
    case "box":
      return (
        <>
          <path className="t-hart__frame" d="M90 30l20-16h100l-20 16z" />
          <rect className="t-hart__frame" x="90" y="30" width="100" height="94" rx="4" />
          <path className="t-hart__frame" d="M190 30l20-16v94l-20 16z" />
          <rect className="t-hart__row" x="120" y="44" width="40" height="64" rx="8" />
          <Sticker x={112} y={86} w={62} h={28} />
        </>
      );
    case "drive":
      return (
        <>
          <rect className="t-hart__frame" x="80" y="16" width="140" height="100" rx="8" />
          {[92, 208].map((cx) => [28, 104].map((cy) => <circle key={`${cx}${cy}`} className="t-hart__foot" cx={cx} cy={cy} r="4" />))}
          <Sticker x={104} y={40} w={92} h={44} />
        </>
      );
    default:
      return (
        <>
          <rect className="t-hart__frame" x="90" y="10" width="120" height="112" rx="16" />
          <Sticker x={118} y={70} w={64} />
        </>
      );
  }
}

/** Decorative illustration (aria-hidden): the text next to it says the same. */
export function HelperArt({ art, steps = 0 }: { art: Art; steps?: number }) {
  return (
    <svg className="t-hart" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      {art.kind === "screens" ? <Screens steps={steps} frame={art.frame} /> : art.kind === "dialer" ? <Dialer /> : <StickerOn on={art.on} />}
    </svg>
  );
}
