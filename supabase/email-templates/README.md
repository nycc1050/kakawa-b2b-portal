# Invite email template

Supabase's transactional emails (invite, password reset, etc.) are configured
in the dashboard, not in code — there's no API key in this repo with
permission to change them (that's the *Management API*, gated behind a
personal access token we don't have; the `service_role` key used everywhere
else in this app only talks to the database/auth data plane, not project
config).

## To apply `invite.html`

1. Supabase Dashboard → your project → **Authentication → Emails → Templates**.
2. Select **Invite user**.
3. **Subject**: `Welcome to Kakawa B2B Portal`
4. **Message body**: paste the full contents of `invite.html` in this folder, replacing whatever's there.
5. Save.

That's it — no code deploy needed, takes effect on the next invite sent.

## Notes

- The button in the template points at `{{ .ConfirmationURL }}` — Supabase
  fills this in automatically with the real invite link (which itself
  redirects to `/auth/callback` in this app, per the `redirectTo` this repo
  already passes to `inviteUserByEmail`). Don't change that part.
- `{{ .Data.full_name }}` pulls the name passed in at invite time (Admin
  console → Customers → New customer). If your Supabase project's mailer
  doesn't support that lookup, the greeting silently won't personalize —
  swap it for a plain "Hi there," if you notice that happening.
- This is HTML-only. Supabase generates its own plain-text fallback from the
  HTML automatically; there's no separate plain-text field to fill in.
- Same rate-limit caveat as everywhere else in this project: the built-in
  mailer caps invites at a handful per hour. A real SMTP provider (Resend,
  Postmark, SendGrid) under **Authentication → Emails → SMTP Settings**
  removes that cap and is also required for this template to send from a
  `kakawachocolates.com.au` address instead of Supabase's own.
