"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Notice } from "@/config/prokom";
import { activeNotice } from "@/lib/tech/points";
import { IconClose } from "./icons";

const KEY = "pk-tech-notice-closed";

function readClosed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

/**
 * Notice above the capsule (SPEC §12.9): the one active today (Europe/Warsaw),
 * dismissal remembered per id. Nothing active → renders nothing (no space taken).
 */
export function NoticeBar({ notices }: { notices: Notice[] }) {
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const n = activeNotice(new Date(), notices);
    setNotice(n && !readClosed().includes(n.id) ? n : null);
  }, [notices]);

  if (!notice) return null;
  const close = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify([...readClosed(), notice.id].slice(-20)));
    } catch {
      /* private mode */
    }
    setNotice(null);
  };
  return (
    <div className="t-notice" role="region" aria-label="Komunikat">
      <div className="t-container t-notice__in">
        {notice.href ? (
          <Link href={notice.href} className="t-notice__text">
            {notice.text}
          </Link>
        ) : (
          <span className="t-notice__text">{notice.text}</span>
        )}
        <button type="button" className="t-notice__close" aria-label="Zamknij komunikat" onClick={close}>
          <IconClose size={16} />
        </button>
      </div>
    </div>
  );
}
