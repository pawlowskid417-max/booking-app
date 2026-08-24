"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { preload } from "swr";
import { fetcher } from "@/lib/fetcher";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<"IDLE" | "LOGGING_IN" | "PREPARING">("IDLE");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoadingState("LOGGING_IN");
    setError(null);
    try {
      const res = await fetch("/api/panel/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setLoadingState("PREPARING");

      preload("/api/panel/me", fetcher);
      preload("/api/panel/services", fetcher);
      preload("/api/panel/categories", fetcher);
      preload("/api/panel/employees", fetcher);
      preload("/api/panel/summary", fetcher);
      preload("/api/panel/settings", fetcher);
      preload("/api/panel/gallery", fetcher);
      preload("/api/panel/reviews", fetcher);
      const todayStr = new Date().toISOString().slice(0, 10);
      preload(`/api/panel/appointments?from=${todayStr}`, fetcher);

      // Dodanie małego sztucznego opóźnienia na załadowanie danych z SWR i animację
      await new Promise(resolve => setTimeout(resolve, 1200));

      router.push("/panel/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd logowania");
      setLoadingState("IDLE");
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16 bg-[var(--background)] relative">
      
      {loadingState !== "IDLE" && (
        <div className="fixed inset-0 z-50 bg-[var(--background)]/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="bg-[var(--surface)] p-8 md:p-10 rounded-3xl shadow-2xl shadow-[var(--accent)]/10 border border-[var(--border)] flex flex-col items-center gap-6 max-w-sm w-[90%] text-center animate-in zoom-in-95 duration-500">
            <div className="relative w-16 h-16 flex items-center justify-center">
              {/* Tło kółka */}
              <div className="absolute inset-0 border-4 border-[var(--accent-light)] rounded-full"></div>
              {/* Animowany spinner */}
              <div className="absolute inset-0 border-4 border-[var(--accent)] rounded-full border-t-transparent animate-spin"></div>
              
              {/* Serce w środku gdy pobiera dane */}
              <div className={`transition-all duration-500 ${loadingState === "PREPARING" ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
                <div className="w-5 h-5 bg-[var(--accent)] rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <h3 className="font-display text-xl text-[var(--accent-dark)] transition-all duration-300">
                {loadingState === "LOGGING_IN" ? "Trwa logowanie" : "Przygotowujemy panel"}
              </h3>
              <p className="text-sm text-[var(--muted)] transition-all duration-300">
                {loadingState === "LOGGING_IN" 
                  ? "Weryfikacja szyfrowanego połączenia..." 
                  : "Pobieramy grafik, usługi i rezerwacje..."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-sm w-full">
        <h1 className="font-display text-2xl text-[var(--accent-dark)] mb-6 text-center">
          Panel salonu
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4 shadow-sm"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5 animate-in fade-in zoom-in duration-200">
              {error}
            </div>
          )}
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              disabled={loadingState !== "IDLE"}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Hasło</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              disabled={loadingState !== "IDLE"}
            />
          </label>
          <button
            type="submit"
            disabled={loadingState !== "IDLE"}
            className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-dark)] disabled:opacity-90 disabled:cursor-not-allowed text-white font-medium py-3 rounded-full transition-all duration-300"
          >
            Zaloguj się
          </button>
        </form>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid var(--border);
          background: var(--surface);
          border-radius: 0.75rem;
          padding: 0.6rem 1rem;
          font-size: 0.9rem;
          outline: none;
          margin-top: 0.25rem;
        }
        .input:focus {
          border-color: var(--accent);
        }
      `}</style>
    </main>
  );
}
