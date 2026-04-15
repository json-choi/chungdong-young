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

  // Tree-shake large icon / util packages at build time
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "@tiptap/extension-link",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
    ],
    // Extend client-side router cache so back/forward feels instant.
    // dynamic: reuse RSC payload for 30s (default 0 = always refetch)
    // static: 5 min — already default, listed for clarity
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
};

export default nextConfig;
