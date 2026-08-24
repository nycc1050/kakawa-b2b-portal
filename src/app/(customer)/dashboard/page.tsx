import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getCurrentUser();
  const customer = session?.customer;
  const tier = session?.tier;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Welcome{customer ? `, ${customer.company_name}` : ""}
      </h1>
      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <dt className="text-sm text-neutral-500">Company</dt>
          <dd className="mt-1 text-base font-medium text-neutral-900">
            {customer?.company_name ?? "—"}
          </dd>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <dt className="text-sm text-neutral-500">Pricing tier</dt>
          <dd className="mt-1 text-base font-medium text-neutral-900">
            {tier ? tier.name : "Not yet assigned — contact Kakawa"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
