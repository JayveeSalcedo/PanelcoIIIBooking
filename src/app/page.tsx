import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { listRooms, overlapping } from "@/lib/bookings";
import { DAY_END_HOUR, DAY_START_HOUR } from "@/lib/constants";
import { addDays, fmtDate, fmtRange, isDateStr, localDate, toInstant } from "@/lib/time";

export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");

export default async function AvailabilityPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date: dateParam } = await searchParams;
  const today = localDate();
  const date = isDateStr(dateParam) ? dateParam : today;

  const dayStart = toInstant(date, "00:00")!;
  const dayEnd = toInstant(addDays(date, 1), "00:00")!;
  const winStart = toInstant(date, `${pad(DAY_START_HOUR)}:00`)!.getTime();
  const winEnd = toInstant(date, `${pad(DAY_END_HOUR)}:00`)!.getTime();
  const span = winEnd - winStart;

  const [rooms, dayBookings] = await Promise.all([listRooms(), overlapping(dayStart, dayEnd)]);
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Room availability</h1>
          <p className="text-sm text-zinc-500">{fmtDate(date)}{date === today && " · Today"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/?date=${addDays(date, -1)}`} className="btn-secondary" aria-label="Previous day">←</Link>
          <form className="flex gap-2">
            <input type="date" name="date" defaultValue={date} className="input w-auto" />
            <button className="btn-secondary">Go</button>
          </form>
          <Link href={`/?date=${addDays(date, 1)}`} className="btn-secondary" aria-label="Next day">→</Link>
          {date !== today && <Link href="/" className="btn-secondary">Today</Link>}
          <Link href={`/request?date=${date >= today ? date : today}`} className="btn-primary">Request a room</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-zinc-600">
        <Legend className="bg-white ring-zinc-300">Available</Legend>
        <Legend className="bg-amber-200 ring-amber-400">Pending approval</Legend>
        <Legend className="bg-emerald-500 ring-emerald-600">Booked</Legend>
      </div>

      <div className="card overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[180px_1fr] border-b border-zinc-200 text-xs text-zinc-500">
            <div className="px-3 py-2 font-medium">Room</div>
            <div className="relative h-8">
              {hours.map((h, i) => (
                <span key={h} className="absolute top-2 -translate-x-1/2" style={{ left: `${(i / hours.length) * 100}%` }}>
                  {i === 0 ? "" : `${((h + 11) % 12) + 1}${h < 12 ? "a" : "p"}`}
                </span>
              ))}
            </div>
          </div>
          {rooms.map((room) => {
            const items = dayBookings.filter((b) => b.roomId === room.id);
            return (
              <div key={room.id} className="grid grid-cols-[180px_1fr] border-b border-zinc-100 last:border-0">
                <div className="px-3 py-3">
                  <div className="text-sm font-medium">{room.name}</div>
                  <div className="text-xs text-zinc-500">{room.capacity ? `Up to ${room.capacity} pax` : "Capacity not set"}</div>
                </div>
                <div className="relative my-2 h-12">
                  {hours.map((h, i) => (
                    <div key={h} className="absolute inset-y-0 border-l border-zinc-100" style={{ left: `${(i / hours.length) * 100}%` }} />
                  ))}
                  {items.map((b) => {
                    const s = Math.max(b.startsAt.getTime(), winStart);
                    const e = Math.min(b.endsAt.getTime(), winEnd);
                    if (e <= s) return null;
                    const approved = b.status === "approved";
                    return (
                      <div
                        key={b.id}
                        title={`${b.title} (${b.department})\n${fmtRange(b.startsAt, b.endsAt)}\n${b.status}`}
                        className={`absolute inset-y-1 overflow-hidden rounded-md px-2 py-1 text-xs leading-tight ring-1 ring-inset ${
                          approved ? "bg-emerald-500 text-white ring-emerald-600" : "bg-amber-200 text-amber-900 ring-amber-400"
                        }`}
                        style={{ left: `${((s - winStart) / span) * 100}%`, width: `${((e - s) / span) * 100}%` }}
                      >
                        <div className="truncate font-medium">{b.title}</div>
                        <div className="truncate opacity-80">{b.department}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Bookings on this day</h2>
        {dayBookings.length === 0 ? (
          <p className="text-sm text-zinc-500">No bookings yet — every room is free.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {dayBookings.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <div className="font-medium">
                    {b.title} <span className="font-normal text-zinc-500">· {b.eventType}</span>
                  </div>
                  <div className="text-zinc-500">
                    {b.roomName} · {fmtRange(b.startsAt, b.endsAt)} · {b.department}
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Legend({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-5 rounded ring-1 ring-inset ${className}`} />
      {children}
    </span>
  );
}
