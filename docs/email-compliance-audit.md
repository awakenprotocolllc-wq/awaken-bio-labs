# Email Marketing Compliance Audit & Implementation Report

**Company:** Awaken Biolabs LLC (Las Vegas, NV)
**Date:** June 2026
**Scope:** CAN-SPAM Act (15 U.S.C. §7701 et seq.) technical controls, per FTC guidance ("CAN-SPAM Act: A Compliance Guide for Business")
**Prepared by:** Automated audit + implementation (Claude Code session)

> **Legal disclaimer:** This document describes *technical controls*. Software alone
> does not guarantee legal compliance. Items requiring business decisions or legal
> review are listed in §17–18 and must be completed by a human.

---

## 1. Executive Summary

The application had **no marketing email sends at the time of audit** — all 15
existing email templates are transactional or relationship messages. However, the
ingredients of a future marketing program already existed (a `marketingOptIn`
boolean on customer accounts and an admin CSV export filtered by opt-in) with
**none** of the required compliance infrastructure: no unsubscribe mechanism, no
suppression list, no consent history, no compliant footer, no bounce/complaint
handling, and opt-out memory that was erased on account deletion.

This engagement implemented a complete, centralized marketing-consent system so
that any future marketing send is compliant by construction, and made the existing
opt-in surfaces feed it correctly.

## 2. Current Architecture Discovered

- **Framework:** Next.js 14 (App Router), TypeScript
- **Database:** Vercel KV (Redis) — no SQL; "migrations" are additive key namespaces
- **Email provider:** **Resend** (REST API via `lib/email.ts`). No other ESP, no CRM,
  no Mailchimp/Klaviyo/SendGrid, no SMS
- **Auth:** cookie sessions (admin / affiliate / customer), KV-backed
- **Scheduled jobs:** one Vercel cron (`/api/health`) — does not send customer email

## 3. Email Collection Points (complete inventory)

| # | Surface | Purpose | Marketing? |
|---|---------|---------|-----------|
| 1 | Checkout (`/api/orders`) | order processing | No — transactional only |
| 2 | Customer signup (`/api/customer/signup`) | account creation | No; `marketingOptIn` defaults **false**, no pre-checked box ✅ |
| 3 | Account settings toggle (`/api/customer/settings`) | the only marketing opt-in | **Yes** — now synced to central model with disclosure |
| 4 | Contact form (`/api/contact`) | requested response to admin | No |
| 5 | Affiliate application (`/api/affiliates`) | program application | No (relationship) |
| 6 | Restock notify (`/api/stock/notify`) | requested one-time alert | Borderline — see §17 |
| 7 | Admin customers CSV export | data export | Indirect marketing source — now suppression-aware |

There are **no** newsletter forms, waitlists, lead-gen forms, CSV *imports*, CRM
integrations, or bulk-send tools in the codebase.

## 4. Marketing Send Paths

**None existed.** The new `lib/marketing-email.ts` (`sendMarketingEmail`) is now the
only sanctioned path, and it enforces eligibility, footer, and headers at send time.

## 5. Transactional / Relationship Send Paths (unchanged, correctly exempt)

- `lib/order-emails.ts` — order confirmation, admin new-order notice, discount-applied
- `lib/customer-emails.ts` — verification, password reset, welcome, account deletion
- `lib/affiliate-emails.ts` — 7 program-lifecycle emails (application, contract,
  credentials, program switch, welcome back, password reset, deletion)
- `lib/stock-emails.ts` — back-in-stock alert (user-requested, one-time, list cleared
  after send)
- `/api/contact`, `/api/affiliates`, `/api/admin/test-email` — internal/admin

## 6. Third-Party Providers

**Resend only.** Resend supports custom SMTP headers (used for List-Unsubscribe) and
signed webhooks (Svix scheme) for `email.bounced` / `email.complained` — both now
implemented.

## 7. Data Model (KV namespaces added)

