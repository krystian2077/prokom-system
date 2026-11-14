"use client";

import { useState } from "react";
import { removeRepair, saveRepair } from "@/lib/tech/my-repairs";

/** "Zapamiętaj na tym urządzeniu" after sending (SPEC §12.6) — off by default (shared phones). */
export function RememberRepair({ repairNumber, last4, device, status }: { repairNumber: string; last4: string; device: string; status: string }) {
  const [on, setOn] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <label className="t-check t-remember">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => {
          const want = e.target.checked;
          const ok = want ? saveRepair({ ref: repairNumber, last4, device, status }) : removeRepair(repairNumber);
          setFailed(!ok);
          setOn(want && ok);
        }}
      />
      <span>
        <b>Zapamiętaj na tym urządzeniu</b>
        <br />
        <span className="t-field__hint">{failed ? "Ta przeglądarka nie pozwala zapisać danych (np. tryb prywatny)." : "Status sprawdzisz potem jednym kliknięciem na stronie statusu i w menu. Nie zaznaczaj na cudzym telefonie."}</span>
      </span>
    </label>
  );
}
