import type { NextConfig } from "next";

// All /api/* calls are handled by src/app/api/[...proxy]/route.ts which
// transparently proxies to the backend and correctly forwards Set-Cookie headers.
// Set BACKEND_URL in Vercel env vars to override the Railway fallback.
const nextConfig: NextConfig = {};

export default nextConfig;
