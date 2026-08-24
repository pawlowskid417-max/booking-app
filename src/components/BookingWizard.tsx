"use client";

import { useEffect, useMemo, useState } from "react";
import type { Employee, Service } from "@/lib/types";
import { formatPrice, formatDurationMin, formatDatePL } from "@/lib/types";
import Stepper, { Step } from "./Stepper";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface DayInfo {
  date: string;
  hasSlots: boolean;
}

export default function BookingWizard() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wybory użytkownika
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [gotcha, setGotcha] = useState("");

  const [confirmation, setConfirmation] = useState<{
    date: string;
    time: string;
    serviceName: string;
    servicePrice: string;
    employeeName: string;
  } | null>(null);

  // Zmienna przechowująca aktualny krok w komponencie Stepper
  const [currentStepperStep, setCurrentStepperStep] = useState(1);

  // ---- Pobieranie danych przez SWR ----
  const { data: servicesData, isLoading: servicesLoading } = useSWR("/api/services", fetcher);
  const services: Service[] = servicesData?.services ?? [];

  const groupedServices = useMemo(() => {
    const groups: Record<string, typeof services> = {};
    for (const s of services) {
      // @ts-ignore
      const catName = s.category || "Inne";
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(s);
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [services]);

  const serviceIdsStr = selectedServices.map(s => s.id).join(",");

  // TODO: we should fetch employees that can perform ALL selected services. For now, fetch employees for the first service if multiple?
  // Or fetch all, and frontend filters? Actually /api/employees?serviceId=... only takes one. We might need to adjust /api/employees.
  // We will pass multiple as comma separated string `serviceIds` and fix the backend later or assume it works for the first one for now.
  // Wait, let's just pass `serviceIds`!
  const { data: employeesData, isLoading: employeesLoading } = useSWR(
    selectedServices.length > 0 ? `/api/employees?serviceIds=${serviceIdsStr}` : null,
    fetcher
  );
  const employees: Employee[] = employeesData?.employees ?? [];

  const { data: daysData, isLoading: daysLoading } = useSWR(
    selectedServices.length > 0 && selectedEmployee
      ? `/api/availability?employeeId=${selectedEmployee.id}&serviceIds=${serviceIdsStr}`
      : null,
    fetcher
  );
  const days: DayInfo[] = daysData?.days ?? [];

  const { data: slotsData, isLoading: slotsLoading, mutate: revalidateSlots } = useSWR(
    selectedServices.length > 0 && selectedEmployee && selectedDate
      ? `/api/availability?employeeId=${selectedEmployee.id}&serviceIds=${serviceIdsStr}&date=${selectedDate}`
      : null,
    fetcher
  );
  const slots: string[] = slotsData?.slots ?? [];

  // Reset time when date changes
  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDate]);

  const groupedDays = useMemo(() => {
    const map = new Map<string, DayInfo[]>();
    for (const d of days) {
      const monthKey = d.date.slice(0, 7);
      if (!map.has(monthKey)) map.set(monthKey, []);
      map.get(monthKey)!.push(d);
    }
    return Array.from(map.entries());
  }, [days]);

  async function submitBooking() {
    if (selectedServices.length === 0 || !selectedEmployee || !selectedDate || !selectedTime) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          serviceIds: selectedServices.map(s => s.id),
          date: selectedDate,
          time: selectedTime,
          clientFirstName: firstName,
          clientLastName: lastName,
          clientEmail: email,
          clientPhone: phone || undefined,
          note: note || undefined,
          _gotcha: gotcha,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Coś poszło nie tak. Spróbuj ponownie.");
        if (res.status === 409) {
          setSelectedTime(null);
          revalidateSlots();
        }
        setIsSubmitting(false);
        return;
      }

      setConfirmation(data.appointment);
    } catch {
      setError("Błąd połączenia. Sprawdź internet i spróbuj ponownie.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
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
    );
  }

  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 animate-in fade-in duration-300">
        <div className="w-12 h-12 border-4 border-[var(--accent-light)] border-t-[var(--accent)] rounded-full animate-spin mb-6"></div>
        <h2 className="font-display text-2xl text-[var(--accent-dark)] mb-2">
          Wysyłanie rezerwacji...
        </h2>
        <p className="text-[var(--muted)] text-sm">Proszę czekać, to potrwa tylko chwilę.</p>
      </div>
    );
  }

  // Funkcja określająca, czy przycisk "Dalej" ma być zablokowany dla danego kroku
  const isNextDisabled = () => {
    if (currentStepperStep === 1 && selectedServices.length === 0) return true;
    if (currentStepperStep === 2 && !selectedEmployee) return true;
    if (currentStepperStep === 3 && (!selectedDate || !selectedTime)) return true;
    if (currentStepperStep === 4 && (!firstName || !lastName || !email)) return true;
    if (isSubmitting || servicesLoading || employeesLoading || daysLoading || slotsLoading) return true;
    return false;
  };

  return (
    <div className="booking-stepper-wrapper">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <Stepper
        initialStep={1}
        backButtonText="Wstecz"
        nextButtonText={currentStepperStep === 4 ? (isSubmitting ? "Wysyłanie..." : "Zarezerwuj") : "Dalej"}
        onStepChange={(step) => setCurrentStepperStep(step)}
        onFinalStepCompleted={() => submitBooking()}
        nextButtonProps={{
          disabled: isNextDisabled(),
          className: `duration-350 flex items-center justify-center rounded-full py-2 px-5 font-medium tracking-tight text-white transition ${
            isNextDisabled()
              ? "bg-zinc-300 pointer-events-none"
              : "bg-[var(--accent)] hover:bg-[var(--accent-dark)]"
          }`,
        }}
        backButtonProps={{
          className: `duration-350 rounded px-4 py-2 transition ${
            currentStepperStep === 1
              ? "pointer-events-none opacity-50 text-neutral-400"
              : "text-[var(--accent-dark)] hover:underline"
          }`,
        }}
        stepCircleContainerClassName="!border-transparent shadow-none"
      >
        <Step>
          <div className="flex flex-col h-full">
            <h2 className="font-display text-xl mb-4 text-center shrink-0">Wybierz usługi</h2>
            <div className="space-y-6 flex-1 overflow-y-auto px-1 py-1">
              {groupedServices.map(([catName, catServices]) => (
                <div key={catName}>
                  <h3 className="text-sm font-semibold text-[var(--accent-dark)] uppercase tracking-wider mb-3 pl-1">
                    {catName}
                  </h3>
                  <div className="space-y-3">
                    {catServices.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          if (selectedServices.some(sel => sel.id === s.id)) {
                            setSelectedServices(selectedServices.filter(sel => sel.id !== s.id));
                          } else {
                            setSelectedServices([...selectedServices, s]);
                          }
                          setSelectedEmployee(null); // Reset employee when services change
                        }}
                        className={`w-full text-left border rounded-2xl p-4 transition-colors relative ${
                          selectedServices.some(sel => sel.id === s.id)
                            ? "border-[var(--accent)] bg-[var(--accent-light)]"
                            : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]"
                        }`}
                      >
                        {selectedServices.some(sel => sel.id === s.id) && (
                          <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-3">
                          <div className="pr-8">
                            <h4 className="font-medium">{s.name}</h4>
                            {s.description && (
                              <p className="text-sm text-[var(--muted)] mt-0.5">{s.description}</p>
                            )}
                            <span className="text-xs text-[var(--muted)]">
                              {formatDurationMin(s.durationMin)}
                            </span>
                          </div>
                          <span className="text-[var(--accent-dark)] font-semibold whitespace-nowrap pt-1 self-start">
                            {formatPrice(s.priceCents)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {services.length === 0 && (
                <p className="text-center text-[var(--muted)] py-10">Ładowanie usług...</p>
              )}
            </div>
          </div>
        </Step>

        <Step>
          <div className="flex flex-col h-full">
            <h2 className="font-display text-xl mb-4 text-center shrink-0">Wybierz osobę</h2>
            {employeesLoading && <p className="text-center text-[var(--muted)] py-6 shrink-0">Ładowanie...</p>}
            <div className="space-y-3 flex-1 overflow-y-auto px-1 py-1">

              {!employeesLoading &&
                employees.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setSelectedEmployee(e)}
                    className={`w-full text-left border rounded-2xl p-4 transition-colors flex items-center gap-4 ${
                      selectedEmployee?.id === e.id
                        ? "border-[var(--accent)] bg-[var(--accent-light)]"
                        : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full bg-[var(--background)] flex items-center justify-center text-[var(--accent-dark)] font-display shrink-0">
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
              {!employeesLoading && employees.length === 0 && (
                <p className="text-center text-[var(--muted)] py-6">
                  Brak dostępnych osób dla tej usługi.
                </p>
              )}
            </div>
          </div>
        </Step>

        <Step>
          <div className="flex flex-col h-full">
            <h2 className="font-display text-xl mb-4 text-center shrink-0">Wybierz termin</h2>
            <div className="flex-1 overflow-y-auto px-1 py-1">
              {!selectedDate && (
                <div>
                  <h3 className="font-medium mb-3">Wybierz dzień</h3>
                  {daysLoading && <p className="text-center text-[var(--muted)] py-6">Ładowanie...</p>}
                  {!daysLoading &&
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
                    onClick={() => {
                      setSelectedDate(null);
                      setSelectedTime(null);
                    }}
                    className="text-sm text-[var(--accent-dark)] mb-4 hover:underline"
                  >
                    ← Zmień dzień
                  </button>
                  <h3 className="font-medium mb-3">{formatDatePL(selectedDate)}</h3>
                  {slotsLoading && <p className="text-center text-[var(--muted)] py-6">Ładowanie...</p>}
                  {!slotsLoading && slots.length === 0 && (
                    <p className="text-[var(--muted)] py-4">Brak wolnych godzin tego dnia.</p>
                  )}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className={`border rounded-xl py-2.5 text-sm font-medium transition-colors ${
                          selectedTime === t
                            ? "border-[var(--accent)] bg-[var(--accent-light)]"
                            : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Step>

        <Step>
          <div className="flex flex-col h-full">
            <h2 className="font-display text-xl mb-4 text-center shrink-0">Twoje dane</h2>
            <div className="bg-[var(--accent-light)] rounded-2xl p-4 mb-6 text-sm shrink-0">
              <p>
                <strong>{selectedServices.map(s=>s.name).join(' + ')}</strong> ({selectedServices.length > 0 ? formatDurationMin(selectedServices.reduce((sum, s) => sum + s.durationMin, 0)) : ""})
              </p>
              <p>
                {selectedEmployee?.firstName} {selectedEmployee?.lastName}
              </p>
              <p>
                {selectedDate ? formatDatePL(selectedDate) : ""}, godz. {selectedTime}
              </p>
              <p className="font-semibold text-[var(--accent-dark)] mt-1">
                {selectedServices.length > 0 ? formatPrice(selectedServices.reduce((sum, s) => sum + s.priceCents, 0)) : ""}
              </p>
            </div>

            <form className="space-y-4 flex-1 overflow-y-auto px-1 py-1">
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

              {/* HONEYPOT */}
              <div style={{ display: "none" }} aria-hidden="true">
                <label htmlFor="website">Strona internetowa</label>
                <input
                  id="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={gotcha}
                  onChange={(e) => setGotcha(e.target.value)}
                />
              </div>
            </form>
          </div>
        </Step>
      </Stepper>

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
