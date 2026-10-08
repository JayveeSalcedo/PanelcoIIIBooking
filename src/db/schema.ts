import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import type { Status } from "@/lib/constants";

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  capacity: integer("capacity"), // null = not yet known, no capacity check
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  ref: text("ref").notNull().unique(),
  eventType: text("event_type").notNull(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  roomId: integer("room_id")
    .notNull()
    .references(() => rooms.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  pax: integer("pax").notNull(),
  requestedBy: text("requested_by").notNull(),
  contact: text("contact").notNull().default(""),
  remarks: text("remarks").notNull().default(""),
  status: text("status").$type<Status>().notNull().default("pending"),
  decisionNote: text("decision_note").notNull().default(""),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Room = typeof rooms.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
