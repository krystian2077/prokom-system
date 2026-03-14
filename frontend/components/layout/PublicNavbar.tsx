"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/", label: "Strona główna" },
  { href: "/uslugi", label: "Usługi" },
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
  const { token, user, logout } = useAuth();
  const isLoggedInAsClient = Boolean(token && user?.role === "client");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
          <Link
            href={isLoggedInAsClient ? "/client/dashboard" : "/client"}
            className={`whitespace-nowrap text-xl font-medium transition-colors duration-200 ${
              isDark
                ? "text-gray-300 hover:text-white"
                : "text-neutral hover:text-dark"
            }`}
          >
            Panel klienta
          </Link>
          {isLoggedInAsClient ? (
            <button
              type="button"
              onClick={() => logout()}
              className={`min-h-[40px] shrink-0 rounded-xl border-2 px-4 text-lg font-semibold transition-all duration-200 ${
                isDark
                  ? "border-white/50 bg-transparent text-white hover:border-white hover:bg-white/10"
                  : "border-gray-200 bg-white text-dark hover:border-primary/40 hover:bg-gray-50 hover:text-dark"
              }`}
            >
              Wyloguj
            </button>
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
                <Link
                  href={isLoggedInAsClient ? "/client/dashboard" : "/client"}
                  onClick={() => setMobileOpen(false)}
                  className={`flex min-h-[48px] items-center rounded-xl px-4 py-3.5 text-base font-medium transition-colors sm:text-lg ${
                    isDark ? "text-gray-300 hover:bg-white/5 hover:text-white" : "text-neutral hover:bg-gray-50 hover:text-dark"
                  }`}
                >
                  Panel klienta
                </Link>
                <div className="mt-3 flex flex-col gap-3">
                  {isLoggedInAsClient ? (
                    <button
                      type="button"
                      onClick={() => { setMobileOpen(false); logout(); }}
                      className={`w-full min-h-[48px] rounded-xl border-2 py-3.5 text-base font-semibold sm:text-lg ${
                        isDark ? "border-white/30 text-white hover:bg-white/10" : "border-gray-200 text-dark"
                      }`}
                    >
                      Wyloguj
                    </button>
                  ) : (
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
