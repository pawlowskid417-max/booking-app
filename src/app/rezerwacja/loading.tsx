export default function Loading() {
  return (
    <div className="flex-1 bg-[var(--background)] py-12 px-6">
      <div className="max-w-2xl mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 md:p-10 shadow-sm animate-pulse">
        {/* Header skeleton */}
        <div className="h-8 w-48 bg-zinc-200 rounded-lg mb-8"></div>
        
        {/* Step skeleton */}
        <div className="h-4 w-32 bg-zinc-200 rounded mb-4"></div>
        
        {/* Service items skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-zinc-100 rounded-xl border border-zinc-200"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
