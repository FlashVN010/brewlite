import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // bắt buộc cho Dockerfile ở trên
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