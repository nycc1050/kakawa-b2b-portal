import { notFound } from "next/navigation";
import Link from "next/link";
import { getRequestForAdmin, getLogoSignedUrl } from "@/lib/customization";
import { StatusBadge } from "@/components/customization/StatusBadge";
import { UpdateRequestForm } from "@/components/admin/UpdateRequestForm";

interface AdminRequestDetailPageProps {
  params: Promise<{ id: string }>;
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-400">{label}</dt>
      <dd className="mt-1 text-sm text-neutral-800 whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

export default async function AdminRequestDetailPage({
  params,
}: AdminRequestDetailPageProps) {
  const { id } = await params;
  const request = await getRequestForAdmin(id);
  if (!request) notFound();

  const logoUrl = await getLogoSignedUrl(request.logo_file_url);

  return (
    <div>
      <Link
        href="/admin/requests"
        className="text-sm text-neutral-500 hover:text-neutral-900"
      >
        ← Back to requests
      </Link>

      <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Request #{request.id.slice(0, 8)}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {request.customers?.company_name ?? "Unknown company"}
            {request.customers?.profiles?.email
              ? ` · ${request.customers.profiles.email}`
              : ""}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {request.products?.title ?? "Unknown product"} · submitted{" "}
            {new Date(request.created_at).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <dl className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
          <Field
            label="Estimated quantity"
            value={request.estimated_quantity ? String(request.estimated_quantity) : null}
          />
          <Field label="Color preferences" value={request.color_preferences} />
          <Field label="Embossing / printing / stamping" value={request.embossing_details} />
          <Field label="Special instructions" value={request.special_instructions} />
          {logoUrl && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-400">
                Logo file
              </dt>
              <dd className="mt-1">
                <a
                  href={logoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-neutral-900 underline underline-offset-4 hover:text-neutral-600"
                >
                  View uploaded file →
                </a>
              </dd>
            </div>
          )}
        </dl>

        <div>
          <h2 className="text-sm font-medium text-neutral-700">
            Update status &amp; notes
          </h2>
          <div className="mt-3">
            <UpdateRequestForm
              requestId={request.id}
              status={request.status}
              adminNotes={request.admin_notes}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
