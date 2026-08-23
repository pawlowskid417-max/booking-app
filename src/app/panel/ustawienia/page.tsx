"use client";

import { useEffect, useState } from "react";
import PanelNav from "@/components/PanelNav";

interface SettingsData {
  booking_window_days: number;
  min_lead_time_hours: number;
  slot_step_minutes: number;
  auto_confirm_bookings: number;
  salon_name: string;
  salon_phone: string | null;
  salon_address: string | null;
  contact_email: string | null;
}

export default function UstawieniaPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/panel/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings));
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/panel/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingWindowDays: settings.booking_window_days,
        minLeadTimeHours: settings.min_lead_time_hours,
        slotStepMinutes: settings.slot_step_minutes,
        autoConfirmBookings: !!settings.auto_confirm_bookings,
        salonName: settings.salon_name,
        salonPhone: settings.salon_phone,
        salonAddress: settings.salon_address,
        contactEmail: settings.contact_email,
      }),
    });

    setSaving(false);
    setMessage(res.ok ? "Ustawienia zapisane." : "Nie udało się zapisać ustawień.");
  }

  if (!settings) {
    return (
      <main className="flex-1 bg-[var(--background)]">
        
        <div className="max-w-2xl mx-auto px-6 py-8 text-[var(--muted)]">Ładowanie...</div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[var(--background)]">
      
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-display text-2xl text-[var(--accent-dark)] mb-6">Ustawienia</h1>

        {message && (
          <div className="bg-[var(--accent-light)] text-[var(--accent-dark)] text-sm rounded-xl px-4 py-2.5 mb-4">
            {message}
          </div>
        )}

        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
          <h2 className="font-medium mb-4">Okno rezerwacji online</h2>

          <label className="block mb-4">
            <span className="text-sm font-medium">
              Na ile dni do przodu klienci mogą rezerwować wizyty
            </span>
            <input
              type="number"
              min={1}
              value={settings.booking_window_days}
              onChange={(e) =>
                setSettings({ ...settings, booking_window_days: Number(e.target.value) })
              }
              className="input"
            />
            <span className="text-xs text-[var(--muted)] block mt-1">
              Np. 30 = klienci widzą wolne terminy od dziś do dziś + 30 dni.
            </span>
          </label>

          <label className="block mb-4">
            <span className="text-sm font-medium">Minimalne wyprzedzenie rezerwacji (godziny)</span>
            <input
              type="number"
              min={0}
              value={settings.min_lead_time_hours}
              onChange={(e) =>
                setSettings({ ...settings, min_lead_time_hours: Number(e.target.value) })
              }
              className="input"
            />
            <span className="text-xs text-[var(--muted)] block mt-1">
              Blokuje rezerwację "na już" — np. 2 = nie da się umówić wizyty za mniej niż 2h.
            </span>
          </label>

          <label className="block mb-4">
            <span className="text-sm font-medium">Krok siatki godzin (minuty)</span>
            <select
              value={settings.slot_step_minutes}
              onChange={(e) =>
                setSettings({ ...settings, slot_step_minutes: Number(e.target.value) })
              }
              className="input"
            >
              <option value={15}>15 minut</option>
              <option value={30}>30 minut</option>
              <option value={60}>60 minut</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!settings.auto_confirm_bookings}
              onChange={(e) =>
                setSettings({ ...settings, auto_confirm_bookings: e.target.checked ? 1 : 0 })
              }
            />
            <span className="text-sm">
              Automatycznie potwierdzaj nowe rezerwacje (bez ręcznej akceptacji)
            </span>
          </label>
        </section>

        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
          <h2 className="font-medium mb-4">Dane salonu</h2>
          <label className="block mb-3">
            <span className="text-sm font-medium">Nazwa salonu</span>
            <input
              value={settings.salon_name}
              onChange={(e) => setSettings({ ...settings, salon_name: e.target.value })}
              className="input"
            />
          </label>
          <label className="block mb-3">
            <span className="text-sm font-medium">Adres</span>
            <input
              value={settings.salon_address ?? ""}
              onChange={(e) => setSettings({ ...settings, salon_address: e.target.value })}
              className="input"
            />
          </label>
          <label className="block mb-3">
            <span className="text-sm font-medium">Telefon</span>
            <input
              value={settings.salon_phone ?? ""}
              onChange={(e) => setSettings({ ...settings, salon_phone: e.target.value })}
              className="input"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Email kontaktowy</span>
            <input
              value={settings.contact_email ?? ""}
              onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
              className="input"
            />
          </label>
        </section>

        <button
          onClick={save}
          disabled={saving}
          className="bg-[var(--accent)] hover:bg-[var(--accent-dark)] disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-full"
        >
          {saving ? "Zapisuję..." : "Zapisz ustawienia"}
        </button>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid var(--border);
          background: var(--surface);
          border-radius: 0.6rem;
          padding: 0.5rem 0.85rem;
          font-size: 0.85rem;
          outline: none;
          display: block;
          margin-top: 0.2rem;
        }
        .input:focus {
          border-color: var(--accent);
        }
      `}</style>
    </main>
  );
}
