"use client";

import { useActionState, useEffect, useState } from "react";
import { checkAvailability, submitRequest, type SlotRoom } from "@/app/actions";
import { EVENT_TYPES } from "@/lib/constants";
import { fmtDuration, localDate, localTime, toInstant } from "@/lib/time";

type Fields = Record<
  | "eventType" | "title" | "department" | "startDate" | "startTime" | "endDate" | "endTime"
  | "roomId" | "pax" | "requestedBy" | "contact" | "remarks",
  string
>;

const BADGE = {
  free: ["Available", "bg-emerald-100 text-emerald-800"],
  pending: ["Pending approval", "bg-amber-100 text-amber-800"],
  booked: ["Booked", "bg-rose-100 text-rose-800"],
} as const;

const HOUR = 3_600_000;

export function RequestForm({
  initialDate,
  startTime,
  endTime,
  roomId = "",
}: {
  initialDate: string;
  startTime: string;
  endTime: string;
  roomId?: string;
}) {
  const [state, formAction, submitting] = useActionState(submitRequest, {});
  const [f, setF] = useState<Fields>({
    eventType: "", title: "", department: "",
    startDate: initialDate, startTime, endDate: initialDate, endTime,
    roomId, pax: "", requestedBy: "", contact: "", remarks: "",
  });
  const [rooms, setRooms] = useState<SlotRoom[] | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setF((prev) => {
      const next = { ...prev, [k]: value };
      // Moving the start moves the end with it, keeping the same duration (1 hour if there was none).
      if (k === "startDate" || k === "startTime") {
        const oldStart = toInstant(prev.startDate, prev.startTime);
        const oldEnd = toInstant(prev.endDate, prev.endTime);
        const newStart = toInstant(next.startDate, next.startTime);
        if (newStart) {
          const span = oldStart && oldEnd && oldEnd > oldStart ? oldEnd.getTime() - oldStart.getTime() : HOUR;
          const newEnd = new Date(newStart.getTime() + span);
          next.endDate = localDate(newEnd);
          next.endTime = localTime(newEnd);
        }
      }
      return next;
    });
  };

  // Re-check room vacancy whenever the requested time changes.
  useEffect(() => {
    let stale = false;
    setChecking(true);
    const t = setTimeout(async () => {
      const res = await checkAvailability(f.startDate, f.startTime, f.endDate, f.endTime);
      if (stale) return;
      setChecking(false);
      if ("error" in res) {
        setSlotError(res.error);
        setRooms(null);
      } else {
        setSlotError(null);
        setRooms(res.rooms);
      }
    }, 300);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [f.startDate, f.startTime, f.endDate, f.endTime]);

  const start = toInstant(f.startDate, f.startTime);
  const end = toInstant(f.endDate, f.endTime);
  const pax = Number(f.pax) || 0;

  const unavailable = (r: SlotRoom) => r.availability !== "free" || (r.capacity != null && pax > r.capacity);
  const selected = rooms?.find((r) => String(r.id) === f.roomId);
  const roomOk = !!selected && !unavailable(selected);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {state.error}
        </div>
      )}

      <section className="card space-y-4 p-5">
        <h2 className="font-semibold">Event</h2>
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <div>
            <label className="label" htmlFor="eventType">Type of event</label>
            <select id="eventType" name="eventType" required value={f.eventType} onChange={set("eventType")} className="input">
              <option value="" disabled>Select…</option>
              {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="title">Event title</label>
            <input id="title" name="title" required maxLength={200} value={f.title} onChange={set("title")} className="input" placeholder="e.g. Committee hearing on the 2027 budget" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <div>
            <label className="label" htmlFor="department">Department / Committee</label>
            <input id="department" name="department" required maxLength={200} value={f.department} onChange={set("department")} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="pax">Expected participants (pax)</label>
            <input id="pax" name="pax" type="number" min={1} required value={f.pax} onChange={set("pax")} className="input" />
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Date &amp; time</h2>
          {start && end && end > start && (
            <span className="text-sm text-zinc-600">
              Duration: <strong>{fmtDuration(start, end)}</strong>
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="startDate">Start date</label>
            <input id="startDate" name="startDate" type="date" required value={f.startDate} onChange={set("startDate")} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="endDate">End date</label>
            <input id="endDate" name="endDate" type="date" required min={f.startDate} value={f.endDate} onChange={set("endDate")} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="startTime">Start time</label>
            <input id="startTime" name="startTime" type="time" required value={f.startTime} onChange={set("startTime")} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="endTime">End time</label>
            <input id="endTime" name="endTime" type="time" required value={f.endTime} onChange={set("endTime")} className="input" />
          </div>
        </div>
        <p className="text-xs text-zinc-500">For multi-day events, set the end date — the room is reserved from the start until the end.</p>
      </section>

      <section className="card space-y-3 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Room</h2>
          {checking && <span className="text-xs text-zinc-500">Checking vacancy…</span>}
        </div>
        {slotError && <p className="text-sm text-rose-700">{slotError}</p>}
        <input type="hidden" name="roomId" value={roomOk ? f.roomId : ""} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rooms?.map((r) => {
            const disabled = unavailable(r);
            const [label, badge] = BADGE[r.availability];
            const tooSmall = r.capacity != null && pax > r.capacity;
            return (
              <label
                key={r.id}
                className={`relative block rounded-lg border p-3 text-sm transition ${
                  disabled
                    ? "cursor-not-allowed border-zinc-200 bg-zinc-50 opacity-60"
                    : String(r.id) === f.roomId
                      ? "cursor-pointer border-brand-600 bg-brand-50 ring-2 ring-accent-400"
                      : "cursor-pointer border-zinc-200 hover:border-zinc-400"
                }`}
              >
                <input
                  type="radio"
                  name="roomChoice"
                  value={r.id}
                  disabled={disabled}
                  checked={String(r.id) === f.roomId}
                  onChange={() => setF((p) => ({ ...p, roomId: String(r.id) }))}
                  className="sr-only"
                />
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{r.name}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${badge}`}>{label}</span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {r.capacity ? `Up to ${r.capacity} pax` : "Capacity not set"}
                  {tooSmall && <span className="text-rose-700"> · too small for {pax} pax</span>}
                </div>
                {r.conflicts.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-xs text-zinc-600">
                    {r.conflicts.map((c, i) => (
                      <li key={i}>
                        {c.status === "approved" ? "Booked" : "Pending approval"}: {c.title} ({c.department}) — {c.when}
                      </li>
                    ))}
                  </ul>
                )}
              </label>
            );
          })}
        </div>
        {rooms?.some((r) => r.availability === "pending") && (
          <p className="text-xs text-zinc-500">
            Rooms marked &ldquo;Pending approval&rdquo; are on hold for another request at this time and can&apos;t be requested
            unless that request is rejected or cancelled.
          </p>
        )}
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-semibold">Requester</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="requestedBy">Requested by</label>
            <input id="requestedBy" name="requestedBy" required maxLength={200} value={f.requestedBy} onChange={set("requestedBy")} className="input" placeholder="Full name and position" />
          </div>
          <div>
            <label className="label" htmlFor="contact">Contact no. / email <span className="font-normal text-zinc-400">(optional)</span></label>
            <input id="contact" name="contact" maxLength={100} value={f.contact} onChange={set("contact")} className="input" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="remarks">Remarks / special needs <span className="font-normal text-zinc-400">(optional)</span></label>
          <textarea id="remarks" name="remarks" rows={3} maxLength={2000} value={f.remarks} onChange={set("remarks")} className="input" placeholder="Projector, sound system, seating arrangement…" />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting || !roomOk} className="btn-primary">
          {submitting ? "Submitting…" : "Submit request"}
        </button>
        {!roomOk && <span className="text-sm text-zinc-500">Choose an available room to continue.</span>}
      </div>
    </form>
  );
}
