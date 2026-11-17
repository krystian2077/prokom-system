"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { line, telHref } from "@/config/prokom";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { highlight } from "@/lib/tech/search/engine";
import { loadIndex } from "@/lib/tech/search/load-index";
import { onSearchRequest } from "@/lib/tech/search/open";
import { MAX_QUERY, buildProvider, type SearchEntry, type SearchGroup, type SearchResult } from "@/lib/tech/search/provider";
import { matchActions, quickActions, type QuickAction } from "@/lib/tech/search/quick-actions";
import { clearRecent, pushRecent, readRecent } from "@/lib/tech/search/recent";
import { POPULAR_PHRASES, SEARCH_CATEGORIES, countCategories, resultsLabel, type CountedCategory } from "@/lib/tech/search/shortcuts";
import { isSearchShortcut, isTypingTarget } from "@/lib/tech/search/shortcut";
import { trackEvent } from "@/lib/tech/track-event";
import { IconArrow, IconClose, IconSearch } from "../icons";
import { IconClock, SearchIcon } from "../rail-icons";
import { QuickActionItem, QuickActionTiles, useQuickRun } from "./QuickActions";

export { INDEX_URL } from "@/lib/tech/search/load-index";
/** The measurement waits until the visitor stops typing. */
const MEASURE_AFTER_MS = 1200;

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

/** One row of the listbox: a result, a matching action, or a category of the empty window. */
type Item = { type: "result"; result: SearchResult } | { type: "action"; action: QuickAction } | { type: "category"; category: CountedCategory };

const sec = (i: number) => ({ "--i": i }) as CSSProperties;

/** Set by LazySearchDialog: `request` — a pending open (new object = open again), `onReady` — listeners attached. */
export type SearchDialogProps = { request?: { phrase?: string } | null; onReady?: () => void };

/**
 * Search window of PRO-KOM Tech — the „mega” search of the PRO-KOM lines (prokom-web Biznes
 * `SearchDialog`: quick actions, popular phrases, shortcuts with counts) in the Tech look.
 * Ctrl/⌘ K, „/” (outside fields), the capsule, the rail and the Menu sheet open a modal
 * `<dialog>` (the browser keeps focus inside and gives it back on close). The field is a
 * combobox: ↑↓ move through the listbox, Enter runs the active row through its own click (link,
 * action or category), Tab walks the tiles and chips, Esc closes.
 * Empty: quick actions (call, copy, e-mail, route, form, status, contact, theme), recent phrases
 * (this browser only), popular phrases and categories with the number of results from the index.
 * Typing: matching actions on top, then groups with the hit highlighted; nothing found → tips,
 * phone, form, contact. The index comes as JSON when the browser is idle or at the first request.
 */
