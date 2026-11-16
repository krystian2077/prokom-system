/** @type {import('next').NextConfig} */
const cspReportUri = process.env.NEXT_PUBLIC_CSP_REPORT_URI || "";
const cspReportOnly = [
  "default-src 'self'",
  // Next.js runtime i aktualne skrypty inline (theme bootstrap + JSON-LD w layoutach).
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https: wss:",
  "frame-src https://www.google.com https://maps.google.com https://maps.googleapis.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(cspReportUri ? [`report-uri ${cspReportUri}`] : []),
].join("; ");

const isProd = process.env.NODE_ENV === "production";
// 30 days: public/ files keep their names, so no `immutable` (a replaced photo shows up within a month at worst).
const publicFilesCache = "public, max-age=2592000";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  /** Domyślnie Next 14 przerywa build/dev przy useSearchParams() bez Suspense (często 500). */
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  /** Zapobiega błędom typu „Cannot find module './vendor-chunks/framer-motion.js'” przy bundlowaniu. */
  transpilePackages: ["framer-motion"],
  async redirects() {
    return [
      // TD4: removed shop pages (SPEC §6). /serwis-telefonow is a real page now.
      { source: "/akcesoria", destination: "/hammer-glass", permanent: true },
      { source: "/oferta", destination: "/", permanent: true },
      // /naprawy/[slug] has no index page: a trimmed address lands on the repairs hub (REPAIRS_HREF), not on 404.
      { source: "/naprawy", destination: "/uslugi", permanent: true },
      {
        source: "/panel/podglad/:path*",
        destination: "/panel/naprawy/:path*",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/panel/naprawy", destination: "/panel/repairs" },
      { source: "/panel/naprawy/:path*", destination: "/panel/repairs/:path*" },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
          // HTTPS only (Nginx terminates TLS); browsers ignore HSTS over http, and localhost never gets it.
          ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
        ],
      },
      // Files from public/ (photos, icons); /_next/static already gets immutable caching from Next.
      { source: "/tech/:path*", headers: [{ key: "Cache-Control", value: publicFilesCache }] },
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: publicFilesCache }] },
    ];
  },
};

module.exports = nextConfig;
