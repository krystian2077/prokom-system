import type { CSSProperties, ReactNode } from "react";
import type { AppIcon, Frame, Pair, Scene, Thing } from "@/lib/tech/model-helper";

/**
 * Illustrations of the "Jak sprawdzić model" steps: settings screens drawn in HTML/CSS
 * (real Polish labels, so the visitor recognises the screen), the phone keypad, and
 * devices seen from outside with the sticker under a magnifier. Decorative: the step
 * text says the same, so the whole scene is aria-hidden. No brand logos.
 */

const hue = (i: number) => ({ "--h": `${(i * 47 + 8) % 360}` }) as CSSProperties;
const delay = (i: number) => ({ "--i": i }) as CSSProperties;

function Glyph({ icon }: { icon: AppIcon }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">
      {icon === "settings" ? (
        <g {...common}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" />
          <circle cx="12" cy="12" r="6.6" />
        </g>
      ) : icon === "phone" ? (
        <path {...common} d="M6.6 3.5h2.6l1.5 4-2 1.3a11 11 0 0 0 6.5 6.5l1.3-2 4 1.5v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" />
      ) : icon === "watch" ? (
        <g {...common}>
          <rect x="6.5" y="6" width="11" height="12" rx="3.2" />
          <path d="M9 6l.6-3h4.8l.6 3M9 18l.6 3h4.8l.6-3M12 9.5V12l1.6 1.2" />
        </g>
      ) : (
        <g {...common}>
          <circle cx="12" cy="12" r="6" />
          <path d="M12 3v3M12 18v3M12 9v3h2.5" />
        </g>
      )}
    </svg>
  );
}

function Tap() {
  return <span className="t-hs__tap" aria-hidden="true" />;
}

/* ---------- Frames ---------- */

function DeviceFrame({ frame, children, title }: { frame: Frame; children: ReactNode; title?: string }) {
  if (frame === "pc" || frame === "mac") {
    return (
      <div className={`t-hs__win t-hs__win--${frame}`}>
        <div className="t-hs__winbar">
          {frame === "mac" ? (
            <span className="t-hs__lights">
              <i />
              <i />
              <i />
            </span>
          ) : null}
          <span className="t-hs__wintitle">{title}</span>
          {frame === "pc" ? (
            <span className="t-hs__winctl">
              <i />
              <i />
              <i />
            </span>
          ) : null}
        </div>
        <div className="t-hs__winbody">{children}</div>
      </div>
    );
  }
  if (frame === "tv") {
    return (
      <div className="t-hs__tv">
        <div className="t-hs__tvscreen">{children}</div>
        <span className="t-hs__tvstand" />
      </div>
    );
  }
  return (
    <div className={`t-hs__dev t-hs__dev--${frame}`}>
      <div className="t-hs__screen">
        <div className="t-hs__status">
          <span>12:30</span>
          <span className="t-hs__statusicons">
            <i />
            <i />
            <i />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Screens ---------- */

function Home({ frame, app, icon }: { frame: Frame; app: string; icon: AppIcon }) {
  const cols = frame === "tablet" ? 6 : 4;
  const total = cols * 4;
  const target = cols + 1;
  return (
    <DeviceFrame frame={frame}>
      <div className="t-hs__home" style={{ "--cols": cols } as CSSProperties}>
        {Array.from({ length: total }, (_, i) =>
          i === target ? (
            <span key={i} className={`t-hs__app is-hit t-hs__app--${icon}`}>
              <span className="t-hs__appico">
                <Glyph icon={icon} />
                <Tap />
              </span>
              <span className="t-hs__applabel">{app}</span>
            </span>
          ) : (
            <span key={i} className="t-hs__app" style={hue(i)}>
              <span className="t-hs__appico" />
              <span className="t-hs__appbar" />
            </span>
          ),
        )}
      </div>
      <div className="t-hs__dock">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="t-hs__appico" style={hue(i + 20)} />
        ))}
      </div>
    </DeviceFrame>
  );
}

function NavBar({ title, back }: { title: string; back: boolean }) {
  return (
    <div className="t-hs__nav">
      {back ? <span className="t-hs__back">‹</span> : null}
      <span className="t-hs__h">{title}</span>
    </div>
  );
}

