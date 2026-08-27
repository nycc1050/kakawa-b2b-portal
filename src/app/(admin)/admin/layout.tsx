import { redirect } from "next/navigation";
import { Nav } from "@/components/shared/Nav";
import { getCurrentUser } from "@/lib/auth";

const ADMIN_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/tiers", label: "Tiers" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/requests", label: "Requests" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();
  if (!session || session.profile.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Nav title="Kakawa Admin" links={ADMIN_LINKS} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
