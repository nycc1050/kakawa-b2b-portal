import Link from "next/link";
import { logout } from "@/app/login/actions";

interface NavProps {
  title: string;
  links: { href: string; label: string }[];
}

export function Nav({ title, links }: NavProps) {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-neutral-900">{title}</span>
          <nav className="flex gap-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-neutral-600 hover:text-neutral-900"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
