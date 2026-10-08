import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelByRef } from "@/app/actions";
import { RefModal } from "@/components/RefModal";
import { BookingDetails } from "@/components/BookingDetails";
import { PrintButton } from "@/components/PrintButton";
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
  const isApproved = b.status === "approved";

  return (
    <div className="mx-auto max-w-2xl space-y-6 print:max-w-none">
      {isNew && <RefModal refNo={b.ref} />}

      <div className="card space-y-5 p-5 print:border-0 print:p-0 print:shadow-none">
        {isApproved && (
          <div className="hidden border-b-2 border-zinc-900 pb-3 text-center print:block">
            <p className="text-sm font-medium uppercase tracking-widest text-zinc-600">Room Booking</p>
            <h2 className="text-2xl font-bold uppercase">Approved Room Booking Form</h2>
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-zinc-500">{b.ref}</p>
            <h1 className="text-xl font-semibold">{b.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={b.status} />
            {isApproved && <PrintButton label="Print approved form" />}
          </div>
        </div>

        <p className="text-sm text-zinc-700 print:hidden">{MESSAGE[b.status]}</p>
        {b.decisionNote && (
          <p className="rounded-lg bg-zinc-50 px-3 py-2 text-sm">
            <span className="text-zinc-500">Approver&apos;s note: </span>
            {b.decisionNote}
          </p>
        )}

        <BookingDetails booking={b} />

        <p className="text-xs text-zinc-500">
          Submitted {fmtDate(b.createdAt)} at {fmtTime(b.createdAt)}
          {b.decidedAt && ` · ${isApproved ? "Approved" : "Updated"} ${fmtDate(b.decidedAt)} at ${fmtTime(b.decidedAt)}`}
        </p>

        {isApproved && (
          <div className="hidden grid-cols-2 gap-12 pt-16 text-sm print:grid">
            <div className="border-t border-zinc-900 pt-1 text-center">Requested by</div>
            <div className="border-t border-zinc-900 pt-1 text-center">Approved by</div>
          </div>
        )}

        {canCancel && (
          <form action={cancelByRef.bind(null, b.ref)} className="border-t border-zinc-100 pt-4 print:hidden">
            <button className="btn-secondary text-rose-700">Cancel this request</button>
          </form>
        )}
      </div>

      <Link href="/" className="text-sm text-brand-700 hover:underline print:hidden">← Back to availability</Link>
    </div>
  );
}
