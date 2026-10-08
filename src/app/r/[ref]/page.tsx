import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelByRef } from "@/app/actions";
import { RefModal } from "@/components/RefModal";
import { BookingDetails } from "@/components/BookingDetails";
import { StatusBadge } from "@/components/StatusBadge";
import { getByRef } from "@/lib/bookings";
import { fmtDate, fmtTime } from "@/lib/time";

export const dynamic = "force-dynamic";

const MESSAGE = {
  pending: "Waiting for the approver to review your request.",
  approved: "Your booking is confirmed.",
  rejected: "Your request was not approved.",
  cancelled: "This booking was cancelled.",
};

export default async function RequestStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { ref } = await params;
  const { new: isNew } = await searchParams;
  const b = await getByRef(decodeURIComponent(ref));
  if (!b) notFound();

  const canCancel = (b.status === "pending" || b.status === "approved") && b.endsAt > new Date();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {isNew && <RefModal refNo={b.ref} />}

      <div className="card space-y-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-zinc-500">{b.ref}</p>
            <h1 className="text-xl font-semibold">{b.title}</h1>
          </div>
          <StatusBadge status={b.status} />
        </div>

        <p className="text-sm text-zinc-700">{MESSAGE[b.status]}</p>
        {b.decisionNote && (
          <p className="rounded-lg bg-zinc-50 px-3 py-2 text-sm">
            <span className="text-zinc-500">Approver&apos;s note: </span>
            {b.decisionNote}
          </p>
        )}

        <BookingDetails booking={b} />

        <p className="text-xs text-zinc-500">
          Submitted {fmtDate(b.createdAt)} at {fmtTime(b.createdAt)}
          {b.decidedAt && ` · Updated ${fmtDate(b.decidedAt)} at ${fmtTime(b.decidedAt)}`}
        </p>

        {canCancel && (
          <form action={cancelByRef.bind(null, b.ref)} className="border-t border-zinc-100 pt-4">
            <button className="btn-secondary text-rose-700">Cancel this request</button>
          </form>
        )}
      </div>

      <Link href="/" className="text-sm text-brand-700 hover:underline">← Back to availability</Link>
    </div>
  );
}
