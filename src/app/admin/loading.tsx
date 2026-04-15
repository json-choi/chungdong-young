export default function AdminLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="mb-6 pb-5 border-b border-church-border-soft">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="h-7 w-32 rounded bg-church-border-soft animate-pulse" />
            <div className="h-4 w-64 rounded bg-church-border-soft animate-pulse" />
          </div>
          <div className="h-10 w-24 rounded-md bg-church-border-soft animate-pulse" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-base p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="h-3 w-10 rounded bg-church-border-soft animate-pulse" />
              <div className="w-7 h-7 rounded-md bg-church-border-soft animate-pulse" />
            </div>
            <div className="h-8 w-12 rounded bg-church-border-soft animate-pulse mt-3" />
          </div>
        ))}
      </div>

      {/* Lists skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mt-8">
        {Array.from({ length: 2 }).map((_, idx) => (
          <section key={idx} className="card-base overflow-hidden">
            <header className="px-5 py-4 border-b border-church-border-soft">
              <div className="h-4 w-24 rounded bg-church-border-soft animate-pulse" />
            </header>
            <ul>
              {Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 px-5 py-3.5 border-b border-church-border-soft last:border-b-0"
                >
                  <div className="h-4 flex-1 rounded bg-church-border-soft animate-pulse" />
                  <div className="h-5 w-16 rounded-full bg-church-border-soft animate-pulse" />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
