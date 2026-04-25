"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  User,
  LayoutDashboard,
  Wrench,
  UserCircle,
  LogOut,
  House,
  BriefcaseBusiness,
  Plus,
  Ellipsis,
  Smartphone,
  ShoppingBag,
  BookOpen,
  Phone,
  Shield,
  ChevronRight,
} from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useAuth } from "@/contexts/AuthContext";

const clientMenuItems = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/naprawy", label: "Moje Naprawy", icon: Wrench },
  { href: "/client/profil", label: "Profil", icon: UserCircle },
] as const;

const navItems = [
  { href: "/", label: "Strona główna" },
  { href: "/uslugi", label: "Usługi" },
  { href: "/oferta", label: "Oferta" },
  { href: "/hammer-glass", label: "Hammer Glass" },
  { href: "/akcesoria", label: "Akcesoria" },
  { href: "/blog", label: "Blog" },
  { href: "/kontakt", label: "Kontakt" },
];

const moreMenuItems = [
  { href: "/oferta", label: "Oferta", icon: ShoppingBag },
  { href: "/hammer-glass", label: "Hammer Glass", icon: Shield },
  { href: "/akcesoria", label: "Akcesoria", icon: Smartphone },
  { href: "/blog", label: "Blog", icon: BookOpen },
  { href: "/kontakt", label: "Kontakt", icon: Phone },
];

