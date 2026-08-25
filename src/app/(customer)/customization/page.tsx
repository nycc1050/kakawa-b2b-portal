import Link from "next/link";
import { listMyRequests } from "@/lib/customization";
import { StatusBadge } from "@/components/customization/StatusBadge";

export default async function CustomizationListPage() {
  const requests = await listMyRequests();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Customization Requests
        </h1>
        <Link
          href="/customization/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          New request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-8 text-center">
          <p className="text-sm text-neutral-500">No requests yet.</p>
          <Link
            href="/customization/new"
            className="mt-3 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4 hover:text-neutral-600"
          >
            Submit your first request →
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400">
                <th className="px-4 py-3 font-medium">Request</th>
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
                      href={`/customization/${r.id}`}
                      className="font-medium text-neutral-900 underline-offset-4 hover:underline"
                    >
                      #{r.id.slice(0, 8)}
                    </Link>
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
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
