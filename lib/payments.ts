// =============================================================================
// PAYMENT METHOD AVAILABILITY — temporary Zelle-only mode.
//
// Card payments are disabled while we are between card processors. ALL card
// infrastructure (Quiklie S2S, OTP/3DS flows, saved cards, webhooks, admin
// badges) remains in place and untouched — it is only hidden from customers
// and rejected at the API boundary.
//
// TO RE-ENABLE CARD PAYMENTS: set NEXT_PUBLIC_CARD_PAYMENTS=1 in Vercel and
// redeploy (the NEXT_PUBLIC_ prefix is required — the flag is read in client
// components and inlined at build time).
//
// Legacy data is unaffected: existing orders keep their paymentMethod, saved
// cards remain stored/manageable, and admin views render card orders normally.
// =============================================================================

export const CARD_PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_CARD_PAYMENTS === "1";
