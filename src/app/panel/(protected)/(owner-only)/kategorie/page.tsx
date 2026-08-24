"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import PanelLoading from "@/components/PanelLoading";

interface Category {
  id: string;
  name: string;
}

export default function CategoriesPanel() {
  const { data: categoriesData, isLoading: loading, mutate: mutateCategories } = useSWR<Category[]>("/api/panel/categories");
  const categories = categoriesData ?? [];

  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const router = useRouter();

  async function addCategory() {
    if (!newName.trim()) return;
    setAdding(true);
    const res = await fetch("/api/panel/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      setNewName("");
      mutateCategories();
      router.refresh();
    }
    setAdding(false);
  }

  async function deleteCategory(name: string) {
    if (deletingId === name) {
      // Potwierdzone usunięcie
      setDeletingId(name + "_loading"); // stan ładowania usuwania
      await fetch(`/api/panel/categories?name=${encodeURIComponent(name)}`, { method: "DELETE" });
      setDeletingId(null);
      mutateCategories();
      router.refresh();
    } else {
      // Pierwsze kliknięcie
      setDeletingId(name);
      setTimeout(() => setDeletingId(null), 3000); // Reset po 3 sekundach
    }
  }

  if (loading) {
    return (
      <main className="flex-1 p-6 md:p-10 flex items-center justify-center">
        <PanelLoading />
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full">
      <h1 className="font-display text-3xl mb-8">Kategorie Usług</h1>
      
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-8">
        <h2 className="font-medium mb-4">Dodaj nową kategorię</h2>
        <div className="flex gap-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="np. Masaże"
            className="flex-1 border border-[var(--border)] rounded-lg px-4 py-2 text-sm outline-none focus:border-[var(--accent)]"
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <button
            onClick={addCategory}
            disabled={adding || !newName.trim()}
            className="bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white text-sm font-medium px-6 py-2 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {adding ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Dodaję...
              </>
            ) : (
              "Dodaj"
            )}
          </button>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <h2 className="font-medium mb-4">Istniejące kategorie</h2>
        {categories.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">Brak kategorii w bazie.</p>
        ) : (
          <div className="grid gap-3">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:border-[var(--accent-light)] transition-colors">
                <span className="font-medium">{cat.name}</span>
                <button
                  onClick={() => deleteCategory(cat.name)}
                  disabled={deletingId === cat.name + "_loading"}
                  className={`text-sm px-4 py-1.5 rounded-full transition-colors ${
                    deletingId === cat.name
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "border border-red-200 text-red-500 hover:bg-red-50"
                  }`}
                >
                  {deletingId === cat.name + "_loading" 
                    ? "Usuwam..." 
                    : deletingId === cat.name 
                      ? "Kliknij by usunąć" 
                      : "Usuń"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
