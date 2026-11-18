"use client";

import { useCallback, useEffect, useState } from "react";
import { ENQUIRY_EVENT, ENQUIRY_KEY, readEnquiry, writeEnquiry, type EnquiryItem } from "@/lib/tech/catalog/enquiry";

/** The enquiry list, in step across components and tabs (custom event + storage event). */
export function useEnquiry(): [EnquiryItem[], (next: EnquiryItem[]) => void, boolean] {
  const [list, setList] = useState<EnquiryItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setList(readEnquiry());
    setReady(true);
    const on = () => setList(readEnquiry());
    const onStorage = (e: StorageEvent) => {
      if (e.key === ENQUIRY_KEY) on();
    };
    window.addEventListener(ENQUIRY_EVENT, on);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(ENQUIRY_EVENT, on);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  const save = useCallback((next: EnquiryItem[]) => {
    setList(next);
    writeEnquiry(next);
  }, []);
  return [list, save, ready];
}
