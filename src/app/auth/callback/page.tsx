"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Stage = "verifying" | "ready" | "submitting" | "error";

const MIN_PASSWORD_LENGTH = 8;
const GENERIC_INVALID_MESSAGE =
  "This invite link is invalid or has expired. Ask Kakawa to resend it.";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("verifying");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function establishSession() {
      // Supabase's hosted /auth/v1/verify endpoint (what the default
      // invite email template links to) verifies the one-time token
      // server-side and redirects here with a live session in the URL
      // *fragment* - which never reaches the server, so this has to
      // run client-side.
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        // Strip the tokens out of the URL/history now that they're used.
        window.history.replaceState(null, "", window.location.pathname);
        if (sessionError) {
          setError(GENERIC_INVALID_MESSAGE);
          setStage("error");
          return;
        }
        setStage("ready");
        return;
      }

      // Fallback path: a custom email template linking straight to this
      // page with ?token_hash=...&type=... instead of Supabase's hosted
      // /verify redirect. Handled the same way either way.
      const searchParams = new URLSearchParams(window.location.search);
      const tokenHash = searchParams.get("token_hash") ?? searchParams.get("token");
      const type = searchParams.get("type") ?? "invite";

      if (tokenHash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "invite" | "signup" | "recovery" | "email_change",
        });
        if (verifyError) {
          setError(GENERIC_INVALID_MESSAGE);
          setStage("error");
          return;
        }
        setStage("ready");
        return;
      }

      setError(GENERIC_INVALID_MESSAGE);
      setStage("error");
    }

    establishSession();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords don't match.");
      return;
    }

    setStage("submitting");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setFormError(updateError.message);
      setStage("ready");
      return;
    }

    // setSession/updateUser above already wrote the session cookies, so
    // the RSC fetch this triggers carries them straight to the guarded
    // (customer) layout.
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-900">Kakawa B2B Portal</h1>

        {stage === "verifying" && (
          <p className="mt-4 text-sm text-neutral-500">Verifying your invite...</p>
        )}

        {stage === "error" && (
          <>
            <p className="mt-1 text-sm text-neutral-500">Set up your account</p>
            <p className="mt-4 text-sm text-red-600" role="alert">
              {error}
            </p>
            <a
              href="/login"
              className="mt-4 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4 hover:text-neutral-600"
            >
              ← Back to login
            </a>
          </>
        )}

        {(stage === "ready" || stage === "submitting") && (
          <>
            <p className="mt-1 text-sm text-neutral-500">
              Create a password to finish setting up your account.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-neutral-700"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600" role="alert">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={stage === "submitting"}
                className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {stage === "submitting" ? "Setting password..." : "Set password & continue"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
