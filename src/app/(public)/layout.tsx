export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-church-bg flex flex-col">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-6 pb-12">
        {children}
      </main>

      <footer className="border-t border-church-border bg-white">
        <div className="max-w-2xl mx-auto px-4 py-5 text-center text-xs text-church-muted">
          <span>&copy; {new Date().getFullYear()} 정동 젊은이 교회</span>
        </div>
      </footer>
    </div>
  );
}
