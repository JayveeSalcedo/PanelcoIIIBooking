"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { bookings, rooms } from "@/db/schema";
import { checkPassword, requireAdmin, signIn, signOut } from "@/lib/auth";
import { getById, overlapping } from "@/lib/bookings";

function back(tab: string, msg: string): never {
  revalidatePath("/", "layout");
  redirect(`/admin?tab=${tab}&msg=${encodeURIComponent(msg)}`);
}

export async function login(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  if (!checkPassword(String(form.get("password") ?? ""))) return { error: "Wrong password." };
  await signIn();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await signOut();
  redirect("/");
}

export async function decide(decision: "approve" | "reject" | "cancel", form: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(form.get("id"));
  const note = String(form.get("note") ?? "").trim().slice(0, 1000);
  const tab = String(form.get("tab") ?? "pending");

  const booking = await getById(id);
  if (!booking) back(tab, "Request not found.");

  const db = await getDb();
  if (decision === "approve") {
    if (booking.status !== "pending") back(tab, `${booking.ref} is no longer pending.`);
    const clash = await overlapping(booking.startsAt, booking.endsAt, {
      roomId: booking.roomId,
      excludeId: booking.id,
      statuses: ["approved"],
    });
    if (clash.length) back(tab, `Cannot approve ${booking.ref}: the room is already booked by ${clash[0].ref}.`);
    await db
      .update(bookings)
      .set({ status: "approved", decisionNote: note, decidedAt: new Date() })
      .where(and(eq(bookings.id, id), eq(bookings.status, "pending")));
    back(tab, `Approved ${booking.ref}.`);
  }

  if (decision === "reject" || decision === "cancel") {
    if (!note) back(tab, "Please give a reason.");
    await db
      .update(bookings)
      .set({ status: decision === "reject" ? "rejected" : "cancelled", decisionNote: note, decidedAt: new Date() })
      .where(and(eq(bookings.id, id), inArray(bookings.status, decision === "reject" ? ["pending"] : ["pending", "approved"])));
    back(tab, `${decision === "reject" ? "Rejected" : "Cancelled"} ${booking.ref}.`);
  }

  back(tab, "Unknown action.");
}

function parseCapacity(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function saveRoom(form: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(form.get("id"));
  const name = String(form.get("name") ?? "").trim();
  const db = await getDb();
  const values = {
    name,
    capacity: parseCapacity(form.get("capacity")),
    sortOrder: Number(form.get("sortOrder")) || 0,
    active: form.get("active") === "on",
  };
  if (!name) redirect("/admin/rooms?msg=Room+name+is+required.");
  try {
    if (id) await db.update(rooms).set(values).where(eq(rooms.id, id));
    else await db.insert(rooms).values(values);
  } catch {
    redirect("/admin/rooms?msg=" + encodeURIComponent(`A room named "${name}" already exists.`));
  }
  revalidatePath("/", "layout");
  redirect("/admin/rooms?msg=" + encodeURIComponent(`Saved ${name}.`));
}