- `mkt:consent:<email>` — authoritative `MarketingConsent` record: status
  (`subscribed | unsubscribed | suppressed | bounced | complained |
  pending_confirmation`), source, consent disclosure version, IP/UA at consent,
  subscribed/unsubscribed timestamps, unsubscribe source/reason, suppression
  reason, created/updated timestamps. **Keyed by email**, so suppression survives
  account deletion.
- `mkt:audit` — capped (5,000) audit event list
- `mkt:webhook:seen:<svix-id>` — webhook dedupe keys (30-day TTL)

No destructive changes. Existing `CustomerAccount.marketingOptIn` retained as a UI
convenience; the central record is authoritative. **Existing customers were NOT
backfilled as "subscribed"** — see §17.

## 8. Compliance Gaps Found → Fixed

| Gap | Fix |
|---|---|
| No unsubscribe mechanism anywhere | HMAC-token one-click unsubscribe (API + page) |
| No suppression list | Central consent model with strictness ordering |
| Opt-in was an ambiguous boolean with no history | Full consent record w/ timestamps, source, disclosure version, IP/UA |
| Account deletion erased opt-out memory | Consent keyed by email; deletion no longer removes it |
| No send-time eligibility check | `canSendMarketingEmail()` called inside `sendMarketingEmail()` immediately before dispatch; fail-closed |
| Profile update could resubscribe silently | `subscribeMarketing()` blocks over unsubscribed (unless owner-initiated `resubscribe`) and always blocks over bounce/complaint/manual suppression |
| No bounce/complaint handling | Resend webhook with signature verification, replay window, dedupe |
| No compliant footer | `buildMarketingFooter()` — legal name, physical postal address, unsubscribe link, opt-in reminder |
| No List-Unsubscribe headers | RFC 2369 + RFC 8058 headers on every marketing send |
| CSV export ignored suppression | Export now marks "Marketing Eligible" from the central model, fail-closed |
| Opt-in checkbox had no disclosure | Consent language added at the point of collection |

## 9. Files Changed / Created

**New:**
- `lib/marketing-consent.ts` — consent state machine, suppression, audit, `canSendMarketingEmail`
- `lib/unsubscribe-token.ts` — HMAC-SHA256 tokens (v1 format, 400-day window, constant-time verify)
- `lib/marketing-email.ts` — centralized marketing send service
- `app/api/marketing/unsubscribe/route.ts` — one-click POST (RFC 8058) + GET
- `app/unsubscribe/page.tsx` — accessible, mobile-responsive confirmation page
- `app/api/webhooks/resend/route.ts` — bounce/complaint sync
- `app/api/admin/marketing-eligible/route.ts` — suppression-aware export source
- `tests/unsubscribe-token.test.ts`, `tests/marketing-consent.test.ts`, `tests/marketing-email.test.ts`

**Modified:**
- `lib/email.ts` — optional `headers` and `fromOverride` passthrough
- `middleware.ts` — Origin-check exemption for one-click unsubscribe (documented rationale)
- `app/api/customer/settings/route.ts` — toggle syncs central model; blocked resubscribes revert the UI flag and inform the user
- `app/account/AccountContent.tsx` — consent disclosure at point of collection
- `app/admin/customers/CustomersClient.tsx` — suppression-aware CSV export
- `package.json` — vitest + `npm test`

## 10. Unsubscribe Architecture

```
Marketing email footer link ──▶ GET /unsubscribe?token=v1.…   (page, processes + confirms)
List-Unsubscribe header      ──▶ POST /api/marketing/unsubscribe?token=…  (RFC 8058 one-click)
mailto fallback              ──▶ support@awakenbiolabs.com (manual — see §17)
```

