import type { Room } from "@/db/schema";
import type { BookingWithRoom } from "@/lib/bookings";
import { APPROVER_NAME, APPROVER_TITLE, EVENT_TYPES } from "@/lib/constants";
import { fmtDuration, fmtFormRange, fmtLongDate, localYear } from "@/lib/time";

const cell = "border border-black px-3 py-2 align-top";
const label = `${cell} font-semibold`;

function Box({ checked, children }: { checked: boolean; children: React.ReactNode }) {
  return (
    <div className="whitespace-nowrap">
      [<span className="inline-block w-5 text-center font-bold">{checked ? "✓" : ""}</span>] {children}
    </div>
  );
}

/** Print-only copy of the paper "Meeting Schedule Request Form", filled in from an approved booking. */
export function PrintableForm({ booking: b, rooms }: { booking: BookingWithRoom; rooms: Room[] }) {
  return (
    <div className="hidden text-[11pt] leading-snug text-black print:block">
      <div className="mb-4 flex items-end justify-between gap-6">
        <h1 className="text-[15pt] font-bold uppercase">Meeting Schedule Request Form</h1>
        <div className="text-right">
          <p className="font-semibold">(OGM CN: MTG - ______ - ______ - {localYear(b.startsAt)})</p>
          <p className="font-mono text-[9pt]">Ref. No. {b.ref}</p>
        </div>
      </div>

      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-[30%]" />
          <col className="w-[26%]" />
          <col className="w-[20%]" />
          <col className="w-[24%]" />
        </colgroup>
        <tbody>
          <tr>
            <td className={label}>
              Type of Event:
              <br />(
              {EVENT_TYPES.map((t, i) => (
                <span key={t}>
                  {i > 0 && "/"}
                  <span className={t === b.eventType ? "underline" : "font-normal"}>{t}</span>
                </span>
              ))}
              )
            </td>
            <td className={`${cell} uppercase`} colSpan={3}>{b.title}</td>
          </tr>
          <tr>
            <td className={label}>Department / Committee In-charge:</td>
            <td className={cell} colSpan={3}>{b.department}</td>
          </tr>
          <tr>
            <td className={label}>Date and Time:</td>
            <td className={`${cell} whitespace-pre`} colSpan={3}>{fmtFormRange(b.startsAt, b.endsAt)}</td>
          </tr>
          <tr>
            <td className={label}>Expected No. of Participants</td>
            <td className={cell} colSpan={3}>{b.pax} pax</td>
          </tr>
          <tr>
            <td className={label}>Duration of Event/Activity:</td>
            <td className={cell} colSpan={3}>{fmtDuration(b.startsAt, b.endsAt)}</td>
          </tr>
          <tr className="h-16">
            <td className={label}>Requested by:</td>
            <td className={`${cell} text-center align-bottom`}>{b.requestedBy}</td>
            <td className={label}>
              Checked by:
              <br />
              <span className="font-normal">(Supervisor or Manager)</span>
            </td>
            <td className={cell} />
          </tr>
          <tr className="h-20">
            <td className={label}>Approved:</td>
            <td className={`${cell} align-bottom`}>
              <span className="font-bold">{APPROVER_NAME}</span>
              <br />
              {APPROVER_TITLE}
            </td>
            <td className={`${label} align-middle`}>Date signed:</td>
            <td className={`${cell} align-middle font-semibold uppercase`}>
              {b.decidedAt && fmtLongDate(b.decidedAt)}
            </td>
          </tr>
          <tr>
            <td className={cell}>
              <span className="italic underline">(To be filled up by OGM Staff):</span>
              <br />
              Available Venue:
            </td>
            <td className={cell} colSpan={3}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                {rooms.map((r) => (
                  <Box key={r.id} checked={r.id === b.roomId}>{r.name}</Box>
                ))}
                <Box checked={false}>No available venue</Box>
              </div>
            </td>
          </tr>
          <tr className="h-16">
            <td className={cell}>Remarks (if any):</td>
            <td className={`${cell} whitespace-pre-wrap`} colSpan={3}>
              {[b.remarks, b.decisionNote && `Approver's note: ${b.decisionNote}`].filter(Boolean).join("\n")}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
