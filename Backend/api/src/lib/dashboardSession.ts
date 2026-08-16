import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

const cookieName = "smartflood_dashboard_session";
const maxAgeSeconds = 60 * 60 * 12;

type DashboardSessionPayload = {
  userId: string;
  expiresAt: number;
};

export function setDashboardSession(response: NextResponse, userId: string) {
  const payload: DashboardSessionPayload = {
    userId,
    expiresAt: Date.now() + maxAgeSeconds * 1000,
  };

  response.cookies.set(cookieName, signPayload(payload), {
    httpOnly: true,
    maxAge: maxAgeSeconds,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearDashboardSession(response: NextResponse) {
  response.cookies.set(cookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

export function getDashboardSessionUserId(req: NextRequest) {
  const value = req.cookies.get(cookieName)?.value;
  if (!value) return null;

  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) return null;
  if (!isValidSignature(encodedPayload, signature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as DashboardSessionPayload;
    if (!payload.userId || payload.expiresAt <= Date.now()) return null;
    return payload.userId;
  } catch {
    return null;
  }
}

function signPayload(payload: DashboardSessionPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${signatureFor(encodedPayload)}`;
}

function isValidSignature(payload: string, signature: string) {
  const expected = Buffer.from(signatureFor(payload));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function signatureFor(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function sessionSecret() {
  const secret = process.env.SMARTFLOOD_SESSION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Missing SMARTFLOOD_SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY in environment");
  return secret;
}
