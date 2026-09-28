import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Shared API contract (TypeScript sources) from the monorepo.
  transpilePackages: ["@qdot/types"],
};

export default nextConfig;
