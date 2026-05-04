// Single source of truth for business contact info.
// Edit this file once and all pages/footers/legal documents update automatically.

export const business = {
  name: "Awaken Biolabs",
  legalName: "Awaken Biolabs LLC",
  nvBusinessId: "NV20263565539",
  entityId: "E56878422026-4",
  managingMember: "Daniel Morales",

  email: "support@awakenbiolabs.com",
  affiliateEmail: "affiliates@awakenbiolabs.com",
  wholesaleEmail: "wholesale@awakenbiolabs.com",

  // TODO: replace with real business phone before submitting to ChargX/Link.money
  phone: "(702) 555-0100",

  // Principal business address (from NV Initial List filing, 04/22/2026)
  address: {
    line1: "9440 West Sahara Avenue",
    line2: "Suite 180",
    city: "Las Vegas",
    state: "NV",
    zip: "89117",
    country: "USA",
  },

  hours: "Mon – Fri · 9am – 6pm PT",
  effectiveDate: "April 22, 2026",
};

export function fullAddress(): string {
  const a = business.address;
  return `${a.line1}${a.line2 ? `, ${a.line2}` : ""}, ${a.city}, ${a.state} ${a.zip}, ${a.country}`;
}
