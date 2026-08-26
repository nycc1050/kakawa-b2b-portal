import { requireAdmin } from "@/lib/auth";
import { listActiveTiers } from "@/lib/customers";
import { CreateCustomerForm } from "@/components/admin/CreateCustomerForm";

export default async function NewCustomerPage() {
  await requireAdmin();
  const tiers = await listActiveTiers();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">New Customer</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Sends a Supabase invite email so they can set a password and log in.
      </p>
      <div className="mt-6">
        <CreateCustomerForm tiers={tiers} />
      </div>
    </div>
  );
}
