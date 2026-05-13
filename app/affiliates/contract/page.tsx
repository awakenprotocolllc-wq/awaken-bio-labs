import { getContractToken } from "@/lib/affiliate-db";
import ContractSigningForm from "./ContractSigningForm";

export const metadata = {
  title: "Affiliate Agreement — Awaken Bio Labs",
};

export default async function ContractPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ?? "";

  // Validate token server-side
  let errorMsg = "";
  let record = null;

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
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-[#E8E6E1] font-sans">
      {/* Header */}
      <div style={{ borderBottom: "1px solid #2A2B2F", padding: "20px 24px" }}>
        <p style={{ margin: 0, fontFamily: "monospace", fontSize: 11, letterSpacing: "0.2em", color: "#57C7D6", textTransform: "uppercase" }}>
          — AWAKEN BIO LABS —
        </p>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
        {errorMsg ? (
          <div style={{ background: "#141517", border: "1px solid #2A2B2F", padding: 32, textAlign: "center" }}>
            <p style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.2em", color: "#57C7D6", textTransform: "uppercase", marginBottom: 16 }}>
              — CONTRACT LINK —
            </p>
            <p style={{ color: "#A09E9A", fontSize: 15, margin: 0 }}>{errorMsg}</p>
            <p style={{ color: "#5A5856", fontSize: 13, marginTop: 16, fontFamily: "monospace" }}>
              Questions? support@awakenbiolabs.com
            </p>
          </div>
        ) : (
          <>
            {/* Intro */}
            <div style={{ borderLeft: "2px solid #57C7D6", paddingLeft: 20, marginBottom: 32 }}>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#F5F3EF", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                Affiliate Agreement
              </h1>
              <p style={{ margin: "12px 0 0", fontSize: 15, color: "#A09E9A", lineHeight: 1.6 }}>
                Hi {record!.name}, please review and digitally sign your Awaken Bio Labs Affiliate Agreement below.
                Once signed, your login credentials will be sent to {record!.email}.
              </p>
            </div>

            {/* Contract text */}
            <div style={{ background: "#141517", border: "1px solid #2A2B2F", padding: 28, marginBottom: 32 }}>
              <p style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.2em", color: "#57C7D6", textTransform: "uppercase", marginBottom: 20 }}>
                — AFFILIATE AGREEMENT —
              </p>

              <ContractBody />
            </div>

            {/* Signing form */}
            <ContractSigningForm token={token} name={record!.name} />
          </>
        )}
      </div>
    </div>
  );
}

function ContractBody() {
  const style = {
    p: { margin: "0 0 14px", fontSize: 13, color: "#A09E9A", lineHeight: 1.7 } as React.CSSProperties,
    h: { margin: "20px 0 8px", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.2em", color: "#57C7D6", textTransform: "uppercase" } as React.CSSProperties,
  };

  return (
    <div>
      <p style={style.p}>
        This Affiliate Agreement ("Agreement") is entered into between <strong style={{ color: "#E8E6E1" }}>Awaken Bio Labs LLC</strong> ("Company") and the affiliate named below ("Affiliate"), effective upon digital signature.
      </p>

      <p style={style.h}>1. Program Overview</p>
      <p style={style.p}>
        The Awaken Bio Labs Affiliate Program allows approved partners to earn commissions by referring customers to the Company's website. Affiliates receive a unique tracking link and discount code to share with their audience.
      </p>

      <p style={style.h}>2. Commission & Payouts</p>
      <p style={style.p}>
        Affiliate earns a commission on each <strong style={{ color: "#E8E6E1" }}>fulfilled</strong> order attributed to their affiliate code or tracking link. Commission rates are established at account creation and communicated to the Affiliate upon approval. Commissions are paid on a schedule determined by the Company (typically monthly). Orders that are cancelled, refunded, or not fulfilled are not eligible for commission.
      </p>

      <p style={style.h}>3. Customer Discount</p>
      <p style={style.p}>
        The Affiliate's unique discount code provides customers with a <strong style={{ color: "#E8E6E1" }}>10% discount</strong> on their order total. Discount codes may not be stacked with other promotions. The Company reserves the right to modify discount rates with reasonable notice.
      </p>

      <p style={style.h}>4. Affiliate Obligations</p>
      <p style={style.p}>
        Affiliate agrees to: (a) promote Awaken Bio Labs products honestly and accurately; (b) clearly disclose the affiliate relationship to their audience in compliance with applicable law (including FTC guidelines); (c) not make medical or health claims about products; (d) represent products as intended solely for in-vitro research use only, not for human or veterinary consumption; (e) not engage in spam, misleading advertising, or incentivized clicks.
      </p>

      <p style={style.h}>5. Prohibited Conduct</p>
      <p style={style.p}>
        Affiliate may not: bid on the Company's branded keywords in paid search without prior written approval; misrepresent products; promote on adult content platforms; or make regulatory claims about the Company's research compounds. Violation may result in immediate termination and forfeiture of unpaid commissions.
      </p>

      <p style={style.h}>6. Intellectual Property</p>
      <p style={style.p}>
        The Company grants Affiliate a limited, non-exclusive license to use Awaken Bio Labs branding solely for program promotion. Affiliate may not alter logos, create derivative marks, or use branding in a misleading way.
      </p>

      <p style={style.h}>7. Term & Termination</p>
      <p style={style.p}>
        This Agreement continues until terminated by either party with 14 days written notice. The Company may terminate immediately for cause (including breach of this Agreement). Upon termination, Affiliate's tracking links and codes will be deactivated. Earned commissions on fulfilled orders prior to termination will be paid at the next scheduled payout.
      </p>

      <p style={style.h}>8. Confidentiality</p>
      <p style={style.p}>
        Affiliate agrees to keep commission rates, approval criteria, and any non-public business information confidential.
      </p>

      <p style={style.h}>9. Disclaimer & Limitation of Liability</p>
      <p style={style.p}>
        The Company makes no guarantees regarding earning potential. Affiliate's commissions depend entirely on their own promotional efforts. The Company's total liability under this Agreement is limited to unpaid commissions owed.
      </p>

      <p style={style.h}>10. Governing Law</p>
      <p style={{ ...style.p, marginBottom: 0 }}>
        This Agreement is governed by the laws of the State of Nevada, USA. Any disputes shall be resolved through binding arbitration in Nevada.
      </p>
    </div>
  );
}
