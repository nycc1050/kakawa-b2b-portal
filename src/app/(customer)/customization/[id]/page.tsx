import { notFound } from "next/navigation";
import Link from "next/link";
import { getRequest, getLogoSignedUrl } from "@/lib/customization";
import { StatusBadge } from "@/components/customization/StatusBadge";

interface RequestDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string }>;
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

export default async function RequestDetailPage({
  params,
  searchParams,
}: RequestDetailPageProps) {
  const [{ id }, { submitted }] = await Promise.all([params, searchParams]);
  const request = await getRequest(id);
  if (!request) notFound();

  const logoUrl = await getLogoSignedUrl(request.logo_file_url);

  return (
    <div>
      <Link
        href="/customization"
        className="text-sm text-neutral-500 hover:text-neutral-900"
      >
        ← Back to requests
      </Link>

      {submitted === "1" && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Request submitted — Kakawa will review it and update the status here.
        </div>
      )}

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Request #{request.id.slice(0, 8)}
          </h1>
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

      <dl className="mt-6 space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
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

      {request.admin_notes && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs uppercase tracking-wide text-blue-400">
            Notes from Kakawa
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-blue-900">
            {request.admin_notes}
          </p>
        </div>
      )}
    </div>
  );
}
