"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, CalendarDays, Clock3, Phone, ShieldCheck, Sparkles, UserRound, Wrench } from "lucide-react";
import { BLOG_POSTS, getFeaturedPost } from "@/lib/blog-posts";
import { BLOG_CATEGORIES, getCategoryStyle } from "@/lib/blog-categories";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const TOPIC_GROUPS = [
  {
    label: "Wszystko",
    categories: BLOG_CATEGORIES.map((c) => c.label),
  },
  {
    label: "Telefony",
    categories: ["Naprawa telefonów", "Akcesoria GSM", "Sklep GSM"],
  },
  {
    label: "Laptopy",
    categories: ["Laptopy", "Sprzęt biznesowy", "Poleasing"],
  },
  {
    label: "Komputery",
    categories: ["Komputery", "Gaming"],
  },
  {
    label: "Drukarki",
    categories: ["Drukarki"],
  },
];

const FALLBACK_AUTHOR = "Zespół PRO-KOM";

const TRUST_ITEMS = [
  {
    icon: "🔧",
    title: "Serwis + sklep w jednym miejscu",
    desc: "Naprawy i akcesoria GSM, laptopy, komputery oraz drukarki - bez rozbijania procesu na kilka firm.",
  },
  {
    icon: "⚡",
    title: "Bezpłatna diagnoza",
    desc: "Najpierw diagnoza i jasna wycena, dopiero później decyzja o naprawie. Zero niespodzianek.",
  },
  {
    icon: "📍",
    title: "Obsługa całego regionu",
    desc: "Rabka-Zdrój, Mszana Dolna, Jordanów, Raba Wyżna, Nowy Targ i okolice - lokalnie i wysyłkowo.",
  },
] as const;

function makeVariants(reducedMotion: boolean): { container: Variants; item: Variants } {
  return {
    container: {
      hidden: {},
      show: {
        transition: {
          staggerChildren: reducedMotion ? 0 : 0.08,
        },
      },
    },
    item: {
      hidden: {
        opacity: 0,
        y: reducedMotion ? 0 : 20,
      },
      show: {
        opacity: 1,
        y: 0,
        transition: {
          duration: reducedMotion ? 0.01 : 0.45,
          ease: "easeOut",
        },
      },
    },
  };
}

function PostCard({ post, reducedMotion }: { post: (typeof BLOG_POSTS)[0]; reducedMotion: boolean }) {
  const cs = getCategoryStyle(post.category);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: reducedMotion ? 0 : 18 },
        show: { opacity: 1, y: 0, transition: { duration: reducedMotion ? 0.01 : 0.38, ease: "easeOut" } },
      }}
    >
      <Link href={`/blog/${post.slug}`} className="group block h-full">
        <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-red-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,.08)] transition-all duration-300 hover:-translate-y-1 hover:border-red-300 hover:shadow-[0_18px_44px_rgba(220,38,38,.18)]">
          <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-red-100/70 blur-2xl" />

          <div className="relative mb-4 flex items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cs.pill}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cs.dot}`} />
              {post.category}
            </span>
            <span className="text-[11px] text-slate-500">{post.readingTime}</span>
          </div>

          <h2 className="relative line-clamp-2 text-lg font-semibold leading-tight text-slate-900 transition-colors group-hover:text-red-700">
            {post.title}
          </h2>
          <p className="relative mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{post.description}</p>

          <div className="relative mt-5 grid gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={13} />
              {formatDate(post.date)}
            </span>
            <span className="inline-flex items-center gap-2">
              <UserRound size={13} />
              {FALLBACK_AUTHOR}
            </span>
          </div>

          <span className="relative mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-700">
            Czytaj artykuł
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </span>
        </article>
      </Link>
    </motion.div>
  );
}

