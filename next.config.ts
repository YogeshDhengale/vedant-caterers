import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/photo-*",
        search: "",
      },
    ],
    localPatterns: [
      {
        pathname: "/logo.png",
      },
      {
        pathname: "/api/gallery/media/**",
      },
      {
        pathname: "/gallery/**",
      },
    ],
  },
  serverExternalPackages: ["mongodb", "@pdf-lib/fontkit"],
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
