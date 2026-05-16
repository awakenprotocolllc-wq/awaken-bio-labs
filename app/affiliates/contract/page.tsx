import { getContractToken, getAffiliateById } from "@/lib/affiliate-db";
import ContractSigningForm from "./ContractSigningForm";

export const metadata = {
  title: "Ambassador Agreement — Awaken Bio Labs",
};

// ─── Style tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#0A0B0D",
  surface: "#141517",
  surfaceAlt: "#0F1012",
  border: "#2A2B2F",
  teal: "#57C7D6",
  paper: "#F5F3EF",
  bone: "#A09E9A",
  dim: "#5A5856",
  text: "#E8E6E1",
};

const s = {
  p: { margin: "0 0 12px", fontSize: 13, color: C.bone, lineHeight: 1.75 } as React.CSSProperties,
  pb: { margin: "0 0 12px", fontSize: 13, color: C.bone, lineHeight: 1.75, fontWeight: 700, color: C.text } as React.CSSProperties,
  h: {
    margin: "28px 0 0",
    paddingBottom: 8,
    borderBottom: `1px solid ${C.border}`,
    fontFamily: "monospace",
    fontSize: 11,
    letterSpacing: "0.2em",
    color: C.teal,
    textTransform: "uppercase" as const,
  } as React.CSSProperties,
  li: { margin: "0 0 6px", fontSize: 13, color: C.bone, lineHeight: 1.7 } as React.CSSProperties,
  th: {
    background: C.surfaceAlt,
    color: C.teal,
    fontFamily: "monospace",
    fontSize: 10,
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    padding: "10px 14px",
    borderBottom: `1px solid ${C.border}`,
    textAlign: "center" as const,
  } as React.CSSProperties,
  td: {
    padding: "9px 14px",
    fontSize: 13,
    color: C.bone,
    borderBottom: `1px solid ${C.border}`,
    verticalAlign: "top" as const,
  } as React.CSSProperties,
  tdAccent: {
    padding: "9px 14px",
    fontSize: 13,
    color: C.teal,
    fontWeight: 700,
    borderBottom: `1px solid ${C.border}`,
    textAlign: "center" as const,
  } as React.CSSProperties,
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    border: `1px solid ${C.border}`,
    marginBottom: 20,
  } as React.CSSProperties,
};

