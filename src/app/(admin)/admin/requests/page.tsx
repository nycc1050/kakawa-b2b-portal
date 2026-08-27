import Link from "next/link";
import { listAllRequestsForAdmin } from "@/lib/customization";
import { StatusBadge } from "@/components/customization/StatusBadge";
import type { RequestStatus } from "@/types/database";

interface AdminRequestsPageProps {
  searchParams: Promise<{ status?: string }>;
}

const STATUS_VALUES: RequestStatus[] = [
  "submitted",
  "in-review",
  "approved",
  "ready-to-order",
];

const FILTERS: { value: RequestStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "in-review", label: "In review" },
  { value: "approved", label: "Approved" },
  { value: "ready-to-order", label: "Ready to order" },
];

function isRequestStatus(value: string): value is RequestStatus {
  return (STATUS_VALUES as string[]).includes(value);
}

export default async function AdminRequestsPage({
  searchParams,
}: AdminRequestsPageProps) {
  const { status } = await searchParams;
  const activeStatus = status && isRequestStatus(status) ? status : undefined;
  const requests = await listAllRequestsForAdmin(activeStatus);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Customization Requests
      </h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const isActive = f.value === "all" ? !activeStatus : activeStatus === f.value;
          return (
            <Link
              key={f.value}
              href={f.value === "all" ? "/admin/requests" : `/admin/requests?status=${f.value}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                isActive
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3 font-medium">Request</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr
                key={r.id}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/requests/${r.id}`}
                    className="font-medium text-neutral-900 underline-offset-4 hover:underline"
                  >
                    #{r.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {r.customers?.company_name ?? "—"}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {r.products?.title ?? "—"}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {new Date(r.created_at).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                  No requests{activeStatus ? " with this status" : ""}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
