"use client";

import { useEffect, useState } from "react";
import { quickActions, type QuickAction } from "@/lib/tech/search/quick-actions";
import { QuickActionTiles, useQuickRun } from "./QuickActions";

/** The quick action tiles of `/szukaj` (the same as in the window); the route follows the clock. */
export function SearchPageActions() {
  const [actions, setActions] = useState<QuickAction[]>(() => quickActions());
  const runner = useQuickRun();
  useEffect(() => setActions(quickActions({ now: new Date() })), []);
  return (
    <>
      <QuickActionTiles actions={actions} runner={runner} className="t-qa--page" />
      <p className="t-visually-hidden" role="status">
        {runner.status}
      </p>
    </>
  );
}