function NavLink({
  href,
  label,
  isActive,
  dark,
}: {
  href: string;
  label: string;
  isActive: boolean;
  dark?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const showUnderline = isActive || hover;

  return (
    <Link
      href={href}
      className={`relative inline-block whitespace-nowrap py-3 text-xl font-medium tracking-tight transition-colors duration-300 ease-out ${
        dark ? "hover:text-white" : "hover:text-dark"
      }`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span
        className={
          isActive ? "text-primary" : dark ? "text-gray-300" : "text-neutral"
        }
      >
        {label}
      </span>
      <motion.span
        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-primary"
        style={{ transformOrigin: "50% 50%" }}
        initial={false}
        animate={{ scaleX: showUnderline ? 1 : 0 }}
        transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
      />
    </Link>
  );
}

export function PublicNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { token, user, logout } = useAuth();
  const isLoggedInAsClient = Boolean(token && user?.role === "client");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isDark = scrolled;

  const dockItems = [
    { id: "start", href: "/", label: "Start", icon: House },
    { id: "zglos", href: "/zgloszenie", label: "Zgłoś", icon: Plus },
    { id: "uslugi", href: "/uslugi", label: "Usługi", icon: BriefcaseBusiness },
    { id: "wiecej", href: null, label: "Więcej", icon: Ellipsis },
  ] as const;

  return (
    <>
      {/* ── Top header bar ── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 w-full transition-all duration-300 ${
          isDark
            ? "border-b border-white/10 bg-dark shadow-[0_4px_24px_-8px_rgba(0,0,0,0.3)] backdrop-blur-xl"
            : "border-b border-gray-100/80 bg-white/95 backdrop-blur-lg"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top, 0)" }}
      >
        <div className="mx-auto flex h-14 min-h-[56px] w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:h-16 sm:min-h-[64px] sm:px-6 lg:h-20 lg:gap-8 lg:px-8 xl:px-10">
          <Link
            href="/"
            className={`shrink-0 text-xl font-bold tracking-tight transition-opacity duration-200 hover:opacity-90 sm:text-2xl lg:text-3xl ${
              isDark ? "text-white" : "text-dark"
            }`}
          >
            PRO-KOM
          </Link>

          <nav
            className="hidden min-w-0 flex-1 justify-center lg:flex"
            aria-label="Główne menu"
          >
            <div className="flex items-center justify-center gap-6 xl:gap-8">
              {navItems.map(({ href, label }) => (
                <NavLink
                  key={href}
                  href={href}
                  label={label}
                  isActive={pathname === href}
                  dark={isDark}
                />
              ))}
            </div>
          </nav>

          {/* Desktop right side */}
          <div className="hidden shrink-0 items-center gap-4 lg:flex xl:gap-5">
            {isLoggedInAsClient ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className={`group flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-3 transition-all duration-300 ${
                    userMenuOpen
                      ? isDark
                        ? "bg-white/15 shadow-[0_0_0_2px_rgba(255,255,255,0.2)]"
                        : "bg-primary/10 shadow-[0_0_0_2px_rgba(220,29,29,0.25)]"
                      : isDark
                        ? "hover:bg-white/10"
                        : "hover:bg-gray-100"
                  }`}
                  aria-label="Menu konta"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <span
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                      userMenuOpen
                        ? isDark
                          ? "bg-white/20 text-white"
                          : "bg-primary/20 text-primary"
                        : isDark
                          ? "bg-white/15 text-white group-hover:bg-white/25"
                          : "bg-primary/10 text-primary group-hover:bg-primary/20"
                    }`}
                  >
                    <User className="h-5 w-5" strokeWidth={2.25} />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 ${
                        isDark
                          ? "border-dark bg-emerald-400"
                          : "border-white bg-emerald-500"
                      }`}
                      title="Zalogowany"
                    />
                  </span>
                  <span
                    className={`max-w-[120px] truncate text-left text-[15px] font-semibold transition-colors xl:max-w-[140px] ${
                      userMenuOpen
                        ? isDark
                          ? "text-white"
                          : "text-primary"
                        : isDark
                          ? "text-gray-200 group-hover:text-white"
                          : "text-dark"
                    }`}
                  >
                    {user?.first_name || user?.email?.split("@")[0] || "Konto"}
                  </span>
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{
                        duration: 0.22,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                      className={`absolute right-0 top-full z-50 mt-2 min-w-[220px] overflow-hidden rounded-xl border py-1.5 shadow-xl ${
                        isDark
                          ? "border-white/15 bg-dark/95 backdrop-blur-md"
                          : "border-gray-200/90 bg-white/95 backdrop-blur-md"
                      }`}
                      role="menu"
                    >
                      {clientMenuItems.map(({ href, label, icon: Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setUserMenuOpen(false)}
                          className={`group/item flex items-center gap-3 px-4 py-3 text-left text-[15px] font-medium transition-all duration-200 ${
                            isDark
                              ? "text-gray-200 hover:bg-white/10 hover:pl-5 hover:text-white"
                              : "text-dark hover:bg-primary/5 hover:pl-5 hover:text-primary"
                          }`}
                          role="menuitem"
                        >
                          <Icon className="h-5 w-5 shrink-0 opacity-80 transition-transform duration-200 group-hover/item:scale-110" />
                          {label}
                        </Link>
                      ))}
                      <div
                        className={`my-1 border-t ${isDark ? "border-white/10" : "border-gray-100"}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className={`group/item flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] font-medium transition-all duration-200 ${
                          isDark
                            ? "text-red-300 hover:bg-red-500/15 hover:pl-5 hover:text-red-200"
                            : "text-red-600 hover:bg-red-50 hover:pl-5"
                        }`}
                        role="menuitem"
                      >
                        <LogOut className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover/item:scale-110" />
                        Wyloguj
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <PremiumButton
                href="/client/login"
                variant="outline"
                size="md"
                className={`min-h-[40px] shrink-0 rounded-xl border-2 px-4 text-lg font-semibold transition-all duration-200 ${
                  isDark
                    ? "border-white/50 bg-transparent text-white hover:border-white hover:bg-white/10"
                    : "border-gray-200 bg-white text-dark hover:border-primary/40 hover:bg-gray-50 hover:text-dark"
                }`}
              >
                Zaloguj się / Zarejestruj się
              </PremiumButton>
            )}
            <PremiumButton
              href="/zgloszenie"
              variant="primary"
              size="md"
              className="min-h-[40px] shrink-0 rounded-xl px-5 text-lg font-semibold shadow-[0_3px_16px_-4px_rgba(225,29,29,0.4)] transition-all duration-200 hover:shadow-[0_8px_28px_-6px_rgba(225,29,29,0.45)] hover:-translate-y-0.5"
            >
              Zgłoś naprawę
            </PremiumButton>
          </div>

          {/* Mobile hamburger — visible in top bar, hidden on desktop */}
          <button
            type="button"
            className={`flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 items-center justify-center rounded-xl transition-colors duration-200 lg:hidden ${
              isDark
                ? "text-white hover:bg-white/10 active:bg-white/15"
                : "text-dark hover:bg-gray-100 active:bg-gray-200"
            }`}
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Zamknij menu" : "Otwórz menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </header>

      {/* ── Mobile fullscreen menu (opened by "Więcej" or hamburger) ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-[65] px-3 pt-2 sm:top-[calc(4rem+env(safe-area-inset-top,0px))] lg:hidden"
            >
              <nav
                className="flex max-h-[calc(100vh-8rem)] flex-col overflow-y-auto rounded-[22px] border border-gray-100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.12)] sm:mx-auto sm:max-w-lg"
                aria-label="Menu mobilne"
              >
                <div className="flex flex-col px-2 py-3">
                  {moreMenuItems.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex min-h-[52px] items-center gap-3.5 rounded-2xl px-4 py-3 text-[15px] font-semibold transition-colors ${
                        pathname === href
                          ? "bg-primary/[0.07] text-primary"
                          : "text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          pathname === href
                            ? "bg-primary/10 text-primary"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                      </span>
                      {label}
                      <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
                    </Link>
                  ))}
                </div>

                <div className="mx-4 border-t border-gray-100" />

                <div className="flex flex-col px-2 py-3">
                  {isLoggedInAsClient ? (
                    <>
                      {clientMenuItems.map(({ href, label, icon: Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex min-h-[52px] items-center gap-3.5 rounded-2xl px-4 py-3 text-[15px] font-semibold transition-colors ${
                            pathname === href
                              ? "bg-primary/[0.07] text-primary"
                              : "text-gray-800 hover:bg-gray-50"
                          }`}
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              pathname === href
                                ? "bg-primary/10 text-primary"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                          </span>
                          {label}
                          <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
                        </Link>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false);
                          logout();
                        }}
                        className="flex min-h-[52px] w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-left text-[15px] font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                          <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
                        </span>
                        Wyloguj się
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/client/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex min-h-[52px] items-center gap-3.5 rounded-2xl px-4 py-3 text-[15px] font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                        <User className="h-[18px] w-[18px]" strokeWidth={2} />
                      </span>
                      Zaloguj się / Zarejestruj
                      <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
                    </Link>
                  )}
                </div>

                <div className="px-4 pb-4 pt-1">
                  <PremiumButton
                    href="/zgloszenie"
                    variant="primary"
                    size="md"
                    className="w-full min-h-[50px] rounded-2xl py-3.5 text-[15px] font-bold shadow-[0_4px_16px_-4px_rgba(225,29,29,0.35)]"
                    onClick={() => setMobileOpen(false)}
                  >
                    Zgłoś naprawę
                  </PremiumButton>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Bottom dock navigation (mobile only) ── */}
      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] lg:hidden"
        aria-label="Szybka nawigacja"
      >
        <div className="pointer-events-auto mx-auto flex max-w-md items-stretch rounded-[22px] border border-gray-200/60 bg-white/[0.92] p-1.5 shadow-[0_-2px_16px_rgba(15,23,42,0.08),0_4px_20px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          {dockItems.map((item) => {
            const Icon = item.icon;
            const isMore = item.id === "wiecej";
            const active = !isMore &&
              (pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href!)));

            if (isMore) {
              return (
                <button
                  key="wiecej"
                  type="button"
                  onClick={() => setMobileOpen((o) => !o)}
                  className={`flex min-h-[52px] flex-1 flex-col items-center justify-center rounded-[16px] px-1 text-[10px] font-semibold tracking-wide transition-all ${
                    mobileOpen
                      ? "bg-gray-900 text-white"
                      : "text-gray-400 active:bg-gray-100"
                  }`}
                  aria-label="Więcej opcji"
                  aria-expanded={mobileOpen}
                >
                  {mobileOpen ? (
                    <X className="mb-0.5 h-5 w-5" strokeWidth={2.2} />
                  ) : (
                    <Icon className="mb-0.5 h-5 w-5" strokeWidth={2.2} />
                  )}
                  Więcej
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href!}
                className={`flex min-h-[52px] flex-1 flex-col items-center justify-center rounded-[16px] px-1 text-[10px] font-semibold tracking-wide transition-all ${
                  active
                    ? "bg-primary text-white shadow-[0_4px_14px_-2px_rgba(225,29,29,0.35)]"
                    : "text-gray-400 active:bg-gray-100"
                }`}
              >
                <Icon className="mb-0.5 h-5 w-5" strokeWidth={2.2} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
