export default function AnnouncementsLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="mb-6 pb-5 border-b border-church-border-soft">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="h-7 w-40 rounded bg-church-border-soft animate-pulse" />
            <div className="h-4 w-72 rounded bg-church-border-soft animate-pulse" />
          </div>
          <div className="h-10 w-24 rounded-md bg-church-border-soft animate-pulse" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        <div className="h-9 w-16 rounded bg-church-border-soft animate-pulse" />
        <div className="h-9 w-28 rounded bg-church-border-soft animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="card-base overflow-hidden">
        <div className="px-5 py-3 border-b border-church-border bg-church-border-soft/40">
          <div className="h-3 w-20 rounded bg-church-border-soft animate-pulse" />
        </div>
        <ul>
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-4 px-5 py-4 border-b border-church-border-soft last:border-b-0"
            >
              <div className="h-6 w-10 rounded-md bg-church-border-soft animate-pulse" />
              <div className="h-4 flex-1 rounded bg-church-border-soft animate-pulse" />
              <div className="h-5 w-16 rounded-full bg-church-border-soft animate-pulse" />
              <div className="h-4 w-24 rounded bg-church-border-soft animate-pulse hidden sm:block" />
              <div className="h-8 w-20 rounded bg-church-border-soft animate-pulse" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
