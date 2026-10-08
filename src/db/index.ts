import { sql } from "drizzle-orm";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

type DB = ReturnType<typeof drizzleNeon<typeof schema>>;

// Idempotent: creates tables and seeds the default rooms on an empty database.
const INIT_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS rooms (
    id serial PRIMARY KEY,
    name text NOT NULL UNIQUE,
    capacity integer,
    sort_order integer NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true
  )`,
  `CREATE TABLE IF NOT EXISTS bookings (
    id serial PRIMARY KEY,
    ref text NOT NULL UNIQUE,
    event_type text NOT NULL,
    title text NOT NULL,
    department text NOT NULL,
    room_id integer NOT NULL REFERENCES rooms(id),
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    pax integer NOT NULL,
    requested_by text NOT NULL,
    contact text NOT NULL DEFAULT '',
    remarks text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'pending',
    decision_note text NOT NULL DEFAULT '',
    decided_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (ends_at > starts_at)
  )`,
  `CREATE INDEX IF NOT EXISTS bookings_room_time_idx ON bookings (room_id, starts_at, ends_at)`,
  `INSERT INTO rooms (name, sort_order)
    SELECT * FROM (VALUES
      ('Conference Room 1', 1),
      ('Conference Room 2', 2),
      ('AMA Hall', 3),
      ('Staff House', 4),
      ('AM/FM Training Room', 5)
    ) AS v(name, sort_order)
    WHERE NOT EXISTS (SELECT 1 FROM rooms)`,
];

async function create(): Promise<DB> {
  let db: DB;
  if (process.env.DATABASE_URL) {
    db = drizzleNeon(neon(process.env.DATABASE_URL), { schema });
  } else {
    if (process.env.VERCEL) throw new Error("DATABASE_URL is not set");
    // Local development: embedded Postgres stored in ./.pglite
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    db = drizzle(new PGlite("./.pglite"), { schema }) as unknown as DB;
  }
  for (const stmt of INIT_STATEMENTS) await db.execute(sql.raw(stmt));
  return db;
}

// Reuse one connection per server instance (and across dev hot reloads).
const g = globalThis as unknown as { __db?: Promise<DB> };

export function getDb(): Promise<DB> {
  g.__db ??= create().catch((err) => {
    g.__db = undefined;
    throw err;
  });
  return g.__db;
}
