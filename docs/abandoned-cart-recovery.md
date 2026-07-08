# Abandoned Cart Recovery — Architecture & Operations

**Scope:** authenticated customers only. Guests are never tracked, never emailed.
**Date:** June 2026

---

## 1. Architecture discovered (and the resulting design)

- **Framework:** Next.js 14 App Router; **DB:** Vercel KV; **Email:** Resend via `lib/email.ts`
- **The storefront cart is client-side only** (`lib/cart.tsx`: React context + localStorage).
  No server cart existed. This feature adds a server-side **mirror** of the cart for
  authenticated customers, synced from the client.
- **Auth:** cookie customer sessions (`awaken_customer`, KV-validated with UA binding)
- **Scheduling:** Vercel cron (no queue/worker infra) — an hourly cron drives sends
- **Compliance:** the existing central marketing consent system (`lib/marketing-consent.ts`,
  `lib/marketing-email.ts`) is reused wholesale; no suppression logic is duplicated

### ⚠️ Platform-rule discrepancy (human review)

The feature spec states carts/checkout require login. **In the current code, guests can
add to cart and check out.** This feature handles that gracefully — `/api/cart/sync`
requires a session, so guest carts simply never enter the recovery system — but the
stated platform rule is not otherwise enforced anywhere. If login-gated checkout is
intended, that is a separate change.

## 2. Data model (KV)

| Key | Contents |
|---|---|
| `acr:cart:<customerId>` | `AbandonedCartRecord` — items snapshot, `lastActivityAt`, `sequenceStartedAt`, `status` (`active` / `converted` / `cancelled` / `completed_sequence`), `sentStages` (stage→sent ISO), `cancelledAt`/`cancelReason`, `convertedAt`/`recoveredOrderId`/`reminderAssociated`, created/updated timestamps |
| `acr:active` | zset of customerIds with an active sequence (score = lastActivityAt ms) — the cron scan set |
| `acr:index` | zset of all tracked customerIds (score = updatedAt ms) — admin dashboard |
| `acr:lock:<cid>:<stage>:<activityEpoch>` | per-stage idempotency lock (SET NX, 6 h TTL) |

The **cart ID is the customer ID** (already a random hex ID). One active cart per
customer. Customer data is not duplicated — the current name/email are read from the
account record at send time. Provider message IDs are not stored (`lib/email.ts` does
not surface them — known limitation).

## 3. Meaningful activity (exact definition)

`recordCartActivity()` fires on every **debounced client cart sync** (2 s), which the
client sends after: add item, remove item, quantity change — and, because the checkout
page mounts the same cart provider, returning to the site/cart with a session also
re-syncs. Each sync **resets the abandonment timer** (`lastActivityAt`).

- Resumed activity never re-sends an already-sent stage; the next unsent stage re-times
  from the newest activity.
- Syncing an **empty** cart durably cancels the sequence (`cart_emptied`).
- After stage 3, the record is `completed_sequence` — terminal for that cart episode
  (anti-nag). A fresh sequence starts only after the episode ends via conversion or
  emptying.

## 4. Timing (configurable)

Env vars with defaults — read at each cron run, no redeploy-time baking:

```
ABANDONED_CART_REMINDER_1_HOURS=1
ABANDONED_CART_REMINDER_2_HOURS=24
ABANDONED_CART_REMINDER_3_HOURS=72
```

Hourly cron (`vercel.json`: `0 * * * *` → `/api/cron/abandoned-carts`, Bearer
`CRON_SECRET` or admin session). Max 3 stages, one stage per cart per run.

## 5. Eligibility — enforced at SEND time, every time

Scheduling state is never trusted. Immediately before each send the processor re-checks:

1. record exists and is `active` (deleted/converted/cancelled/completed → skip or prune)
2. account still exists (`getCustomerById`) — else durable cancel `account_deleted`
3. **email verified** — else skip and retry next run (never cancelled; they may verify)
4. `canSendMarketingEmail(currentEmail)` — the central gate (unsubscribed, suppressed,
   bounced, complained, no consent → durable cancel `not_marketing_eligible`)
5. items still purchasable (catalog + orderable price + not out-of-stock) — else durable
   cancel `items_unavailable`
6. stage not already sent (record + NX lock + post-lock re-read → race-safe)
7. `sendMarketingEmail()` re-checks eligibility once more inside the pipeline

**Email address changes:** impossible in the current UI/API (account email is
immutable), but the design is robust anyway — the target address is read fresh from
the account at send time; a stale snapshot address is never used.

## 6. Email classification — ⚠️ human/legal review

Abandoned-cart reminders are treated as **commercial/marketing email** (the FTC's
primary-purpose analysis generally treats cart reminders as commercial). They route
through `sendMarketingEmail()`, so they carry the CAN-SPAM footer, working unsubscribe,
and List-Unsubscribe headers — and **only customers with confirmed marketing consent
receive them**. This deliberately limits reach. If the business wants cart reminders
for non-marketing-subscribed customers, that reclassification needs legal review first.

## 7. Cancellation (durable, with timestamp + reason)

