// All dates and times are entered and shown in the office's local timezone.
export const TZ = "Asia/Manila";
export const TZ_OFFSET = "+08:00";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export function isDateStr(s: unknown): s is string {
  return typeof s === "string" && DATE_RE.test(s) && !isNaN(Date.parse(`${s}T00:00:00Z`));
}

/** Local date ("YYYY-MM-DD") + time ("HH:mm") → instant. */
export function toInstant(date: string, time: string): Date | null {
  if (!isDateStr(date) || !TIME_RE.test(time)) return null;
  const d = new Date(`${date}T${time}:00${TZ_OFFSET}`);
  return isNaN(d.getTime()) ? null : d;
}

const isoDateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const dateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hour: "numeric",
  minute: "2-digit",
});

/** Instant → local "YYYY-MM-DD". */
export function localDate(d: Date = new Date()): string {
  return isoDateFmt.format(d);
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function fmtDate(d: Date | string): string {
  return dateFmt.format(typeof d === "string" ? new Date(`${d}T12:00:00${TZ_OFFSET}`) : d);
}

export function fmtTime(d: Date): string {
  return timeFmt.format(d);
}

export function fmtRange(start: Date, end: Date): string {
  if (localDate(start) === localDate(end)) {
    return `${fmtDate(start)}, ${fmtTime(start)} – ${fmtTime(end)}`;
  }
  return `${fmtDate(start)} ${fmtTime(start)} – ${fmtDate(end)} ${fmtTime(end)}`;
}

/** Number of calendar days the range touches (1 for a same-day event). */
export function daySpan(start: Date, end: Date): number {
  const a = Date.parse(`${localDate(start)}T00:00:00Z`);
  const b = Date.parse(`${localDate(end)}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000) + 1;
}

export function fmtDuration(start: Date, end: Date): string {
  const days = daySpan(start, end);
  if (days > 1) return `${days} days`;
  const mins = Math.round((end.getTime() - start.getTime()) / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return [h && `${h} hr${h > 1 ? "s" : ""}`, m && `${m} min`].filter(Boolean).join(" ") || "0 min";
}

const longDateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  month: "long",
  day: "numeric",
  year: "numeric",
});

/** "August 28, 2026 | 9:30 AM – 12:00 PM", as written on the paper form. */
export function fmtFormRange(start: Date, end: Date): string {
  if (localDate(start) === localDate(end)) {
    return `${longDateFmt.format(start)}  |  ${fmtTime(start)} – ${fmtTime(end)}`;
  }
  return `${longDateFmt.format(start)} ${fmtTime(start)} – ${longDateFmt.format(end)} ${fmtTime(end)}`;
}

export function fmtLongDate(d: Date): string {
  return longDateFmt.format(d);
}

export function localYear(d: Date): string {
  return localDate(d).slice(0, 4);
}
