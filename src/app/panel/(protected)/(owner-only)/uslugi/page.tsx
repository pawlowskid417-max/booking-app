"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import PanelLoading from "@/components/PanelLoading";
import type { Service } from "@/lib/types";
import { formatPrice, formatDurationMin } from "@/lib/types";

export default function UslugiPage() {
  const { data: servicesData, isLoading: loadingServices, mutate: mutateServices } = useSWR<{ services: Service[] }>("/api/panel/services");
  const services = servicesData?.services ?? [];

  const { data: categoriesData, isLoading: loadingCategories } = useSWR<{ id: string; name: string }[]>("/api/panel/categories");
  const categories = categoriesData ?? [];

  const loading = loadingServices || loadingCategories;
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Manicure");
  const [durationMin, setDurationMin] = useState(60);
  const [priceZl, setPriceZl] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (categories.length > 0 && category === "Manicure") {
      setCategory(categories[0].name);
    }
  }, [categories]);

  async function addService() {
    if (!name.trim() || !priceZl) return;
    setAdding(true);
    setMessage(null);
    const priceCents = Math.round(parseFloat(priceZl.replace(",", ".")) * 100);

    const res = await fetch("/api/panel/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, category, durationMin, priceCents }),
    });

    if (res.ok) {
      setName("");
      setDescription("");
      if (categories.length > 0) setCategory(categories[0].name);
      setDurationMin(60);
      setPriceZl("");
      mutateServices();
    } else {
      const data = await res.json();
      setMessage(data.error || "Nie udało się dodać usługi.");
    }
    setAdding(false);
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/panel/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    mutateServices();
  }

  return (
    <main className="flex-1 bg-[var(--background)]">
      
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="font-display text-2xl text-[var(--accent-dark)] mb-6">Usługi</h1>

        {message && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5 mb-4">
            {message}
          </div>
        )}

        {loading && !data && <PanelLoading />}

        <div className="space-y-3 mb-8">
          {services.map((s) => (
            <div
              key={s.id}
              className={`bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between gap-4 ${
                !s.isActive ? "opacity-50" : ""
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[var(--accent-light)] text-[var(--accent-dark)] px-2 py-0.5 rounded text-xs font-semibold">{s.category}</span>
                  <p className="font-medium">{s.name}</p>
                </div>
                {s.description && <p className="text-sm text-[var(--muted)]">{s.description}</p>}
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {formatDurationMin(s.durationMin)} · {formatPrice(s.priceCents)}
                </p>
              </div>
              <button
                onClick={() => toggleActive(s.id, !!s.isActive)}
                className="text-xs border border-[var(--border)] hover:border-[var(--accent)] px-3 py-1.5 rounded-full whitespace-nowrap"
              >
                {s.isActive ? "Dezaktywuj" : "Aktywuj"}
              </button>
            </div>
          ))}
        </div>

        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
          <h2 className="font-medium mb-4">Dodaj nową usługę</h2>
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium">Nazwa</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Kategoria</span>
              {categories.length > 0 ? (
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-red-500 mt-2">Brak kategorii. Dodaj je najpierw w zakładce Kategorie.</div>
              )}
            </label>
            <label className="block">
              <span className="text-sm font-medium">Opis (opcjonalnie)</span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
              />
            </label>
            <div className="flex gap-4">
              <label className="block flex-1">
                <span className="text-sm font-medium">Czas trwania (min)</span>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={durationMin}
                  onChange={(e) => setDurationMin(Number(e.target.value))}
                  className="input"
                />
              </label>
              <label className="block flex-1">
                <span className="text-sm font-medium">Cena (zł)</span>
                <input
                  value={priceZl}
                  onChange={(e) => setPriceZl(e.target.value)}
                  placeholder="np. 120"
                  className="input"
                />
              </label>
            </div>
            <button
              onClick={addService}
              disabled={adding || !name.trim() || !priceZl}
              className="bg-[var(--accent)] hover:bg-[var(--accent-dark)] disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-full"
            >
              {adding ? "Dodaję..." : "Dodaj usługę"}
            </button>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid var(--border);
          background: var(--surface);
          border-radius: 0.6rem;
          padding: 0.5rem 0.85rem;
          font-size: 0.85rem;
          outline: none;
          display: block;
          margin-top: 0.2rem;
        }
        .input:focus {
          border-color: var(--accent);
        }
      `}</style>
    </main>
  );
}
