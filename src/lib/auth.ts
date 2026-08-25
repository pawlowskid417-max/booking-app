import { db } from "./db";
import { scryptSync, timingSafeEqual, randomBytes } from "crypto";
import { cache } from "react";
import { getSessionUser, SessionUser } from "./session";

// Re-eksportujemy wszystko z session.ts
export * from "./session";

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

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      include: { employee: true },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id ?? null,
    };
  } catch (e) {
    return null;
  }
});