function List({ frame, title, rows, hit }: { frame: Frame; title: string; rows: string[]; hit: number }) {
  const items = (
    <div className="t-hs__group">
      {rows.map((r, i) => (
        <span key={r} className={`t-hs__row${i === hit ? " is-hit" : ""}`} style={delay(i)}>
          <span className="t-hs__rowico" style={hue(i + rows.length)} />
          <span className="t-hs__rowlabel">{r}</span>
          <span className="t-hs__chev">›</span>
          {i === hit ? <Tap /> : null}
        </span>
      ))}
    </div>
  );
  if (frame === "pc") {
    return (
      <DeviceFrame frame="pc" title="Ustawienia">
        <div className="t-hs__split">
          <div className="t-hs__side">
            <span className="t-hs__h">{title}</span>
            {items}
          </div>
          <div className="t-hs__main">
            <span className="t-hs__ph t-hs__ph--wide" />
            <span className="t-hs__ph" />
            <span className="t-hs__ph" />
            <span className="t-hs__ph t-hs__ph--short" />
          </div>
        </div>
      </DeviceFrame>
    );
  }
  return (
    <DeviceFrame frame={frame}>
      <NavBar title={title} back={!/^Ustawienia$/.test(title) && frame !== "tv"} />
      {items}
    </DeviceFrame>
  );
}

function Badge() {
  return <span className="t-hs__badge">To wpisz</span>;
}

function Info({ frame, title, hero, rows, hit, heroHit, stack }: { frame: Frame; title: string; hero?: Pair; rows: Pair[]; hit: number[]; heroHit?: boolean; stack?: boolean }) {
  const body = (
    <>
      {hero ? (
        <div className={`t-hs__hero${heroHit ? " is-hit" : ""}`}>
          <span className="t-hs__heroart" />
          <span className="t-hs__herotext">
            <b>{hero[0]}</b>
            <span>{hero[1]}</span>
          </span>
          {heroHit ? <Badge /> : null}
        </div>
      ) : null}
      <div className={`t-hs__group${stack ? " is-stack" : ""}`}>
        {rows.map(([k, v], i) => (
          <span key={k} className={`t-hs__row t-hs__row--kv${hit.includes(i) ? " is-hit" : ""}`} style={delay(i)}>
            <span className="t-hs__rowlabel">{k}</span>
            <span className="t-hs__val">{v}</span>
            {hit.includes(i) && i === hit[0] ? <Badge /> : null}
          </span>
        ))}
      </div>
    </>
  );
  if (frame === "pc" || frame === "mac") {
    return (
      <DeviceFrame frame={frame} title={frame === "pc" ? "Ustawienia" : ""}>
        <div className={frame === "mac" ? "t-hs__about" : "t-hs__pcinfo"}>
          {frame === "pc" ? <span className="t-hs__h">{title}</span> : null}
          {body}
        </div>
      </DeviceFrame>
    );
  }
  return (
    <DeviceFrame frame={frame}>
      <NavBar title={title} back={frame !== "tv"} />
      {body}
    </DeviceFrame>
  );
}

