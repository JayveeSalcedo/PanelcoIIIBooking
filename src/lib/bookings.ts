import { and, asc, desc, eq, getTableColumns, gt, gte, inArray, lt, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, rooms, type Booking, type Room } from "@/db/schema";
import { ACTIVE_STATUSES, type Status } from "./constants";

export type BookingWithRoom = Booking & { roomName: string };

export type RoomAvailability = Room & {
  availability: "free" | "pending" | "booked";
  conflicts: BookingWithRoom[];
};

function bookingSelect() {
  return { ...getTableColumns(bookings), roomName: rooms.name };
}

export async function listRooms(activeOnly = true): Promise<Room[]> {
  const db = await getDb();
  return db
    .select()
    .from(rooms)
    .where(activeOnly ? eq(rooms.active, true) : undefined)
    .orderBy(asc(rooms.sortOrder), asc(rooms.id));
}

/** Pending/approved bookings that overlap [start, end). */
export async function overlapping(
  start: Date,
  end: Date,
  opts: { roomId?: number; excludeId?: number; statuses?: Status[] } = {},
): Promise<BookingWithRoom[]> {
  const db = await getDb();
  return db
    .select(bookingSelect())
    .from(bookings)
    .innerJoin(rooms, eq(rooms.id, bookings.roomId))
    .where(
      and(
        lt(bookings.startsAt, end),
        gt(bookings.endsAt, start),
        inArray(bookings.status, opts.statuses ?? ACTIVE_STATUSES),
        opts.roomId ? eq(bookings.roomId, opts.roomId) : undefined,
        opts.excludeId ? ne(bookings.id, opts.excludeId) : undefined,
      ),
    )
    .orderBy(asc(bookings.startsAt));
}

export async function roomAvailability(start: Date, end: Date): Promise<RoomAvailability[]> {
  const [roomList, taken] = await Promise.all([listRooms(), overlapping(start, end)]);
  return roomList.map((room) => {
    const conflicts = taken.filter((b) => b.roomId === room.id);
    const availability = conflicts.some((b) => b.status === "approved")
      ? "booked"
      : conflicts.length
        ? "pending"
        : "free";
    return { ...room, availability, conflicts };
  });
}

export async function getByRef(ref: string): Promise<BookingWithRoom | undefined> {
  const db = await getDb();
  const [row] = await db
    .select(bookingSelect())
    .from(bookings)
    .innerJoin(rooms, eq(rooms.id, bookings.roomId))
    .where(eq(bookings.ref, ref.trim().toUpperCase()));
  return row;
}

export async function getById(id: number): Promise<Booking | undefined> {
  const db = await getDb();
  const [row] = await db.select().from(bookings).where(eq(bookings.id, id));
  return row;
}

export async function listBookings(filter: "pending" | "upcoming" | "all"): Promise<BookingWithRoom[]> {
  const db = await getDb();
  const base = db.select(bookingSelect()).from(bookings).innerJoin(rooms, eq(rooms.id, bookings.roomId));
  if (filter === "pending") {
    return base.where(eq(bookings.status, "pending")).orderBy(asc(bookings.createdAt));
  }
  if (filter === "upcoming") {
    return base
      .where(and(eq(bookings.status, "approved"), gte(bookings.endsAt, new Date())))
      .orderBy(asc(bookings.startsAt));
  }
  return base.orderBy(desc(bookings.createdAt)).limit(300);
}

/** Bookings whose start falls in [start, end), oldest first, optionally limited to some statuses. */
export async function bookingsStartingBetween(start: Date, end: Date, statuses?: Status[]): Promise<BookingWithRoom[]> {
  const db = await getDb();
  return db
    .select(bookingSelect())
    .from(bookings)
    .innerJoin(rooms, eq(rooms.id, bookings.roomId))
    .where(
      and(
        gte(bookings.startsAt, start),
        lt(bookings.startsAt, end),
        statuses ? inArray(bookings.status, statuses) : undefined,
      ),
    )
    .orderBy(asc(bookings.startsAt), asc(bookings.id));
}
