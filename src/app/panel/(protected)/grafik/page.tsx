"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import PanelNav from "@/components/PanelNav";
import PanelLoading from "@/components/PanelLoading";
import type { Employee } from "@/lib/types";

const WEEKDAYS = [
  { value: 1, label: "Poniedziałek" },
  { value: 2, label: "Wtorek" },
  { value: 3, label: "Środa" },
  { value: 4, label: "Czwartek" },
  { value: 5, label: "Piątek" },
  { value: 6, label: "Sobota" },
  { value: 0, label: "Niedziela" },
];

interface WorkingHourRow {
  weekday: number;
  startTime: string;
  endTime: string;
}

interface DayOverrideRow {
  id: string;
  date: string;
  type: string;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
}

interface CurrentUser {
  role: string;
  employeeId: string | null;
}

export default function GrafikPage() {
  const { data: meData } = useSWR<{ user: CurrentUser }>("/api/panel/me");
  const user = meData?.user ?? null;

  const { data: empData } = useSWR<{ employees: Employee[] }>("/api/panel/employees");
  const employees = empData?.employees ?? [];

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  
  useEffect(() => {
    if (user && employees.length > 0 && !selectedEmployeeId) {
      if (user.role !== "OWNER" && user.employeeId) {
        setSelectedEmployeeId(user.employeeId);
      } else if (user.role === "OWNER") {
        setSelectedEmployeeId(employees[0].id);
      }
    }
  }, [user, employees, selectedEmployeeId]);

  const { data: whData, isLoading: loadingWH, mutate: mutateWH } = useSWR<{ workingHours: WorkingHourRow[] }>(
    selectedEmployeeId ? `/api/panel/working-hours?employeeId=${selectedEmployeeId}` : null
  );

  const { data: doData, isLoading: loadingDO, mutate: mutateDO } = useSWR<{ overrides: DayOverrideRow[] }>(
    selectedEmployeeId ? `/api/panel/day-overrides?employeeId=${selectedEmployeeId}` : null
  );

  const [hours, setHours] = useState<Record<number, { active: boolean; start: string; end: string }>>({});
  
  useEffect(() => {
    if (whData) {
      const map: Record<number, { active: boolean; start: string; end: string }> = {};
      for (const w of [0, 1, 2, 3, 4, 5, 6]) {
        map[w] = { active: false, start: "09:00", end: "17:00" };
      }
      for (const row of whData.workingHours) {
        map[row.weekday] = { active: true, start: row.startTime, end: row.endTime };
      }
      setHours(map);
    }
  }, [whData]);

  const overrides = doData?.overrides ?? [];
  const pageReady = user && employees.length > 0 && !loadingWH && !loadingDO;

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [newOverrideDate, setNewOverrideDate] = useState("");
  const [newOverrideType, setNewOverrideType] = useState("DAY_OFF");
  const [newOverrideStart, setNewOverrideStart] = useState("09:00");
  const [newOverrideEnd, setNewOverrideEnd] = useState("17:00");
  const [newOverrideNote, setNewOverrideNote] = useState("");

  async function saveSchedule() {
    setSaving(true);
    setMessage(null);
    const payload = Object.entries(hours).map(([weekday, v]) => ({
      weekday: Number(weekday),
      startTime: v.start,
      endTime: v.end,
      isActive: v.active,
    }));

    const res = await fetch("/api/panel/working-hours", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: selectedEmployeeId, hours: payload }),
    });

    setSaving(false);
    setMessage(res.ok ? "Grafik zapisany." : "Nie udało się zapisać grafiku.");
  }

  async function addOverride() {
    if (!newOverrideDate) return;
    setMessage(null);
    const res = await fetch("/api/panel/day-overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: selectedEmployeeId,
        date: newOverrideDate,
        type: newOverrideType,
        startTime: newOverrideType === "CUSTOM_HOURS" ? newOverrideStart : undefined,
        endTime: newOverrideType === "CUSTOM_HOURS" ? newOverrideEnd : undefined,
        note: newOverrideNote || undefined,
      }),
    });
    if (res.ok) {
      setNewOverrideDate("");
      setNewOverrideNote("");
      mutateDO();
    } else {
      setMessage("Nie udało się dodać wyjątku.");
    }
  }

  async function removeOverride(id: string) {
    await fetch(`/api/panel/day-overrides/${id}`, { method: "DELETE" });
    mutateDO();
  }

  return (
    <main className="flex-1 bg-[var(--background)]">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="font-display text-2xl text-[var(--accent-dark)] mb-6">Grafik pracy</h1>

        {!pageReady ? (
          <PanelLoading />
        ) : (
          <>

        {user?.role === "OWNER" && (
          <label className="block mb-6">
            <span className="text-sm font-medium">Pracownik</span>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="input mt-1"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName}
                </option>
              ))}
            </select>
          </label>
        )}

        {message && (
          <div className="bg-[var(--accent-light)] text-[var(--accent-dark)] text-sm rounded-xl px-4 py-2.5 mb-4">
            {message}
          </div>
        )}

        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-8">
          <h2 className="font-medium mb-4">Stałe godziny pracy (co tydzień)</h2>
          <div className="space-y-2">
            {WEEKDAYS.map((wd) => {
              const h = hours[wd.value] ?? { active: false, start: "09:00", end: "17:00" };
              return (
                <div key={wd.value} className="flex items-center gap-3 flex-wrap">
                  <label className="flex items-center gap-2 w-40 shrink-0">
                    <input
                      type="checkbox"
                      checked={h.active}
                      disabled={user?.role === "EMPLOYEE"}
                      onChange={(e) =>
                        setHours((prev) => ({
                          ...prev,
                          [wd.value]: { ...h, active: e.target.checked },
                        }))
                      }
                    />
                    <span className="text-sm">{wd.label}</span>
                  </label>
                  {h.active && (
                    <>
                      <input
                        type="time"
                        value={h.start}
                        disabled={user?.role === "EMPLOYEE"}
                        onChange={(e) =>
                          setHours((prev) => ({ ...prev, [wd.value]: { ...h, start: e.target.value } }))
                        }
                        className="input w-32"
                      />
                      <span className="text-sm text-[var(--muted)]">—</span>
                      <input
                        type="time"
                        value={h.end}
                        disabled={user?.role === "EMPLOYEE"}
                        onChange={(e) =>
                          setHours((prev) => ({ ...prev, [wd.value]: { ...h, end: e.target.value } }))
                        }
                        className="input w-32"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {user?.role === "OWNER" && (
            <button
              onClick={saveSchedule}
              disabled={saving || !selectedEmployeeId}
              className="mt-5 bg-[var(--accent)] hover:bg-[var(--accent-dark)] disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-full"
            >
              {saving ? "Zapisuję..." : "Zapisz grafik"}
            </button>
          )}
        </section>

        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
          <h2 className="font-medium mb-1">Wyjątki (urlopy, zmiany godzin)</h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            Nadpisują stały grafik dla konkretnego dnia.
          </p>

          <div className="space-y-2 mb-5">
            {overrides.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between gap-3 bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5"
              >
                <div className="text-sm">
                  <strong>{o.date}</strong> —{" "}
                  {o.type === "DAY_OFF" ? "dzień wolny" : `godz. ${o.startTime}–${o.endTime}`}
                  {o.note && <span className="text-[var(--muted)]"> ({o.note})</span>}
                </div>
                {user?.role === "OWNER" && (
                  <button
                    onClick={() => removeOverride(o.id)}
                    className="text-xs text-[var(--muted)] hover:text-red-600"
                  >
                    Usuń
                  </button>
                )}
              </div>
            ))}
            {overrides.length === 0 && (
              <p className="text-sm text-[var(--muted)]">Brak zaplanowanych wyjątków.</p>
            )}
          </div>

          {user?.role === "OWNER" && (
            <div className="flex flex-wrap items-end gap-3 border-t border-[var(--border)] pt-4">
              <label className="block">
                <span className="text-xs font-medium">Data</span>
                <input
                  type="date"
                  value={newOverrideDate}
                  onChange={(e) => setNewOverrideDate(e.target.value)}
                  className="input"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium">Typ</span>
                <select
                  value={newOverrideType}
                  onChange={(e) => setNewOverrideType(e.target.value)}
                  className="input"
                >
                  <option value="DAY_OFF">Dzień wolny</option>
                  <option value="CUSTOM_HOURS">Zmienione godziny</option>
                </select>
              </label>
              {newOverrideType === "CUSTOM_HOURS" && (
                <>
                  <label className="block">
                    <span className="text-xs font-medium">Od</span>
                    <input
                      type="time"
                      value={newOverrideStart}
                      onChange={(e) => setNewOverrideStart(e.target.value)}
                      className="input w-28"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium">Do</span>
                    <input
                      type="time"
                      value={newOverrideEnd}
                      onChange={(e) => setNewOverrideEnd(e.target.value)}
                      className="input w-28"
                    />
                  </label>
                </>
              )}
              <label className="block flex-1 min-w-[140px]">
                <span className="text-xs font-medium">Notatka (opcjonalnie)</span>
                <input
                  value={newOverrideNote}
                  onChange={(e) => setNewOverrideNote(e.target.value)}
                  className="input"
                  placeholder="np. Urlop"
                />
              </label>
              <button
                onClick={addOverride}
                disabled={!newOverrideDate}
                className="bg-[var(--accent)] hover:bg-[var(--accent-dark)] disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-full"
              >
                Dodaj
              </button>
            </div>
          )}
        </section>
      </>
        )}
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid var(--border);
          background: var(--surface);
          border-radius: 0.6rem;
          padding: 0.45rem 0.75rem;
          font-size: 0.85rem;
          outline: none;
          display: block;
          margin-top: 0.15rem;
        }
        .input:focus {
          border-color: var(--accent);
        }
      `}</style>
    </main>
  );
}
