import type { NextConfig } from "next";

// BACKEND_URL is server-side only (no NEXT_PUBLIC_ prefix)
// Bud/Vercel infra cannot inject it — safe to use as Railway fallback
const RAILWAY_API = "https://anchorpro-production.up.railway.app";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiUrl = process.env.BACKEND_URL ?? RAILWAY_API;
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
