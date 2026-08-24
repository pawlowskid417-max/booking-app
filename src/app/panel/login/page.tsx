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
    <main className="flex-1 flex items-center justify-center px-6 py-16 bg-[var(--background)]">
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
            {loadingState === "IDLE" && "Zaloguj się"}
            {loadingState === "LOGGING_IN" && (
              <>
                <svg className="animate-spin h-5 w-5 text-white/90" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logowanie...
              </>
            )}
            {loadingState === "PREPARING" && (
              <>
                <svg className="animate-spin h-5 w-5 text-white/90" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Przygotowywanie panelu...
              </>
            )}
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
