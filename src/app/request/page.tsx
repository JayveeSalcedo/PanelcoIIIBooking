import { addDays, isDateStr, localDate, localTime } from "@/lib/time";
import { RequestForm } from "./RequestForm";

const isTime = (s: unknown): s is string => typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

export default async function RequestPage({ searchParams }: { searchParams: Promise<{ date?: string; start?: string; end?: string; room?: string }> }) {
  const { date, start, end, room } = await searchParams;
  const today = localDate();
  let initialDate = isDateStr(date) && date >= today ? date : today;
  let startTime = "08:00";
  let endTime = "17:00";

  const fromSlot = isTime(start) && isTime(end) && start < end;
  if (fromSlot) {
    // Picked from the availability timeline.
    startTime = start;
    endTime = end;
  } else if (initialDate === today) {
    // Today's 8 AM may already be past: start at the next full hour instead.
    const now = localTime(new Date());
    const nextHour = Number(now.slice(0, 2)) + 1;
    if (nextHour >= 22) {
      initialDate = addDays(today, 1);
    } else if (now >= startTime) {
      startTime = `${String(nextHour).padStart(2, "0")}:00`;
      if (startTime >= "16:00") endTime = `${String(nextHour + 1).padStart(2, "0")}:00`;
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Request a room</h1>
        <p className="text-sm text-zinc-500">
          Your request will be reviewed by the approver. You&apos;ll get a reference number to check its status.
        </p>
      </div>
      <RequestForm
        initialDate={initialDate}
        startTime={startTime}
        endTime={endTime}
        roomId={fromSlot && room && /^\d+$/.test(room) ? room : ""}
      />
    </div>
  );
}
