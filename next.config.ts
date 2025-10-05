import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@t3-oss/env-nextjs", "@t3-oss/env-core"],
  typedRoutes: true,
  cacheHandler:
  process.env.NODE_ENV === "production"
    ? require.resolve("./cache-handler.mjs")
    : undefined,
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;
