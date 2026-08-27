"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/app/login/actions";

interface NavProps {
  title: string;
  links: { href: string; label: string }[];
}

export function Nav({ title, links }: NavProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-neutral-900">{title}</span>
          <nav className="hidden gap-4 md:flex">
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

        <div className="flex items-center gap-4">
          <form action={logout} className="hidden md:block">
            <button
              type="submit"
              className="text-sm text-neutral-500 hover:text-neutral-900"
            >
              Sign out
            </button>
          </form>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle navigation menu"
            className="-mr-1 p-1 text-neutral-600 hover:text-neutral-900 md:hidden"
          >
            {open ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-neutral-200 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm text-neutral-600 hover:text-neutral-900"
              >
                {l.label}
              </Link>
            ))}
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-neutral-500 hover:text-neutral-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </nav>
      )}
    </header>
  );
}
