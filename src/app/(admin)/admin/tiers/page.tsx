import Link from "next/link";
import { listTiersWithCounts } from "@/lib/tiers";

export default async function AdminTiersPage() {
  const tiers = await listTiersWithCounts();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Pricing Tiers</h1>
        <Link
          href="/admin/tiers/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          New tier
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3 font-medium">Tier</th>
              <th className="px-4 py-3 font-medium">Base discount</th>
              <th className="px-4 py-3 font-medium">Customers</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t) => (
              <tr
                key={t.id}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/tiers/${t.id}`}
                    className="font-medium text-neutral-900 underline-offset-4 hover:underline"
                  >
                    {t.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {Math.round(t.base_discount_percent * 100)}% off
                </td>
                <td className="px-4 py-3 text-neutral-600">{t.customerCount}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      t.is_active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {t.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
            {tiers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                  No tiers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
