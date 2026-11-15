"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { line, telHref } from "@/config/prokom";
import { POINTS_HREF, SUBMIT_HREF, TRACK_HREF } from "@/lib/tech/nav";
import { highlight } from "@/lib/tech/search/engine";
import { onSearchRequest } from "@/lib/tech/search/open";
import { MAX_QUERY, POPULAR, buildProvider, type SearchEntry, type SearchGroup, type SearchResult } from "@/lib/tech/search/provider";
import { clearRecent, pushRecent, readRecent } from "@/lib/tech/search/recent";
import { isSearchShortcut, isTypingTarget } from "@/lib/tech/search/shortcut";
import { trackEvent } from "@/lib/tech/track-event";
import { IconArrow, IconSearch } from "../icons";
import { IconClock, SearchIcon } from "../rail-icons";

/** Built at build time from the Tech data (app/(public)/szukaj/indeks.json/route.ts). */
export const INDEX_URL = "/szukaj/indeks.json";
/** The measurement waits until the visitor stops typing. */
const MEASURE_AFTER_MS = 1200;

/** One fetch per page load, shared by every caller (the shell stays mounted across pages). */
let indexRequest: Promise<SearchEntry[]> | null = null;
function loadIndex(): Promise<SearchEntry[]> {
  indexRequest ??= fetch(INDEX_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`index ${r.status}`);
      return r.json() as Promise<SearchEntry[]>;
    })
    .catch(() => {
      // A passing error is not kept: the next request to search tries again.
      indexRequest = null;
      return Promise.reject(new Error("index"));
    });
  return indexRequest;
}

/** Shortcuts of the empty window (the same places the tab bar and the menu lead to). */
const SHORTCUTS: SearchResult[] = [
  { id: "skrot:zgloszenie", title: "Zgłoś naprawę online", hint: "Formularz zgłoszenia — kilka minut", href: SUBMIT_HREF, group: "akcje", icon: "wrench" },
  { id: "skrot:status", title: "Status naprawy", hint: "Sprawdź po numerze zgłoszenia", href: TRACK_HREF, group: "akcje", icon: "track" },
  { id: "skrot:punkty", title: "Punkty serwisowe", hint: "Adresy i godziny otwarcia", href: POINTS_HREF, group: "akcje", icon: "pin" },
];

function lockScroll(): () => void {
  const body = document.body;
  const prev = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
  const bar = window.innerWidth - document.documentElement.clientWidth;
  body.style.overflow = "hidden";
  if (bar > 0) body.style.paddingRight = `${bar}px`;
  return () => {
    body.style.overflow = prev.overflow;
    body.style.paddingRight = prev.paddingRight;
  };
}

const resultsLabel = (n: number) => `${n} ${n === 1 ? "wynik" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "wyniki" : "wyników"}`;

/**
 * Search window of PRO-KOM Tech — the behaviour of the lines' `SearchDialog` (prokom-web-hub,
 * spec §5.1) in the Tech look. Ctrl/⌘ K, „/” (outside fields), the capsule, the rail and the
 * Menu sheet open a modal `<dialog>` (the browser keeps focus inside and gives it back on close).
 * The field is a combobox: ↑↓ move through the results, Enter opens the active one (the first by
 * default), Esc closes. Empty: shortcuts, recent phrases (this browser only), popular phrases.
 * Typing: groups with the hit highlighted; nothing found → phone, form, contact. The index comes
 * as JSON when the browser is idle or at the first request to search.
 */
