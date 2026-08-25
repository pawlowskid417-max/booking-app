"use client";

import { useState } from "react";
import useSWR from "swr";
import PanelNav from "@/components/PanelNav";
import PanelLoading from "@/components/PanelLoading";
import { formatPrice } from "@/lib/types";

interface SummaryData {
  completedEarningsCents: number;
  expectedEarningsCents: number;
  completedCount: number;
  upcomingCount: number;
  topEmployees: { id: string; name: string; count: number; earningsCents: number }[];
  topServices: { id: string; name: string; count: number }[];
}

export default function PodsumowaniePage() {
  const [from] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  });

  const { data, error, isLoading: loading } = useSWR<{ summary: SummaryData }>(`/api/panel/summary?from=${from}`);
  const summary = data?.summary ?? null;

  if (loading && !summary) {
    return (
      <main className="flex-1 bg-[var(--background)]">
        
        <PanelLoading />
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="flex-1 bg-[var(--background)]">
        
        <div className="p-8 text-center text-red-500">{error}</div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[var(--background)] pb-12">
      
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="font-display text-2xl text-[var(--accent-dark)] mb-8">Podsumowanie i Statystyki</h1>

        {/* Kafelki z głównymi statystykami */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-[var(--muted)] mb-1">Zarobki (zrealizowane)</h3>
            <p className="text-3xl font-bold text-[var(--accent-dark)]">{formatPrice(summary.completedEarningsCents)}</p>
          </div>
          
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-[var(--muted)] mb-1">Zarobki (oczekiwane)</h3>
            <p className="text-3xl font-bold text-[var(--foreground)] opacity-80">{formatPrice(summary.expectedEarningsCents)}</p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-[var(--muted)] mb-1">Zrealizowane wizyty</h3>
            <p className="text-3xl font-bold text-[var(--foreground)]">{summary.completedCount}</p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-[var(--muted)] mb-1">Nadchodzące wizyty</h3>
            <p className="text-3xl font-bold text-[var(--foreground)] opacity-80">{summary.upcomingCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Pracownicy */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h2 className="font-display text-xl mb-6 text-[var(--foreground)]">Najlepsi Pracownicy</h2>
            
            {summary.topEmployees.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Brak danych do wyświetlenia.</p>
            ) : (
              <div className="space-y-4">
                {summary.topEmployees.map((emp, idx) => (
                  <div key={emp.id} className="flex items-center justify-between p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] text-[var(--accent-dark)] flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-[var(--foreground)]">{emp.name}</h4>
                        <p className="text-xs text-[var(--muted)]">Zrealizowanych wizyt: {emp.count}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[var(--accent-dark)]">{formatPrice(emp.earningsCents)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Usługi */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h2 className="font-display text-xl mb-6 text-[var(--foreground)]">Najpopularniejsze Usługi</h2>
            
            {summary.topServices.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Brak danych do wyświetlenia.</p>
            ) : (
              <div className="space-y-4">
                {summary.topServices.map((srv, idx) => (
                  <div key={srv.id} className="flex items-center justify-between p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-[var(--cream)] text-[var(--muted)] flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <h4 className="font-medium text-[var(--foreground)]">{srv.name}</h4>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[var(--foreground)]">{srv.count} razy</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
