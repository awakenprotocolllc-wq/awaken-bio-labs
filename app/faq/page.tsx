import SiteShell from "@/components/SiteShell";
import PageHeader from "@/components/PageHeader";
import FAQAccordion from "./FAQAccordion";

export const metadata = {
  title: "FAQ · Awaken Bio Labs",
  description: "Frequently asked questions about Awaken Bio Labs peptides, quality standards, US manufacturing, shipping, and ordering.",
};

const sections = [
  {
    heading: "Products & Quality",
    faqs: [
      {
        q: "Where are your products manufactured?",
        a: "Every compound we carry is manufactured in the United States. We do not source product from overseas suppliers. Domestic manufacturing gives us tighter quality control, shorter supply chains, and full visibility into what goes into every vial.",
      },
      {
        q: "Where is third-party testing conducted?",
        a: "All third-party testing is completed by independent, accredited laboratories based in the United States. We do not send samples abroad. Every Certificate of Analysis is issued by a domestic lab whose credentials you can verify.",
      },
      {
        q: "What purity standard do you guarantee?",
        a: "We guarantee ≥99% purity on all compounds, verified by HPLC analysis. Each batch is independently tested before it ships. You can download the Certificate of Analysis for any product on our COAs page.",
      },
      {
        q: "What is a Certificate of Analysis (COA)?",
        a: "A COA is a document from an independent laboratory confirming the identity, purity, and concentration of a compound. Every product we ship comes with a corresponding COA from a US-based third-party lab. COAs are available for download on our COAs page.",
      },
      {
        q: "Are products lyophilized (freeze-dried)?",
        a: "Yes. All peptide compounds are supplied in lyophilized (freeze-dried) powder form unless otherwise specified. Lyophilization maximizes stability and shelf life during transit and storage.",
      },
    ],
  },
  {
    heading: "Orders & Shipping",
    faqs: [
      {
        q: "How do I place an order?",
        a: "Browse our catalog, find the compound and strength you need, and click 'Place an Order' on the product page. This opens a pre-filled email to our team. We'll confirm availability, provide an invoice, and ship once payment is received.",
      },
      {
        q: "How fast do orders ship?",
        a: "Orders confirmed before 1PM Eastern ship same day via FedEx 2-Day. Orders confirmed after 1PM ship the following business day. Cold-chain handling is applied where required.",
      },
      {
        q: "Do you ship internationally?",
        a: "We currently ship within the United States only. International availability may expand in the future — contact us to be added to the notification list.",
      },
      {
        q: "How are products packaged for shipping?",
        a: "Compounds are packaged in tamper-evident, UV-protective vials inside insulated shipping containers. Cold packs are included where temperature sensitivity requires it.",
      },
    ],
  },
  {
    heading: "Research & Compliance",
    faqs: [
      {
        q: "Are your products for human consumption?",
        a: "No. All Awaken Bio Labs products are sold strictly for in-vitro research, laboratory analysis, and scientific experimentation. They are not intended for human consumption, veterinary use, or therapeutic application of any kind.",
      },
      {
        q: "Who can purchase from Awaken Bio Labs?",
        a: "Our products are intended for qualified researchers, laboratory professionals, and licensed institutions. By purchasing, you confirm that you are 21 or older and that products will be used exclusively for lawful research purposes.",
      },
      {
        q: "Are these products FDA approved?",
        a: "No. Research compounds sold on this site are not FDA-approved for human use. Statements made on this website have not been evaluated by the FDA and are not intended to diagnose, treat, cure, or prevent any disease.",
      },
    ],
  },
  {
    heading: "Returns & Support",
    faqs: [
      {
        q: "What is your return policy?",
        a: "Due to the nature of research compounds, we do not accept returns of opened product. Damaged or incorrect shipments are replaced at no charge — contact us within 7 days of delivery with your order number and photos of the issue.",
      },
      {
        q: "How do I reach your team?",
        a: "Email support@awakenbiolabs.com for general inquiries. We respond to every message within one business day, Monday through Friday 9AM–6PM ET.",
      },
      {
        q: "Do you offer wholesale or bulk pricing?",
        a: "Yes. Email wholesale@awakenbiolabs.com with your requirements and we'll provide a custom quote. Bulk pricing is available for qualified buyers.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="FAQ"
        title="Frequently Asked."
        subtitle="Everything you need to know about our products, quality standards, and how to order."
      />

      <section className="bg-obsidian py-14 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4">
          <FAQAccordion sections={sections} />

          <div className="bg-carbon border border-slate p-6 sm:p-8 mt-16">
            <p className="font-mono text-accent text-[10px] tracking-[0.2em] mb-3">— STILL HAVE QUESTIONS? —</p>
            <h3 className="font-sans font-bold text-paper text-2xl mb-2">Talk to our team.</h3>
            <p className="text-bone mb-6">We respond to every inquiry within one business day.</p>
            <a
              href="/contact"
              className="inline-flex items-center bg-accent text-obsidian font-semibold px-7 h-12 min-h-[44px] hover:bg-accent/80 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