export default function BlogPageClient() {
  const featured = getFeaturedPost();
  const [activeGroup, setActiveGroup] = useState("Wszystko");
  const [activeCategory, setActiveCategory] = useState("Wszystkie w grupie");
  const reducedMotion = useReducedMotion();
  const variants = makeVariants(Boolean(reducedMotion));

  const sorted = useMemo(
    () => [...BLOG_POSTS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    []
  );

  const activeGroupConfig = TOPIC_GROUPS.find((g) => g.label === activeGroup) ?? TOPIC_GROUPS[0];
  const categoriesInGroup = activeGroupConfig.categories;

  const filtered = sorted.filter((p) => {
    const inGroup = categoriesInGroup.includes(p.category);
    if (!inGroup) return false;
    if (activeCategory === "Wszystkie w grupie") return true;
    return p.category === activeCategory;
  });

  const rest = filtered.filter((p) => !p.featured || activeCategory !== "Wszystkie w grupie");

  return (
    <div className="relative overflow-hidden bg-white text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-44 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-red-100/80 blur-3xl" />
        <div className="absolute right-0 top-56 h-[320px] w-[320px] rounded-full bg-rose-100/70 blur-3xl" />
      </div>

      <section className="relative border-b border-red-100/80">
        <motion.div
          variants={variants.container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-6xl px-4 pb-14 pt-16 sm:px-6 sm:pt-20"
        >
          <motion.div variants={variants.item} className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-700">
              <Sparkles size={13} />
              Blog PRO-KOM Serwis
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.2] tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.15]">
              Poradniki serwisowe PRO-KOM w Rabce-Zdroju,
              <span className="block bg-gradient-to-r from-red-700 via-red-600 to-rose-500 bg-clip-text text-transparent">
                telefony, laptopy i komputery bez tajemnic
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Praktyczne poradniki i doświadczenie serwisu PRO-KOM. Telefony, laptopy, komputery, drukarki i sprzęt
              poleasingowy - podane lekko, czytelnie i bez lania wody.
            </p>
          </motion.div>

          <motion.div variants={variants.container} className="mt-8 grid gap-3 sm:grid-cols-3">
            <motion.div variants={variants.item} className="rounded-2xl border border-red-100 bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,.06)]">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                <Wrench size={13} />
                Artykułów
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{BLOG_POSTS.length}</p>
            </motion.div>
            <motion.div variants={variants.item} className="rounded-2xl border border-red-100 bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,.06)]">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                <CalendarDays size={13} />
                Najnowsza publikacja
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-800">{sorted[0] ? formatDate(sorted[0].date) : "Brak danych"}</p>
            </motion.div>
            <motion.div variants={variants.item} className="rounded-2xl border border-red-100 bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,.06)]">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                <Clock3 size={13} />
                Średni czas czytania
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-800">3-6 minut</p>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      <div className="sticky top-16 z-30 border-b border-red-100 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max items-center gap-2">
              {TOPIC_GROUPS.map((group) => (
                <button
                  key={group.label}
                  type="button"
                  onClick={() => {
                    setActiveGroup(group.label);
                    setActiveCategory("Wszystkie w grupie");
                  }}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    activeGroup === group.label
                      ? "border border-red-300 bg-red-50 text-red-700 shadow-[0_6px_18px_rgba(239,68,68,.22)]"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-red-700"
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveGroup("Wszystko");
                  setActiveCategory("Wszystkie w grupie");
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeGroup === "Wszystko" && activeCategory === "Wszystkie w grupie"
                    ? "border border-red-300 bg-red-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-red-200"
                }`}
              >
                Wszystkie wpisy
              </button>

              {BLOG_CATEGORIES.filter((cat) => categoriesInGroup.includes(cat.label)).map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setActiveCategory(cat.label)}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeCategory === cat.label
                      ? "border border-red-300 bg-red-50 text-red-700"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-red-200"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${cat.dot}`} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {featured && activeGroup === "Wszystko" && activeCategory === "Wszystkie w grupie" && (
          <motion.section
            initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: reducedMotion ? 0.01 : 0.45, ease: "easeOut" }}
            className="mb-14"
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Wyróżniony artykuł</p>
            <Link href={`/blog/${featured.slug}`} className="group block">
              <article className="relative overflow-hidden rounded-[30px] border border-red-100 bg-[linear-gradient(145deg,rgba(255,255,255,.98),rgba(254,242,242,.92))] p-8 shadow-[0_20px_56px_rgba(15,23,42,.10)] transition-all duration-300 hover:-translate-y-0.5 hover:border-red-300 hover:shadow-[0_28px_66px_rgba(239,68,68,.20)] sm:p-10">
                <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-red-200/45 blur-3xl" />

                <div className="relative mb-4 flex flex-wrap items-center gap-3 text-xs">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ${getCategoryStyle(featured.category).pill}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${getCategoryStyle(featured.category).dot}`} />
                    {featured.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <CalendarDays size={13} />
                    {formatDate(featured.date)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <Clock3 size={13} />
                    {featured.readingTime}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <UserRound size={13} />
                    {FALLBACK_AUTHOR}
                  </span>
                </div>

                <h2 className="relative max-w-4xl text-2xl font-semibold leading-tight text-slate-900 transition-colors group-hover:text-red-700 sm:text-3xl">
                  {featured.title}
                </h2>
                <p className="relative mt-4 max-w-3xl text-base leading-relaxed text-slate-600">{featured.description}</p>

                {featured.keyTakeaways && featured.keyTakeaways.length > 0 && (
                  <ul className="relative mt-6 grid gap-2 sm:grid-cols-2">
                    {featured.keyTakeaways.slice(0, 4).map((point) => (
                      <li key={point} className="flex items-start gap-2 rounded-xl border border-red-100 bg-white/85 p-3 text-sm text-slate-700">
                        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-red-500" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="relative mt-7 inline-flex items-center gap-2 text-sm font-semibold text-red-700">
                  Przeczytaj wyróżniony poradnik
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </div>
              </article>
            </Link>
          </motion.section>
        )}

        <section>
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {rest.length} {rest.length === 1 ? "artykuł" : "artykułów"} · {activeGroup}
            {activeCategory !== "Wszystkie w grupie" ? ` · ${activeCategory}` : ""}
          </p>

          {rest.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
              <p className="text-slate-600">Brak artykułów dla wybranych filtrów.</p>
            </div>
          ) : (
            <motion.div
              key={`${activeGroup}-${activeCategory}`}
              variants={variants.container}
              initial="hidden"
              animate="show"
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {rest.map((post) => (
                <PostCard key={post.slug} post={post} reducedMotion={Boolean(reducedMotion)} />
              ))}
            </motion.div>
          )}
        </section>

        <motion.section
          variants={variants.container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-16 grid gap-5 md:grid-cols-3"
        >
          {TRUST_ITEMS.map((item) => (
            <motion.article
              key={item.title}
              variants={variants.item}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,.06)] transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-[0_18px_42px_rgba(239,68,68,.16)]"
            >
              <div className="mb-3 text-2xl">{item.icon}</div>
              <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
            </motion.article>
          ))}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: reducedMotion ? 0.01 : 0.45, ease: "easeOut" }}
          className="mt-10 overflow-hidden rounded-[30px] border border-red-200 bg-[linear-gradient(145deg,rgba(254,242,242,.8),rgba(255,255,255,.96))] p-8 shadow-[0_20px_56px_rgba(15,23,42,.10)] sm:p-10"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700/90">
            PRO-KOM Serwis · ul. Orkana 16B, Rabka-Zdrój
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">Masz pytanie lub potrzebujesz szybkiej diagnozy?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
            Skontaktuj się z nami i dobierzemy najlepsze rozwiązanie: naprawa, modernizacja albo nowy sprzęt.
            Działamy od poniedziałku do piątku 9:00-17:00 i w soboty 9:00-14:00.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="tel:883200151"
              className="inline-flex items-center gap-2 rounded-2xl border border-red-300 bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <Phone size={16} />
              Zadzwoń: 883 200 151
            </a>
            <Link
              href="/zgloszenie"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-red-200 hover:text-red-700"
            >
              Zgłoś naprawę online
            </Link>
            <Link
              href="/oferta"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-red-200 hover:text-red-700"
            >
              Zobacz ofertę sprzętu
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
