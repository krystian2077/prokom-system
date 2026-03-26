"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

function PostCard({ post }: { post: (typeof BLOG_POSTS)[0] }) {
  const cs = getCategoryStyle(post.category);
  return (
    <Link href={`/blog/${post.slug}`} className="group">
      <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-card transition-all hover:border-red-200 hover:shadow-md">
        <div className="mb-3 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cs.pill}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${cs.dot}`} />
            {post.category}
          </span>
        </div>
        <h2 className="flex-1 text-base font-bold leading-snug text-prokom-black transition-colors group-hover:text-primary">
          {post.title}
        </h2>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-prokom-gray">
          {post.description}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-xs text-prokom-gray">{formatDate(post.date)}</span>
          <span className="text-xs text-prokom-gray">{post.readingTime}</span>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
          Czytaj
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </div>
      </article>
    </Link>
  );
}

export default function BlogPageClient() {
  const featured = getFeaturedPost();
  const [activeGroup, setActiveGroup] = useState("Wszystko");
  const [activeCategory, setActiveCategory] = useState("Wszystkie w grupie");

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
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden border-b border-gray-100 bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-red-50 opacity-60 blur-3xl" />
          <div className="absolute -bottom-24 left-0 h-[300px] w-[300px] rounded-full bg-gray-50 opacity-80 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            PRO-KOM Serwis · Rabka-Zdrój
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-prokom-black sm:text-5xl">
            Blog i poradniki
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-prokom-gray sm:text-lg">
            Praktyczne porady od serwisu i sklepu PRO-KOM w Rabce-Zdroju. Laptopy, komputery,
            drukarki, gaming, poleasing i telefony — odpowiadamy na pytania klientów.
          </p>

        </div>
      </section>

      {/* ─── Filter bar: group + category ─── */}
      <div className="sticky top-16 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
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
                      ? "bg-prokom-black text-white shadow-sm"
                      : "border border-gray-200 bg-white text-prokom-gray hover:border-gray-300 hover:text-prokom-black"
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
                onClick={() => setActiveCategory("Wszystkie w grupie")}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeCategory === "Wszystkie w grupie"
                    ? "bg-primary text-white"
                    : "border border-gray-200 bg-white text-prokom-gray hover:border-gray-300"
                }`}
              >
                Wszystkie w grupie
              </button>

              {BLOG_CATEGORIES.filter((cat) => categoriesInGroup.includes(cat.label)).map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setActiveCategory(cat.label)}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeCategory === cat.label
                      ? `${cat.pill}`
                      : "border border-gray-200 bg-white text-prokom-gray hover:border-gray-300"
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

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* ─── Featured post (tylko przy "Wszystko" i wszystkich podkategoriach) ─── */}
        {featured && activeGroup === "Wszystko" && activeCategory === "Wszystkie w grupie" && (
          <div className="mb-14">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-prokom-gray">
              Wyróżniony artykuł
            </p>
            <Link href={`/blog/${featured.slug}`} className="group block">
              <article className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card transition-all hover:border-red-200 hover:shadow-md">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-50/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="p-8 sm:p-10">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getCategoryStyle(featured.category).pill}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${getCategoryStyle(featured.category).dot}`} />
                      {featured.category}
                    </span>
                    <span className="text-xs text-prokom-gray">{formatDate(featured.date)}</span>
                    <span className="text-xs text-prokom-gray">· {featured.readingTime} czytania</span>
                  </div>
                  <h2 className="text-2xl font-extrabold leading-tight text-prokom-black transition-colors group-hover:text-primary sm:text-3xl">
                    {featured.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-prokom-gray">
                    {featured.description}
                  </p>
                  {featured.keyTakeaways && featured.keyTakeaways.length > 0 && (
                    <ul className="mt-5 space-y-2">
                      {featured.keyTakeaways.slice(0, 3).map((point) => (
                        <li key={point} className="flex items-start gap-2 text-sm text-prokom-gray">
                          <span className="mt-0.5 flex-none text-primary">✓</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
                    Czytaj artykuł
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </article>
            </Link>
          </div>
        )}

        <div>
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-prokom-gray">
            {rest.length} {rest.length === 1 ? "artykuł" : "artykułów"} · {activeGroup}
            {activeCategory !== "Wszystkie w grupie" ? ` · ${activeCategory}` : ""}
          </p>
          {rest.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-10 text-center">
              <p className="text-prokom-gray">Brak artykułów dla wybranych filtrów.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* ─── Trust strip ─── */}
        <div className="mt-16 grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: "🔧",
              title: "Serwis i sklep w jednym",
              desc: "Naprawiamy telefony, laptopy, komputery i drukarki. Sprzedajemy akcesoria GSM i sprzęt poleasingowy.",
            },
            {
              icon: "✓",
              title: "Bezpłatna diagnoza",
              desc: "Oceniamy usterkę bezpłatnie. Wycena przed naprawą — płacisz tylko jeśli się zgadzasz.",
            },
            {
              icon: "📦",
              title: "Obsługujemy całą okolicę",
              desc: "Klienci z Mszany Dolnej, Jordanowa, Raby Wyżnej, Nowego Targu i Czarnego Dunajca — osobiście i wysyłkowo.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <div className="mb-3 text-2xl">{item.icon}</div>
              <p className="font-bold text-prokom-black">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-prokom-gray">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* ─── CTA ─── */}
        <div className="mt-10 rounded-2xl bg-prokom-black p-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
            PRO-KOM Serwis · ul. Orkana 16B, Rabka-Zdrój
          </p>
          <p className="mt-3 text-xl font-extrabold">
            Masz pytanie lub potrzebujesz naprawy?
          </p>
          <p className="mt-2 text-sm text-white/70">
            Zadzwoń lub odwiedź nas. Pon–Pt 9:00–17:00, Sob 9:00–14:00.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="tel:883200151"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
            >
              Zadzwoń: 883 200 151
            </a>
            <Link
              href="/zgloszenie"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20"
            >
              Zgłoś naprawę online
            </Link>
            <Link
              href="/oferta"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20"
            >
              Zobacz ofertę sprzętu
            </Link>
          </div>
        </div>

      </div>
    </>
  );
}
