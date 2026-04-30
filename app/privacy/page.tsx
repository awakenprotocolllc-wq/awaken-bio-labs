import LegalPage from "@/components/LegalPage";
import { business } from "@/lib/business";

export const metadata = { title: `Privacy Policy · ${business.name}` };

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="LEGAL"
      title="Privacy Policy."
      subtitle={`How ${business.name} collects, uses, and safeguards your personal information.`}
    >
      <p>
        At {business.name}, protecting the privacy and security of our visitors and
        customers is a top priority. This Privacy Policy explains how we collect,
        use, store, and safeguard your information when you visit our website or
        use our services.
      </p>

      <h2>1. Information We Collect</h2>
      <p>When you visit or place an order, we may collect:</p>
      <ul>
        <li>Name, email address, and contact details</li>
        <li>Billing and shipping addresses</li>
        <li>Order history and transaction records (excluding full card numbers)</li>
        <li>Website usage data such as IP address, browser type, and access times</li>
      </ul>
      <p>
        We use this information to process orders, improve your experience, and
        provide customer support.
      </p>

      <h2>2. Cookies &amp; Tracking</h2>
      <p>Our website uses cookies and similar technologies to:</p>
      <ul>
        <li>Remember items placed in your shopping cart</li>
        <li>Understand how visitors interact with the website</li>
        <li>Deliver a more personalized browsing experience</li>
      </ul>
      <p>
        You may disable cookies in your browser settings. Some features may not
        function properly without them.
      </p>

      <h2>3. Email &amp; SMS Communication</h2>
      <p>By creating an account or placing an order, you may receive:</p>
      <ul>
        <li>Order confirmations and customer support messages</li>
        <li>Shipping and delivery notifications</li>
        <li>Product updates, promotions, and special offers (you can unsubscribe at any time)</li>
      </ul>
      <p>
        We do not share SMS/text message opt-in data with third parties for
        promotional purposes.
      </p>

      <h2>4. Sharing of Information</h2>
      <p>
        {business.name} does not sell, rent, or trade your personal information to
        third parties. We share information only with trusted service providers
        who assist with payment processing, order fulfillment, or website
        operations — and only to the extent necessary to perform those functions.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        We retain personal information only as long as necessary to fulfill the
        purposes outlined in this Policy or as required by law (e.g., tax,
        accounting, or compliance obligations).
      </p>

      <h2>6. Security</h2>
      <p>
        We use industry-standard SSL encryption and security measures to protect
        sensitive data. While no method of transmission over the internet is 100%
        secure, we take reasonable precautions and recommend you safeguard your
        login credentials.
      </p>

      <h2>7. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Request a copy of the personal information we hold about you</li>
        <li>Request correction of inaccurate information</li>
        <li>Request deletion of your information (subject to legal retention requirements)</li>
        <li>Opt out of marketing communications at any time</li>
      </ul>

      <h2>8. Third-Party Links</h2>
      <p>
        Our website may contain links to external sites. {business.name} is not
        responsible for the privacy practices or content of those sites.
      </p>

      <h2>9. Children&apos;s Privacy</h2>
      <p>
        Our services are not directed to individuals under 21. We do not knowingly
        collect personal information from minors.
      </p>

      <h2>10. Updates to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. The &quot;Effective
        Date&quot; at the top of this page reflects the latest revision.
      </p>

      <h2>11. Contact Us</h2>
      <p>
        Questions about this Policy or your data? Contact us at{" "}
        <a href={`mailto:${business.email}`}>{business.email}</a>.
      </p>
    </LegalPage>
  );
}
