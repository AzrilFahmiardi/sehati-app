import { decodeJwt } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "hv_session";

function isSessionValid(token: string | undefined): boolean {
  if (!token) {
    return false;
  }
  try {
    const claims = decodeJwt(token);
    return typeof claims.exp === "number" && claims.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/pasien" ||
    request.nextUrl.pathname.startsWith("/pasien/skrining") ||
    request.nextUrl.pathname.startsWith("/pasien/hasil") ||
    request.nextUrl.pathname.startsWith("/nakes/hasil") ||
    request.nextUrl.pathname.startsWith("/nakes/skrining") ||
    request.nextUrl.pathname.startsWith("/capture")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (isSessionValid(token)) {
    return NextResponse.next();
  }

  const isPasienPath = request.nextUrl.pathname.startsWith("/pasien");
  const loginUrl = new URL(isPasienPath ? "/login-pasien" : "/login-nakes", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/nakes/:path*", "/capture/:path*", "/pasien/:path*"],
};
