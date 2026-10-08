import { STATUS_STYLE, type Status } from "@/lib/constants";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${STATUS_STYLE[status]}`}>
      {status}
    </span>
  );
}