- No login, no fee, no reason required, no extra data collected
- Idempotent; repeated requests safe; never downgrades a stricter suppression
- Token: HMAC-SHA256 over `email.issuedAt`, base64url, constant-time compare,
  400-day validity (exceeds CAN-SPAM's 30-day post-send minimum), no DB IDs exposed
- Deliberately **not rate-limited** — an opt-out must never be throttled away;
  abuse is bounded by the signature requirement
- Errors return non-200 so the mail client/user knows the opt-out did NOT process

## 11. Suppression Architecture

Strictness ordering (never auto-downgraded):
`complained (5) > bounced (4) > suppressed (3) > unsubscribed (2) > pending (1) > subscribed (0)`

- Re-import/re-signup cannot restore eligibility (`subscribe` without `resubscribe` is blocked)
- Owner-initiated resubscribe (authenticated account settings) may clear
  `unsubscribed` only — never bounce/complaint/manual suppression
- `canSendMarketingEmail` fails closed on any datastore error

## 12. Provider Synchronization

- **Inbound:** Resend → `/api/webhooks/resend` (bounces, complaints). Svix HMAC
  signature verified with `RESEND_WEBHOOK_SECRET`, 5-minute replay window, svix-id
  dedupe, 500-on-error so Svix retries (events are not lost).
- **Outbound:** Not required — Resend's send API has no subscriber list to sync for
  plain API sends; suppression is enforced in-app before every dispatch. If Resend
  Audiences/Broadcasts are adopted later, propagation must be added (flagged, §17).

## 13. Admin Protections

- CSV export "Marketing Eligible" column reflects the central model, fail-closed
- No admin resubscribe tool exists — bounce/complaint suppression cannot be cleared
  from any UI (deliberate; remediation would need a purpose-built, logged flow)
- All consent mutations are audit-logged with actor/source

## 14. Audit Logging

`mkt:audit` records: subscribe, subscribe_blocked, resubscribe, unsubscribe,
suppress, bounce_suppress, complaint_suppress, provider_webhook, marketing_send,
marketing_send_skipped. No tokens or secrets are logged.

## 15. Testing

24 automated tests (vitest, `npm test`), covering: eligibility for
subscribed/unsubscribed/suppressed/bounced/complained/unknown; unsubscribe
idempotency; import-style resubscribe blocked; owner resubscribe allowed;
strictness ordering; fail-closed on KV error; token roundtrip/tamper/expiry/
missing-secret; footer contents (identity, postal address, unsubscribe link);
List-Unsubscribe headers; send-time gating; batch sends excluding ineligible
recipients. `tsc --noEmit` clean; production build passes.
*(ESLint has never been configured in this repo — the `next lint` setup prompt was
not answered as part of this change.)*

## 16. Required Environment Variables (NEW — human action)

| Variable | Required | Purpose |
|---|---|---|
| `UNSUBSCRIBE_TOKEN_SECRET` | **Yes, before any marketing send** | 32+ random bytes; marketing sends are blocked without it |
| `RESEND_WEBHOOK_SECRET` | Yes, for bounce/complaint sync | From Resend dashboard when creating the webhook endpoint |
| `COMPANY_LEGAL_NAME` | Optional | Overrides `lib/business.ts` ("Awaken Biolabs LLC") |
| `COMPANY_MAILING_ADDRESS` | Optional | Overrides `lib/business.ts` (9440 W Sahara Ave, Suite 180, Las Vegas, NV 89117) |
| `MARKETING_FROM_NAME` / `MARKETING_REPLY_TO_EMAIL` | Optional | Marketing sender identity overrides |

**Deployment steps:** (1) generate and set `UNSUBSCRIBE_TOKEN_SECRET` in Vercel;
(2) create a Resend webhook pointing to `https://awakenbiolabs.com/api/webhooks/resend`
subscribed to `email.bounced` + `email.complained`, and set `RESEND_WEBHOOK_SECRET`;
(3) deploy; (4) verify per checklist below.

**Post-deployment verification:** send a test marketing email via
`sendMarketingEmail` to a subscribed test address → confirm footer, unsubscribe
link works (page + one-click), record flips to `unsubscribed`, second send is
skipped; trigger a Resend test webhook → confirm suppression recorded.

## 17. Remaining HUMAN ACTION ITEMS (code cannot verify these)

1. **Physical postal address** — `lib/business.ts` contains the NV filing address.
   Confirm it is a valid mail-receiving address (or a registered USPS PO box /
   commercial mail receiving agency) before the first marketing send.
2. **Placeholder phone** — `business.phone` is `(702) 555-0100` (fake). Not a
   CAN-SPAM issue, but replace before using it anywhere customer-facing.
3. **`support@awakenbiolabs.com` mailbox** — the mailto unsubscribe fallback and
   footer reference it. A human must actually process "Unsubscribe" emails within
   10 business days (CAN-SPAM deadline). Establish this process.
4. **Back-in-stock emails** (`lib/stock-emails.ts`) — treated as requested
   transactional/relationship messages (user explicitly requested one alert; list
   cleared after send). If copy ever becomes promotional (discounts, cross-sells),
   reclassify as marketing and route through `sendMarketingEmail`. **Legal review
   recommended** for the current copy.
5. **Subject lines** — code cannot guarantee truthful, non-deceptive subject lines.
   Every future campaign's subject must accurately reflect content (CAN-SPAM §7704(a)(2)).
6. **Legacy `marketingOptIn=true` customers** — their consent predates the central
   model, with no timestamp/disclosure evidence. They were **not** auto-enrolled as
   `subscribed`. Business decision required: either (a) treat the historical toggle
   as sufficient and backfill with `source: "legacy_profile_flag"`, or (b) run a
   re-permission campaign. Do not fabricate consent history.
7. **Mixed-content emails** — order/shipping emails currently contain no promotion.
   If promotional content is ever added to transactional templates, obtain legal
   review of primary-purpose classification (16 CFR Part 316).
8. **Resend contract/AUP** — confirm vendor terms for commercial email.
9. **CSV exports** — once exported, data leaves the system. Any external send tool
   must honor the "Marketing Eligible = No" column; re-export before every campaign.
10. **No admin remediation flow for bounces/complaints** — deliberate. If a customer
    legitimately asks to be reinstated after a complaint, this needs a purpose-built,
    logged admin flow. Currently impossible by design.

## 18. State / Scope Findings (separate review recommended)

- **California (CCPA/CPRA):** the site sells nationwide; CA customers are near-certain.
  A privacy page exists (`app/privacy`). CCPA is primarily about data rights, not
  email, but the consent records now include IP/UA — ensure the privacy policy
  discloses this. **Flag for privacy counsel.**
- **Other US state privacy laws** (CO, VA, CT, UT, TX, OR…): same category as above.
- **Canada (CASL)** / **EU-UK (GDPR/PECR)**: no geo-blocking exists; if non-US
  customers order, stricter express-consent regimes may apply. CASL in particular is
  opt-in based. **Flag: confirm whether marketing will target non-US addresses.**
- **Minors:** signup requires certifying 21+. Marketing to minors not applicable if
  enforced.
- **SMS:** none found (phone is collected at checkout for carrier notifications only
  and never persisted). TCPA not currently in scope.
- **Regulated categories:** products are research-use-only compounds; marketing copy
  is subject to the FDA/FTC claims constraints already tracked in this project
  (research-only framing, no health claims). All marketing templates must keep the
  existing compliance language rules.

## 19. Known Limitations

- Preference-center granularity (newsletter vs. promotions categories) was **not**
  built — there is exactly one marketing stream today, and a single global opt-out
  is the clearest compliant UX. The consent model has room for category prefs if a
  second stream ever launches.
- Webhook → provider outbound sync is N/A for plain Resend API sends (no provider-side
  list exists); revisit if Resend Audiences are adopted.
- Race window: a recipient unsubscribing mid-campaign could still receive an email
  already accepted by Resend milliseconds earlier. Eligibility is checked per-message
  immediately before dispatch, which is the practical limit of in-app enforcement.
- `next lint` is unconfigured repo-wide (pre-existing).
