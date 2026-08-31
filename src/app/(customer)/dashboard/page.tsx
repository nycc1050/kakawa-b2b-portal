import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getCurrentUser();
  const customer = session?.customer;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Welcome{customer ? `, ${customer.company_name}` : ""}
      </h1>
      {/* Pricing tier is intentionally not shown here - wholesale/volume
          discounts still apply everywhere prices are calculated, customers
          just don't see Kakawa's internal tier label. */}
      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <dt className="text-sm text-neutral-500">Company</dt>
          <dd className="mt-1 text-base font-medium text-neutral-900">
            {customer?.company_name ?? "—"}
          </dd>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <dt className="text-sm text-neutral-500">Email</dt>
          <dd className="mt-1 text-base font-medium text-neutral-900">
            {session?.profile.email ?? "—"}
          </dd>
        </div>
      </dl>
      <Link
        href="/catalog"
        className="mt-6 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
      >
        Browse catalog
      </Link>
    </div>
  );
}
