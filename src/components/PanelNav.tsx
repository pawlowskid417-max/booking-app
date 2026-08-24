"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface CurrentUser {
  id: string;
  email: string;
  role: string;
  employeeId: string | null;
}

export default function PanelNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetch("/api/panel/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setUser(d.user))
      .catch(() => router.push("/panel/login"));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/panel/logout", { method: "POST" });
    router.push("/panel/login");
  }

  const links = [
    { href: "/panel/dashboard", label: "Rezerwacje" },
    { href: "/panel/grafik", label: "Grafik" },
    ...(user?.role === "OWNER"
      ? [
          { href: "/panel/uslugi", label: "Usługi" },
          { href: "/panel/pracownicy", label: "Pracownicy" },
          { href: "/panel/galeria", label: "Galeria" },
          { href: "/panel/opinie", label: "Opinie" },
          { href: "/panel/ustawienia", label: "Ustawienia" },
        ]
      : []),
  ];

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 w-full md:w-auto">
          <span className="font-display text-xl text-[var(--accent-dark)] whitespace-nowrap">Panel salonu</span>
          <nav className="flex gap-1 flex-wrap justify-center md:justify-start">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  pathname === l.href
                    ? "bg-[var(--accent-light)] text-[var(--accent-dark)] font-medium"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
          {user && <span className="text-xs text-[var(--muted)] truncate max-w-[150px] md:max-w-none">{user.email}</span>}
          <button
            onClick={handleLogout}
            className="text-sm text-[var(--muted)] hover:text-[var(--accent-dark)] whitespace-nowrap"
          >
            Wyloguj
          </button>
        </div>
      </div>
    </header>
  );
}
