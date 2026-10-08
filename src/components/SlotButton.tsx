"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type Slot = {
  href: string; // request form link with date, times and room prefilled
  roomName: string;
  dateLabel: string;
  timeLabel: string; // the clicked hour, e.g. "9:00 AM – 10:00 AM"
  freeUntil: string; // end of the free stretch, e.g. "1:00 PM"
};

/** An empty hour on the availability timeline; clicking it offers to request that room for that hour. */
export function SlotButton({ slot, style }: { slot: Slot; style: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Request ${slot.roomName}, ${slot.dateLabel}, ${slot.timeLabel}`}
        title={`Available ${slot.timeLabel} — click to request`}
        className="absolute inset-y-1 rounded-md transition hover:bg-brand-50 hover:ring-2 hover:ring-inset hover:ring-accent-400 focus-visible:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400"
        style={style}
      />
      {open && (
        <dialog
          ref={dialog}
          onClose={() => setOpen(false)}
          aria-labelledby="slot-title"
          className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-zinc-900/60"
        >
          <div className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
              ✓
            </div>
            <div className="space-y-1">
              <h2 id="slot-title" className="text-lg font-semibold">{slot.roomName} is available</h2>
              <p className="text-sm text-zinc-600">
                {slot.dateLabel}
                <br />
                <strong>{slot.timeLabel}</strong>
              </p>
              <p className="text-xs text-zinc-500">Free until {slot.freeUntil}. You can adjust the time on the form.</p>
            </div>
            <Link href={slot.href} className="btn-primary w-full py-2.5">Open request form</Link>
            <form method="dialog">
              <button className="btn-secondary w-full">Close</button>
            </form>
          </div>
        </dialog>
      )}
    </>
  );
}
