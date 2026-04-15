export default function PublicLoading() {
  return (
    <div>
      {/* Toggle skeleton */}
      <div className="h-10 w-36 bg-church-border-soft rounded-xl mb-6 animate-pulse" />

      {/* Feed skeleton */}
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="card-base overflow-hidden animate-pulse"
          >
            {i === 0 && <div className="w-full aspect-2/1 bg-church-border-soft" />}
            <div className="p-5 sm:p-6 space-y-3">
              <div className="h-6 bg-church-border-soft rounded w-3/4" />
              <div className="space-y-2 pt-1">
                <div className="h-3.5 bg-church-border-soft rounded w-full" />
                <div className="h-3.5 bg-church-border-soft rounded w-5/6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
