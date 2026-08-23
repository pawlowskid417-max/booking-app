import { db } from "./db";
import { scryptSync, timingSafeEqual, randomBytes } from "crypto";
import { cookies } from "next/headers";

// ============================================================
// PROSTA AUTORYZACJA PANELU — bez zewnętrznych bibliotek/płatnych usług.
// Sesja: podpisany losowy token trzymany w tabeli w pamięci procesu
// (dla uproszczenia demo). W produkcji: rozważ NextAuth.js lub
// przechowywanie sesji w tabeli DB z wygasaniem.
// ============================================================

const SESSION_COOKIE = "panel_session";

// Sesje trzymane w pamięci procesu (mapa token -> userId).
// UWAGA (produkcja): to znika przy restarcie serwera — do prostego,
// jednosalonowego użytku wystarczające, ale do prawdziwego wdrożenia
// warto przenieść do tabeli `sessions` w bazie.
const sessions = new Map<string, { userId: string; expiresAt: number }>();

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export interface SessionUser {
  id: string;
  email: string;
  role: string;
  employeeId: string | null;
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 dni
  sessions.set(token, { userId, expiresAt });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return token;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) sessions.delete(token);
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { employee: true },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employee?.id ?? null,
  };
}
