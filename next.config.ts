import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // Pin the project root so a stray package-lock.json in a parent folder is ignored.
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      // /user is an alias for the public site (which lives at /)
      { source: "/user", destination: "/", permanent: false },
      { source: "/user/:path*", destination: "/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
