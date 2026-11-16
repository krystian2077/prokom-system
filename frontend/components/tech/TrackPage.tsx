"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TrackResponse } from "@/lib/tech/contract";
import { deviceName, isSaved, loadRepairs, saveRepair, updateFromTrack, type SavedRepair } from "@/lib/tech/my-repairs";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { fetchTrack } from "@/lib/tech/requests";
import { trackEvent } from "@/lib/tech/track-event";
import { MyRepairs } from "./MyRepairs";
import { TrackHead } from "./PageHeads";
import { PrepChecklist } from "./PrepChecklist";
import { DEVICE_CATEGORIES } from "@/types/repair";
import { RepairTracker } from "./RepairTracker";
import { TrackExample } from "./TrackExample";
import { visiblePoints } from "@/lib/tech/points";

const examplePoint = visiblePoints().find((p) => !p.draft);

/**
 * /track (TD3 PR 3, design #status-naprawy, KONTRAKT §3): TrackForm, RepairTracker
 * and "Twoje naprawy". ?ref= fills the number; a remembered repair with that number
 * is checked right away (entering /track counts as asking — SPEC §12.6).
 */
export function TrackPage() {
  const sp = useSearchParams();
  const [ref, setRef] = useState("");
  const [last4, setLast4] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<{ ref?: string; last4?: string }>({});
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrackResponse | null>(null);
  const [query, setQuery] = useState<{ ref: string; last4: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const auto = useRef(false);

  const check = useCallback(async (r: string, l: string, opts: { remember?: boolean } = {}) => {
    setLoading(true);
    setError(null);
    const res = await fetchTrack(r, l);
    setLoading(false);
    trackEvent("status_sprawdzony", { wynik: res.ok ? "znaleziono" : "nie" });
    if (!res.ok) {
      setData(null);
      setError(res.message);
      return;
    }
    setData(res.data);
    setQuery({ ref: res.data.repair_number, last4: l });
    updateFromTrack(res.data);
    if (opts.remember) saveRepair({ ref: res.data.repair_number, last4: l, device: deviceName(res.data), status: res.data.status });
    setSaved(isSaved(res.data.repair_number));
    window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, []);

  useEffect(() => {
    const q = sp.get("ref")?.trim();
    if (!q) return;
    setRef(q);
    if (auto.current) return;
    const known = loadRepairs().find((r) => r.ref === q);
    if (known) {
      auto.current = true;
      setLast4(known.last4);
      void check(known.ref, known.last4);
    }
  }, [sp, check]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = ref.trim();
    const l = last4.replace(/\D/g, "");
    const fe: { ref?: string; last4?: string } = {};
    if (!r) fe.ref = "Podaj numer zgłoszenia.";
    if (l.length !== 4) fe.last4 = "Podaj 4 ostatnie cyfry telefonu.";
    setFieldErr(fe);
    if (fe.ref || fe.last4) return;
    void check(r, l, { remember });
  };

  const onShow = useCallback((r: SavedRepair, d: TrackResponse | null) => {
    if (!d) return;
    setRef(r.ref);
    setLast4(r.last4);
    setData(d);
    setQuery({ ref: r.ref, last4: r.last4 });
    setSaved(true);
    setError(null);
    window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, []);

  return (
    <div className="t-ui t-container t-trk">
      <div className="t-trk__head">
        <TrackHead />
        <form className="t-card t-trk__form" onSubmit={onSubmit} noValidate aria-label="Sprawdź status naprawy">
          <label className="t-field t-trk__fref" htmlFor="trk-ref">
            <span className="t-field__label">Numer zgłoszenia</span>
            <input id="trk-ref" type="text" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="z potwierdzenia e-mail" autoComplete="off" autoCapitalize="characters" spellCheck={false} aria-invalid={!!fieldErr.ref || undefined} aria-describedby={fieldErr.ref ? "trk-ref-err" : undefined} />
            {fieldErr.ref ? (
              <span className="t-field__error" id="trk-ref-err">
                {fieldErr.ref}
              </span>
            ) : null}
          </label>
          <label className="t-field t-trk__f4" htmlFor="trk-last4">
            <span className="t-field__label">4 ostatnie cyfry telefonu</span>
            <input id="trk-last4" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="np. 0151" autoComplete="off" aria-invalid={!!fieldErr.last4 || undefined} aria-describedby={fieldErr.last4 ? "trk-last4-err" : undefined} />
            {fieldErr.last4 ? (
              <span className="t-field__error" id="trk-last4-err">
                {fieldErr.last4}
              </span>
            ) : null}
          </label>
          <button type="submit" className="t-btn t-btn--acc t-trk__go" disabled={loading}>
            {loading ? "Sprawdzam…" : "Sprawdź"}
          </button>
          <label className="t-check t-trk__remember">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span>Zapamiętaj na tym urządzeniu</span>
          </label>
        </form>
      </div>

      {error ? (
        <div className="t-alert" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      <div ref={resultRef} className="t-trk__result" aria-live="polite">
        {data && query ? (
          <>
            <RepairTracker data={data} onRefresh={() => void check(query.ref, query.last4)} refreshing={loading} />
            {/* "Przyjęte" (first stage): what to prepare before handing the device over (SPEC §12.3). */}
            {data.stages[data.stage_index]?.key === "received" && !data.is_interrupted ? (
              <PrepChecklist category={DEVICE_CATEGORIES.find((c) => c.label === data.device.category)?.value ?? null} />
            ) : null}
            {!saved ? (
              <button
                type="button"
                className="t-linkbtn t-trk__save"
                onClick={() => {
                  saveRepair({ ref: data.repair_number, last4: query.last4, device: deviceName(data), status: data.status });
                  setSaved(isSaved(data.repair_number));
                }}
              >
                Zapamiętaj tę naprawę na tym urządzeniu
              </button>
            ) : null}
          </>
        ) : !error ? (
          // Empty state like the design (#status-naprawy, "widok przykładowy"): the hint next to the
          // same example panel as on the home page, instead of a lone text card.
          <div className="t-track t-trk__empty">
            <div className="t-track__text">
              <p className="t-track__desc">
                <b>Numer zgłoszenia</b> znajdziesz w e-mailu z potwierdzeniem i na ekranie po wysłaniu zgłoszenia. Do sprawdzenia potrzebne są też 4 ostatnie cyfry telefonu podanego w zgłoszeniu.
              </p>
              <Link href={SUBMIT_HREF} className="t-linkbtn t-trk__emptylink">
                Nie masz jeszcze zgłoszenia? Zgłoś naprawę →
              </Link>
            </div>
            <TrackExample point={examplePoint} />
          </div>
        ) : null}
      </div>

      <MyRepairs onShow={onShow} />
    </div>
  );
}
