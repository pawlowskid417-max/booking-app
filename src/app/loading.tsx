export default function Loading() {
  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-24 animate-pulse">
      {/* Hero skeleton */}
      <div className="h-16 bg-zinc-200 rounded-lg max-w-2xl mx-auto mb-6"></div>
      <div className="h-4 bg-zinc-200 rounded max-w-md mx-auto mb-10"></div>
      <div className="h-12 w-48 bg-zinc-200 rounded-full mx-auto mb-24"></div>

      {/* Services skeleton */}
      <div className="h-8 w-48 bg-zinc-200 rounded-lg mx-auto mb-10"></div>
      <div className="grid sm:grid-cols-2 gap-5 mb-20">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-zinc-100 rounded-3xl border border-zinc-200"></div>
        ))}
      </div>
    </div>
  );
}
