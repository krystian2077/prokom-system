"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, LayoutDashboard, Wrench, UserCircle, LogOut } from "lucide-react";
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
  { href: "/kontakt", label: "Kontakt" },
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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const isDark = scrolled;

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isDark
          ? "border-b border-white/10 bg-dark shadow-[0_4px 24px -8px rgba(0,0,0,0.3)] backdrop-blur-xl"
          : "border-b border-gray-100 bg-white/90 backdrop-blur-lg"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top, 0)" }}
    >
      <div className="mx-auto flex h-14 min-h-[56px] w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:h-16 sm:min-h-[64px] sm:px-6 lg:h-20 lg:gap-8 lg:px-8 xl:px-10">
        {/* Logo — mniejszy na telefonie */}
        <Link
          href="/"
          className={`shrink-0 text-xl font-bold tracking-tight transition-opacity duration-200 hover:opacity-90 sm:text-2xl lg:text-3xl ${
            isDark ? "text-white" : "text-dark"
          }`}
        >
          PRO-KOM
        </Link>

        {/* Środek — nav */}
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

        {/* Prawa strona — Panel + przyciski */}
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
                      isDark ? "border-dark bg-emerald-400" : "border-white bg-emerald-500"
                    }`}
                    title="Zalogowany"
                  />
                </span>
                <span
                  className={`max-w-[120px] truncate text-left text-[15px] font-semibold transition-colors xl:max-w-[140px] ${
                    userMenuOpen
                      ? isDark ? "text-white" : "text-primary"
                      : isDark ? "text-gray-200 group-hover:text-white" : "text-dark"
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
                    transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
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
                    <div className={`my-1 border-t ${isDark ? "border-white/10" : "border-gray-100"}`} />
                    <button
                      type="button"
                      onClick={() => { setUserMenuOpen(false); logout(); }}
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
            className="min-h-[40px] shrink-0 rounded-xl px-5 text-lg font-semibold shadow-[0_3px 16px -4px rgba(225,29,29,0.4)] transition-all duration-200 hover:shadow-[0_8px 28px -6px rgba(225,29,29,0.45)] hover:-translate-y-0.5"
          >
            Zgłoś naprawę
          </PremiumButton>
        </div>

        {/* Mobile: hamburger — min 44px touch */}
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
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Menu mobilne — tło zgodne z nagłówkiem, duże pola dotykowe */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            className={`overflow-hidden border-t lg:hidden ${
              isDark ? "border-white/10 bg-dark" : "border-gray-100 bg-white"
            }`}
          >
            <nav className="flex flex-col px-4 py-4 pb-6 sm:px-5 sm:py-5" aria-label="Menu mobilne">
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex min-h-[48px] items-center rounded-xl px-4 py-3.5 text-base font-medium transition-colors sm:text-lg ${
                    pathname === href
                      ? isDark ? "bg-white/10 text-primary" : "bg-primary/10 text-primary"
                      : isDark ? "text-gray-300 hover:bg-white/5 hover:text-white" : "text-dark hover:bg-gray-50"
                  }`}
                >
                  {label}
                </Link>
              ))}
              <div className={`mt-2 border-t pt-4 ${isDark ? "border-white/10" : "border-gray-100"}`}>
                {isLoggedInAsClient ? (
                  <>
                    {clientMenuItems.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-colors sm:text-lg ${
                          pathname === href
                            ? isDark ? "bg-white/10 text-primary" : "bg-primary/10 text-primary"
                            : isDark ? "text-gray-300 hover:bg-white/5 hover:text-white" : "text-dark hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0 opacity-80" />
                        {label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setMobileOpen(false); logout(); }}
                      className={`flex min-h-[48px] w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-base font-medium transition-colors sm:text-lg ${
                        isDark ? "text-red-300 hover:bg-white/5" : "text-red-600 hover:bg-red-50"
                      }`}
                    >
                      <LogOut className="h-5 w-5 shrink-0" />
                      Wyloguj
                    </button>
                  </>
                ) : (
                  <Link
                    href="/client"
                    onClick={() => setMobileOpen(false)}
                    className={`flex min-h-[48px] items-center rounded-xl px-4 py-3.5 text-base font-medium transition-colors sm:text-lg ${
                      isDark ? "text-gray-300 hover:bg-white/5 hover:text-white" : "text-neutral hover:bg-gray-50 hover:text-dark"
                    }`}
                  >
                    Panel klienta
                  </Link>
                )}
                <div className="mt-3 flex flex-col gap-3">
                  {!isLoggedInAsClient && (
                    <PremiumButton
                      href="/client/login"
                      variant="outline"
                      size="md"
                      className={`w-full min-h-[48px] rounded-xl border-2 py-3.5 text-base font-semibold sm:text-lg ${
                        isDark ? "border-white/30 text-white hover:bg-white/10" : "border-gray-200 text-dark"
                      }`}
                    >
                      Zaloguj się / Zarejestruj się
                    </PremiumButton>
                  )}
                  <PremiumButton
                    href="/zgloszenie"
                    variant="primary"
                    size="md"
                    className="w-full min-h-[48px] rounded-xl py-3.5 text-base font-semibold shadow-[0_3px_16px_-4px_rgba(225,29,29,0.4)] sm:text-lg"
                  >
                    Zgłoś naprawę
                  </PremiumButton>
                </div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