function Menu({ rows, hit }: { rows: string[]; hit: number }) {
  return (
    <div className="t-hs__desk">
      <div className="t-hs__menubar">
        <span className="t-hs__logo is-hit" />
        <b>Finder</b>
        <span>Plik</span>
        <span>Edycja</span>
        <span>Widok</span>
      </div>
      <div className="t-hs__dropdown">
        {rows.map((r, i) => (
          <span key={r} className={`t-hs__mrow${i === hit ? " is-hit" : ""}${i === 0 || i === 3 ? " has-sep" : ""}`} style={delay(i)}>
            {r}
            {i === hit ? <Tap /> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

function Dialer({ typed, result }: { typed: string; result?: string }) {
  const order = typed.split("");
  return (
    <DeviceFrame frame="phone">
      <div className={`t-hs__dialer${result ? " has-result" : ""}`}>
        <div className="t-hs__typed">
          {order.map((c, i) => (
            <span key={`${c}-${i}`} style={delay(i)}>
              {c}
            </span>
          ))}
        </div>
        <div className="t-hs__keys">
          {KEYS.map((k) => {
            const at = order.indexOf(k);
            return (
              <span key={k} className={`t-hs__key${at >= 0 ? " is-seq" : ""}`} style={at >= 0 ? delay(at) : undefined}>
                {k}
              </span>
            );
          })}
        </div>
        <span className="t-hs__call">
          <Glyph icon="phone" />
        </span>
        {result ? (
          <div className="t-hs__result">
            <b>IMEI</b>
            <span className="t-hs__imei">
              {result}
              <Badge />
            </span>
            <span className="t-hs__ok">OK</span>
          </div>
        ) : null}
      </div>
    </DeviceFrame>
  );
}

/* ---------- Devices from outside ---------- */

const Barcode = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => (
  <g className="t-hs__bars">
    {Array.from({ length: Math.floor(w / 3.2) }, (_, i) => (
      <rect key={i} x={x + i * 3.2} y={y} width={i % 3 === 0 ? 1.8 : i % 2 ? 0.9 : 1.3} height={h} />
    ))}
  </g>
);

/** Sticker drawn on the device; its frame is the spot that pulses. */
function Spot({ x, y, w, h, round = false }: { x: number; y: number; w: number; h: number; round?: boolean }) {
  return (
    <g>
      {round ? null : (
        <>
          <rect className="t-hs__sticker" x={x} y={y} width={w} height={h} rx={4} />
          <rect className="t-hs__slines" x={x + 7} y={y + 7} width={w * 0.5} height={3} rx={1.5} />
          <rect className="t-hs__slines" x={x + 7} y={y + 14} width={w * 0.36} height={3} rx={1.5} />
          <Barcode x={x + 7} y={y + h - 16} w={w - 14} h={10} />
        </>
      )}
      <rect className="t-hs__ring" x={x - 8} y={y - 8} width={w + 16} height={h + 16} rx={round ? h / 2 + 8 : 12} />
    </g>
  );
}

function ThingArt({ on }: { on: Thing }) {
  switch (on) {
    case "laptop":
      return (
        <svg viewBox="0 0 320 220" className="t-hs__svg">
          <rect className="t-hs__body" x="30" y="22" width="260" height="176" rx="18" />
          <rect className="t-hs__shade" x="30" y="22" width="260" height="16" rx="8" />
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} className="t-hs__vent" x={170 + i * 15} y="66" width="8" height="54" rx="4" />
          ))}
          {[
            [46, 46],
            [248, 46],
            [46, 176],
            [248, 176],
          ].map(([x, y]) => (
            <rect key={`${x}-${y}`} className="t-hs__foot" x={x} y={y} width="26" height="9" rx="4.5" />
          ))}
          <circle className="t-hs__screw" cx="160" cy="150" r="3" />
          <circle className="t-hs__screw" cx="250" cy="150" r="3" />
          <Spot x={58} y={64} w={92} h={50} />
        </svg>
      );
    case "tower":
      return (
        <svg viewBox="0 0 320 220" className="t-hs__svg">
          <rect className="t-hs__body" x="92" y="12" width="136" height="192" rx="10" />
          <rect className="t-hs__shade" x="206" y="12" width="22" height="192" rx="6" />
          {Array.from({ length: 5 }, (_, r) =>
            Array.from({ length: 6 }, (_, c) => <circle key={`${r}-${c}`} className="t-hs__vent" cx={112 + c * 14} cy={128 + r * 13} r="3.2" />),
          )}
          <rect className="t-hs__foot" x="100" y="202" width="30" height="7" rx="3" />
          <rect className="t-hs__foot" x="190" y="202" width="30" height="7" rx="3" />
          <Spot x={106} y={32} w={84} h={50} />
        </svg>
      );
    case "printer":
      return (
        <svg viewBox="0 0 320 220" className="t-hs__svg">
          <rect className="t-hs__shade" x="52" y="44" width="216" height="30" rx="10" />
          <rect className="t-hs__body" x="36" y="66" width="248" height="112" rx="16" />
          <rect className="t-hs__slot" x="76" y="146" width="168" height="10" rx="5" />
          <rect className="t-hs__shade" x="66" y="174" width="188" height="20" rx="6" />
          <rect className="t-hs__panel" x="196" y="86" width="70" height="40" rx="9" />
          <circle className="t-hs__btn" cx="212" cy="106" r="5" />
          <circle className="t-hs__btn" cx="230" cy="106" r="5" />
          <circle className="t-hs__btn is-acc" cx="248" cy="106" r="5" />
          <rect className="t-hs__plate" x="56" y="92" width="104" height="18" rx="5" />
          <rect className="t-hs__ring" x="48" y="84" width="120" height="34" rx="12" />
        </svg>
      );
    case "printer-back":
      return (
        <svg viewBox="0 0 320 220" className="t-hs__svg">
          <rect className="t-hs__shade" x="52" y="44" width="216" height="30" rx="10" />
          <rect className="t-hs__body" x="36" y="66" width="248" height="112" rx="16" />
          <rect className="t-hs__port" x="240" y="86" width="22" height="14" rx="3" />
          <rect className="t-hs__port" x="248" y="108" width="14" height="14" rx="3" />
          <circle className="t-hs__port" cx="250" cy="150" r="9" />
          <rect className="t-hs__shade" x="96" y="150" width="100" height="16" rx="6" />
          <Spot x={58} y={84} w={96} h={54} />
        </svg>
      );
    case "console":
      return (
        <svg viewBox="0 0 320 220" className="t-hs__svg">
          <rect className="t-hs__body" x="28" y="54" width="264" height="112" rx="22" />
          <rect className="t-hs__shade" x="28" y="54" width="264" height="18" rx="9" />
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} className="t-hs__vent" x={176 + i * 11} y="88" width="5" height="52" rx="2.5" />
          ))}
          <rect className="t-hs__port" x="176" y="150" width="20" height="8" rx="2" />
          <rect className="t-hs__port" x="204" y="150" width="14" height="8" rx="2" />
          <rect className="t-hs__port" x="226" y="150" width="14" height="8" rx="2" />
          <Spot x={52} y={86} w={92} h={50} />
        </svg>
      );
    case "watch":
      return (
        <svg viewBox="0 0 320 220" className="t-hs__svg">
          <rect className="t-hs__shade" x="126" y="2" width="68" height="44" rx="10" />
          <rect className="t-hs__shade" x="126" y="174" width="68" height="44" rx="10" />
          <circle className="t-hs__body" cx="160" cy="110" r="78" />
          <circle className="t-hs__panel" cx="160" cy="110" r="44" />
          <circle className="t-hs__btn" cx="160" cy="110" r="14" />
          <path className="t-hs__engrave" d="M108 74a64 64 0 0 1 104 0" />
          <path className="t-hs__engrave" d="M104 150a64 64 0 0 0 112 0" />
          <circle className="t-hs__ring" cx="160" cy="110" r="70" />
        </svg>
      );
    case "box":
      return (
        <svg viewBox="0 0 320 220" className="t-hs__svg">
          <path className="t-hs__shade" d="M70 46l26-22h158l-26 22Z" />
          <path className="t-hs__shade" d="M228 46l26-22v150l-26 22Z" />
          <rect className="t-hs__body" x="70" y="46" width="158" height="150" rx="6" />
          <rect className="t-hs__panel" x="150" y="96" width="54" height="84" rx="12" />
          <Spot x={86} y={60} w={74} h={50} />
        </svg>
      );
    case "drive":
      return (
        <svg viewBox="0 0 320 220" className="t-hs__svg">
          <rect className="t-hs__body" x="58" y="30" width="204" height="160" rx="10" />
          {[
            [70, 42],
            [250, 42],
            [70, 178],
            [250, 178],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} className="t-hs__screw" cx={x} cy={y} r="4" />
          ))}
          <rect className="t-hs__port" x="120" y="184" width="80" height="10" rx="2" />
          <Spot x={78} y={50} w={120} h={80} />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 320 220" className="t-hs__svg">
          <rect className="t-hs__body" x="56" y="36" width="208" height="148" rx="30" />
          <rect className="t-hs__shade" x="56" y="36" width="208" height="22" rx="11" />
          <circle className="t-hs__screw" cx="84" cy="160" r="3.5" />
          <circle className="t-hs__screw" cx="236" cy="160" r="3.5" />
          <Spot x={82} y={70} w={84} h={48} />
        </svg>
      );
  }
}

