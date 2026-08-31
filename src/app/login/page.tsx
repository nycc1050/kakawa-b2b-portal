"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

function RedirectToField() {
  // Reads ?redirectTo=... set by middleware when a deep link (e.g. a
  // bookmarked /quote) bounced an unauthenticated visit here, so login()
  // can send the customer back to it instead of always defaulting to
  // /catalog.
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  if (!redirectTo) return null;
  return <input type="hidden" name="redirectTo" value={redirectTo} />;
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-900">
          Kakawa B2B Portal
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Sign in with the account details Kakawa sent you.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <Suspense fallback={null}>
            <RedirectToField />
          </Suspense>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-xs text-neutral-400">
          No account yet? Ask Kakawa to invite you.
        </p>
      </div>
    </main>
  );
}
