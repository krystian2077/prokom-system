/** @type {import('next').NextConfig} */
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
};

module.exports = nextConfig;
