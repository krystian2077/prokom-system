import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/panel/", "/admin-panel/", "/client/", "/api/"],
      },
    ],
    sitemap: "https://pro-kom.eu/sitemap.xml",
    host: "https://pro-kom.eu",
  };
}
