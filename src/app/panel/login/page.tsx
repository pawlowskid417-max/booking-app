"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { preload } from "swr";
import { fetcher } from "@/lib/fetcher";
import { motion, AnimatePresence } from "motion/react";
import { Heart } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<"IDLE" | "LOGGING_IN" | "PRELOADING" | "FINISHED">("IDLE");

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
      
      setLoadingState("PRELOADING");

      const todayStr = new Date().toISOString().slice(0, 10);
      
      await Promise.all([
        preload("/api/panel/me", fetcher),
        preload("/api/panel/services", fetcher),
        preload("/api/panel/categories", fetcher),
        preload("/api/panel/employees", fetcher),
        preload("/api/panel/summary", fetcher),
        preload("/api/panel/settings", fetcher),
        preload("/api/panel/gallery", fetcher),
        preload("/api/panel/reviews", fetcher),
        preload(`/api/panel/appointments?from=${todayStr}`, fetcher)
      ]);

      setLoadingState("FINISHED");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd logowania");
      setLoadingState("IDLE");
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16 bg-[var(--background)] relative overflow-hidden">
      
      <AnimatePresence onExitComplete={() => {
        if (loadingState === "FINISHED") {
          router.push("/panel/dashboard");
          router.refresh();
        }
      }}>
        {loadingState !== "IDLE" && loadingState !== "FINISHED" && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-50 bg-[var(--background)]/70 flex flex-col items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
              className="bg-[var(--surface)] p-8 md:p-10 rounded-[1.75rem] shadow-2xl shadow-[var(--accent)]/10 border border-[var(--border)] flex flex-col items-center gap-6 max-w-sm w-[90%] text-center"
            >
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 border-[3px] border-[var(--accent-light)] rounded-full opacity-60"></div>
                
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="absolute inset-0 border-[3px] border-[var(--accent)] rounded-full border-t-transparent"
                ></motion.div>
                
                <AnimatePresence>
                  {loadingState === "PRELOADING" && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      >
                        <Heart className="w-5 h-5 text-[var(--accent)] fill-current" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="space-y-1 min-h-[4rem] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {loadingState === "LOGGING_IN" ? (
                    <motion.div key="login" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.25 }}>
                      <h3 className="font-display text-xl text-[var(--accent-dark)]">Trwa logowanie</h3>
                      <p className="text-sm text-[var(--muted)] mt-1">Weryfikacja poświadczeń...</p>
                    </motion.div>
                  ) : (
                    <motion.div key="preload" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.25 }}>
                      <h3 className="font-display text-xl text-[var(--accent-dark)]">Przygotowujemy panel</h3>
                      <p className="text-sm text-[var(--muted)] mt-1">Pobieramy bezpiecznie z serwera grafiki, rezerwacje i ustawienia...</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-sm w-full z-10">
        <h1 className="font-display text-2xl text-[var(--accent-dark)] mb-6 text-center">
          Panel salonu
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4 shadow-sm"
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5"
            >
              {error}
            </motion.div>
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
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-dark)] disabled:opacity-80 text-white font-medium py-3 rounded-full transition-colors"
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
