"use client";

export default function PanelLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-16 w-full">
      <div className="relative flex items-center justify-center">
        {/* Zewnętrzny pierścień z gradientem */}
        <div className="absolute w-16 h-16 rounded-full border-[3px] border-transparent border-t-[var(--accent)] border-l-[var(--accent-light)] animate-spin"></div>
        {/* Drugi kręcący się w przeciwną stronę pierścień */}
        <div className="absolute w-12 h-12 rounded-full border-[3px] border-transparent border-b-[var(--accent-dark)] border-r-[var(--accent)] animate-[spin_1.5s_linear_infinite_reverse]"></div>
        {/* Wewnętrzny puls */}
        <div className="w-4 h-4 bg-[var(--accent)] rounded-full animate-ping opacity-80"></div>
      </div>
      <p className="mt-6 font-display text-[var(--accent-dark)] tracking-[0.2em] animate-pulse text-xs font-semibold uppercase">
        Ładowanie
      </p>
    </div>
  );
}
