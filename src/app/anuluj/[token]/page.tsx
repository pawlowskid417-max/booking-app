"use client";

import { use, useEffect, useState } from "react";
import { formatDatePL } from "@/lib/types";

interface AppointmentInfo {
  id: string;
  status: string;
  start_at: string;
  client_first_name: string;
  service_name: string;
}

export default function CancelPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appt, setAppt] = useState<AppointmentInfo | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/appointments/cancel/${token}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setAppt(data.appointment);
      })
      .catch((e) => setError(e.message || "Nie znaleziono rezerwacji"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleCancel() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/cancel/${token}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCancelled(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się anulować rezerwacji");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center">
        {loading && <p className="text-[var(--muted)]">Ładowanie...</p>}

        {!loading && error && !cancelled && (
          <>
            <h1 className="font-display text-xl text-[var(--accent-dark)] mb-2">
              Nie udało się znaleźć rezerwacji
            </h1>
            <p className="text-sm text-[var(--muted)]">{error}</p>
          </>
        )}

        {!loading && appt && !cancelled && appt.status !== "CANCELLED" && (
          <>
            <h1 className="font-display text-xl text-[var(--accent-dark)] mb-4">
              Anulować wizytę?
            </h1>
            <div className="text-sm bg-[var(--accent-light)] rounded-xl p-4 mb-6 text-left">
              <p>
                <strong>{appt.service_name}</strong>
              </p>
              <p>
                {formatDatePL(appt.start_at.slice(0, 10))}, godz. {appt.start_at.slice(11, 16)}
              </p>
            </div>
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            <button
              onClick={handleCancel}
              disabled={submitting}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-dark)] disabled:opacity-60 text-white font-medium py-3 rounded-full transition-colors"
            >
              {submitting ? "Anuluję..." : "Tak, anuluj wizytę"}
            </button>
            <a href="/" className="block text-sm text-[var(--muted)] mt-4 hover:underline">
              Nie, zostaw wizytę
            </a>
          </>
        )}

        {!loading && appt && appt.status === "CANCELLED" && !cancelled && (
          <>
            <h1 className="font-display text-xl text-[var(--accent-dark)] mb-2">
              Ta wizyta jest już anulowana
            </h1>
            <a href="/rezerwacja" className="text-sm text-[var(--accent-dark)] hover:underline">
              Zarezerwuj nowy termin →
            </a>
          </>
        )}

        {cancelled && (
          <>
            <div className="w-14 h-14 rounded-full bg-[var(--accent-light)] text-[var(--accent-dark)] flex items-center justify-center text-2xl mx-auto mb-4">
              ✓
            </div>
            <h1 className="font-display text-xl text-[var(--accent-dark)] mb-2">
              Wizyta anulowana
            </h1>
            <p className="text-sm text-[var(--muted)] mb-4">
              Wysłaliśmy potwierdzenie anulowania na Twój email.
            </p>
            <a href="/rezerwacja" className="text-sm text-[var(--accent-dark)] hover:underline">
              Zarezerwuj nowy termin →
            </a>
          </>
        )}
      </div>
    </main>
  );
}
