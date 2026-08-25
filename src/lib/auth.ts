import { db } from "./db";
import { scryptSync, timingSafeEqual, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { cache } from "react";

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
  email?: string;
  role: string;
  employeeId: string | null;
}

const encoder = new TextEncoder();

async function getCryptoKey() {
  requireSecret();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function arrayBufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToArrayBuffer(hex: string) {
  const view = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    view[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return view.buffer;
}

export async function sign(payload: string): Promise<string> {
  const key = await getCryptoKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${arrayBufferToHex(signature)}`;
}

export async function verify(signed: string): Promise<string | null> {
  const parts = signed.split(".");
  if (parts.length !== 2) return null;
  const payload = parts[0];
  const signatureHex = parts[1];
  
  try {
    const key = await getCryptoKey();
    const signatureBuffer = hexToArrayBuffer(signatureHex);
    const isValid = await crypto.subtle.verify("HMAC", key, signatureBuffer, encoder.encode(payload));
    return isValid ? payload : null;
  } catch (e) {
    return null;
  }
}

export async function createSession(user: { id: string, role: string, employeeId?: string | null }): Promise<string> {
  const payloadStr = JSON.stringify({
    userId: user.id,
    role: user.role,
    employeeId: user.employeeId || null,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 dni
  });
  const token = await sign(payloadStr);

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

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payloadStr = await verify(token);
  if (!payloadStr) return null;
  
  try {
    const payload = JSON.parse(payloadStr);
    if (payload.exp < Date.now()) {
      return null;
    }

    return {
      id: payload.userId,
      role: payload.role,
      employeeId: payload.employeeId ?? null,
    };
  } catch (e) {
    return null;
  }
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
