import Link from "next/link";
import Image from "next/image";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-church-bg flex flex-col">
      <header className="sticky top-0 z-30 bg-church-bg/80 backdrop-blur-md border-b border-church-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <Link
            href="/"
            className="focus-ring inline-flex items-center gap-2.5 rounded-md"
            aria-label="정동 젊은이 교회 홈"
          >
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="w-7 h-7 object-contain"
              priority
            />
            <span className="font-heading text-[15px] text-church-text">
              정동 젊은이 교회
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-5 pb-28 sm:pb-12">
        {children}
      </main>

      <footer className="hidden sm:block border-t border-church-border mt-12">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-between text-xs text-church-muted">
          <span>주일 오후 2시 · 서울 중구 정동길</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
