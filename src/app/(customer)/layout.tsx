import { redirect } from "next/navigation";
import { Nav } from "@/components/shared/Nav";
import { getCurrentUser } from "@/lib/auth";
import { QuoteProvider } from "@/lib/quote-context";

const CUSTOMER_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/catalog", label: "Catalog" },
  { href: "/quote", label: "Quote" },
  { href: "/customization", label: "Customization Requests" },
];

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Belt-and-braces: middleware already enforces this, but a guarded
  // layout means a direct server-render can never leak customer data.
  const session = await getCurrentUser();
  if (!session || session.profile.role !== "customer") {
    redirect("/login");
  }

  return (
    <QuoteProvider>
      <div className="min-h-screen bg-neutral-50">
        <Nav title="Kakawa B2B" links={CUSTOMER_LINKS} />
        <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
      </div>
    </QuoteProvider>
  );
}
