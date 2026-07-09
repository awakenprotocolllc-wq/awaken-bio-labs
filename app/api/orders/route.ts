import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { createOrder, updateOrderStatus, listOrders, calcSubtotal, type OrderItem } from "@/lib/db";
import { sendCustomerOrderEmail, sendAdminOrderEmail } from "@/lib/order-emails";
import { createShipStationOrder } from "@/lib/shipstation";
import { products, getPriceForStrength, isOrderable, slugify } from "@/lib/products";
import { getOutOfStockSlugs } from "@/lib/stock-db";
import { CARD_PAYMENTS_ENABLED } from "@/lib/payments";
import { validateDiscountCode } from "@/lib/affiliate-db";
import { rateLimit, rateLimitBurst, clientIp } from "@/lib/rate-limit";
import { findAttack } from "@/lib/validate";
import { validateAdminSession } from "@/lib/admin-auth";
import { apiError } from "@/lib/api-error";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://awakenbiolabs.com";
const QUIKLIE_BASE = "https://api.quiklie.com";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_RE   = /^\d{5}(-\d{4})?$/;
const STATE_RE = /^[A-Za-z]{2}$/;
const PHONE_RE = /^[\d\s\-().+]{7,20}$/;

// ---------------------------------------------------------------------------
// POST /api/orders — create order and process payment
// paymentMethod "zelle" → save order + send Zelle instructions, no card processing
// paymentMethod "card"  → Quiklie S2S with 4% processing fee baked into total
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);

    // Burst cap: 10 checkout submissions per minute per IP
    const { allowed: burstOk } = await rateLimitBurst(`orders:${ip}`);
    if (!burstOk) {
      return NextResponse.json({ ok: false, error: "Too many requests. Slow down and try again." }, { status: 429 });
    }
    // Hourly cap: 30 per hour (allows a few retries per order attempt)
    const { allowed: hourlyOk } = await rateLimit(`orders:${ip}`, 30, 60 * 60);
    if (!hourlyOk) {
      return NextResponse.json({ ok: false, error: "Too many submissions. Try again later." }, { status: 429 });
    }

    const body = await req.json();
    const {
      customer, shipping, items, notes,
      discountCode, discountAmount, shippingCost, processingFee, orderTotal,
      paymentMethod, // "card" | "zelle"
      card, // { number, holderName, expiryMonth, expiryYear, cvv }
      website, // honeypot — must be empty
    } = body ?? {};

    // Honeypot: bots fill this field, humans don't see it
    if (website) {
      return NextResponse.json({ ok: true, orderId: "bot-discard" }); // silently discard
    }

    // ── Field presence ────────────────────────────────────────────────────────
    if (
      !customer?.name || !customer?.email ||
      !shipping?.line1 || !shipping?.city || !shipping?.state || !shipping?.zip ||
      !items?.length
    ) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // ── Payment method enum ───────────────────────────────────────────────────
    if (paymentMethod !== "card" && paymentMethod !== "zelle") {
      return NextResponse.json({ ok: false, error: "Invalid payment method" }, { status: 400 });
    }
    // Zelle-only mode: card processing is temporarily disabled (lib/payments.ts).
    // Enforced server-side so a crafted request cannot reach the card path.
    if (paymentMethod === "card" && !CARD_PAYMENTS_ENABLED) {
      return NextResponse.json(
        { ok: false, error: "Card payments are temporarily unavailable. Please pay with Zelle." },
        { status: 400 }
      );
    }

    // ── Customer field validation ─────────────────────────────────────────────
    if (!EMAIL_RE.test(String(customer.email).trim())) {
      return NextResponse.json({ ok: false, error: "Invalid email address" }, { status: 400 });
    }
    if (String(customer.name).trim().length > 200) {
      return NextResponse.json({ ok: false, error: "Name is too long" }, { status: 400 });
    }
    // Validate phone if provided but never persist it — used only for carrier delivery notifications
    const customerPhone: string | undefined =
      customer.phone && PHONE_RE.test(String(customer.phone)) ? String(customer.phone).trim() : undefined;
    if (customer.phone && !customerPhone) {
      return NextResponse.json({ ok: false, error: "Invalid phone number" }, { status: 400 });
    }

    // ── Shipping field validation ─────────────────────────────────────────────
    if (!STATE_RE.test(String(shipping.state))) {
      return NextResponse.json({ ok: false, error: "State must be a 2-letter code (e.g. CA)" }, { status: 400 });
    }
    if (!ZIP_RE.test(String(shipping.zip).trim())) {
      return NextResponse.json({ ok: false, error: "ZIP code must be 5 digits (e.g. 90210)" }, { status: 400 });
    }
    if (String(shipping.line1).trim().length > 200) {
      return NextResponse.json({ ok: false, error: "Address is too long" }, { status: 400 });
    }
    if (String(shipping.city).trim().length > 100) {
      return NextResponse.json({ ok: false, error: "City is too long" }, { status: 400 });
    }

    // ── Card field validation ─────────────────────────────────────────────────
    if (paymentMethod === "card") {
      if (!card?.number || !card?.holderName || !card?.expiryMonth || !card?.expiryYear || !card?.cvv) {
        return NextResponse.json({ ok: false, error: "Card details are required" }, { status: 400 });
      }
      const cardDigits = String(card.number).replace(/[\s-]/g, "");
      if (!/^\d{13,19}$/.test(cardDigits)) {
        return NextResponse.json({ ok: false, error: "Invalid card number" }, { status: 400 });
      }
      const expMonth = Number(card.expiryMonth);
      const expYear  = Number(card.expiryYear);
      const nowYear  = new Date().getFullYear();
      if (!Number.isInteger(expMonth) || expMonth < 1 || expMonth > 12) {
        return NextResponse.json({ ok: false, error: "Invalid expiry month" }, { status: 400 });
      }
      if (!Number.isInteger(expYear) || expYear < nowYear || expYear > nowYear + 20) {
        return NextResponse.json({ ok: false, error: "Invalid expiry year" }, { status: 400 });
      }
      if (!/^\d{3,4}$/.test(String(card.cvv).trim())) {
        return NextResponse.json({ ok: false, error: "Invalid CVV" }, { status: 400 });
      }
      if (String(card.holderName).trim().length > 200) {
        return NextResponse.json({ ok: false, error: "Cardholder name is too long" }, { status: 400 });
      }
    }

    // ── Attack pattern scan on free-text fields ───────────────────────────────
    const attackField = findAttack({
      name: typeof customer?.name === "string" ? customer.name : undefined,
      email: typeof customer?.email === "string" ? customer.email : undefined,
      address: typeof shipping?.line1 === "string" ? shipping.line1 : undefined,
      city: typeof shipping?.city === "string" ? shipping.city : undefined,
      notes: typeof notes === "string" ? notes : undefined,
    });
    if (attackField) {
      console.warn(`[orders] attack pattern in field "${attackField}", ip: ${ip}`);
      return NextResponse.json({ ok: false, error: "Submission rejected." }, { status: 400 });
    }

    // ── Server-side item validation: prices from catalog, never from client ──
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }
    if (items.length > 20) {
      return NextResponse.json({ ok: false, error: "Too many items in order (max 20 lines)" }, { status: 400 });
    }
    const outOfStockSlugs = new Set(await getOutOfStockSlugs());
    const validatedItems: OrderItem[] = [];
    for (const item of items) {
      const { product: productName, strength, qty } = item ?? {};
      if (!productName || !strength || !qty || !Number.isInteger(qty) || qty < 1 || qty > 99) {
        return NextResponse.json({ ok: false, error: "Invalid item in order" }, { status: 400 });
      }
      const catalogProduct = products.find((p) => p.name === productName);
      if (!catalogProduct) {
        return NextResponse.json({ ok: false, error: `Unknown product: ${productName}` }, { status: 400 });
      }
      const catalogPrice = getPriceForStrength(catalogProduct, strength);
      if (!catalogPrice || !isOrderable(catalogProduct, strength)) {
        return NextResponse.json({ ok: false, error: `Product not available: ${productName} ${strength}` }, { status: 400 });
      }
      if (outOfStockSlugs.has(slugify(catalogProduct.name))) {
        return NextResponse.json({ ok: false, error: `Out of stock: ${productName}. Please remove it from your cart.` }, { status: 409 });
      }
      validatedItems.push({ product: productName, strength, price: catalogPrice, qty });
    }

    // ── Compute subtotal from catalog prices ──
    const subtotal = calcSubtotal(validatedItems);
    const subtotalNum = parseFloat(subtotal.replace(/[^0-9.]/g, "")) || 0;

    // ── Validate discount code server-side ──
    const refCode = req.cookies.get("awaken_ref")?.value || discountCode || undefined;
    const codeToValidate = (discountCode || req.cookies.get("awaken_ref")?.value || "").trim().toUpperCase();
    let validatedDiscountCode: string | undefined;
    let validatedDiscountAmount: string | undefined;
    if (codeToValidate) {
      const { valid, discountRate } = await validateDiscountCode(codeToValidate);
      if (valid) {
        validatedDiscountCode = codeToValidate;
        const discountNum = parseFloat((subtotalNum * discountRate).toFixed(2));
        validatedDiscountAmount = `$${discountNum.toFixed(2)}`;
      }
    }
    const discountNum = validatedDiscountAmount
      ? parseFloat(validatedDiscountAmount.replace(/[^0-9.]/g, "")) || 0
      : 0;

    // ── Shipping — accept from client but clamp to sane range ──
    const rawShipping = parseFloat((shippingCost || "$0").replace(/[^0-9.]/g, "")) || 0;
    const shippingNum = Math.max(0, Math.min(rawShipping, 100));
    const validatedShippingCost = shippingNum > 0 ? `$${shippingNum.toFixed(2)}` : undefined;

    // ── Processing fee and total computed server-side ──
    const baseForFee = subtotalNum - discountNum + shippingNum;
    const processingFeeNum = paymentMethod === "card" ? parseFloat((baseForFee * 0.04).toFixed(2)) : 0;
    const validatedProcessingFee = processingFeeNum > 0 ? `$${processingFeeNum.toFixed(2)}` : undefined;
    const validatedOrderTotal = `$${(baseForFee + processingFeeNum).toFixed(2)}`;

    // Strip phone before storage — it's used for carrier notifications only
    const customerForStorage = { name: String(customer.name).trim(), email: String(customer.email).trim().toLowerCase() };

    // ── Zelle path ──────────────────────────────────────────────────────────
    if (paymentMethod === "zelle") {
      const order = await createOrder({
        customer: customerForStorage,
        shipping,
        items: validatedItems,
        subtotal,
        notes: notes?.slice(0, 500) || undefined,
        refCode,
        discountCode: validatedDiscountCode,
        discountAmount: validatedDiscountAmount,
        shippingCost: validatedShippingCost,
        orderTotal: validatedOrderTotal,
        paymentMethod: "zelle",
      });

      // Send emails immediately — customer gets Zelle instructions
      const [customerEmailResult, adminEmailResult] = await Promise.allSettled([
        sendCustomerOrderEmail(order),
        sendAdminOrderEmail(order),
      ]);
      if (customerEmailResult.status === "rejected") {
        console.error("[orders/zelle] Customer email FAILED for", order.id, customerEmailResult.reason);
      } else if (customerEmailResult.value?.fallback) {
        console.warn("[orders/zelle] Customer email suppressed — RESEND_API_KEY not set. Order:", order.id);
      }
      if (adminEmailResult.status === "rejected") {
        console.error("[orders/zelle] Admin email FAILED for", order.id, adminEmailResult.reason);
      }

      console.log("[orders/zelle] Order created, awaiting Zelle payment:", order.id);
      return NextResponse.json({ ok: true, orderId: order.id, zelle: true });
    }

    // ── Card path (Quiklie S2S) ──────────────────────────────────────────────
    // 1. Save the order (pending_payment — confirmed only after Quiklie SUCCESS)
    const order = await createOrder({
      customer: customerForStorage,
      shipping,
      items: validatedItems,
      subtotal,
      notes: notes?.slice(0, 500) || undefined,
      refCode,
      discountCode: validatedDiscountCode,
      discountAmount: validatedDiscountAmount,
      shippingCost: validatedShippingCost,
      processingFee: validatedProcessingFee,
      orderTotal: validatedOrderTotal,
      paymentMethod: "card",
    });

    // 2. Build Quiklie payment request
    const apiKey = process.env.QUIKLIE_API_KEY;
    const merchantId = process.env.QUIKLIE_MERCHANT_ID;

    if (!apiKey || !merchantId) {
      console.error("[orders] QUIKLIE_API_KEY or QUIKLIE_MERCHANT_ID not set");
      return NextResponse.json({ ok: false, error: "Payment processor not configured. Please contact support." }, { status: 500 });
    }

    // Use server-computed total — never trust the client-supplied amount
    const amount = parseFloat(validatedOrderTotal.replace(/[^0-9.]/g, "")) || 0;

    // Split full name into first/last
    const nameParts = customer.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : nameParts[0];

    // Customer IP (Vercel passes this via x-forwarded-for)
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "0.0.0.0";

    // Strip spaces/dashes from card number
    const cardNumber = card.number.replace(/[\s-]/g, "");

    // Do NOT log card data — security requirement
    const quikliePayload = {
      merchantId,
      firstName,
      lastName,
      email: customer.email,
      phone: customerPhone || "0000000000",
      amount,
      currencyCode: "USD",
      address: shipping.line1,
      zipCode: shipping.zip,
      city: shipping.city,
      state: shipping.state,
      country: "US",
      ipAddress,
      callbackUrl: `${SITE}/api/webhooks/quiklie`,
      redirectUrl: `${SITE}/order-confirmation?id=${order.id}&method=card`,
      customerReferenceId: `CUST-${order.id}`,
      transactionReferenceId: order.id,
      cardNumber,
      cardHolderName: card.holderName,
      cardExpiryMonth: String(card.expiryMonth).padStart(2, "0"),
      cardExpiryYear: String(card.expiryYear),
      cardCvv: card.cvv,
      // midType omitted — let Quiklie use the default MID assigned to the merchant
    };

    // 3. Call Quiklie
    let quiklieData: Record<string, unknown>;
    try {
      const quiklieRes = await fetch(`${QUIKLIE_BASE}/api/v2/process-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "x-source": "api",
        },
        body: JSON.stringify(quikliePayload),
      });

      quiklieData = await quiklieRes.json();
    } catch (fetchErr) {
      console.error("[orders/quiklie] network error:", fetchErr);
      return NextResponse.json({ ok: false, error: "Payment gateway unreachable. Please try again." }, { status: 502 });
    }

    const statusCode = Number(quiklieData.statusCode);
    const qkpaymentId = quiklieData.qkpaymentId as string | undefined;

    // Store Quiklie payment ID → orderId for webhook lookup
    if (qkpaymentId) {
      await kv.set(`quiklie:tx:${qkpaymentId}`, order.id, { ex: 60 * 60 * 48 });
      await kv.set(`quiklie:ref:${order.id}`, order.id, { ex: 60 * 60 * 48 });
    }

    // 4. Handle Quiklie response
    // statusCode 1 = SUCCESS
    if (statusCode === 1 || (quiklieData.status as string)?.toUpperCase() === "SUCCESS") {
      await updateOrderStatus(order.id, "paid");
      const paidOrder = { ...order, status: "paid" as const };
      createShipStationOrder(paidOrder, customerPhone).catch((e) => console.error("[quiklie] ShipStation:", e));
      await Promise.allSettled([
        sendCustomerOrderEmail(paidOrder),
        sendAdminOrderEmail(paidOrder),
      ]);
      return NextResponse.json({ ok: true, orderId: order.id, paid: true });
    }

    // statusCode 2 = 3DS required — redirect customer to Quiklie 3DS page
    if (statusCode === 2) {
      const redirectUrl = quiklieData.quikleeRedirectUrl as string;
      if (!redirectUrl || !redirectUrl.startsWith("https://")) {
        console.error("[orders/quiklie] 3DS redirect URL missing or not HTTPS:", redirectUrl);
        return NextResponse.json({ ok: false, error: "Payment could not be processed. Please try again." }, { status: 502 });
      }
      return NextResponse.json({ ok: true, orderId: order.id, requires3DS: true, redirectUrl });
    }

    // statusCode 3 = OTP required
    if (statusCode === 3) {
      return NextResponse.json({
        ok: true,
        orderId: order.id,
        requiresOTP: true,
        transactionId: qkpaymentId,
      });
    }

    // statusCode 5 = DECLINED
    if (statusCode === 5) {
      return NextResponse.json({
        ok: false,
        error: "Your card was declined. Please check your details or try a different card.",
      }, { status: 402 });
    }

    // statusCode 4 = PENDING (async — wait for webhook)
    if (statusCode === 4) {
      return NextResponse.json({ ok: true, orderId: order.id, pending: true });
    }

    // Unknown / error response
    console.error("[orders/quiklie] unexpected statusCode:", statusCode, (quiklieData.message as string) ?? "(no message)");
    return NextResponse.json({ ok: false, error: "Payment could not be processed. Please try again." }, { status: 402 });

  } catch (err) {
    return apiError("POST /api/orders", err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/orders — list all orders (admin only)
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    if (!(await validateAdminSession(req.cookies.get("awaken_admin")?.value))) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const orders = await listOrders();
    return NextResponse.json({ ok: true, orders });
  } catch (err) {
    return apiError("GET /api/orders", err);
  }
}
