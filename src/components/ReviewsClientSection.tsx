"use client";

import { useState } from "react";
import AnimatedSection from "./AnimatedSection";
import { Review } from "@prisma/client";

export default function ReviewsClientSection({ reviews }: { reviews: Review[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rating, content }),
      });
      if (res.ok) {
        setStatus("success");
        setTimeout(() => setIsOpen(false), 3000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="bg-[var(--surface)] py-20 border-t border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-6">
        <AnimatedSection>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="font-display text-3xl text-[var(--foreground)]">Opinie naszych klientek</h2>
              <p className="text-[var(--muted)] mt-2">Zobacz co o nas mówią lub zostaw swoją opinię</p>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)] px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
            >
              {isOpen ? "Anuluj" : "Zostaw opinię"}
            </button>
          </div>
        </AnimatedSection>

        {isOpen && (
          <AnimatedSection>
            <form onSubmit={handleSubmit} className="bg-white border border-[var(--border)] p-6 rounded-2xl mb-12 shadow-sm max-w-xl">
              <h3 className="font-display text-xl mb-4">Twoja opinia</h3>
              {status === "success" ? (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg">
                  Dziękujemy za opinię! Pojawi się na stronie po zatwierdzeniu.
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Imię</label>
                    <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="Twoje imię" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ocena (1-5)</label>
                    <select value={rating} onChange={e => setRating(Number(e.target.value))} className="w-full border p-2 rounded-lg">
                      <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                      <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                      <option value={3}>⭐⭐⭐ (3/5)</option>
                      <option value={2}>⭐⭐ (2/5)</option>
                      <option value={1}>⭐ (1/5)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Treść</label>
                    <textarea required value={content} onChange={e => setContent(e.target.value)} className="w-full border p-2 rounded-lg" rows={3} placeholder="Napisz co myślisz..." />
                  </div>
                  <button disabled={status === "submitting"} className="w-full bg-[var(--foreground)] text-white py-3 rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50">
                    {status === "submitting" ? "Wysyłanie..." : "Wyślij opinię"}
                  </button>
                  {status === "error" && <p className="text-red-500 text-sm mt-2">Wystąpił błąd podczas wysyłania.</p>}
                </div>
              )}
            </form>
          </AnimatedSection>
        )}

        {reviews.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
              <AnimatedSection key={r.id} delay={i * 0.1}>
                <div className="bg-white border border-[var(--border)] p-6 rounded-2xl h-full shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex gap-1 text-yellow-400 mb-3 text-sm">
                    {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                  </div>
                  <p className="text-[var(--foreground)] italic mb-4">"{r.content}"</p>
                  <p className="font-medium text-sm text-[var(--accent-dark)]">— {r.name}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        ) : (
          <p className="text-[var(--muted)]">Nie mamy jeszcze żadnych opinii. Bądź pierwsza!</p>
        )}
      </div>
    </section>
  );
}
