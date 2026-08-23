import { Employee, Service, Appointment } from "@prisma/client";

export type { Employee, Service, Appointment };

export interface AppointmentWithDetails extends Appointment {
  employeeFirstName: string;
  employeeLastName: string;
  serviceName: string;
  serviceDurationMin: number;
  servicePriceCents: number;
}

export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " zł";
}

export function formatDurationMin(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} godz.` : `${h} godz. ${m} min`;
}

const WEEKDAY_NAMES_PL = [
  "Niedziela",
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
];

export function formatDatePL(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const weekday = WEEKDAY_NAMES_PL[d.getUTCDay()];
  const day = d.getUTCDate();
  const monthNames = [
    "stycznia",
    "lutego",
    "marca",
    "kwietnia",
    "maja",
    "czerwca",
    "lipca",
    "sierpnia",
    "września",
    "października",
    "listopada",
    "grudnia",
  ];
  const month = monthNames[d.getUTCMonth()];
  return `${weekday}, ${day} ${month}`;
}
