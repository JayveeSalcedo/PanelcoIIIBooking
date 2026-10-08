import { addDays, isDateStr, localDate, localTime } from "@/lib/time";
import { RequestForm } from "./RequestForm";

export default async function RequestPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const today = localDate();
  let initialDate = isDateStr(date) && date >= today ? date : today;
  let startTime = "08:00";
  let endTime = "17:00";

  // Today's 8 AM may already be past: start at the next full hour instead.
  if (initialDate === today) {
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
      <RequestForm initialDate={initialDate} startTime={startTime} endTime={endTime} />
    </div>
  );
}
