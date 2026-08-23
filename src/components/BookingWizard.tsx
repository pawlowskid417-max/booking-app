"use client";

import { useEffect, useMemo, useState } from "react";
import type { Employee, Service } from "@/lib/types";
import { formatPrice, formatDurationMin, formatDatePL } from "@/lib/types";

type Step = "service" | "employee" | "datetime" | "details" | "confirmed";

interface DayInfo {
  date: string;
  hasSlots: boolean;
}

export default function BookingWizard() {
  const [step, setStep] = useState<Step>("service");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dane źródłowe
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Wybory użytkownika
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [days, setDays] = useState<DayInfo[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const [confirmation, setConfirmation] = useState<{
    date: string;
    time: string;
    serviceName: string;
    servicePrice: string;
    employeeName: string;
  } | null>(null);

  // ---- Krok 1: pobierz usługi ----
  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setServices(d.services ?? []));
  }, []);

  // ---- Krok 2: po wyborze usługi, pobierz pracowników którzy ją wykonują ----
  useEffect(() => {
    if (!selectedService) return;
    setLoading(true);
    fetch(`/api/employees?serviceId=${selectedService.id}`)
      .then((r) => r.json())
      .then((d) => setEmployees(d.employees ?? []))
      .finally(() => setLoading(false));
  }, [selectedService]);

  // ---- Krok 3: po wyborze pracownika, pobierz przegląd dostępnych dni ----
  useEffect(() => {
    if (!selectedService || !selectedEmployee) return;
    setLoading(true);
    fetch(`/api/availability?employeeId=${selectedEmployee.id}&serviceId=${selectedService.id}`)
      .then((r) => r.json())
      .then((d) => setDays(d.days ?? []))
      .finally(() => setLoading(false));
  }, [selectedService, selectedEmployee]);

  // ---- Po wyborze konkretnego dnia, pobierz godziny ----
  useEffect(() => {
    if (!selectedService || !selectedEmployee || !selectedDate) return;
    setLoading(true);
    setSelectedTime(null);
    fetch(
      `/api/availability?employeeId=${selectedEmployee.id}&serviceId=${selectedService.id}&date=${selectedDate}`
    )
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .finally(() => setLoading(false));
  }, [selectedService, selectedEmployee, selectedDate]);

  const groupedDays = useMemo(() => {
    // Grupujemy dni po miesiącu, żeby ładnie wyświetlić kalendarz
    const map = new Map<string, DayInfo[]>();
    for (const d of days) {
      const monthKey = d.date.slice(0, 7);
      if (!map.has(monthKey)) map.set(monthKey, []);
      map.get(monthKey)!.push(d);
    }
    return Array.from(map.entries());
  }, [days]);

  async function submitBooking() {
    if (!selectedService || !selectedEmployee || !selectedDate || !selectedTime) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          serviceId: selectedService.id,
          date: selectedDate,
          time: selectedTime,
          clientFirstName: firstName,
          clientLastName: lastName,
          clientEmail: email,
          clientPhone: phone || undefined,
          note: note || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Coś poszło nie tak. Spróbuj ponownie.");
        // Jeśli slot zajęty, cofnij do wyboru godziny i odśwież dostępność
        if (res.status === 409) {
          setSelectedTime(null);
          fetch(
            `/api/availability?employeeId=${selectedEmployee.id}&serviceId=${selectedService.id}&date=${selectedDate}`
          )
            .then((r) => r.json())
            .then((d) => setSlots(d.slots ?? []));
        }
        setLoading(false);
        return;
      }

      setConfirmation(data.appointment);
      setStep("confirmed");
    } catch {
      setError("Błąd połączenia. Sprawdź internet i spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  const progressSteps: { key: Step; label: string }[] = [
    { key: "service", label: "Usługa" },
    { key: "employee", label: "Osoba" },
    { key: "datetime", label: "Termin" },
    { key: "details", label: "Dane" },
  ];
  const currentIndex = progressSteps.findIndex((s) => s.key === step);

  return (
    <div>
      {step !== "confirmed" && (
        <div className="flex items-center justify-center gap-2 mb-10">
          {progressSteps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  i <= currentIndex
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--accent-light)] text-[var(--muted)]"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  i <= currentIndex ? "text-[var(--foreground)]" : "text-[var(--muted)]"
                }`}
              >
                {s.label}
              </span>
              {i < progressSteps.length - 1 && (
                <div className="w-6 h-px bg-[var(--border)] mx-1" />
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* KROK 1: USŁUGA */}
      {step === "service" && (
        <div className="space-y-3">
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedService(s);
                setSelectedEmployee(null);
                setStep("employee");
              }}
              className="w-full text-left bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] rounded-2xl p-5 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium">{s.name}</h3>
                  {s.description && (
                    <p className="text-sm text-[var(--muted)] mt-0.5">{s.description}</p>
                  )}
                  <span className="text-xs text-[var(--muted)]">
                    {formatDurationMin(s.durationMin)}
                  </span>
                </div>
                <span className="text-[var(--accent-dark)] font-semibold whitespace-nowrap">
                  {formatPrice(s.priceCents)}
                </span>
              </div>
            </button>
          ))}
          {services.length === 0 && (
            <p className="text-center text-[var(--muted)] py-10">Ładowanie usług...</p>
          )}
        </div>
      )}

      {/* KROK 2: PRACOWNIK */}
      {step === "employee" && selectedService && (
        <div>
          <BackButton onClick={() => setStep("service")} label="Zmień usługę" />
          <p className="text-sm text-[var(--muted)] mb-4">
            Wybrano: <strong>{selectedService.name}</strong>
          </p>

          {loading && <p className="text-center text-[var(--muted)] py-6">Ładowanie...</p>}

          <div className="space-y-3">
            {!loading && employees.length > 1 && (
              <button
                onClick={() => {
                  // "Dowolna osoba" = wybierz pierwszą dostępną (uproszczenie demo)
                  setSelectedEmployee(employees[0]);
                  setStep("datetime");
                }}
                className="w-full text-left bg-[var(--accent-light)] border border-[var(--border)] hover:border-[var(--accent)] rounded-2xl p-5 transition-colors"
              >
                <h3 className="font-medium">Dowolna dostępna osoba</h3>
                <p className="text-sm text-[var(--muted)]">
                  Pokażemy najbliższy wolny termin spośród całego zespołu
                </p>
              </button>
            )}
            {!loading &&
              employees.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setSelectedEmployee(e);
                    setStep("datetime");
                  }}
                  className="w-full text-left bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] rounded-2xl p-5 transition-colors flex items-center gap-4"
                >
                  <div className="w-11 h-11 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent-dark)] font-display shrink-0">
                    {e.firstName[0]}
                    {e.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {e.firstName} {e.lastName}
                    </h3>
                    {e.bio && <p className="text-sm text-[var(--muted)]">{e.bio}</p>}
                  </div>
                </button>
              ))}
            {!loading && employees.length === 0 && (
              <p className="text-center text-[var(--muted)] py-6">
                Brak dostępnych osób dla tej usługi.
              </p>
            )}
          </div>
        </div>
      )}

      {/* KROK 3: TERMIN */}
      {step === "datetime" && selectedService && selectedEmployee && (
        <div>
          <BackButton onClick={() => setStep("employee")} label="Zmień osobę" />
          <p className="text-sm text-[var(--muted)] mb-4">
            <strong>{selectedService.name}</strong> — {selectedEmployee.firstName}{" "}
            {selectedEmployee.lastName}
          </p>

          {!selectedDate && (
            <div>
              <h3 className="font-medium mb-3">Wybierz dzień</h3>
              {loading && <p className="text-center text-[var(--muted)] py-6">Ładowanie...</p>}
              {!loading &&
                groupedDays.map(([month, monthDays]) => (
                  <div key={month} className="mb-5">
                    <p className="text-xs uppercase tracking-wide text-[var(--muted)] mb-2">
                      {monthLabel(month)}
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {monthDays.map((d) => {
                        const dayNum = d.date.slice(8, 10);
                        return (
                          <button
                            key={d.date}
                            disabled={!d.hasSlots}
                            onClick={() => setSelectedDate(d.date)}
                            className={`aspect-square rounded-xl text-sm font-medium flex items-center justify-center transition-colors ${
                              d.hasSlots
                                ? "bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] cursor-pointer"
                                : "bg-transparent text-[var(--border)] cursor-not-allowed"
                            }`}
                          >
                            {parseInt(dayNum, 10)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {selectedDate && (
            <div>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-sm text-[var(--accent-dark)] mb-4 hover:underline"
              >
                ← Zmień dzień
              </button>
              <h3 className="font-medium mb-3">{formatDatePL(selectedDate)}</h3>
              {loading && <p className="text-center text-[var(--muted)] py-6">Ładowanie...</p>}
              {!loading && slots.length === 0 && (
                <p className="text-[var(--muted)] py-4">Brak wolnych godzin tego dnia.</p>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setSelectedTime(t);
                      setStep("details");
                    }}
                    className="bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] rounded-xl py-2.5 text-sm font-medium transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* KROK 4: DANE KLIENTA */}
      {step === "details" && selectedService && selectedEmployee && selectedDate && selectedTime && (
        <div>
          <BackButton onClick={() => setStep("datetime")} label="Zmień termin" />

          <div className="bg-[var(--accent-light)] rounded-2xl p-4 mb-6 text-sm">
            <p>
              <strong>{selectedService.name}</strong> ({formatDurationMin(selectedService.durationMin)})
            </p>
            <p>
              {selectedEmployee.firstName} {selectedEmployee.lastName}
            </p>
            <p>
              {formatDatePL(selectedDate)}, godz. {selectedTime}
            </p>
            <p className="font-semibold text-[var(--accent-dark)] mt-1">
              {formatPrice(selectedService.priceCents)}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitBooking();
            }}
            className="space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Imię" required>
                <input
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Nazwisko" required>
                <input
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input"
                />
              </Field>
            </div>
            <Field label="Adres email" required hint="Wyślemy tu potwierdzenie i przypomnienie o wizycie">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Telefon" hint="Opcjonalnie — do kontaktu w razie potrzeby">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Uwagi" hint="Opcjonalnie">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input min-h-[80px]"
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-dark)] disabled:opacity-60 text-white font-medium py-3.5 rounded-full transition-colors"
            >
              {loading ? "Rezerwuję..." : "Potwierdź rezerwację"}
            </button>
          </form>
        </div>
      )}

      {/* POTWIERDZENIE */}
      {step === "confirmed" && confirmation && (
        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-full bg-[var(--accent-light)] text-[var(--accent-dark)] flex items-center justify-center text-3xl mx-auto mb-6">
            ✓
          </div>
          <h2 className="font-display text-2xl text-[var(--accent-dark)] mb-2">
            Wizyta zarezerwowana!
          </h2>
          <p className="text-[var(--muted)] mb-6">
            Potwierdzenie wysłaliśmy na Twój adres email.
          </p>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 inline-block text-left text-sm space-y-1">
            <p>
              <strong>{confirmation.serviceName}</strong>
            </p>
            <p>{confirmation.employeeName}</p>
            <p>
              {formatDatePL(confirmation.date)}, godz. {confirmation.time}
            </p>
            <p className="font-semibold text-[var(--accent-dark)]">{confirmation.servicePrice}</p>
          </div>
          <div className="mt-8">
            <a href="/" className="text-[var(--accent-dark)] hover:underline text-sm">
              ← Wróć do strony głównej
            </a>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid var(--border);
          background: var(--surface);
          border-radius: 0.75rem;
          padding: 0.65rem 1rem;
          font-size: 0.9rem;
          outline: none;
        }
        .input:focus {
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="text-sm text-[var(--accent-dark)] mb-4 hover:underline block"
    >
      ← {label}
    </button>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {label} {required && <span className="text-[var(--accent-dark)]">*</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-[var(--muted)] block mt-1">{hint}</span>}
    </label>
  );
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const names = [
    "Styczeń",
    "Luty",
    "Marzec",
    "Kwiecień",
    "Maj",
    "Czerwiec",
    "Lipiec",
    "Sierpień",
    "Wrzesień",
    "Październik",
    "Listopad",
    "Grudzień",
  ];
  return `${names[month - 1]} ${year}`;
}
