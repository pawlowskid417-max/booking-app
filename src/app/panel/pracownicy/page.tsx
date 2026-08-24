"use client";

import { useEffect, useState, useCallback } from "react";
import PanelNav from "@/components/PanelNav";
import PanelLoading from "@/components/PanelLoading";
import ImageUpload from "@/components/ImageUpload";
import type { Service } from "@/lib/types";

interface EmployeeRow {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  bio: string | null;
  isActive: boolean;
  serviceIds: string[];
}

export default function PracownicyPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/panel/employees").then((r) => r.json()),
      fetch("/api/panel/services").then((r) => r.json()),
    ])
      .then(([e, s]) => {
        setEmployees(e.employees ?? []);
        setServices(s.services ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggleServiceSelection(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function addEmployee() {
    if (!firstName.trim() || !lastName.trim()) return;
    setAdding(true);
    setMessage(null);

    const res = await fetch("/api/panel/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, bio, photoUrl, serviceIds: selectedServiceIds, email, password }),
    });

    if (res.ok) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setBio("");
      setPhotoUrl("");
      setSelectedServiceIds([]);
      load();
    } else {
      const data = await res.json();
      setMessage(data.error || "Nie udało się dodać pracownika.");
    }
    setAdding(false);
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/panel/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  }

  async function updateEmployeeServices(id: string, serviceIds: string[]) {
    await fetch(`/api/panel/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceIds }),
    });
    load();
  }

  async function deleteEmployee(id: string) {
    if (deletingId === id) {
      if (window.confirm("Czy na pewno chcesz usunąć tego pracownika? Tej operacji nie można cofnąć.")) {
        setDeletingId(id + "_loading");
        await fetch(`/api/panel/employees/${id}`, { method: "DELETE" });
        setDeletingId(null);
        load();
      } else {
        setDeletingId(null);
      }
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  }

  return (
    <main className="flex-1 bg-[var(--background)]">
      
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="font-display text-2xl text-[var(--accent-dark)] mb-6">Pracownicy</h1>

        {message && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5 mb-4">
            {message}
          </div>
        )}

        {loading && <PanelLoading />}

        <div className="space-y-4 mb-8">
          {employees.map((e) => (
            <div
              key={e.id}
              className={`bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 ${
                !e.isActive ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-4">
                  {e.photoUrl && (
                    <img src={e.photoUrl} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
                  )}
                  <div>
                    <p className="font-medium">
                      {e.firstName} {e.lastName}
                    </p>
                    {e.bio && <p className="text-sm text-[var(--muted)]">{e.bio}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(e.id, !!e.isActive)}
                    className="text-xs border border-[var(--border)] hover:border-[var(--accent)] px-3 py-1.5 rounded-full whitespace-nowrap"
                  >
                    {e.isActive ? "Dezaktywuj" : "Aktywuj"}
                  </button>
                  <button
                    onClick={() => deleteEmployee(e.id)}
                    disabled={deletingId === e.id + "_loading"}
                    className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                      deletingId === e.id
                        ? "bg-red-500 text-white border-red-500"
                        : "border border-red-200 text-red-500 hover:bg-red-50"
                    }`}
                  >
                    {deletingId === e.id + "_loading" 
                      ? "Usuwam..." 
                      : deletingId === e.id 
                        ? "Kliknij ponownie" 
                        : "Usuń"}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)] mb-2">Wykonywane usługi:</p>
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => {
                    const active = e.serviceIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          const next = active
                            ? e.serviceIds.filter((id) => id !== s.id)
                            : [...e.serviceIds, s.id];
                          updateEmployeeServices(e.id, next);
                        }}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          active
                            ? "bg-[var(--accent-light)] border-[var(--accent)] text-[var(--accent-dark)]"
                            : "border-[var(--border)] text-[var(--muted)]"
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
          <h2 className="font-medium mb-4">Dodaj pracownika</h2>
          <div className="space-y-3">
            <div className="flex gap-4">
              <label className="block flex-1">
                <span className="text-sm font-medium">Imię</span>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input" />
              </label>
              <label className="block flex-1">
                <span className="text-sm font-medium">Nazwisko</span>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="input" />
              </label>
            </div>
            <div className="flex gap-4">
              <label className="block flex-1">
                <span className="text-sm font-medium">Email (do logowania)</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="pracownik@salon.pl" />
              </label>
              <label className="block flex-1">
                <span className="text-sm font-medium">Hasło startowe</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="min. 6 znaków" />
              </label>
            </div>
            <ImageUpload
              label="Zdjęcie pracownika (1:1)"
              value={photoUrl}
              onChange={setPhotoUrl}
              aspectRatio="square"
            />
            <label className="block">
              <span className="text-sm font-medium">Opis / bio (opcjonalnie)</span>
              <input value={bio} onChange={(e) => setBio(e.target.value)} className="input" />
            </label>
            <div>
              <p className="text-sm font-medium mb-2">Wykonywane usługi</p>
              <div className="flex flex-wrap gap-2">
                {services.map((s) => {
                  const active = selectedServiceIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleServiceSelection(s.id)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                        active
                          ? "bg-[var(--accent-light)] border-[var(--accent)] text-[var(--accent-dark)]"
                          : "border-[var(--border)] text-[var(--muted)]"
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={addEmployee}
              disabled={adding || !firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()}
              className="bg-[var(--accent)] hover:bg-[var(--accent-dark)] disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-full"
            >
              {adding ? "Dodaję..." : "Dodaj pracownika"}
            </button>
          </div>
        </section>
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
