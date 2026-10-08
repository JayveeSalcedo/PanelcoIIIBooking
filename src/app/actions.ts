"use server";

import { randomBytes } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { bookings } from "@/db/schema";
import { getByRef, listRooms, overlapping, roomAvailability } from "@/lib/bookings";
import { EVENT_TYPES, MAX_SPAN_DAYS } from "@/lib/constants";
import { daySpan, fmtRange, toInstant } from "@/lib/time";

export type SlotRoom = {
  id: number;
  name: string;
  capacity: number | null;
  availability: "free" | "pending" | "booked";
  // Only non-sensitive fields of the conflicting bookings are sent to the browser.
  conflicts: { title: string; department: string; status: string; when: string }[];
};

type Range = { start: Date; end: Date } | { error: string };

function parseRange(startDate: string, startTime: string, endDate: string, endTime: string): Range {
  const start = toInstant(startDate, startTime);
  const end = toInstant(endDate, endTime);
  if (!start || !end) return { error: "Enter a valid start and end date/time." };
  if (end <= start) return { error: "End must be after start." };
  if (start < new Date()) return { error: "Start time is already in the past." };
  if (daySpan(start, end) > MAX_SPAN_DAYS) return { error: `Bookings can span at most ${MAX_SPAN_DAYS} days.` };
  return { start, end };
}

export async function checkAvailability(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
): Promise<{ error: string } | { rooms: SlotRoom[] }> {
  const range = parseRange(startDate, startTime, endDate, endTime);
  if ("error" in range) return range;
  const result = await roomAvailability(range.start, range.end);
  return {
    rooms: result.map((r) => ({
      id: r.id,
      name: r.name,
      capacity: r.capacity,
      availability: r.availability,
      conflicts: r.conflicts.map((c) => ({
        title: c.title,
        department: c.department,
        status: c.status,
        when: fmtRange(c.startsAt, c.endsAt),
      })),
    })),
  };
}

export type RequestFormState = { error?: string; values?: Record<string, string> };

function newRef(): string {
  // Unambiguous characters only (no 0/O, 1/I).
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  return "RB-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function submitRequest(_prev: RequestFormState, form: FormData): Promise<RequestFormState> {
  const v = Object.fromEntries(
    ["eventType", "title", "department", "startDate", "startTime", "endDate", "endTime", "roomId", "pax", "requestedBy", "contact", "remarks"].map(
      (k) => [k, String(form.get(k) ?? "").trim()],
    ),
  );
  const fail = (error: string): RequestFormState => ({ error, values: v });

  if (!EVENT_TYPES.includes(v.eventType as (typeof EVENT_TYPES)[number])) return fail("Choose the type of event.");
  if (!v.title) return fail("Enter the event title.");
  if (!v.department) return fail("Enter the department or committee.");
  if (!v.requestedBy) return fail("Enter who is requesting.");
  if (v.title.length > 200 || v.department.length > 200 || v.requestedBy.length > 200 || v.contact.length > 100 || v.remarks.length > 2000)
    return fail("One of the fields is too long.");

  const pax = Number(v.pax);
  if (!Number.isInteger(pax) || pax < 1 || pax > 100_000) return fail("Enter the expected number of participants.");

  const range = parseRange(v.startDate, v.startTime, v.endDate, v.endTime);
  if ("error" in range) return fail(range.error);

  const room = (await listRooms()).find((r) => r.id === Number(v.roomId));
  if (!room) return fail("Choose an available room.");
  if (room.capacity != null && pax > room.capacity)
    return fail(`${room.name} holds up to ${room.capacity} pax. Choose a larger room.`);

  // A pending request holds the room until the approver decides, so it blocks new requests too.
  const taken = await overlapping(range.start, range.end, { roomId: room.id });
  if (taken.some((b) => b.status === "approved"))
    return fail(`${room.name} is already booked during that time. Choose another room or time.`);
  if (taken.length)
    return fail(
      `${room.name} already has a request for that time that is waiting for approval. Choose another room or time, or check again later if it is rejected.`,
    );

  const ref = newRef();
  const db = await getDb();
  await db.insert(bookings).values({
    ref,
    eventType: v.eventType,
    title: v.title,
    department: v.department,
    roomId: room.id,
    startsAt: range.start,
    endsAt: range.end,
    pax,
    requestedBy: v.requestedBy,
    contact: v.contact,
    remarks: v.remarks,
  });

  revalidatePath("/", "layout");
  redirect(`/r/${ref}?new=1`);
}

export async function cancelByRef(ref: string): Promise<void> {
  const booking = await getByRef(ref);
  if (!booking) return;
  const db = await getDb();
  await db
    .update(bookings)
    .set({ status: "cancelled", decidedAt: new Date() })
    .where(and(eq(bookings.id, booking.id), inArray(bookings.status, ["pending", "approved"])));
  revalidatePath("/", "layout");
}

export async function lookupRef(form: FormData): Promise<void> {
  const ref = String(form.get("ref") ?? "").trim().toUpperCase();
  redirect(ref ? `/r/${encodeURIComponent(ref)}` : "/status");
}
