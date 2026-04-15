import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
    // Cache transformed images for 1 year — minimizes Vercel image optimization billing
    minimumCacheTTL: 31_536_000,
    // Trim device sizes to what we actually use (mobile-first web)
    deviceSizes: [640, 828, 1200],
    imageSizes: [64, 128, 256, 384],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
