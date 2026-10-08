import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "rb_admin";

function password(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD is not set");
  return pw;
}

// Derived from the password, so changing ADMIN_PASSWORD signs everyone out.
function sessionToken(): string {
  return createHmac("sha256", password()).update("room-booking-admin").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function checkPassword(input: string): boolean {
  return safeEqual(input, password());
}

export async function isAdmin(): Promise<boolean> {
  const value = (await cookies()).get(COOKIE)?.value;
  return !!value && safeEqual(value, sessionToken());
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/login");
}

export async function signIn(): Promise<void> {
  (await cookies()).set(COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
