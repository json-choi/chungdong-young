import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/theme-toggle";

// Runs before body paints — sets `.dark` class based on stored preference or
// system setting to avoid FOUC. Reads/writes localStorage["theme"].
const themeBootstrap = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var shouldDark = stored === "dark" || ((!stored || stored === "system") && prefersDark);
    if (shouldDark) document.documentElement.classList.add("dark");
    localStorage.removeItem("palette");
  } catch (e) {}
})();
`;

export const metadata: Metadata = {
  title: {
    default: "정동 젊은이 교회",
    template: "%s · 정동 젊은이 교회",
  },
  description: "정동 젊은이 교회 공지사항",
};

// System-preference dark mode — browser adapts status bar / UI chrome to match.
export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF9" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1419" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Set .dark class before paint — reads localStorage + system pref */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* Warm up TLS/DNS to the image CDN before the first <Image> request */}
        <link rel="preconnect" href="https://public.blob.vercel-storage.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://public.blob.vercel-storage.com" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster />
        {process.env.NODE_ENV === "development" && <ThemeToggle />}
      </body>
    </html>
  );
}
