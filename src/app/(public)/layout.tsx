export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-church-bg">
      <header className="bg-white border-b border-church-border">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <h1 className="text-xl font-semibold text-church-navy text-center">
            정동 젊은이 교회
          </h1>
          <p className="text-sm text-church-muted text-center mt-0.5">
            공지사항
          </p>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
