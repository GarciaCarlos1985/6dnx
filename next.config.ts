import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.akamai.steamstatic.com",
        pathname: "/steam/apps/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/gweb-uniblog-publish-prod/images/**",
      },
    ],
  },
};

export default nextConfig;
