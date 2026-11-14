import type { MetadataRoute } from "next";
import { buildSitemap } from "@/lib/tech/sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap();
}
