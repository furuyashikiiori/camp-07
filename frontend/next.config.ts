import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
const isDevBranch = process.env.VERCEL_GIT_COMMIT_REF === "dev";

// API URL の決定
const getApiUrl = () => {
  if (isDevelopment) return "http://localhost:8080";
  if (isDevBranch) return "https://qrsona-backend-dev.onrender.com";
  return "https://qrsona-backend.onrender.com";
};

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || getApiUrl(),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${getApiUrl()}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
