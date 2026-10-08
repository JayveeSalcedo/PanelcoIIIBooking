export const EVENT_TYPES = ["Meeting", "Hearing", "Seminar", "Training"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
export type Status = (typeof STATUSES)[number];

// Statuses that occupy a room's time slot.
export const ACTIVE_STATUSES: Status[] = ["pending", "approved"];

export const STATUS_STYLE: Record<Status, string> = {
  pending: "bg-amber-100 text-amber-800 ring-amber-300",
  approved: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  rejected: "bg-rose-100 text-rose-800 ring-rose-300",
  cancelled: "bg-zinc-100 text-zinc-600 ring-zinc-300",
};

// Visible hours on the availability timeline.
export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 21;

// Longest allowed booking, in days.
export const MAX_SPAN_DAYS = 31;
