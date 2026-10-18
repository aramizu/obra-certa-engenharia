import type { NextConfig } from "next";
import { CLIENT_STALE_TIMES } from "./lib/nav-cache";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    staleTimes: {
      dynamic: CLIENT_STALE_TIMES.dynamic,
      static: CLIENT_STALE_TIMES.static,
    },
  },
};

export default nextConfig;
