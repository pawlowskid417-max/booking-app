"use client";

import { useEffect, useState } from "react";
import { Review } from "@prisma/client";
import PanelLoading from "@/components/PanelLoading";

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    try {
      const res = await fetch("/api/panel/reviews");
      if (!res.ok) throw new Error("Nie udało się pobrać opinii");
      const data = await res.json();
      setReviews(data.reviews);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleApproval(id: string, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/panel/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: !currentStatus }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, approved: !currentStatus } : r))
        );
      }
    } catch (e) {
      alert("Błąd podczas zmiany statusu");
    }
  }

  async function deleteReview(id: string) {
    if (!confirm("Czy na pewno chcesz usunąć tę opinię?")) return;
    try {
      const res = await fetch(`/api/panel/reviews/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (e) {
      alert("Błąd podczas usuwania");
    }
  }

  if (loading) {
    return (
      <main className="flex-1 bg-[var(--background)]">
        <PanelLoading />
      </main>
    );
  }
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Zarządzanie opiniami</h1>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        {reviews.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted)]">Brak opinii w systemie.</div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {reviews.map((r) => (
              <li key={r.id} className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-[var(--foreground)]">{r.name}</span>
                    <span className="text-yellow-500 text-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    {!r.approved && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-md font-medium border border-yellow-200">
                        Oczekuje
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--muted)] text-sm mb-2">
                    {new Date(r.createdAt).toLocaleDateString("pl-PL")}
                  </p>
                  <p className="text-[var(--foreground)] mt-2">{r.content}</p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0 mt-4 md:mt-0">
                  <button
                    onClick={() => toggleApproval(r.id, r.approved)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      r.approved 
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200" 
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {r.approved ? "Ukryj" : "Zatwierdź"}
                  </button>
                  <button
                    onClick={() => deleteReview(r.id)}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    Usuń
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
