import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verify } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("panel_session")?.value;
  const isLoginPage = request.nextUrl.pathname === "/panel/login";

  if (!token) {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL("/panel/login", request.url));
    }
    return NextResponse.next();
  }

  // Weryfikacja podpisu HMAC (Edge)
  const payloadStr = await verify(token);
  
  if (!payloadStr) {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL("/panel/login", request.url));
    }
    return NextResponse.next();
  }

  try {
    const payload = JSON.parse(payloadStr);
    if (payload.exp < Date.now()) {
      if (!isLoginPage) {
        return NextResponse.redirect(new URL("/panel/login", request.url));
      }
      return NextResponse.next();
    }
  } catch (e) {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL("/panel/login", request.url));
    }
    return NextResponse.next();
  }

  if (isLoginPage) {
    return NextResponse.redirect(new URL("/panel/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*"],
};