export function SearchDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const uid = useId();
  const listId = `${uid}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const measured = useRef<Set<string>>(new Set());
  const unlock = useRef<(() => void) | null>(null);

  const load = useCallback(() => {
    loadIndex()
      .then((list) => {
        setEntries(list);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, []);

  // Fetched when the browser is idle, so it never weighs on the page itself.
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const idle = w.requestIdleCallback?.(load, { timeout: 4000 });
    const timer = idle === undefined ? window.setTimeout(load, 1500) : undefined;
    return () => {
      if (idle !== undefined) w.cancelIdleCallback?.(idle);
      window.clearTimeout(timer);
    };
  }, [load]);

  const show = useCallback(
    (phrase?: string) => {
      const box = dialog.current;
      // Another modal (an open native dialog) owns the screen.
      if (!box || box.open || document.querySelector("dialog[open]")) return;
      if (!entries) load();
      setRecent(readRecent());
      measured.current = new Set();
      if (phrase !== undefined) setQuery(phrase);
      setActiveIndex(phrase ? 0 : -1);
      box.showModal();
      unlock.current = lockScroll();
      setOpen(true);
      input.current?.focus();
      input.current?.select();
    },
    [entries, load],
  );
  const close = () => dialog.current?.close();

  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!isSearchShortcut({ key: e.key, ctrlKey: e.ctrlKey, metaKey: e.metaKey, altKey: e.altKey, typing: isTypingTarget(e.target) })) return;
      // Inside the open window Ctrl K selects the phrase instead of reopening.
      if (dialog.current?.open) {
        e.preventDefault();
        input.current?.select();
        return;
      }
      if (document.querySelector('.t-sheet.is-open')) return;
      e.preventDefault();
      show();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [show]);

  useEffect(() => onSearchRequest((phrase) => show(phrase)), [show]);

  const provider = useMemo(() => (entries ? buildProvider(entries) : null), [entries]);
  const deferred = useDeferredValue(query);
  const trimmed = deferred.trim().slice(0, MAX_QUERY);
  const groups: SearchGroup[] = useMemo(() => (trimmed && provider ? provider.query(trimmed) : []), [provider, trimmed]);
  const total = useMemo(() => (trimmed && provider ? provider.count(trimmed) : 0), [provider, trimmed]);
  const options: SearchResult[] = useMemo(() => (trimmed ? groups.flatMap((g) => g.results) : SHORTCUTS), [groups, trimmed]);
  const loading = Boolean(trimmed) && !provider && !failed;
  const nothing = Boolean(trimmed) && Boolean(provider) && total === 0;
  const optionId = (i: number) => `${uid}-opt-${i}`;
  // Empty field: nothing is picked until ↑↓ (Enter does nothing); typing: the first result.
  const current = activeIndex < 0 || !options.length ? -1 : Math.min(activeIndex, options.length - 1);

  // SPEC §12.5: length of the phrase and the number of results, never the phrase itself.
  useEffect(() => {
    if (!open || !provider || trimmed.length < 2 || measured.current.has(trimmed)) return;
    const timer = window.setTimeout(() => {
      measured.current.add(trimmed);
      trackEvent("szukaj", { dlugosc: trimmed.length, wyniki: total, zrodlo: "okno" });
    }, MEASURE_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [open, provider, trimmed, total]);

  // The active option stays in view while ↑↓ walk the list.
  useEffect(() => {
    if (!open || current < 0) return;
    document.getElementById(optionId(current))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, open]);

  /** A result was opened: the phrase goes to „Ostatnio szukane” and the next opening starts empty. */
  const remember = () => {
    if (trimmed) setRecent(pushRecent(trimmed));
    setQuery("");
  };

  const go = (result: SearchResult) => {
    remember();
    close();
    router.push(result.href);
  };

  const onFieldKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      // In a search field Chrome's first Esc only clears the text: close at once.
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!options.length) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(current < 0 ? (step > 0 ? 0 : options.length - 1) : (current + step + options.length) % options.length);
    } else if (e.key === "Home" && e.ctrlKey) {
      setActiveIndex(0);
    } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      const chosen = current >= 0 ? options[current] : undefined;
      if (chosen) go(chosen);
      else if (trimmed && failed) {
        close();
        router.push(`/szukaj?q=${encodeURIComponent(trimmed)}`);
      }
    }
  };

  const onLinkClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    remember();
    close();
  };

  const option = (r: SearchResult, i: number) => (
    <li key={r.id} role="presentation">
      <Link
        id={optionId(i)}
        href={r.href}
        role="option"
        aria-selected={i === current}
        tabIndex={-1}
        className="t-sdlg__result"
        data-active={i === current ? "" : undefined}
        onMouseMove={() => i !== current && setActiveIndex(i)}
        onClick={onLinkClick}
      >
        <span className="t-sdlg__icon">
          <SearchIcon icon={r.icon} />
        </span>
        <span className="t-sdlg__text">
          <span className="t-sdlg__name">
            {trimmed
              ? highlight(r.title, trimmed).map((m, k) =>
                  m.hit ? (
                    <mark key={k} className="t-sdlg__hit">
                      {m.text}
                    </mark>
                  ) : (
                    m.text
                  ),
                )
              : r.title}
          </span>
          {r.hint ? <span className="t-sdlg__hint">{r.hint}</span> : null}
        </span>
        <IconArrow className="t-sdlg__go" size={15} />
      </Link>
    </li>
  );

  let index = 0;
  const groupBlock = (g: { key: string; title: string; results: SearchResult[] }) => (
    <div key={g.key} role="group" aria-labelledby={`${uid}-g-${g.key}`} className="t-sdlg__group">
      <p id={`${uid}-g-${g.key}`} className="t-sdlg__title" role="presentation">
        {g.title}
      </p>
      <ul role="presentation">{g.results.map((r) => option(r, index++))}</ul>
    </div>
  );

  const tel = telHref(line.phone);
  const fullHref = `/szukaj?q=${encodeURIComponent(trimmed)}`;

  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${uid}-h`}
      className="t-sdlg t-ui"
      data-t-search=""
      onClose={() => {
        setOpen(false);
        unlock.current?.();
        unlock.current = null;
      }}
      onClick={(e) => {
        // A click on the backdrop (outside the box) closes.
        if (e.target !== dialog.current) return;
        const box = dialog.current.getBoundingClientRect();
        if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) close();
      }}
    >
      <div className="t-sdlg__in">
        <h2 id={`${uid}-h`} className="t-visually-hidden">
          Szukaj na stronie
        </h2>
        <div className="t-sdlg__field">
          <IconSearch size={22} strokeWidth={2.3} className="t-sdlg__loupe" />
          <input
            ref={input}
            type="search"
            role="combobox"
            aria-label="Szukaj na stronie"
            aria-expanded={options.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={current >= 0 ? optionId(current) : undefined}
            value={query}
            maxLength={MAX_QUERY}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(e.target.value.trim() ? 0 : -1);
            }}
            onKeyDown={onFieldKey}
            placeholder="Szukaj: ekran, bateria, laptop, status…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
          />
          <button type="button" className="t-sdlg__close" onClick={close}>
            Esc<span className="t-visually-hidden"> — zamknij wyszukiwarkę</span>
          </button>
        </div>
        <p className="t-visually-hidden" aria-live="polite">
          {trimmed && provider ? resultsLabel(total) : ""}
        </p>

        <div className="t-sdlg__body">
          {!trimmed ? (
            <>
              {recent.length ? (
                <section className="t-sdlg__chipset" aria-labelledby={`${uid}-recent`}>
                  <div className="t-sdlg__row">
                    <p id={`${uid}-recent`} className="t-sdlg__title">
                      Ostatnio szukane
                    </p>
                    <button
                      type="button"
                      className="t-sdlg__link"
                      onClick={() => {
                        clearRecent();
                        setRecent([]);
                        input.current?.focus();
                      }}
                    >
                      Wyczyść
                    </button>
                  </div>
                  <div className="t-sdlg__chips">
                    {recent.map((phrase) => (
                      <button
                        key={phrase}
                        type="button"
                        className="t-sdlg__chip"
                        onClick={() => {
                          setQuery(phrase);
                          setActiveIndex(0);
                          input.current?.focus();
                        }}
                      >
                        <IconClock size={15} />
                        {phrase}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
              <section className="t-sdlg__chipset" aria-labelledby={`${uid}-popular`}>
                <p id={`${uid}-popular`} className="t-sdlg__title">
                  Najczęściej szukane
                </p>
                <div className="t-sdlg__chips">
                  {POPULAR.map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      className="t-sdlg__chip"
                      onClick={() => {
                        setQuery(phrase);
                        setActiveIndex(0);
                        input.current?.focus();
                      }}
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          <div id={listId} role="listbox" aria-label={trimmed ? "Wyniki wyszukiwania" : "Na skróty"} className="t-sdlg__list">
            {!trimmed ? groupBlock({ key: "akcje", title: "Na skróty", results: SHORTCUTS }) : groups.map(groupBlock)}
          </div>

          {loading ? (
            <p className="t-sdlg__state" role="status">
              <span className="t-sdlg__spin" aria-hidden="true" />
              Wczytuję wyszukiwarkę…
            </p>
          ) : null}
          {trimmed && failed && !provider ? (
            <div className="t-sdlg__none">
              <p className="t-sdlg__noneh">Nie udało się wczytać wyszukiwarki</p>
              <p>Spróbuj na stronie wyników — działa też bez połączenia z tym oknem.</p>
              <Link href={fullHref} className="t-btn t-btn--acc t-btn--sm" onClick={onLinkClick}>
                Szukaj „{trimmed}” <IconArrow />
              </Link>
            </div>
          ) : null}
          {nothing ? (
            <div className="t-sdlg__none">
              <p className="t-sdlg__noneh">Nie znaleźliśmy „{trimmed}”</p>
              <p>Opisz usterkę w zgłoszeniu albo zadzwoń — podpowiemy, czy to naprawimy.</p>
              <div className="t-sdlg__noneactions">
                <a href={tel} className="t-btn t-btn--acc t-btn--sm" data-track="telefon_klik" data-track-miejsce="szukaj">
                  Zadzwoń: {line.phoneDisplay}
                </a>
                <Link href={SUBMIT_HREF} className="t-btn t-btn--ghost t-btn--sm" onClick={onLinkClick}>
                  Zgłoś naprawę
                </Link>
                <Link href="/kontakt" className="t-btn t-btn--ghost t-btn--sm" onClick={onLinkClick}>
                  Napisz do nas
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <div className="t-sdlg__foot">
          <p className="t-sdlg__keys" aria-hidden="true">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> wybór
            </span>
            <span>
              <kbd>Enter</kbd> otwórz
            </span>
            <span>
              <kbd>Esc</kbd> zamknij
            </span>
          </p>
          {trimmed && total > 0 ? (
            <Link href={fullHref} className="t-sdlg__all" onClick={onLinkClick}>
              Wszystkie wyniki ({total}) <IconArrow size={13} />
            </Link>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
