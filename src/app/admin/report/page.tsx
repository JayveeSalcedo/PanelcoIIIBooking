import Link from "next/link";
import { PrintButton } from "@/components/PrintButton";
import { requireAdmin } from "@/lib/auth";
import { bookingsStartingBetween, type BookingWithRoom } from "@/lib/bookings";
import { STATUSES, type Status } from "@/lib/constants";
import { addDays, fmtDate, fmtRange, fmtTime, isDateStr, localDate, toInstant } from "@/lib/time";

const th = "border border-zinc-300 bg-zinc-50 px-2 py-1.5 text-left font-semibold print:bg-zinc-100";
const td = "border border-zinc-300 px-2 py-1.5 align-top";

function monthBounds(today: string) {
  const first = `${today.slice(0, 8)}01`;
  const [y, m] = today.split("-").map(Number);
  const nextFirst = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { first, last: addDays(nextFirst, -1) };
}

/** Rows grouped by key, keeping first-seen order; most requests first. */
function tally(list: BookingWithRoom[], key: (b: BookingWithRoom) => string) {
  const map = new Map<string, { total: number; approved: number; items: BookingWithRoom[] }>();
  for (const b of list) {
    const k = key(b);
    const row = map.get(k) ?? { total: 0, approved: 0, items: [] };
    row.total++;
    if (b.status === "approved") row.approved++;
    row.items.push(b);
    map.set(k, row);
  }
  return [...map.entries()].sort((a, b) => b[1].total - a[1].total);
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const month = monthBounds(localDate());
  let from = isDateStr(sp.from) ? sp.from : month.first;
  let to = isDateStr(sp.to) ? sp.to : month.last;
  if (to < from) [from, to] = [to, from];
  const status = STATUSES.includes(sp.status as Status) ? (sp.status as Status) : "all";

  const list = await bookingsStartingBetween(
    toInstant(from, "00:00")!,
    toInstant(addDays(to, 1), "00:00")!,
    status === "all" ? undefined : [status],
  );
  const counts = Object.fromEntries(STATUSES.map((s) => [s, list.filter((b) => b.status === s).length])) as Record<Status, number>;
  const byRoom = tally(list, (b) => b.roomName);
  const byRequester = tally(list, (b) => b.requestedBy.trim());
  const now = new Date();

  return (
    <div className="space-y-6 print:space-y-4 print:text-[10pt]">
      <form className="card flex flex-wrap items-end gap-3 p-4 print:hidden">
        <div>
          <label className="label" htmlFor="from">From</label>
          <input id="from" name="from" type="date" defaultValue={from} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="to">To</label>
          <input id="to" name="to" type="date" defaultValue={to} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status} className="input capitalize">
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn-secondary">Generate</button>
        <div className="ml-auto">
          <PrintButton label="Print report" />
        </div>
      </form>

      <header className="border-b-2 border-zinc-900 pb-3">
        <h1 className="text-xl font-bold uppercase">Room Booking Summary Report</h1>
        <p className="text-sm">
          Period: <strong>{fmtDate(from)} – {fmtDate(to)}</strong>
          {" · "}Status: <strong className="capitalize">{status === "all" ? "All" : status}</strong>
        </p>
        <p className="text-xs text-zinc-500">Generated {fmtDate(now)} at {fmtTime(now)}</p>
      </header>

      {list.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">No requests in this period.</p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-5 print:grid-cols-5">
            <Stat label="Total requests" value={list.length} />
            {STATUSES.map((s) => <Stat key={s} label={s} value={counts[s]} />)}
          </section>

          <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-2 print:gap-4">
            <section className="break-inside-avoid">
              <h2 className="mb-2 font-semibold">By requester</h2>
              <table className="w-full border-collapse text-sm print:text-[9pt]">
                <thead>
                  <tr>
                    <th className={th}>Requested by</th>
                    <th className={th}>Department / Committee</th>
                    <th className={`${th} text-right`}>Requests</th>
                    <th className={`${th} text-right`}>Approved</th>
                  </tr>
                </thead>
                <tbody>
                  {byRequester.map(([name, r]) => (
                    <tr key={name}>
                      <td className={`${td} font-medium`}>{name}</td>
                      <td className={td}>{[...new Set(r.items.map((b) => b.department))].join(", ")}</td>
                      <td className={`${td} text-right`}>{r.total}</td>
                      <td className={`${td} text-right`}>{r.approved}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="break-inside-avoid">
              <h2 className="mb-2 font-semibold">By room</h2>
              <table className="w-full border-collapse text-sm print:text-[9pt]">
                <thead>
                  <tr>
                    <th className={th}>Room</th>
                    <th className={`${th} text-right`}>Requests</th>
                    <th className={`${th} text-right`}>Approved</th>
                  </tr>
                </thead>
                <tbody>
                  {byRoom.map(([room, r]) => (
                    <tr key={room}>
                      <td className={`${td} font-medium`}>{room}</td>
                      <td className={`${td} text-right`}>{r.total}</td>
                      <td className={`${td} text-right`}>{r.approved}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          <section>
            <h2 className="mb-2 font-semibold">All requests</h2>
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full min-w-[900px] border-collapse text-sm print:min-w-0 print:text-[8.5pt]">
                <thead>
                  <tr>
                    <th className={th}>#</th>
                    <th className={th}>Date &amp; time</th>
                    <th className={th}>Event</th>
                    <th className={th}>Department / Committee</th>
                    <th className={th}>Room</th>
                    <th className={`${th} text-right`}>Pax</th>
                    <th className={th}>Requested by</th>
                    <th className={th}>Status</th>
                    <th className={th}>Ref. No.</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((b, i) => (
                    <tr key={b.id} className="break-inside-avoid">
                      <td className={td}>{i + 1}</td>
                      <td className={td}>{fmtRange(b.startsAt, b.endsAt)}</td>
                      <td className={td}>
                        <span className="font-medium">{b.title}</span>
                        <span className="text-zinc-500"> · {b.eventType}</span>
                      </td>
                      <td className={td}>{b.department}</td>
                      <td className={td}>{b.roomName}</td>
                      <td className={`${td} text-right`}>{b.pax}</td>
                      <td className={`${td} font-medium`}>{b.requestedBy}</td>
                      <td className={`${td} capitalize`}>{b.status}</td>
                      <td className={`${td} font-mono`}>
                        <Link href={`/r/${b.ref}`} className="hover:underline">{b.ref}</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-3 print:rounded-none print:shadow-none">
      <div className="text-xs capitalize text-zinc-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
