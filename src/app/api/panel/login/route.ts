import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Podaj email i hasło" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() }
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Nieprawidłowy email lub hasło" }, { status: 401 });
  }

  await createSession(user.id);

  return NextResponse.json({ success: true, role: user.role });
}
