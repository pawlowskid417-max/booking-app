"use client";

import { useEffect, useState, useCallback } from "react";
import PanelNav from "@/components/PanelNav";
import PanelLoading from "@/components/PanelLoading";
import type { AppointmentWithDetails } from "@/lib/types";
import { formatPrice, formatDatePL } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Oczekująca",
  CONFIRMED: "Potwierdzona",
  CANCELLED: "Anulowana",
  COMPLETED: "Zrealizowana",
  NO_SHOW: "Nie stawił się",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-slate-200 text-slate-700",
  NO_SHOW: "bg-orange-100 text-orange-800",
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFrom, setFilterFrom] = useState(todayStr());
  const [showPast, setShowPast] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (!showPast) params.set("from", filterFrom);
    fetch(`/api/panel/appointments?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setAppointments(d.appointments ?? []))
      .finally(() => setLoading(false));
  }, [filterFrom, showPast]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: string) {
    setActionError(null);
    const res = await fetch(`/api/panel/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json();
      setActionError(data.error || "Nie udało się zaktualizować rezerwacji");
      return;
    }
    load();
  }

  const grouped = groupByDate(appointments);

  return (
    <main className="flex-1">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <h1 className="font-display text-2xl text-[var(--accent-dark)]">Rezerwacje</h1>
          <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <input
              type="checkbox"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
            />
            Pokaż też przeszłe wizyty
          </label>
        </div>

        {actionError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5 mb-4">
            {actionError}
          </div>
        )}

        {loading && <PanelLoading />}

        {!loading && appointments.length === 0 && (
          <div className="text-center py-16 text-[var(--muted)]">
            Brak rezerwacji {showPast ? "" : "w nadchodzącym okresie"}.
          </div>
        )}

        <div className="space-y-8">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <h2 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wide mb-3">
                {formatDatePL(date)}
              </h2>
              <div className="space-y-3">
                {items.map((a) => (
                  <div
                    key={a.id}
                    className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-wrap items-center gap-4 justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center w-16 shrink-0">
                        <div className="font-semibold text-lg">{new Date(a.startAt).toISOString().slice(11, 16)}</div>
                      </div>
                      <div>
                        <p className="font-medium">
                          {a.clientFirstName} {a.clientLastName}
                        </p>
                        <p className="text-sm text-[var(--muted)]">
                          {a.serviceName} · {a.employeeFirstName} {a.employeeLastName} ·{" "}
                          {formatPrice(a.servicePriceCents)}
                        </p>
                        <p className="text-xs text-[var(--muted)] mt-0.5">
                          {a.clientEmail}
                          {a.clientPhone && (
                            <>
                              {" · "}
                              <a href={`tel:${a.clientPhone}`} className="underline">
                                {a.clientPhone}
                              </a>
                            </>
                          )}
                        </p>
                        {a.note && (
                          <p className="text-xs text-[var(--muted)] italic mt-0.5">„{a.note}"</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[a.status]}`}
                      >
                        {STATUS_LABELS[a.status]}
                      </span>

                      {a.status === "PENDING" && (
                        <button
                          onClick={() => updateStatus(a.id, "CONFIRMED")}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-full"
                        >
                          Akceptuj
                        </button>
                      )}
                      {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                        <button
                          onClick={() => updateStatus(a.id, "CANCELLED")}
                          className="text-xs bg-white border border-[var(--border)] hover:border-red-300 hover:text-red-600 px-3 py-1.5 rounded-full"
                        >
                          Anuluj
                        </button>
                      )}
                      {a.status === "CONFIRMED" && (
                        <>
                          <button
                            onClick={() => updateStatus(a.id, "COMPLETED")}
                            className="text-xs bg-white border border-[var(--border)] hover:border-[var(--accent)] px-3 py-1.5 rounded-full"
                          >
                            Zrealizowana
                          </button>
                          <button
                            onClick={() => updateStatus(a.id, "NO_SHOW")}
                            className="text-xs bg-white border border-[var(--border)] hover:border-orange-300 hover:text-orange-600 px-3 py-1.5 rounded-full"
                          >
                            Nie stawił się
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function groupByDate(
  appointments: AppointmentWithDetails[]
): [string, AppointmentWithDetails[]][] {
  const map = new Map<string, AppointmentWithDetails[]>();
  for (const a of appointments) {
    const date = new Date(a.startAt).toISOString().slice(0, 10);
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(a);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}
