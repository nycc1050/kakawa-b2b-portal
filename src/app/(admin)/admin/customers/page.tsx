import Link from "next/link";
import { listCustomers } from "@/lib/customers";

export default async function AdminCustomersPage() {
  const customers = await listCustomers();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Customers</h1>
        <Link
          href="/admin/customers/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          New customer
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Tier</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr
                key={c.id}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="font-medium text-neutral-900 underline-offset-4 hover:underline"
                  >
                    {c.company_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {c.profiles?.email ?? "—"}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {c.tiers?.name ?? (
                    <span className="text-amber-600">Not assigned</span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {new Date(c.created_at).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      c.is_active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {c.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
