"use client";

import { useEffect, useState } from "react";
import PanelNav from "@/components/PanelNav";
import PanelLoading from "@/components/PanelLoading";

interface SettingsData {
  bookingWindowDays: number;
  minLeadTimeHours: number;
  slotStepMinutes: number;
  autoConfirmBookings: boolean;
  salonName: string;
  salonPhone: string | null;
  salonAddress: string | null;
  contactEmail: string | null;
  heroImageUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  address: string | null;
  mapUrl: string | null;
  mapIframeUrl: string | null;
  openingHours: string | null;
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
        bookingWindowDays: settings.bookingWindowDays,
        minLeadTimeHours: settings.minLeadTimeHours,
        slotStepMinutes: settings.slotStepMinutes,
        autoConfirmBookings: !!settings.autoConfirmBookings,
        salonName: settings.salonName,
        salonPhone: settings.salonPhone,
        salonAddress: settings.salonAddress,
        contactEmail: settings.contactEmail,
        heroImageUrl: settings.heroImageUrl,
        instagramUrl: settings.instagramUrl,
        facebookUrl: settings.facebookUrl,
        address: settings.address,
        mapUrl: settings.mapUrl,
        mapIframeUrl: settings.mapIframeUrl,
        openingHours: settings.openingHours,
      }),
    });

    setSaving(false);
    setMessage(res.ok ? "Ustawienia zapisane." : "Nie udało się zapisać ustawień.");
  }

  if (!settings) {
    return (
      <main className="flex-1 bg-[var(--background)]">
        <PanelLoading />
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
              value={settings.bookingWindowDays ?? ""}
              onChange={(e) =>
                setSettings({ ...settings, bookingWindowDays: Number(e.target.value) })
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
              value={settings.minLeadTimeHours ?? ""}
              onChange={(e) =>
                setSettings({ ...settings, minLeadTimeHours: Number(e.target.value) })
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
              value={settings.slotStepMinutes ?? 30}
              onChange={(e) =>
                setSettings({ ...settings, slotStepMinutes: Number(e.target.value) })
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
              checked={!!settings.autoConfirmBookings}
              onChange={(e) =>
                setSettings({ ...settings, autoConfirmBookings: e.target.checked })
              }
              className="w-4 h-4"
            />
            <span className="text-sm">
              Automatycznie potwierdzaj nowe rezerwacje (bez ręcznej akceptacji)
            </span>
          </label>
        </section>

        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
          <h2 className="font-medium mb-4">Dane salonu i Wygląd</h2>
          
          <label className="block mb-3">
            <span className="text-sm font-medium">Nazwa salonu</span>
            <input
              value={settings.salonName || ""}
              onChange={(e) => setSettings({ ...settings, salonName: e.target.value })}
              className="input"
            />
          </label>
          <label className="block mb-3">
            <span className="text-sm font-medium">Adres</span>
            <input
              value={settings.salonAddress ?? ""}
              onChange={(e) => setSettings({ ...settings, salonAddress: e.target.value })}
              className="input"
            />
          </label>
          <label className="block mb-3">
            <span className="text-sm font-medium">Telefon</span>
            <input
              value={settings.salonPhone || ""}
              onChange={(e) => setSettings({ ...settings, salonPhone: e.target.value })}
              className="input"
            />
          </label>
          <label className="block mb-3">
            <span className="text-sm font-medium">Email kontaktowy</span>
            <input
              value={settings.contactEmail || ""}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="input"
            />
          </label>
          <label className="block mb-3">
            <span className="text-sm font-medium">Link do wizytówki z mapą (Google Maps - przycisk Wyznacz Trasę)</span>
            <input
              value={settings.mapUrl || ""}
              onChange={(e) => setSettings({ ...settings, mapUrl: e.target.value })}
              className="input"
              placeholder="np. https://maps.app.goo.gl/..."
            />
          </label>
          <label className="block mb-3">
            <span className="text-sm font-medium">Link osadzenia mapy w stopce (Iframe Src z Google Maps)</span>
            <input
              value={settings.mapIframeUrl || ""}
              onChange={(e) => setSettings({ ...settings, mapIframeUrl: e.target.value })}
              className="input"
              placeholder='<iframe src="https://www.google.com/maps/embed?...'
            />
          </label>
          <label className="block mb-3">
            <span className="text-sm font-medium">Link do Instagrama</span>
            <input
              value={settings.instagramUrl || ""}
              onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
              className="input"
            />
          </label>
          <label className="block mb-3">
            <span className="text-sm font-medium">Link do Facebooka</span>
            <input
              value={settings.facebookUrl ?? ""}
              onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
              className="input"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Godziny otwarcia (tekst)</span>
            <textarea
              value={settings.openingHours ?? ""}
              onChange={(e) => setSettings({ ...settings, openingHours: e.target.value })}
              className="input min-h-[100px]"
              placeholder="Pon-Pt: 9:00 - 18:00&#10;Sob: 9:00 - 14:00"
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
