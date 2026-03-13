"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isDark = scrolled;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isDark
          ? "border-b border-white/10 bg-dark shadow-[0_4px 24px -8px rgba(0,0,0,0.3)] backdrop-blur-xl"
          : "border-b border-gray-100 bg-white/90 backdrop-blur-lg"
      }`}
    >
      <div className="mx-auto flex h-20 w-full max-w-[1600px] items-center justify-between gap-6 px-4 sm:px-6 lg:gap-8 lg:px-8 xl:px-10">
        {/* Logo */}
        <Link
          href="/"
          className={`shrink-0 text-3xl font-bold tracking-tight transition-opacity duration-200 hover:opacity-90 ${
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
            href="/client"
            className={`whitespace-nowrap text-xl font-medium transition-colors duration-200 ${
              isDark
                ? "text-gray-300 hover:text-white"
                : "text-neutral hover:text-dark"
            }`}
          >
            Panel klienta
          </Link>
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
          <PremiumButton
            href="/zgloszenie"
            variant="primary"
            size="md"
            className="min-h-[40px] shrink-0 rounded-xl px-5 text-lg font-semibold shadow-[0_3px 16px -4px rgba(225,29,29,0.4)] transition-all duration-200 hover:shadow-[0_8px 28px -6px rgba(225,29,29,0.45)] hover:-translate-y-0.5"
          >
            Zgłoś naprawę
          </PremiumButton>
        </div>

        {/* Mobile: hamburger */}
        <button
          type="button"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 lg:hidden ${
            isDark
              ? "text-white hover:bg-white/10"
              : "text-dark hover:bg-gray-100"
          }`}
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Otwórz menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Menu mobilne */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden border-t border-gray-100 bg-white lg:hidden"
          >
            <nav
              className="flex flex-col px-4 py-5"
              aria-label="Menu mobilne"
            >
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl px-4 py-4 text-xl font-medium transition-colors ${
                    pathname === href
                      ? "bg-primary/10 text-primary"
                      : "text-dark hover:bg-gray-50"
                  }`}
                >
                  {label}
                </Link>
              ))}
              <div className="mt-3 border-t border-gray-100 pt-4">
                <Link
                  href="/client"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-4 py-4 text-xl font-medium text-neutral hover:bg-gray-50 hover:text-dark"
                >
                  Panel klienta
                </Link>
                <div className="mt-3 flex flex-col gap-3">
                  <PremiumButton
                    href="/client/login"
                    variant="outline"
                    size="md"
                    className="w-full rounded-xl border-2 border-gray-200 py-3.5 text-xl font-semibold text-dark"
                  >
                    Zaloguj się / Zarejestruj się
                  </PremiumButton>
                  <PremiumButton
                    href="/zgloszenie"
                    variant="primary"
                    size="md"
                    className="w-full rounded-xl py-3.5 text-xl font-semibold shadow-[0_3px 16px -4px rgba(225,29,29,0.4)]"
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
