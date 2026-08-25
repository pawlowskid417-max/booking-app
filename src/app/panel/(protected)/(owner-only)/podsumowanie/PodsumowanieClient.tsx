"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

type AppointmentLight = {
  id: string;
  startAt: Date | string;
  status: string;
  clientFirstName: string;
  clientLastName: string;
  employee?: { firstName: string };
};

interface Props {
  initialAppointments: AppointmentLight[];
  employeesCount: number;
  servicesCount: number;
}

export default function PodsumowanieClient({ initialAppointments, employeesCount, servicesCount }: Props) {
  const [appointments, setAppointments] = useState(initialAppointments);

  useEffect(() => {
    const channel = supabase
      .channel('owner-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newApp = payload.new as AppointmentLight;
            setAppointments((prev) => [newApp, ...prev].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()));
          }
          if (payload.eventType === 'UPDATE') {
             setAppointments((prev) => 
               prev.map(app => app.id === payload.new.id ? { ...app, ...payload.new } : app)
             );
          }
          if (payload.eventType === 'DELETE') {
             setAppointments((prev) => prev.filter(app => app.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border)] flex flex-col justify-center">
           <span className="text-sm text-[var(--muted)] mb-1">Aktywni pracownicy</span>
           <span className="text-2xl font-bold">{employeesCount}</span>
        </div>
        <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border)] flex flex-col justify-center">
           <span className="text-sm text-[var(--muted)] mb-1">Dostępne usługi</span>
           <span className="text-2xl font-bold">{servicesCount}</span>
        </div>
      </div>
      
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-display text-xl text-[var(--foreground)]">Dzisiejsze Wizyty (Na żywo)</h2>
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        
        {appointments.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Brak wizyt na dziś.</p>
        ) : (
          <ul className="space-y-3">
            {appointments.map(app => (
              <li key={app.id} className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border)] flex items-center justify-between">
                <div>
                  <p className="font-medium text-[var(--foreground)]">{app.clientFirstName} {app.clientLastName}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {new Date(app.startAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                    {app.employee?.firstName ? ` · ${app.employee.firstName}` : ''}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium bg-[var(--accent-light)] text-[var(--accent-dark)] px-3 py-1 rounded-full">
                    {app.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
