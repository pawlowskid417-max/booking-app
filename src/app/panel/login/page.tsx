"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
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
      
      const safeFetcher = (url: string) => fetcher(url).catch(err => {
        console.error(`Błąd preloadingu ${url}:`, err);
        return null; 
      });

      const [me, services, categories, employees, summary, settings, gallery, reviews, appointments] = await Promise.all([
        safeFetcher("/api/panel/me"),
        safeFetcher("/api/panel/services"),
        safeFetcher("/api/panel/categories"),
        safeFetcher("/api/panel/employees"),
        safeFetcher("/api/panel/summary"),
        safeFetcher("/api/panel/settings"),
        safeFetcher("/api/panel/gallery"),
        safeFetcher("/api/panel/reviews"),
        safeFetcher(`/api/panel/appointments?from=${todayStr}`)
      ]);

      if (me) mutate("/api/panel/me", me, false);
      if (services) mutate("/api/panel/services", services, false);
      if (categories) mutate("/api/panel/categories", categories, false);
      if (employees) mutate("/api/panel/employees", employees, false);
      if (summary) mutate("/api/panel/summary", summary, false);
      if (settings) mutate("/api/panel/settings", settings, false);
      if (gallery) mutate("/api/panel/gallery", gallery, false);
      if (reviews) mutate("/api/panel/reviews", reviews, false);
      if (appointments) mutate(`/api/panel/appointments?from=${todayStr}`, appointments, false);

      let empId = "";
      if (me?.user?.role !== "OWNER" && me?.user?.employeeId) {
        empId = me.user.employeeId;
      } else if (me?.user?.role === "OWNER" && employees?.employees?.length > 0) {
        empId = employees.employees[0].id;
      }

      if (empId) {
        const [wh, ov] = await Promise.all([
          safeFetcher(`/api/panel/working-hours?employeeId=${empId}`),
          safeFetcher(`/api/panel/day-overrides?employeeId=${empId}`)
        ]);
        if (wh) mutate(`/api/panel/working-hours?employeeId=${empId}`, wh, false);
        if (ov) mutate(`/api/panel/day-overrides?employeeId=${empId}`, ov, false);
      }

      // Weryfikacja, czy sesja realnie zadziałała
      if (!me?.user) {
        throw new Error("Nie udało się ustanowić sesji.");
      }

      setLoadingState("FINISHED");
      
      router.replace("/panel/dashboard");
      
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd logowania");
      setLoadingState("IDLE");
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16 bg-[var(--background)] relative overflow-hidden">
      
      <AnimatePresence>
        {loadingState !== "IDLE" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // Solidne tło zapobiega miganiu formularza logowania podczas przejścia routera
            className="fixed inset-0 z-50 bg-[var(--background)] flex flex-col items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
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
                  {(loadingState === "PRELOADING" || loadingState === "FINISHED") && (
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
                  ) : loadingState === "PRELOADING" ? (
                    <motion.div key="preload" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.25 }}>
                      <h3 className="font-display text-xl text-[var(--accent-dark)]">Przygotowujemy panel</h3>
                      <p className="text-sm text-[var(--muted)] mt-1">Pobieramy bezpiecznie z serwera grafiki, rezerwacje i ustawienia...</p>
                    </motion.div>
                  ) : (
                    <motion.div key="finished" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                      <h3 className="font-display text-xl text-[var(--accent-dark)]">Sukces!</h3>
                      <p className="text-sm text-[var(--muted)] mt-1">Otwieram panel główny...</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loadingState === "IDLE" && (
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
              />
            </label>
            <button
              type="submit"
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white font-medium py-3 rounded-full transition-colors"
            >
              Zaloguj się
            </button>
          </form>
        </div>
      )}

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
