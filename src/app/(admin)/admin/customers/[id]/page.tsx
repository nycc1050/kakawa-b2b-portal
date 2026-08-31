import { notFound } from "next/navigation";
import { getCustomer, getCustomerRequestHistory, listActiveTiers } from "@/lib/customers";
import { EditCustomerForm } from "@/components/admin/EditCustomerForm";
import { ToggleActiveButton } from "@/components/admin/ToggleActiveButton";
import { StatusBadge } from "@/components/customization/StatusBadge";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const [customer, tiers, requests] = await Promise.all([
    getCustomer(id),
    listActiveTiers(),
    getCustomerRequestHistory(id),
  ]);

  if (!customer) notFound();

  const [firstName, ...rest] = (customer.profiles?.full_name ?? "").trim().split(/\s+/);
  const lastName = rest.join(" ");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        {customer.company_name}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">{customer.profiles?.email}</p>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-neutral-700">Details</h2>
          <div className="mt-3">
            <EditCustomerForm
              customerId={customer.id}
              companyName={customer.company_name}
              firstName={firstName || ""}
              lastName={lastName}
              phone={customer.phone}
              tierId={customer.tier_id}
              tiers={tiers}
            />
          </div>
          <div className="mt-6">
            <ToggleActiveButton customerId={customer.id} isActive={customer.is_active} />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-neutral-700">
            Customization request history
          </h2>
          {requests.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-400">No requests yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {requests.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {r.products?.title ?? "Unknown product"}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {new Date(r.created_at).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
