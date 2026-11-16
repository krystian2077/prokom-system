"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { ClientProfile } from "@/types/panel";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { IconHome, IconPlus, IconUser, IconWrench } from "../icons";
import { IconLogout } from "./account-icons";

const LINKS = [
  { href: "/client/dashboard", label: "Pulpit", icon: <IconHome size={17} /> },
  { href: "/client/naprawy", label: "Moje naprawy", icon: <IconWrench size={16} strokeWidth={2.2} /> },
  { href: "/client/profil", label: "Profil", icon: <IconUser size={17} /> },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/client/naprawy") return pathname.startsWith("/client/naprawy");
  return pathname === href;
}

/**
 * Frame of the logged-in client account inside the Tech shell: who is signed in, the
 * account tabs (Pulpit / Moje naprawy / Profil), "Zgłoś naprawę" and "Wyloguj".
 * Logout is the same call as before (AuthContext.logout → /client/login).
 */
export function AccountShell({ user, email, unverified, children }: { user: ClientProfile | null; email?: string; unverified: boolean; children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/client/login");
  };

  const initial = user?.firstName?.[0]?.toUpperCase() ?? "";
  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "";

  return (
    <div className="t-ui t-container t-ck t-ck-acct">
      <div className="t-ck-acct__bar">
        <div className="t-ck-acct__who">
          <span className="t-ck-avatar" aria-hidden="true">
            {initial || <IconUser size={18} />}
          </span>
          <span className="t-ck-acct__whotext">
            <span className="t-ck-acct__label">Konto klienta</span>
            {name ? <strong>{name}</strong> : <span className="t-ck-skel" style={{ width: 120, height: 16, borderRadius: 6 }} aria-hidden="true" />}
          </span>
        </div>

        <nav className="t-ck-acct__nav" aria-label="Konto klienta">
          <span className="t-ck-acct__navin">
            {LINKS.map((l) => {
              const on = isActive(pathname, l.href);
              return (
                <Link key={l.href} href={l.href} className={on ? "is-on" : undefined} aria-current={on ? "page" : undefined}>
                  {l.icon}
                  {l.label}
                </Link>
              );
            })}
          </span>
        </nav>

        <div className="t-ck-acct__actions">
          <Link href={SUBMIT_HREF} className="t-pbtn t-pbtn--acc t-pbtn--m t-ck-acct__submit">
            <IconPlus size={16} />
            Zgłoś naprawę
          </Link>
          <button type="button" className="t-pbtn t-pbtn--outline t-pbtn--m t-ck-acct__logout" onClick={handleLogout} aria-label="Wyloguj">
            <IconLogout size={17} />
            <span>Wyloguj</span>
          </button>
        </div>
      </div>

      {unverified && email ? (
        <div className="t-ck-notice" role="status">
          <span>Zweryfikuj swój adres e-mail, aby uzyskać pełny dostęp.</span>
          <Link href={`/client/verify-email?email=${encodeURIComponent(email)}`} className="t-ck-link">
            Wyślij kod ponownie
          </Link>
        </div>
      ) : null}

      <div className="t-ck-acct__main">{children}</div>
    </div>
  );
}
