import { db } from "./db";
import { scryptSync, timingSafeEqual, randomBytes, createHmac } from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "panel_session";
const SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";

function requireSecret() {
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error("CRITICAL: JWT_SECRET environment variable is missing in production!");
  }
}

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

function sign(payload: string): string {
  requireSecret();
  const hmac = createHmac("sha256", SECRET);
  hmac.update(payload);
  return `${payload}.${hmac.digest("hex")}`;
}

function verify(signed: string): string | null {
  requireSecret();
  const parts = signed.split(".");
  if (parts.length !== 2) return null;
  const payload = parts[0];
  const signature = parts[1];
  
  const expectedSignature = createHmac("sha256", SECRET).update(payload).digest("hex");
  if (timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return payload;
  }
  return null;
}

export async function createSession(userId: string): Promise<string> {
  const payloadStr = JSON.stringify({
    userId,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 dni
  });
  const token = sign(payloadStr);

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
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payloadStr = verify(token);
  if (!payloadStr) return null;
  
  try {
    const payload = JSON.parse(payloadStr);
    if (payload.exp < Date.now()) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
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
}
