import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-config";
import { BLOG_POSTS } from "@/lib/blog-posts";
import BlogPageClient from "./BlogPageClient";

export const metadata: Metadata = {
  title:
    "Blog — serwis telefonów, laptopów, komputerów, drukarek | PRO-KOM Rabka-Zdrój",
  description:
    "Praktyczne poradniki od PRO-KOM Serwis w Rabce-Zdroju: naprawa laptopów, komputerów, drukarek i telefonów, akcesoria GSM, gaming, sprzęt biznesowy i poleasingowy. Odpowiedzi na pytania klientów.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title:
      "Blog PRO-KOM — poradniki serwisowe i zakupowe | Rabka-Zdrój",
    description:
      "Laptop, komputer, drukarka, telefon — praktyczne porady i odpowiedzi od serwisu PRO-KOM w Rabce-Zdroju.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog PRO-KOM — serwis i poradniki | Rabka-Zdrój",
    description:
      "Laptopy, komputery, drukarki, telefony, gaming, poleasing — praktyczne porady od serwisu PRO-KOM w Rabce-Zdroju.",
  },
};

export default function BlogPage() {
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_URL}/blog`,
    name: "Blog PRO-KOM Serwis",
    description:
      "Praktyczne poradniki serwisowe i zakupowe: laptopy, komputery, drukarki, telefony, gaming, poleasing — od PRO-KOM Serwis w Rabce-Zdroju.",
    url: `${SITE_URL}/blog`,
    publisher: {
      "@type": "Organization",
      name: "PRO-KOM Serwis",
      url: `${SITE_URL}`,
    },
    blogPost: BLOG_POSTS.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      url: `${SITE_URL}/blog/${post.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <BlogPageClient />
    </>
  );
}
