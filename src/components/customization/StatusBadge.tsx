import type { RequestStatus } from "@/types/database";

const STYLES: Record<RequestStatus, string> = {
  submitted: "bg-neutral-100 text-neutral-700",
  "in-review": "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  "ready-to-order": "bg-emerald-100 text-emerald-800",
};

const LABELS: Record<RequestStatus, string> = {
  submitted: "Submitted",
  "in-review": "In review",
  approved: "Approved",
  "ready-to-order": "Ready to order",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
