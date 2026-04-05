export default function PublicLoading() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="card-base overflow-hidden animate-pulse"
        >
          {i === 0 && <div className="w-full aspect-2/1 bg-gray-100" />}
          <div className="p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 bg-gray-100 rounded-full w-14" />
              <div className="h-4 bg-gray-50 rounded w-28" />
            </div>
            <div className="h-5 bg-gray-100 rounded w-3/4" />
            <div className="space-y-2 pt-1">
              <div className="h-3.5 bg-gray-50 rounded w-full" />
              <div className="h-3.5 bg-gray-50 rounded w-5/6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
