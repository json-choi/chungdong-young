export default function PublicLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-church-border overflow-hidden animate-pulse"
        >
          <div className="flex">
            <div className="w-1 shrink-0 bg-gray-200" />
            <div className="flex-1 p-5 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
