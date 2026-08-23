export default function Loading() {
  return (
    <div className="p-6 max-w-5xl mx-auto animate-pulse">
      <div className="h-8 w-48 bg-zinc-200 rounded-lg mb-8"></div>
      
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-zinc-100 rounded-lg border border-zinc-200"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
