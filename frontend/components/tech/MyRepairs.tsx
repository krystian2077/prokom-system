"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import type { TrackResponse } from "@/lib/tech/contract";
import { trackHref } from "@/lib/tech/contract";
import { MY_REPAIRS_EVENT, STORAGE_KEY, clearRepairs, loadRepairs, removeRepair, updateFromTrack, type SavedRepair } from "@/lib/tech/my-repairs";
import { fetchTrack } from "@/lib/tech/requests";
import { formatDateTime } from "@/lib/tech/track";

/** Remembered repairs, kept in sync across components and tabs. `null` before hydration. */
export function useMyRepairs(): SavedRepair[] | null {
  const [list, setList] = useState<SavedRepair[] | null>(null);
  useEffect(() => {
    const read = () => setList(loadRepairs());
    read();
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === STORAGE_KEY) read();
    };
    window.addEventListener(MY_REPAIRS_EVENT, read);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(MY_REPAIRS_EVENT, read);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return list;
}

type Props = {
  /** On /track: show the full status below instead of following a link. */
  onShow?: (repair: SavedRepair, data: TrackResponse | null) => void;
  compact?: boolean;
  title?: string;
};

/**
 * "Twoje naprawy" (SPEC §12.6) on /track and in the Menu sheet. The API is asked only
 * after "Odśwież" — never in the background. No data = no section.
 */
export function MyRepairs({ onShow, compact = false, title = "Twoje naprawy" }: Props) {
  const list = useMyRepairs();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, string>>({});
  const headId = useId();

  const refresh = useCallback(
    async (r: SavedRepair) => {
      setBusy(r.ref);
      const res = await fetchTrack(r.ref, r.last4);
      setBusy(null);
      if (res.ok) {
        updateFromTrack(res.data);
        setMsg((m) => ({ ...m, [r.ref]: "" }));
        onShow?.(r, res.data);
      } else {
        setMsg((m) => ({ ...m, [r.ref]: res.message }));
      }
    },
    [onShow],
  );

  if (!list || !list.length) return null;
  return (
    <section className={`t-myr${compact ? " t-myr--compact" : ""}`} aria-labelledby={headId} data-my-repairs="">
      <div className="t-myr__head">
        <span className="t-eyebrow" id={headId}>
          {title}
        </span>
        <span className="t-myr__note">Zapamiętane na tym urządzeniu</span>
      </div>
      <ul className="t-myr__list">
        {list.map((r) => (
          <li key={r.ref} className="t-myr__item">
            <div className="t-myr__info">
              <b>{r.device}</b>
              <span className="t-myr__ref">{r.ref}</span>
              <span className="t-myr__status">
                {r.status}
                {formatDateTime(r.checkedAt) ? <span className="t-muted"> · sprawdzone {formatDateTime(r.checkedAt)}</span> : null}
              </span>
              {msg[r.ref] ? (
                <span className="t-field__error" role="alert">
                  {msg[r.ref]}
                </span>
              ) : null}
            </div>
            <div className="t-myr__actions">
              <button type="button" className="t-btn t-btn--sm t-btn--ghost" onClick={() => void refresh(r)} disabled={busy === r.ref} aria-label={`Odśwież status ${r.ref}`}>
                {busy === r.ref ? "Sprawdzam…" : "Odśwież"}
              </button>
              {compact ? (
                <Link href={trackHref(r.ref)} className="t-btn t-btn--sm t-btn--ghost">
                  Szczegóły
                </Link>
              ) : null}
              <button type="button" className="t-linkbtn" onClick={() => removeRepair(r.ref)} aria-label={`Usuń z tego urządzenia ${r.ref}`}>
                Usuń z tego urządzenia
              </button>
            </div>
          </li>
        ))}
      </ul>
      {list.length > 1 ? (
        <button type="button" className="t-linkbtn t-myr__clear" onClick={() => clearRepairs()}>
          Usuń wszystkie
        </button>
      ) : null}
    </section>
  );
}
