import { isDateStr, localDate } from "@/lib/time";
import { RequestForm } from "./RequestForm";

export default async function RequestPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const today = localDate();
  const initialDate = isDateStr(date) && date >= today ? date : today;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Request a room</h1>
        <p className="text-sm text-zinc-500">
          Your request will be reviewed by the approver. You&apos;ll get a reference number to check its status.
        </p>
      </div>
      <RequestForm initialDate={initialDate} />
    </div>
  );
}