export function SearchDialog({ request, onReady }: SearchDialogProps = {}) {
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
  // Deterministic on the server; the route tile follows the clock once the window opens.
  const [actions, setActions] = useState<QuickAction[]>(() => quickActions());
  const runner = useQuickRun();
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
      setActions(quickActions({ now: new Date() }));
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
      if (document.querySelector(".t-sheet.is-open")) return;
      e.preventDefault();
      show();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [show]);

  useEffect(() => onSearchRequest((phrase) => show(phrase)), [show]);

  // LazySearchDialog: a request made before this chunk arrived opens the window once it is here.
  const showRef = useRef(show);
  showRef.current = show;
  useEffect(() => {
    if (request) showRef.current(request.phrase);
  }, [request]);
  // Declared after the listeners above, so they are already attached when the loader lets go.
  useEffect(() => onReady?.(), [onReady]);

  const provider = useMemo(() => (entries ? buildProvider(entries) : null), [entries]);
  const categories = useMemo(() => (provider ? countCategories(provider) : null), [provider]);
  const deferred = useDeferredValue(query);
  const trimmed = deferred.trim().slice(0, MAX_QUERY);
  const groups: SearchGroup[] = useMemo(() => (trimmed && provider ? provider.query(trimmed) : []), [provider, trimmed]);
  const total = useMemo(() => (trimmed && provider ? provider.count(trimmed) : 0), [provider, trimmed]);
  const matched = useMemo(() => (trimmed ? matchActions(actions, trimmed) : []), [actions, trimmed]);
  const items: Item[] = useMemo(() => {
    if (!trimmed) return (categories ?? []).map((category) => ({ type: "category" as const, category }));
    return [...matched.map((action) => ({ type: "action" as const, action })), ...groups.flatMap((g) => g.results.map((result) => ({ type: "result" as const, result })))];
  }, [categories, groups, matched, trimmed]);
  const loading = Boolean(trimmed) && !provider && !failed;
  const nothing = Boolean(trimmed) && Boolean(provider) && total === 0 && matched.length === 0;
  const optionId = (i: number) => `${uid}-opt-${i}`;
  // Empty field: nothing is picked until ↑↓ (Enter does nothing); typing: the first row.
  const current = activeIndex < 0 || !items.length ? -1 : Math.min(activeIndex, items.length - 1);

  // SPEC §12.5: length of the phrase and the number of results, never the phrase itself.
  useEffect(() => {
    if (!open || !provider || trimmed.length < 2 || measured.current.has(trimmed)) return;
    const timer = window.setTimeout(() => {
      measured.current.add(trimmed);
      trackEvent("szukaj", { dlugosc: trimmed.length, wyniki: total, zrodlo: "okno" });
    }, MEASURE_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [open, provider, trimmed, total]);

  // The active row stays in view while ↑↓ walk the list.
  useEffect(() => {
    if (!open || current < 0) return;
    document.getElementById(optionId(current))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, open]);

  /** A link was followed: the phrase goes to „Ostatnio szukane” and the next opening starts empty. */
  const remember = () => {
    if (trimmed) setRecent(pushRecent(trimmed));
    setQuery("");
  };
  const follow = () => {
    remember();
    close();
  };

  /** A chip or a category types its phrase; the first row becomes active. */
  const typeIn = (phrase: string) => {
    setQuery(phrase);
    setActiveIndex(0);
    input.current?.focus();
  };

  const onFieldKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      // In a search field Chrome's first Esc only clears the text: close at once.
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!items.length) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(current < 0 ? (step > 0 ? 0 : items.length - 1) : (current + step + items.length) % items.length);
    } else if (e.key === "Home" && e.ctrlKey) {
      setActiveIndex(0);
    } else if (e.key === "End" && e.ctrlKey && items.length) {
      setActiveIndex(items.length - 1);
    } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      // The active row runs through its own click: links navigate, actions run, categories type.
      if (current >= 0) document.getElementById(optionId(current))?.click();
      else if (trimmed && failed) {
        close();
        router.push(`/szukaj?q=${encodeURIComponent(trimmed)}`);
      }
    }
  };

  const onLinkClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    follow();
  };

  const optionProps = (i: number) => ({
    id: optionId(i),
    role: "option",
    "aria-selected": i === current,
    tabIndex: -1,
    "data-active": i === current ? "" : undefined,
    onMouseMove: () => i !== current && setActiveIndex(i),
  });

  const marked = (title: string) =>
    trimmed
      ? highlight(title, trimmed).map((m, k) =>
          m.hit ? (
            <mark key={k} className="t-sdlg__hit">
              {m.text}
            </mark>
          ) : (
            m.text
          ),
        )
      : title;

  const rowBody = (icon: SearchResult["icon"], title: ReactNode, hint?: string, tail?: ReactNode) => (
    <>
      <span className="t-sdlg__icon">
        <SearchIcon icon={icon} />
      </span>
      <span className="t-sdlg__text">
        <span className="t-sdlg__name">{title}</span>
        {hint ? <span className="t-sdlg__hint">{hint}</span> : null}
      </span>
      {tail ?? <IconArrow className="t-sdlg__go" size={15} />}
    </>
  );

  let index = 0;
  const resultOption = (r: SearchResult) => {
    const i = index++;
    return (
      <li key={r.id} role="presentation">
        <Link href={r.href} className="t-sdlg__result" {...optionProps(i)} onClick={onLinkClick}>
          {rowBody(r.icon, marked(r.title), r.hint)}
        </Link>
      </li>
    );
  };
  const actionOption = (a: QuickAction) => {
    const i = index++;
    const v = runner.view(a);
    return (
      <li key={a.id} role="presentation">
        <QuickActionItem action={a} runner={runner} onFollow={follow} className={`t-sdlg__result t-sdlg__result--action${v.done ? " is-done" : ""}`} extra={optionProps(i)}>
          {rowBody(v.icon, v.done ? v.short : marked(a.label), v.hint, <span className="t-sdlg__kind">{a.kind === "copy" || a.kind === "theme" ? "Akcja" : a.external ? "Mapy" : "Otwórz"}</span>)}
        </QuickActionItem>
      </li>
    );
  };
  const categoryOption = (c: CountedCategory, n: number) => {
    const i = index++;
    return (
      <li key={c.key} role="presentation" style={sec(n)}>
        <button type="button" className="t-sdlg__cat" {...optionProps(i)} onClick={() => typeIn(c.query)}>
          <span className="t-sdlg__caticon">
            <SearchIcon icon={c.icon} size={20} />
          </span>
          <span className="t-sdlg__text">
            <span className="t-sdlg__catname">{c.label}</span>
            <span className="t-sdlg__catcount">{resultsLabel(c.count)}</span>
          </span>
          <IconArrow className="t-sdlg__go" size={14} />
        </button>
      </li>
    );
  };

  const groupBlock = (key: string, title: string, children: ReactNode, count?: number) => (
    <div key={key} role="group" aria-labelledby={`${uid}-g-${key}`} className="t-sdlg__group">
      <p id={`${uid}-g-${key}`} className="t-sdlg__title" role="presentation">
        {title}
        {count ? (
          <span className="t-sdlg__count" aria-hidden="true">
            {count}
          </span>
        ) : null}
      </p>
      <ul role="presentation">{children}</ul>
    </div>
  );

  const tel = telHref(line.phone);
  const fullHref = `/szukaj?q=${encodeURIComponent(trimmed)}`;
  const chips = (list: readonly { label: string; query: string }[]) => (
    <div className="t-sdlg__chips">
      {list.map((p) => (
        <button key={p.label} type="button" className="t-sdlg__chip" onClick={() => typeIn(p.query)}>
          <IconSearch size={14} strokeWidth={2.4} />
          {p.label}
        </button>
      ))}
    </div>
  );

  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${uid}-h`}
      className="t-sdlg t-ui"
      data-t-search=""
      data-state={trimmed ? (nothing ? "none" : "results") : "empty"}
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
            aria-expanded={items.length > 0}
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
            placeholder="Szukaj: ekran, bateria, laptop…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
          />
          {query ? (
            <button
              type="button"
              className="t-sdlg__clear"
              onClick={() => {
                setQuery("");
                setActiveIndex(-1);
                input.current?.focus();
              }}
            >
              <IconClose size={16} />
              <span className="t-visually-hidden">Wyczyść pole</span>
            </button>
          ) : null}
          <button type="button" className="t-sdlg__close" onClick={close}>
            <span className="t-sdlg__esc" aria-hidden="true">
              Esc
            </span>
            <span className="t-sdlg__x" aria-hidden="true">
              <IconClose size={20} />
            </span>
            <span className="t-visually-hidden">Zamknij wyszukiwarkę</span>
          </button>
        </div>
        <p className="t-visually-hidden" aria-live="polite">
          {trimmed && provider ? resultsLabel(total) : ""}
        </p>
        <p className="t-visually-hidden" role="status">
          {runner.status}
        </p>

        <div className="t-sdlg__body">
          {!trimmed ? (
            <>
              <section className="t-sdlg__sec" style={sec(0)} aria-labelledby={`${uid}-qa`}>
                <p id={`${uid}-qa`} className="t-sdlg__title">
                  Szybkie akcje
                </p>
                <QuickActionTiles actions={actions} runner={runner} onFollow={follow} />
              </section>
              {recent.length ? (
                <section className="t-sdlg__sec" style={sec(1)} aria-labelledby={`${uid}-recent`}>
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
                      <button key={phrase} type="button" className="t-sdlg__chip t-sdlg__chip--recent" onClick={() => typeIn(phrase)}>
                        <IconClock size={15} />
                        {phrase}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
              <section className="t-sdlg__sec" style={sec(2)} aria-labelledby={`${uid}-popular`}>
                <p id={`${uid}-popular`} className="t-sdlg__title">
                  Najczęściej szukane
                </p>
                {chips(POPULAR_PHRASES)}
              </section>
            </>
          ) : null}

          <div id={listId} role="listbox" aria-label={trimmed ? "Wyniki wyszukiwania" : "Na skróty"} className={`t-sdlg__list${trimmed ? "" : " t-sdlg__sec"}`} style={trimmed ? undefined : sec(3)}>
            {!trimmed ? (
              <div role="group" aria-labelledby={`${uid}-g-cats`} className="t-sdlg__group">
                <p id={`${uid}-g-cats`} className="t-sdlg__title" role="presentation">
                  Na skróty
                </p>
                {categories ? (
                  <ul role="presentation" className="t-sdlg__cats">
                    {categories.map(categoryOption)}
                  </ul>
                ) : (
                  <ul role="presentation" className="t-sdlg__cats" aria-hidden="true">
                    {SEARCH_CATEGORIES.map((c) => (
                      <li key={c.key} role="presentation">
                        <span className="t-sdlg__cat t-sdlg__cat--wait">
                          <span className="t-sdlg__caticon">
                            <SearchIcon icon={c.icon} size={20} />
                          </span>
                          <span className="t-sdlg__text">
                            <span className="t-sdlg__catname">{c.label}</span>
                            <span className="t-sdlg__skel" />
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <>
                {matched.length ? groupBlock("akcje", "Szybkie akcje", matched.map(actionOption)) : null}
                {groups.map((g) => groupBlock(g.key, g.title, g.results.map(resultOption), g.results.length))}
              </>
            )}
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
              <span className="t-sdlg__noneicon" aria-hidden="true">
                <IconSearch size={26} strokeWidth={2.2} />
              </span>
              <p className="t-sdlg__noneh">Nie znaleźliśmy „{trimmed}”</p>
              <p>Opisz usterkę w zgłoszeniu albo zadzwoń — podpowiemy, czy to naprawimy.</p>
              <ul className="t-sdlg__tips">
                <li>Sprawdź pisownię albo wpisz krócej, np. „ekran”.</li>
                <li>Wpisz rodzaj sprzętu: telefon, laptop, konsola.</li>
                <li>Opisz objaw: „nie ładuje”, „zalany”, „grzeje się”.</li>
              </ul>
              <div className="t-sdlg__noneactions">
                <a href={tel} className="t-btn t-btn--acc t-btn--sm" data-track="telefon_klik" data-track-miejsce="szukaj">
                  Zadzwoń: {line.phoneDisplay}
                </a>
                <Link href={SUBMIT_HREF} className="t-btn t-btn--ghost t-btn--sm" data-track="zgloszenie_start" data-track-zrodlo="przycisk" onClick={onLinkClick}>
                  Zgłoś naprawę
                </Link>
                <Link href="/kontakt" className="t-btn t-btn--ghost t-btn--sm" onClick={onLinkClick}>
                  Napisz do nas
                </Link>
              </div>
              <div className="t-sdlg__nonepop">
                <p className="t-sdlg__title">Może chodziło o</p>
                {chips(POPULAR_PHRASES.slice(0, 6))}
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
              <kbd>Tab</kbd> akcje
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