// ─── Product pricing data (matches PDF as of agreement date) ─────────────────
const PRODUCTS = [
  { name: "CJC-1295 (with DAC)",          strength: "5mg",    price: 65.00 },
  { name: "CJC-1295 (without DAC)",        strength: "10mg",   price: 55.00 },
  { name: "Ipamorelin",                    strength: "10mg",   price: 60.00 },
  { name: "GHRP-6 Acetate",               strength: "10mg",   price: 45.00 },
  { name: "Sermorelin Acetate",            strength: "10mg",   price: 75.00 },
  { name: "IGF-1 LR3",                    strength: "1mg",    price: 65.00 },
  { name: "IGF-DES",                      strength: "1mg",    price: 74.50 },
  { name: "GLP3-R (Retatrutide)",         strength: "10mg",   price: 102.00 },
  { name: "GLP3-R (Retatrutide)",         strength: "30mg",   price: 261.00 },
  { name: "AOD-9604",                     strength: "5mg",    price: 50.00 },
  { name: "5-Amino-1MQ",                  strength: "5mg",    price: 70.00 },
  { name: "BPC-157",                      strength: "10mg",   price: 52.50 },
  { name: "TB-500",                       strength: "10mg",   price: 57.00 },
  { name: "Wolverine Blend (TB-500 + BPC-157)", strength: "20mg", price: 135.00 },
  { name: "BPC Blend",                    strength: "70mg",   price: 110.50 },
  { name: "KPV (Lysine-Proline-Valine)",  strength: "10mg",   price: 75.00 },
  { name: "PNC-27",                       strength: "10mg",   price: 150.00 },
  { name: "SS-31",                        strength: "50mg",   price: 150.00 },
  { name: "NAD+",                         strength: "500mg",  price: 82.00 },
  { name: "Glutathione",                  strength: "1500mg", price: 84.00 },
  { name: "MOTS-C",                       strength: "10mg",   price: 48.50 },
  { name: "MOTS-C",                       strength: "40mg",   price: 120.00 },
  { name: "Epithalon",                    strength: "10mg",   price: 40.00 },
  { name: "FOX-04",                       strength: "10mg",   price: 217.50 },
  { name: "SLU-PP-322",                   strength: "5mg",    price: 65.00 },
  { name: "Selank",                       strength: "10mg",   price: 48.50 },
  { name: "Semax",                        strength: "10mg",   price: 48.50 },
  { name: "DSIP",                         strength: "15mg",   price: 70.00 },
  { name: "Pinealon",                     strength: "20mg",   price: 65.00 },
  { name: "Kisspeptin-10",               strength: "10mg",   price: 75.00 },
  { name: "PT-141",                       strength: "10mg",   price: 36.00 },
  { name: "Oxytocin",                     strength: "2mg",    price: 30.00 },
  { name: "GHK-Cu",                       strength: "50mg",   price: 45.00 },
  { name: "GHK-Cu",                       strength: "100mg",  price: 61.50 },
  { name: "Snap-8",                       strength: "10mg",   price: 35.00 },
  { name: "KLOW",                         strength: "80mg",   price: 145.00 },
  { name: "BAC Water",                    strength: "10ml",   price: 9.50 },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ContractPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ?? "";

  let errorMsg = "";
  let record = null;
  let commissionPct = 20; // default matches PDF

  if (!token) {
    errorMsg = "No contract token provided.";
  } else {
    record = await getContractToken(token);
    if (!record) {
      errorMsg = "This contract link is invalid or has expired.";
    } else if (record.signed) {
      errorMsg = "You've already signed this agreement.";
    } else if (new Date() > new Date(record.expiresAt)) {
      errorMsg = "This contract link has expired. Please contact support@awakenbiolabs.com.";
    } else {
      // Fetch actual commission rate set at approval
      const account = await getAffiliateById(record.affiliateId);
      if (account) commissionPct = Math.round(account.commissionRate * 100);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      {/* Top bar */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ margin: 0, fontFamily: "monospace", fontSize: 11, letterSpacing: "0.2em", color: C.teal, textTransform: "uppercase" }}>
          — AWAKEN BIOLABS —
        </p>
        <p style={{ margin: 0, fontFamily: "monospace", fontSize: 10, color: C.dim }}>
          awakenbiolabs.com · affiliates@awakenbiolabs.com
        </p>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px" }}>
        {errorMsg ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 40, textAlign: "center" }}>
            <p style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.2em", color: C.teal, textTransform: "uppercase", marginBottom: 16 }}>
              — CONTRACT LINK —
            </p>
            <p style={{ color: C.bone, fontSize: 15, margin: 0 }}>{errorMsg}</p>
            <p style={{ color: C.dim, fontSize: 12, marginTop: 16, fontFamily: "monospace" }}>
              Questions? support@awakenbiolabs.com
            </p>
          </div>
        ) : (
          <>
            {/* Cover */}
            <div style={{ textAlign: "center", marginBottom: 48, paddingBottom: 40, borderBottom: `1px solid ${C.border}` }}>
              <p style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.2em", color: C.teal, textTransform: "uppercase", margin: "0 0 16px" }}>
                AWAKEN BIOLABS
              </p>
              <h1 style={{ margin: "0 0 8px", fontSize: 40, fontWeight: 800, color: C.paper, letterSpacing: "-0.02em" }}>
                Ambassador Program
              </h1>
              <p style={{ margin: "0 0 24px", fontSize: 16, color: C.bone }}>Partnership Proposal & Program Agreement</p>
              <div style={{ width: 60, height: 2, background: C.teal, margin: "0 auto 24px" }} />
              <p style={{ margin: 0, fontSize: 14, color: C.bone, maxWidth: 600, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
                Awaken Biolabs is building a network of trusted ambassadors who share our mission of advancing in-vitro research. This program gives you a clean way to earn income by recommending products you believe in — with zero inventory, zero fulfillment, and full support from our team.
              </p>
            </div>

            {/* Personalized intro */}
            <div style={{ borderLeft: `2px solid ${C.teal}`, paddingLeft: 20, marginBottom: 40 }}>
              <p style={{ margin: 0, fontSize: 15, color: C.bone, lineHeight: 1.6 }}>
                Hi <strong style={{ color: C.paper }}>{record!.name}</strong> — please review this agreement carefully and sign at the bottom. Your login credentials will be sent to <strong style={{ color: C.paper }}>{record!.email}</strong> immediately after signing.
              </p>
            </div>

            {/* ── Contract body ── */}
            <ContractBody commissionPct={commissionPct} />

            {/* Signing form */}
            <div style={{ marginTop: 48, paddingTop: 40, borderTop: `1px solid ${C.border}` }}>
              <p style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.2em", color: C.teal, textTransform: "uppercase", marginBottom: 20 }}>
                — ACCEPTANCE & DIGITAL SIGNATURE —
              </p>
              <p style={{ fontSize: 13, color: C.bone, lineHeight: 1.7, marginBottom: 28 }}>
                By signing below, you agree to be bound by the Ambassador Program Agreement and the Mutual Non-Disclosure Agreement set forth above. Electronic signatures have the same legal effect as original handwritten signatures.
              </p>
              <ContractSigningForm token={token} name={record!.name} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Contract body ────────────────────────────────────────────────────────────
function ContractBody({ commissionPct }: { commissionPct: number }) {
  const commissionDecimal = commissionPct / 100;

  return (
    <div>
      {/* ── HOW IT WORKS ── */}
      <h2 style={s.h}>How It Works</h2>
      <div style={{ marginTop: 16, marginBottom: 24 }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, width: "50%" }}>10% Discount Code</th>
              <th style={{ ...s.th, width: "50%" }}>{commissionPct}% Commission</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...s.td, verticalAlign: "top", padding: 16 }}>
                Every ambassador receives a unique promo code. Your audience applies it at checkout and takes 10% off every order, every time.
              </td>
              <td style={{ ...s.td, verticalAlign: "top", padding: 16, borderLeft: `1px solid ${C.border}` }}>
                You earn {commissionPct}% commission on every sale made through your code. Paid monthly on the 15th. No caps. No quotas required to stay active.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── EARNING TIERS ── */}
      <h2 style={s.h}>Earning Tiers</h2>
      <p style={{ ...s.p, marginTop: 12 }}>
        Based on a $300 average order value (AOV). 10% ambassador discount applied first; {commissionPct}% commission on the net sale.
      </p>

      {/* AOV row */}
      <table style={{ ...s.table, marginBottom: 12 }}>
        <thead>
          <tr>
            <th style={s.th}>Avg Order</th>
            <th style={s.th}>After 10% Disc.</th>
            <th style={s.th}>Your Commission</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...s.td, textAlign: "center" }}>$300.00</td>
            <td style={s.tdAccent}>$270.00</td>
            <td style={s.tdAccent}>${(270 * commissionDecimal).toFixed(2)} / customer / mo</td>
          </tr>
        </tbody>
      </table>

      {/* Tier table */}
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Tier</th>
            <th style={s.th}>Monthly Income</th>
            <th style={s.th}>Net Sales</th>
            <th style={s.th}>Customers</th>
          </tr>
        </thead>
        <tbody>
          {[
            { tier: "Starter",      customers: 50,  netSales: 13500 },
            { tier: "Builder",      customers: 100, netSales: 27000 },
            { tier: "Top Producer", customers: 250, netSales: 67500 },
          ].map((row) => (
            <tr key={row.tier}>
              <td style={{ ...s.td, textAlign: "center" }}>{row.tier}</td>
              <td style={s.tdAccent}>${(row.netSales * commissionDecimal).toLocaleString()}</td>
              <td style={{ ...s.td, textAlign: "center" }}>${row.netSales.toLocaleString()}</td>
              <td style={{ ...s.td, textAlign: "center" }}>{row.customers} active</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ ...s.p, fontSize: 12, color: C.dim, fontStyle: "italic" }}>
        A single referral ordering monthly at $300 is worth ~${(270 * commissionDecimal * 12).toFixed(0)} per year. Twenty engaged customers is real passive income. Two hundred fifty is a full-time business.
      </p>

      {/* ── SAMPLE RETAIL PRICING ── */}
      <h2 style={s.h}>Sample Retail Pricing</h2>
      <p style={{ ...s.p, marginTop: 12 }}>
        Prices reflect current retail listings on awakenbiolabs.com as of the Agreement date. Commission is calculated on the net sale after the 10% ambassador discount.
      </p>

      {/* Price disclaimer box */}
      <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, padding: "14px 16px", marginBottom: 16, fontSize: 11, color: C.dim, lineHeight: 1.6 }}>
        <strong style={{ color: C.bone }}>PRICE DISCLAIMER & RESERVATION OF RIGHTS — </strong>
        Retail prices listed herein are provided for illustrative reference only and reflect pricing current as of the Agreement date. Awaken Biolabs LLC expressly reserves the right, in its sole and absolute discretion, to modify, adjust, increase, decrease, or otherwise change any product price at any time and without prior notice. All commission calculations will be based on the actual net sale amount processed at the time of the transaction, regardless of any pricing reflected herein. Ambassador expressly acknowledges that no pricing set forth in this Agreement constitutes a guarantee or warranty of future pricing.
      </div>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={{ ...s.th, textAlign: "left" }}>Product</th>
            <th style={s.th}>Strength</th>
            <th style={s.th}>Retail Price</th>
            <th style={s.th}>Ambassador Earns ({commissionPct}%)</th>
          </tr>
        </thead>
        <tbody>
          {PRODUCTS.map((p, i) => {
            const earns = p.price * 0.9 * commissionDecimal;
            return (
              <tr key={i} style={{ background: i % 2 === 1 ? C.surfaceAlt : "transparent" }}>
                <td style={{ ...s.td, textAlign: "left" }}>{p.name}</td>
                <td style={{ ...s.td, textAlign: "center", fontFamily: "monospace", fontSize: 12 }}>{p.strength}</td>
                <td style={s.tdAccent}>${p.price.toFixed(2)}</td>
                <td style={s.tdAccent}>${earns.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p style={{ ...s.p, fontSize: 11, color: C.dim, fontStyle: "italic" }}>
        * Earnings column reflects {commissionPct}% of net (retail minus 10% ambassador discount). Actual payout based on transaction-time pricing.
      </p>

      {/* ── WHAT AWAKEN BIOLABS PROVIDES ── */}
      <h2 style={s.h}>What Awaken Biolabs Provides</h2>
      <ul style={{ margin: "12px 0 20px", paddingLeft: 20 }}>
        {[
          "Unique discount code and real-time tracking dashboard.",
          "Ambassador media kit — branded assets, product imagery, sample captions, and content.",
          "Monthly education drops: new research protocols, COA references, and talking points.",
          "Direct access to the founding team for questions you can't answer.",
          `Commission payouts on the 15th of the following month via Zelle, ACH, or direct deposit.`,
          "Zero inventory, zero fulfillment, zero customer-service obligations.",
        ].map((item, i) => (
          <li key={i} style={s.li}>{item}</li>
        ))}
      </ul>

      {/* ── AMBASSADOR EXPECTATIONS ── */}
      <h2 style={s.h}>Ambassador Expectations</h2>
      <ul style={{ margin: "12px 0 20px", paddingLeft: 20 }}>
        {[
          "Represent Awaken Biolabs professionally — no unsupported claims of any kind.",
          "Follow all FDA research-use-only compliance language when posting publicly.",
          "Use only brand-approved assets when running paid promotions.",
          "Minimum 2 posts or stories per month referencing Awaken Biolabs (any platform).",
          "No cross-promotion of competing peptide or research-compound brands while active.",
        ].map((item, i) => (
          <li key={i} style={s.li}>{item}</li>
        ))}
      </ul>

      {/* ── ELEVATE: LICENSING TIER ── */}
      <h2 style={s.h}>Elevate: The Licensing Tier</h2>
      <p style={{ ...s.p, marginTop: 12 }}>
        For partners ready to move beyond commission and build real inventory income. The Awaken Biolabs License grants qualified partners full wholesale access. The licensing fee is paid once for access to the wholesale account — it is not an inventory deposit and is not credited toward future product orders. Licensed partners choose between two fulfillment paths and can switch or run both at the same time.
      </p>
      <p style={s.p}>
        <strong style={{ color: C.text }}>Path A — Stock & Resell:</strong> Buy product at wholesale (50% off retail), stock your own inventory, and resell at any price you set. You keep the full spread between your wholesale cost and your retail. Required if you want to price independently of Awaken Biolabs.
      </p>
      <p style={s.p}>
        <strong style={{ color: C.text }}>Path B — Drop-Ship Revenue Share:</strong> No inventory required. Drive sales through your channel; orders are fulfilled through the Awaken Biolabs website at our standard retail prices. Partner receives 50% of revenue on every order tied to their account.
      </p>

      <table style={s.table}>
        <tbody>
          {[
            ["Licensing Fee", "$10,000 one-time fee for wholesale account access (not an inventory deposit; not applied to product orders)"],
            ["Fulfillment Options", "Path A — stock your own product and resell at your own price; Path B — we drop-ship at Awaken Biolabs retail and you keep 50% of revenue"],
            ["Margin Structure", "Path A: ~50% gross margin (buy wholesale, set your own retail). Path B: 50% revenue share on every drop-shipped order."],
            ["Pricing Control", "Independent retail pricing only available under Path A (must hold inventory). Path B sells at Awaken Biolabs retail."],
            ["Income Potential", "$10,000–$20,000+ / month at full run rate"],
            ["Territory", "Negotiated per partner — exclusivity available for qualifying markets"],
            ["Support Provided", "Dedicated account manager, wholesale pricing sheet, private ordering portal"],
            ["Requirements", "Business entity, resale documentation, signed licensing agreement"],
          ].map(([label, value], i) => (
            <tr key={i} style={{ background: i % 2 === 1 ? C.surfaceAlt : "transparent" }}>
              <td style={{ ...s.td, color: C.teal, fontWeight: 600, width: "30%", whiteSpace: "nowrap" }}>{label}</td>
              <td style={{ ...s.td, borderLeft: `1px solid ${C.border}` }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ ...s.p, fontWeight: 700, color: C.text }}>How the math works at the license tier:</p>
      <p style={{ ...s.p, fontWeight: 700, color: C.bone }}>Path A — Stock & Resell example</p>
      <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
        {[
          "Partner pays one-time $10,000 licensing fee for wholesale account access.",
          "Partner buys at wholesale (~50% of retail) and sets their own retail price.",
          "Example: Retatrutide 30mg has a market retail price. Wholesale ~50%. Profit per unit at market retail = ~50% margin.",
          "100 units / month at this margin ≈ $13,750 monthly profit.",
          "200 units / month ≈ $27,500 monthly profit. Top partners operate at this volume.",
        ].map((item, i) => <li key={i} style={s.li}>{item}</li>)}
      </ul>
      <p style={{ ...s.p, fontWeight: 700, color: C.bone }}>Path B — Drop-Ship Revenue Share example</p>
      <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
        {[
          "Partner pays one-time $10,000 licensing fee. No inventory required.",
          "Sales tied to partner's account ship from Awaken Biolabs at posted retail.",
          "Example: Retatrutide 30mg sells at retail. Partner share = 50% per unit.",
          "100 drop-shipped units / month ≈ $13,750 / month with zero fulfillment.",
          "Best for partners with strong audiences who don't want to handle inventory or shipping.",
        ].map((item, i) => <li key={i} style={s.li}>{item}</li>)}
      </ul>

      {/* ── PROGRAM COMPARISON ── */}
      <h2 style={s.h}>Program Comparison</h2>
      <div style={{ overflowX: "auto", marginTop: 16 }}>
        <table style={{ ...s.table, minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ ...s.th, textAlign: "left" }}></th>
              <th style={s.th}>Ambassador</th>
              <th style={s.th}>Licensed — Path A (Stock)</th>
              <th style={s.th}>Licensed — Path B (Drop-Ship)</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Upfront Investment", "$0", "$10,000 fee + inventory buy", "$10,000 licensing fee"],
              ["Payment Model", `${commissionPct}% commission per sale`, "Buy at 50% off retail, keep full spread", "50% revenue share on every drop-shipped order"],
              ["Inventory", "None — we fulfill", "Yes — you stock product", "None — we fulfill"],
              ["Pricing Control", "Awaken retail", "You set your own retail", "Sells at Awaken retail"],
              ["Monthly Income", "$1,000–$5,000", "$10,000–$20,000+", "$5,000–$15,000+"],
              ["Customer Ownership", "Awaken Biolabs retains", "You own the customer", "You own the customer"],
              ["Best For", "Creators & influencers", "Operators, clinics, resellers", "Audiences without ops capacity"],
            ].map(([label, a, b, c], i) => (
              <tr key={i} style={{ background: i % 2 === 1 ? C.surfaceAlt : "transparent" }}>
                <td style={{ ...s.td, color: C.bone, fontWeight: 600 }}>{label}</td>
                <td style={{ ...s.td, textAlign: "center", color: label === "Monthly Income" ? C.teal : undefined, fontWeight: label === "Monthly Income" ? 700 : undefined }}>{a}</td>
                <td style={{ ...s.td, textAlign: "center", color: label === "Monthly Income" ? C.teal : undefined, fontWeight: label === "Monthly Income" ? 700 : undefined }}>{b}</td>
                <td style={{ ...s.td, textAlign: "center", color: label === "Monthly Income" ? C.teal : undefined, fontWeight: label === "Monthly Income" ? 700 : undefined }}>{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── PROGRAM AGREEMENT ── */}
      <h2 style={s.h}>Program Agreement</h2>
      <p style={{ ...s.p, marginTop: 12 }}>
        By signing below, Ambassador agrees to the following terms with Awaken Biolabs LLC (the "Company"):
      </p>
      <ol style={{ margin: "0 0 20px", paddingLeft: 20 }}>
        {[
          ["Term.", "This Agreement begins on the signature date and continues month-to-month. Either party may terminate with 14 days' written notice."],
          ["Commissions.", `Awaken Biolabs LLC will pay Ambassador ${commissionPct}% of the net sale amount (post-10%-discount) on any order placed using Ambassador's unique code. Commissions are paid monthly, on the 15th of the following month, for all orders that have cleared the refund window.`],
          ["Refunds & Chargebacks.", "Any commission paid on an order that is later refunded or charged back will be deducted from the Ambassador's next payout."],
          ["Conduct & Compliance.", "Ambassador will represent Awaken Biolabs LLC professionally, will not make unauthorized medical claims, and will include all compliance language (research use only, etc.) required by the Company when publicly promoting products."],
          ["Exclusivity.", "While this Agreement is active, Ambassador will not promote directly competing peptide or research-compound brands. General health and wellness brands are fine."],
          ["Brand Assets.", "Awaken Biolabs LLC grants Ambassador a limited, non-exclusive license to use approved brand assets solely for the purpose of promoting Company products. All assets remain property of Awaken Biolabs LLC."],
          ["Pricing & Right to Modify.", "All product prices listed in this Agreement are for reference only and reflect pricing current as of the Agreement date. Awaken Biolabs LLC reserves the right, in its sole and absolute discretion, to modify any product price at any time and without prior notice. Commission calculations will always be based on the actual net sale amount at the time of the transaction. Ambassador expressly acknowledges that no pricing in this Agreement constitutes a guarantee or warranty of future pricing."],
          ["Independent Contractor.", "Ambassador is an independent contractor, not an employee. Ambassador is responsible for their own taxes and business registration where applicable."],
          ["Licensing Option.", "Ambassadors in good standing for 60+ days may apply to upgrade to the Licensed Partner tier, subject to a separate licensing agreement and the one-time $10,000 licensing fee outlined herein."],
          ["Modifications.", "Awaken Biolabs LLC may update program terms with 30 days' written notice. Continued participation after that notice constitutes acceptance."],
        ].map(([title, body], i) => (
          <li key={i} style={{ ...s.li, marginBottom: 10 }}>
            <strong style={{ color: C.text }}>{title}</strong> {body}
          </li>
        ))}
      </ol>

      {/* ── MUTUAL NDA ── */}
      <h2 style={s.h}>Mutual Non-Disclosure Agreement (NDA)</h2>
      <p style={{ ...s.p, marginTop: 12 }}>
        This Mutual Non-Disclosure Agreement is incorporated into and forms part of this Program Agreement between Awaken Biolabs LLC (the "Company") and the undersigned Ambassador. Each party may be the disclosing party ("Discloser") or the receiving party ("Recipient").
      </p>
      <ol style={{ margin: "0 0 20px", paddingLeft: 20 }}>
        {[
          ["Confidential Information.", '"Confidential Information" means all non-public information disclosed by Discloser to Recipient, in any form, including but not limited to: wholesale and retail pricing, supplier relationships, product formulations, sourcing channels, customer lists and data, marketing strategies, financial information, dashboards, internal documents, trade secrets, and the existence and terms of this Agreement.'],
          ["Obligations.", "Recipient will (a) hold Confidential Information in strict confidence, (b) use it solely to perform under this Agreement, (c) not disclose it to any third party without Discloser's prior written consent, and (d) protect it using at least the same degree of care it uses to protect its own confidential information (and in no event less than reasonable care)."],
          ["Exclusions.", "Confidential Information does not include information that: (a) is or becomes publicly available through no fault of Recipient; (b) was rightfully known to Recipient before disclosure; (c) is rightfully obtained from a third party without breach of any obligation; or (d) is independently developed by Recipient without use of Confidential Information."],
          ["Compelled Disclosure.", "If Recipient is legally compelled to disclose Confidential Information, Recipient will, where legally permitted, provide prompt written notice to Discloser and cooperate in seeking a protective order or other remedy."],
          ["Term.", "The confidentiality obligations in this NDA survive termination of the Program Agreement and continue for three (3) years thereafter. Obligations with respect to trade secrets continue for as long as such information remains a trade secret under applicable law."],
          ["Return or Destruction.", "Upon termination of this Agreement or upon Discloser's written request, Recipient will promptly return or destroy all Confidential Information in its possession and certify such destruction in writing if requested."],
          ["No License.", "Nothing in this NDA grants Recipient any license, ownership, or other rights to Discloser's Confidential Information, intellectual property, or trademarks except as expressly set forth in the Program Agreement."],
          ["Remedies.", "Recipient acknowledges that any breach of this NDA may cause irreparable harm for which monetary damages would be inadequate. Discloser is entitled to seek injunctive relief in addition to any other remedies available at law or in equity, without the necessity of posting bond."],
          ["Governing Law.", "This NDA is governed by the laws of the State in which Awaken Biolabs LLC is organized, without regard to its conflict of laws principles."],
        ].map(([title, body], i) => (
          <li key={i} style={{ ...s.li, marginBottom: 10 }}>
            <strong style={{ color: C.text }}>{title}</strong> {body}
          </li>
        ))}
      </ol>

      {/* Company signature block */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
        <table style={{ ...s.table, marginBottom: 0 }}>
          <thead>
            <tr>
              <th style={{ ...s.th, width: "50%", textAlign: "left", padding: "12px 16px" }}>Ambassador</th>
              <th style={{ ...s.th, width: "50%", textAlign: "left", padding: "12px 16px" }}>Awaken Biolabs LLC</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...s.td, padding: "20px 16px", borderBottom: "none" }}>
                <p style={{ margin: "0 0 20px", fontSize: 12, color: C.dim, fontFamily: "monospace" }}>Printed Name:</p>
                <p style={{ margin: "0 0 32px", fontSize: 13, color: C.bone, fontStyle: "italic" }}>To be completed upon signing</p>
                <p style={{ margin: "0 0 20px", fontSize: 12, color: C.dim, fontFamily: "monospace" }}>Signature:</p>
                <div style={{ borderBottom: `1px solid ${C.border}`, width: "80%", marginBottom: 20 }} />
                <p style={{ margin: "0 0 8px", fontSize: 12, color: C.dim, fontFamily: "monospace" }}>Date:</p>
                <div style={{ borderBottom: `1px solid ${C.border}`, width: "60%" }} />
              </td>
              <td style={{ ...s.td, padding: "20px 16px", borderLeft: `1px solid ${C.border}`, borderBottom: "none" }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: C.dim, fontFamily: "monospace" }}>Printed Name:</p>
                <p style={{ margin: "0 0 32px", fontSize: 15, fontWeight: 700, color: C.paper }}>Daniel Morales, Founder</p>
                <p style={{ margin: "0 0 20px", fontSize: 12, color: C.dim, fontFamily: "monospace" }}>Signature:</p>
                <div style={{ borderBottom: `1px solid ${C.border}`, width: "80%", marginBottom: 20 }} />
                <p style={{ margin: "0 0 8px", fontSize: 12, color: C.dim, fontFamily: "monospace" }}>Date:</p>
                <div style={{ borderBottom: `1px solid ${C.border}`, width: "60%" }} />
              </td>
            </tr>
          </tbody>
        </table>
        <p style={{ margin: "16px 0 0", fontSize: 11, color: C.dim, textAlign: "center", fontFamily: "monospace" }}>
          Awaken Biolabs LLC · awakenbiolabs.com · affiliates@awakenbiolabs.com · Optimize. Perform. Elevate.
        </p>
      </div>
    </div>
  );
}