function ThingScene({ on, zoom }: { on: Thing; zoom?: { rows: Pair[]; hit: number[]; plate?: boolean } }) {
  return (
    <div className={`t-hs__thing${zoom ? " has-zoom" : ""}`}>
      <ThingArt on={on} />
      {zoom ? (
        <div className={`t-hs__loupe${zoom.plate ? " is-plate" : ""}`}>
          {zoom.plate ? null : <span className="t-hs__loupebars" />}
          {zoom.rows.map(([k, v], i) => (
            <span key={`${k}-${v}`} className={`t-hs__lrow${zoom.hit.includes(i) ? " is-hit" : ""}`} style={delay(i)}>
              {k ? <span className="t-hs__lkey">{k}:</span> : null}
              <span className="t-hs__lval">{v}</span>
              {i === zoom.hit[0] ? <Badge /> : null}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function HelperScene({ scene }: { scene: Scene }) {
  let inner: ReactNode;
  switch (scene.kind) {
    case "home":
      inner = <Home frame={scene.frame} app={scene.app} icon={scene.icon} />;
      break;
    case "list":
      inner = <List frame={scene.frame} title={scene.title} rows={scene.rows} hit={scene.hit} />;
      break;
    case "info":
      inner = <Info frame={scene.frame} title={scene.title} hero={scene.hero} rows={scene.rows} hit={scene.hit} heroHit={scene.heroHit} stack={scene.stack} />;
      break;
    case "menu":
      inner = <Menu rows={scene.rows} hit={scene.hit} />;
      break;
    case "dialer":
      inner = <Dialer typed={scene.typed} result={scene.result} />;
      break;
    case "thing":
      inner = <ThingScene on={scene.on} zoom={scene.zoom} />;
      break;
  }
  const frame = scene.kind === "menu" ? "mac" : scene.kind === "dialer" ? "phone" : scene.kind === "thing" ? "thing" : scene.frame;
  return (
    <div className={`t-hs t-hs--${scene.kind}`} data-frame={frame} aria-hidden="true">
      {inner}
    </div>
  );
}
