import type { NextConfig } from "next";

function getSupabaseProductAssetsPattern() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;

  if (!configuredUrl) return null;

  try {
    const supabaseUrl = new URL(configuredUrl);
    if (supabaseUrl.protocol !== "https:") return null;

    return {
      protocol: "https" as const,
      hostname: supabaseUrl.hostname,
      port: supabaseUrl.port,
      pathname: "/storage/v1/object/public/product-assets/**",
      search: "",
    };
  } catch {
    return null;
  }
}

const supabaseProductAssetsPattern = getSupabaseProductAssetsPattern();

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
      {
        protocol: "https",
        hostname: "blog.google",
        pathname: "/**",
      },
      ...(supabaseProductAssetsPattern
        ? [supabaseProductAssetsPattern]
        : []),
    ],
  },
};

export default nextConfig;
