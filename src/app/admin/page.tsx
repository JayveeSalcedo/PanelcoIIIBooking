import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { BookingDetails } from "@/components/BookingDetails";
import { StatusBadge } from "@/components/StatusBadge";
import { listBookings, overlapping, type BookingWithRoom } from "@/lib/bookings";
import { fmtDate, fmtRange, fmtTime } from "@/lib/time";
import { decide } from "./actions";

const TABS = [
  { id: "pending", label: "Pending" },
  { id: "upcoming", label: "Upcoming approved" },
  { id: "all", label: "All requests" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; msg?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const tab: Tab = TABS.some((t) => t.id === sp.tab) ? (sp.tab as Tab) : "pending";
  const list = await listBookings(tab);
  const conflicts = await Promise.all(
    list.map((b) =>
      b.status === "pending" ? overlapping(b.startsAt, b.endsAt, { roomId: b.roomId, excludeId: b.id }) : Promise.resolve([]),
    ),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin?tab=${t.id}`}
            className={`rounded-full px-3 py-1 text-sm ${t.id === tab ? "bg-brand-700 text-white ring-2 ring-accent-400" : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {sp.msg && <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm text-brand-900">{sp.msg}</div>}

      {list.length === 0 && <p className="py-10 text-center text-sm text-zinc-500">Nothing here.</p>}

      {list.map((b, i) => (
        <RequestCard key={b.id} booking={b} conflicts={conflicts[i]} tab={tab} />
      ))}
    </div>
  );
}

function RequestCard({ booking: b, conflicts, tab }: { booking: BookingWithRoom; conflicts: BookingWithRoom[]; tab: Tab }) {
  const blocking = conflicts.filter((c) => c.status === "approved");
  const competing = conflicts.filter((c) => c.status === "pending");
  const isOpen = b.status === "pending" || (b.status === "approved" && b.endsAt > new Date());

  return (
    <article className="card space-y-4 p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-zinc-500">
            <Link href={`/r/${b.ref}`} className="hover:underline">{b.ref}</Link> · submitted {fmtDate(b.createdAt)} {fmtTime(b.createdAt)}
          </p>
          <h2 className="text-lg font-semibold">{b.title}</h2>
        </div>
        <StatusBadge status={b.status} />
      </header>

      <BookingDetails booking={b} />

      {b.decisionNote && <p className="text-sm text-zinc-600">Note: {b.decisionNote}</p>}

      {blocking.length > 0 && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          Room already booked at this time — cannot approve:
          <ConflictList items={blocking} />
        </div>
      )}
      {competing.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Other pending requests for the same room and time (approving this one will block them):
          <ConflictList items={competing} />
        </div>
      )}

      {isOpen && (
        <form className="flex flex-wrap items-end gap-2 border-t border-zinc-100 pt-4">
          <input type="hidden" name="id" value={b.id} />
          <input type="hidden" name="tab" value={tab} />
          <div className="min-w-[220px] flex-1">
            <label className="label" htmlFor={`note-${b.id}`}>Note to requester</label>
            <input id={`note-${b.id}`} name="note" className="input" placeholder="Required when rejecting or cancelling" />
          </div>
          {b.status === "pending" ? (
            <>
              <button formAction={decide.bind(null, "approve")} value="approve" disabled={blocking.length > 0} className="btn-success">Approve</button>
              <button formAction={decide.bind(null, "reject")} value="reject" className="btn-danger">Reject</button>
            </>
          ) : (
            <button formAction={decide.bind(null, "cancel")} value="cancel" className="btn-danger">Cancel booking</button>
          )}
        </form>
      )}
    </article>
  );
}

function ConflictList({ items }: { items: BookingWithRoom[] }) {
  return (
    <ul className="mt-1 list-disc pl-5">
      {items.map((c) => (
        <li key={c.id}>
          <Link href={`/r/${c.ref}`} className="font-mono underline">{c.ref}</Link> — {c.title} ({c.department}), {fmtRange(c.startsAt, c.endsAt)}
        </li>
      ))}
    </ul>
  );
}
