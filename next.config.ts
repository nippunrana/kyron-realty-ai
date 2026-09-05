import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/base-path";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: BASE_PATH,
  reactStrictMode: true,
};

export default nextConfig;
