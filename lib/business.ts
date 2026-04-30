// Single source of truth for business contact info.
// REPLACE THE PLACEHOLDERS below with your real info before submitting to ChargX/Link.money.
// Edit this file once and all pages/footers/legal documents update automatically.

export const business = {
  name: "Awaken Bio Labs",
  legalName: "Awaken Bio Labs LLC", // replace with registered legal name
  email: "support@awakenbiolabs.com",
  affiliateEmail: "affiliates@awakenbiolabs.com",
  wholesaleEmail: "wholesale@awakenbiolabs.com",
  phone: "(555) 555-5555", // REPLACE
  address: {
    line1: "1234 Example St", // REPLACE
    line2: "Suite 100",        // REPLACE or remove
    city: "Las Vegas",          // REPLACE
    state: "NV",                // REPLACE
    zip: "89101",               // REPLACE
    country: "USA",
  },
  hours: "Mon – Fri · 9am – 6pm ET",
  effectiveDate: "April 30, 2026", // updated when policies change
};

export function fullAddress(): string {
  const a = business.address;
  return `${a.line1}${a.line2 ? `, ${a.line2}` : ""}, ${a.city}, ${a.state} ${a.zip}, ${a.country}`;
}
