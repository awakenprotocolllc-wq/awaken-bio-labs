import LegalPage from "@/components/LegalPage";
import { business } from "@/lib/business";

export const metadata = { title: `Terms of Use · ${business.name}` };

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="LEGAL"
      title="Terms of Use."
      subtitle={`Please read these Terms carefully before using ${business.name}.`}
    >
      <p>
        By accessing or using {business.name} (&quot;we,&quot; &quot;us,&quot; or
        &quot;our&quot;), you agree to be bound by these Terms of Use. If you do not
        agree, do not use this website.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 21 years of age and a licensed researcher, scientist,
        or affiliated with a research institution to purchase products from this site.
        By placing an order, you represent and warrant that you meet these criteria.
      </p>

      <h2>2. Research Use Only</h2>
      <p>
        All products sold by {business.name} are intended <strong>solely for
        in-vitro research and laboratory experimentation</strong>. They are not drugs,
        food, or cosmetics. They are <strong>not for human or animal consumption,
        therapeutic, or diagnostic use</strong>. Statements made on this website
        have not been evaluated by the U.S. Food and Drug Administration (FDA).
      </p>

      <h2>3. Orders, Payments &amp; Pricing</h2>
      <ul>
        <li>Prices are listed in U.S. Dollars and may change without notice.</li>
        <li>Payments must be completed at the time of order via approved payment methods.</li>
        <li>Orders placed after 11:00 PM PST are processed the following business day.</li>
        <li>Due to the nature of our products, all sales are final unless otherwise stated in our Returns &amp; Refunds Policy.</li>
      </ul>

      <h2>4. Shipping &amp; Delivery</h2>
      <p>
        Orders generally ship the next business day after processing. Standard
        delivery is 2–5 business days within the continental United States.
        {" "}{business.name} is not responsible for delays caused by shipping carriers,
        customs, or events beyond our control. See our Shipping Policy for full details.
      </p>

      <h2>5. Intellectual Property</h2>
      <p>
        All website content — including branding, text, graphics, photography, and
        design — is the property of {business.name} and is protected by intellectual
        property laws. Unauthorized reproduction, modification, or distribution is
        strictly prohibited.
      </p>

      <h2>6. Disclaimer of Warranties</h2>
      <ul>
        <li>All products and information are provided &quot;as is&quot; without warranty of any kind.</li>
        <li>Products are not intended to diagnose, treat, cure, or prevent any disease.</li>
        <li>Customers assume all responsibility for the safe handling and lawful use of products purchased.</li>
      </ul>

      <h2>7. Limitation of Liability</h2>
      <p>
        In no event shall {business.name}, its owners, employees, or affiliates be
        held liable for any direct, indirect, incidental, consequential, or punitive
        damages arising from the use or misuse of products. By purchasing, you agree
        to <strong>indemnify and hold {business.name} harmless</strong> from any
        claims, losses, or liabilities connected to your use of our products.
      </p>

      <h2>8. Termination of Use</h2>
      <p>
        We reserve the right to refuse service, cancel accounts, or deny sales to
        any individual who does not comply with these Terms.
      </p>

      <h2>9. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the State of {business.address.state},
        United States, without regard to conflict of laws principles. Any disputes
        shall be resolved in the courts of {business.address.state}.
      </p>

      <h2>10. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the website
        after changes constitutes acceptance of the revised Terms.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these Terms? Contact us at{" "}
        <a href={`mailto:${business.email}`}>{business.email}</a>.
      </p>
    </LegalPage>
  );
}