| Trigger | Mechanism | Reason recorded |
|---|---|---|
| Order created (checkout completed, card or Zelle) | `createOrder()` hook → `markCartConverted` | `converted` + orderId |
| Cart emptied (incl. post-order `clearCart`) | sync → `cancelSequence` | `cart_emptied` |
| Account deleted | `deleteCustomerAccount` removes record + indexes; send-time check backs it up | key deleted / `account_deleted` |
| Unsubscribe / suppression / bounce / complaint | send-time gate | `not_marketing_eligible` |
| All items unavailable | send-time gate | `items_unavailable` |

Status changes are written to the record itself, not just the schedule — cancellation
survives restarts and re-scans.

## 8. Return link & ownership security

Email CTA → `https://…/cart-return?r=<stage>` — **no cart ID, no customer ID, no token**
in the URL, so there is nothing to tamper with and nothing to leak.

- Authenticated → `/api/cart/restore` returns **the session customer's own** snapshot
  (customer ID derived from the session; no parameter accepted → IDOR structurally
  impossible); local device cart wins, server snapshot only fills an empty local cart;
  then → `/checkout`.
- Unauthenticated → `/account/login?next=/cart-return` (the login page already rejects
  non-relative `next` values → no open redirect), then the same flow. **No login bypass
  of any kind.**
- Current pricing/stock always apply on return; emails state prices/availability may
  change and items are not reserved.

## 9. Analytics

- `acr_reminder_sent`, `acr_cancelled`, `acr_converted`, `acr_click` events in the
  existing `mkt:audit` log; per-record `sentStages`, `recoveredOrderId`,
  `reminderAssociated`.
- **Attribution is labeled honestly:** `reminderAssociated` means "a reminder was sent
  before the order" — correlation, not causation, and the admin UI says so.
- Provider-level open/delivery tracking is not enabled (Resend tracking off by default;
  not required).

## 10. Admin visibility

`/admin/abandoned-carts` (admin-only, linked from Orders nav as "Carts"): customer
name/email, status, cart value, item count, last activity, stages sent, next scheduled
reminder, cancellation reason, recovered order. Latest 100 records. No payment or
address data exposed.

## 11. Files

**New:** `lib/abandoned-cart.ts`, `lib/abandoned-cart-emails.ts`,
`app/api/cart/sync/route.ts`, `app/api/cart/restore/route.ts`,
`app/api/cron/abandoned-carts/route.ts`, `app/cart-return/page.tsx`,
`app/admin/abandoned-carts/page.tsx`, `tests/abandoned-cart.test.ts`
**Modified:** `lib/cart.tsx` (debounced sync + `replaceCart`), `lib/db.ts` (conversion
hook), `lib/customer-db.ts` (deletion cleanup), `lib/marketing-consent.ts` (audit event
types), `vercel.json` (hourly cron), `app/admin/orders/OrdersClient.tsx` (nav link)

## 12. Deployment

1. Ensure `CRON_SECRET` is set in Vercel (already used by `/api/health`).
2. `UNSUBSCRIBE_TOKEN_SECRET` must be set (marketing pipeline requirement — sends are
   blocked without it).
3. Optionally set the `ABANDONED_CART_REMINDER_*_HOURS` overrides.
4. Deploy — the new cron registers from `vercel.json` automatically.
5. Verify: add items to a cart while logged in as a marketing-subscribed test account,
   wait past reminder 1 (or temporarily set `ABANDONED_CART_REMINDER_1_HOURS=0.05`),
   run the cron manually (visit `/api/cron/abandoned-carts` as admin), check the email,
   click the CTA, complete checkout, and confirm the admin page shows `converted`.

## 13. Test coverage (16 new tests; 41 total pass)

Covers spec items 1–18, 22, 23: eligibility creation, empty-cart exclusion, conversion
cancels stages (incl. mid-sequence), activity resets timing, each stage exactly once,
no 4th send, duplicate/concurrent cron runs (NX-lock race), unsubscribed/suppressed/
no-consent exclusion, current-email-only sends, deleted account/cart, unavailable
items, unverified skip-and-retry, send-time recheck, configurable timing, and template
content (items, subtotal, CTA, footer, no-guarantee + research-only language).
Items 19–21 (URL tampering / cross-customer access / login return) are **structural**:
the return URL contains no identifier, and both cart APIs derive the customer ID
exclusively from the validated session cookie; the login `next` param already rejects
absolute URLs. Route-level integration tests would require an HTTP harness the repo
doesn't have — flagged as a known limitation.

## 14. Known limitations & human-review items

- **Marketing-consent gating** (see §6) — reminders reach only marketing-subscribed,
  email-verified customers. Business/legal call if broader reach is wanted.
- **Guest checkout exists** despite the stated platform rule (§1) — separate decision.
- Cross-device restore fills only an *empty* local cart; it never overwrites a device
  cart (deliberate — device cart is freshest intent).
- Cart price snapshots in reminders are re-computed from the current catalog at send
  time; if a price changed, the email shows the current price (correct behavior).
- Provider message IDs not persisted; no open/click provider tracking.
- Hourly cron granularity means a stage can send up to ~59 min after its threshold.
- If the cron is down for a long period, catch-up sends at most one stage per cart per
  run (no burst of 3 emails at once).
