import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The repo root also has a package.json (for the run-both script), so say which
  // folder is the website.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
