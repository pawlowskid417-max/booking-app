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
          { href: "/panel/ustawienia", label: "Ustawienia" },
        ]
      : []),
  ];

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-6">
          <span className="font-display text-lg text-[var(--accent-dark)]">Panel salonu</span>
          <nav className="flex gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
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
        <div className="flex items-center gap-3">
          {user && <span className="text-xs text-[var(--muted)]">{user.email}</span>}
          <button
            onClick={handleLogout}
            className="text-sm text-[var(--muted)] hover:text-[var(--accent-dark)]"
          >
            Wyloguj
          </button>
        </div>
      </div>
    </header>
  );
}
