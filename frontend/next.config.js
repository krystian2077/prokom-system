/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
