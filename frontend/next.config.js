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
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(cspReportUri ? [`report-uri ${cspReportUri}`] : []),
].join("; ");

const nextConfig = {
  reactStrictMode: true,
  /** Domyślnie Next 14 przerywa build/dev przy useSearchParams() bez Suspense (często 500). */
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  /** Zapobiega błędom typu „Cannot find module './vendor-chunks/framer-motion.js'” przy bundlowaniu. */
  transpilePackages: ["framer-motion"],
  async redirects() {
    return [
      { source: "/serwis-telefonow", destination: "/uslugi", permanent: true },
      {
        source: "/panel/podglad/:path*",
        destination: "/panel/naprawy/:path*",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/:path*`,
      },
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
        ],
      },
    ];
  },
};

module.exports = nextConfig;
