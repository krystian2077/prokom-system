"use client";

import { useEffect, useState } from "react";
import type { ServicePoint } from "@/config/prokom";
import { warsawNow } from "@/lib/tech/hours";
import { hoursRows } from "@/lib/tech/point-format";

/** Today's day group in Warsaw (client only, after hydration — no guessing on the server). */
function todayGroup(now: Date): "pn–pt" | "sob" | "nd" {
  const { date } = warsawNow(now);
  const wd = new Date(Date.UTC(date.y, date.m - 1, date.d)).getUTCDay();
  return wd === 0 ? "nd" : wd === 6 ? "sob" : "pn–pt";
}

/** Hours chips from the design (`.hr`): the chip for today gets "· dziś" and the accent frame. */
export function HoursChips({ point }: { point: Pick<ServicePoint, "hours"> }) {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayGroup(new Date())), []);
  return (
    <ul className="t-hours" aria-label="Godziny otwarcia">
      {hoursRows(point).map((r) => (
        <li key={r.days} className={today === r.days ? "is-today" : undefined}>
          <span>
            {r.label}
            {today === r.days ? " · dziś" : ""}
          </span>
          <b>{r.value}</b>
        </li>
      ))}
    </ul>
  );
}
