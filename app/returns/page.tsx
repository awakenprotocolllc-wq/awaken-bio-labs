import LegalPage from "@/components/LegalPage";
import { business } from "@/lib/business";

export const metadata = { title: `Returns & Refunds · ${business.name}` };

export default function ReturnsPage() {
  return (
    <LegalPage
      eyebrow="LEGAL"
      title="Returns & Refunds."
      subtitle="What is and isn't eligible for return, and how to request a replacement or refund."
    >
      <h2>1. General Policy</h2>
      <p>
        Due to the sensitive nature of research compounds and the requirements of
        product integrity, <strong>all sales are final</strong>. We do not accept
        returns of opened, used, or unsealed product.
      </p>

      <h2>2. Eligible Returns</h2>
      <p>We will replace or refund orders in the following situations:</p>
      <ul>
        <li><strong>Damaged on arrival:</strong> visible damage to product or packaging upon delivery</li>
        <li><strong>Incorrect product shipped:</strong> different compound, strength, or quantity than ordered</li>
        <li><strong>Defective product:</strong> failed batch verification or fails to meet specification on COA</li>
        <li><strong>Lost in transit:</strong> tracking shows package never delivered after carrier investigation</li>
      </ul>

      <h2>3. How to Request a Return or Refund</h2>
      <ol>
        <li>
          <strong>Within 7 days of delivery</strong>, email{" "}
          <a href={`mailto:${business.email}`}>{business.email}</a> with:
          <ul>
            <li>Your order number</li>
            <li>Photos of the damaged product or packaging (if applicable)</li>
            <li>A brief description of the issue</li>
          </ul>
        </li>
        <li>Our team will respond within 1 business day with next steps.</li>
        <li>If approved, you will receive either a full refund to the original payment method or a replacement shipped at no cost.</li>
      </ol>

      <h2>4. Refund Processing Time</h2>
      <p>
        Approved refunds are processed to the original payment method within 5–10
        business days. Your bank or card issuer may take additional time to post
        the credit to your account.
      </p>

      <h2>5. Non-Returnable Items</h2>
      <ul>
        <li>Opened, used, or unsealed compounds</li>
        <li>Products purchased through a third-party reseller</li>
        <li>Products damaged due to improper storage or handling after delivery</li>
        <li>Custom blends or special-order items</li>
      </ul>

      <h2>6. Cancellations</h2>
      <p>
        Orders may be cancelled for a full refund if requested before the order
        ships. Once a tracking number is generated, the order cannot be cancelled
        — but you may follow the return process above if applicable.
      </p>

      <h2>7. Chargebacks</h2>
      <p>
        We ask that you contact us first to resolve any payment dispute before
        initiating a chargeback with your card issuer. Filing a chargeback without
        first attempting to resolve the issue may result in account suspension.
      </p>

      <h2>8. Contact</h2>
      <p>
        Returns or refund questions? Email{" "}
        <a href={`mailto:${business.email}`}>{business.email}</a> during business
        hours ({business.hours}).
      </p>
    </LegalPage>
  );
}
