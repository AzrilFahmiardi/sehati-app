import { decodeJwt } from "jose";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "hv_session";

export async function POST(request: Request) {
  const { idToken } = (await request.json()) as { idToken?: string };

  if (!idToken) {
    return NextResponse.json({ error: "idToken wajib disertakan" }, { status: 400 });
  }

  let expiresAt: number;
  try {
    const claims = decodeJwt(idToken);
    if (!claims.exp) {
      throw new Error("ID token tidak memuat klaim exp");
    }
    expiresAt = claims.exp;
  } catch {
    return NextResponse.json({ error: "ID token tidak valid" }, { status: 400 });
  }

  const maxAgeSeconds = Math.max(expiresAt - Math.floor(Date.now() / 1000), 0);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
