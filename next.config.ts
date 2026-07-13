import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Video answers via FormData fallback (R2 uses direct PUT and does not use this limit)
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
