"use client";

import { useState, useMemo } from "react";
import type { Service } from "@/lib/types";
import { formatPrice, formatDurationMin } from "@/lib/types";
import AnimatedSection from "@/components/AnimatedSection";

export default function ServicesTabsClient({ services }: { services: Service[] }) {
  const categories = useMemo(() => {
    const cats = Array.from(new Set(services.map(s => s.category || "Inne")));
    // Sort categories, maybe keep "Manicure", "Pedicure" first
    return cats.sort((a, b) => {
      if (a === "Manicure") return -1;
      if (b === "Manicure") return 1;
      if (a === "Pedicure") return -1;
      if (b === "Pedicure") return 1;
      return a.localeCompare(b);
    });
  }, [services]);

  const [activeCategory, setActiveCategory] = useState(categories[0] || "Inne");

  const filteredServices = useMemo(() => {
    return services.filter(s => (s.category || "Inne") === activeCategory);
  }, [services, activeCategory]);

  if (services.length === 0) {
    return <p className="text-center text-[var(--muted)]">Brak dostępnych usług.</p>;
  }

  return (
    <div className="w-full">
      {/* Zakładki kategorii */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === cat
                ? "bg-[var(--foreground)] text-[var(--background)] shadow-md scale-105"
                : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Lista usług w wybranej kategorii */}
      <div className="grid sm:grid-cols-2 gap-5 min-h-[300px] content-start">
        {filteredServices.map((s, i) => (
          <AnimatedSection key={s.id + activeCategory} delay={i * 0.05}>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 flex flex-col h-full hover:border-[var(--accent)] transition-colors duration-300 shadow-sm hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium text-lg text-[var(--foreground)]">{s.name}</h3>
                <span className="text-[var(--foreground)] font-display font-medium text-lg whitespace-nowrap">
                  {formatPrice(s.priceCents)}
                </span>
              </div>
              {s.description && (
                <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">{s.description}</p>
              )}
              <div className="mt-auto pt-4 flex items-center justify-between">
                <span className="text-xs text-[var(--muted)] bg-[var(--background)] border border-[var(--border)] px-3 py-1.5 rounded-full inline-block">
                  ⏱ {formatDurationMin(s.durationMin)}
                </span>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  );
}
