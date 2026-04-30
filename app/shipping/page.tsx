import LegalPage from "@/components/LegalPage";
import { business } from "@/lib/business";

export const metadata = { title: `Shipping Policy · ${business.name}` };

export default function ShippingPage() {
  return (
    <LegalPage
      eyebrow="LEGAL"
      title="Shipping Policy."
      subtitle="Processing times, carriers, transit windows, and what happens if a package is lost or damaged."
    >
      <h2>1. Processing Time</h2>
      <ul>
        <li>Orders placed before 1:00 PM ET on a business day ship the same day.</li>
        <li>Orders placed after the cutoff or on weekends/holidays ship the next business day.</li>
        <li>Custom or back-ordered items may require additional processing time — you will be notified by email.</li>
      </ul>

      <h2>2. Shipping Methods &amp; Transit Time</h2>
      <ul>
        <li><strong>FedEx 2-Day:</strong> standard for all domestic orders</li>
        <li><strong>FedEx Overnight:</strong> available at checkout for time-sensitive orders</li>
        <li>Cold-chain handling (refrigerated/insulated packaging) is applied to compounds requiring it, at no extra cost</li>
      </ul>

      <h2>3. Shipping Destinations</h2>
      <p>
        We currently ship within the <strong>United States only</strong>, including
        Alaska and Hawaii. International shipping is not available at this time.
      </p>

      <h2>4. Shipping Charges</h2>
      <p>
        Shipping rates are calculated at checkout based on order weight, destination,
        and service level selected. Promotional free-shipping thresholds, if any,
        will be displayed at checkout.
      </p>

      <h2>5. Tracking</h2>
      <p>
        A tracking number will be emailed once your order ships. Allow up to 24
        hours after shipment for tracking details to populate with the carrier.
      </p>

      <h2>6. Lost, Stolen, or Damaged Packages</h2>
      <p>
        If your package arrives damaged or fails to arrive within 7 business days
        of the carrier&apos;s estimated delivery date, contact{" "}
        <a href={`mailto:${business.email}`}>{business.email}</a> within 14 days of
        the original ship date. We will work with the carrier to resolve the claim
        and re-ship or refund as appropriate.
      </p>
      <p>
        {business.name} is not responsible for packages marked &quot;delivered&quot;
        by the carrier that are subsequently stolen from the delivery address.
      </p>

      <h2>7. Address Accuracy</h2>
      <p>
        Customers are responsible for providing accurate shipping addresses. Orders
        returned due to incorrect addresses may be re-shipped at the customer&apos;s
        expense.
      </p>

      <h2>8. Restricted Areas</h2>
      <p>
        We reserve the right to refuse shipment to addresses or jurisdictions where
        our products may not be legally received or where carrier service is not
        available.
      </p>

      <h2>9. Contact</h2>
      <p>
        Shipping questions? Email{" "}
        <a href={`mailto:${business.email}`}>{business.email}</a>.
      </p>
    </LegalPage>
  );
}
