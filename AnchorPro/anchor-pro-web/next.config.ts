import type { NextConfig } from "next";
import path from "path";

// All /api/* calls are handled by src/app/api/[...proxy]/route.ts which
// transparently proxies to the backend and correctly forwards Set-Cookie headers.
// Set BACKEND_URL in Vercel env vars to override the Railway fallback.
const nextConfig: NextConfig = {
  // Pin the Turbopack root to this directory — the repo also has an unrelated
  // package-lock.json one level up (a standalone DB script's deps), which Turbopack's
  // ancestor-lockfile auto-detection otherwise picks as the root, breaking every route.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
