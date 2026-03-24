"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";

/** Odświeża wiele query (invalidacja) co `ms` + ręczny refresh. */
export function useAutoRefresh(queryKeys: QueryKey[], ms = 30_000) {
  const qc = useQueryClient();
  const [countdown, setCountdown] = useState(ms / 1000);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stableKeys = useMemo(() => queryKeys, [JSON.stringify(queryKeys)]);

  const invalidateAll = useCallback(() => {
    void Promise.all(stableKeys.map((qk) => qc.invalidateQueries({ queryKey: qk })));
  }, [qc, stableKeys]);

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setIsRefreshing(true);
          void invalidateAll();
          setTimeout(() => setIsRefreshing(false), 600);
          return ms / 1000;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [invalidateAll, ms]);

  const refresh = () => {
    setIsRefreshing(true);
    void invalidateAll();
    setCountdown(ms / 1000);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return { countdown, isRefreshing, refresh };
}
