import type { BookingWithRoom } from "@/lib/bookings";
import { fmtDuration, fmtRange } from "@/lib/time";

export function BookingDetails({ booking: b, showContact = true }: { booking: BookingWithRoom; showContact?: boolean }) {
  const rows: [string, React.ReactNode][] = [
    ["Type of event", b.eventType],
    ["Department / Committee", b.department],
    ["Room", b.roomName],
    ["Date & time", fmtRange(b.startsAt, b.endsAt)],
    ["Duration", fmtDuration(b.startsAt, b.endsAt)],
    ["Expected participants", `${b.pax} pax`],
    ["Requested by", b.requestedBy],
  ];
  if (showContact && b.contact) rows.push(["Contact", b.contact]);
  if (b.remarks) rows.push(["Remarks", <span key="r" className="whitespace-pre-wrap">{b.remarks}</span>]);

  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-zinc-500">{k}</dt>
          <dd className="font-medium text-zinc-900">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
