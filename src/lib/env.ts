/**
 * Base URL of this app, for building absolute links (e.g. auth
 * redirectTo). Prefers an explicit override, then falls back to
 * Vercel's own stable production domain (auto-injected at build/runtime
 * on Vercel, no manual config needed), then localhost for local dev.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}
