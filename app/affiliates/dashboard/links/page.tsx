"use client";

import { useEffect, useState } from "react";
import AffiliateDashboardShell from "@/components/AffiliateDashboardShell";
import { getCurrentUser } from "@/lib/affiliate-auth";

export default function LinksPage() {
  const [code, setCode] = useState("PARTNER");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (u) setCode(u.affiliateCode);
  }, []);

  const baseUrl = "https://awakenbiolabs.com";
  const links = [
    { label: "Homepage", url: `${baseUrl}/?ref=${code}` },
    { label: "Shop · Full Catalog", url: `${baseUrl}/shop?ref=${code}` },
    { label: "BPC-157 (top seller)", url: `${baseUrl}/shop/bpc-157?ref=${code}` },
    { label: "Tirzepatide", url: `${baseUrl}/shop/tirzepatide?ref=${code}` },
  ];

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <AffiliateDashboardShell title="Links & codes.">
      {/* Discount code */}
      <div className="bg-carbon border border-slate p-6 sm:p-8 mb-8">
        <p className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase mb-3">
          — YOUR DISCOUNT CODE —
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-sans font-bold text-paper text-3xl sm:text-4xl tracking-tight">
              {code}
            </p>
            <p className="text-bone text-sm mt-2">
              Customers using this code get 10% off. You earn 25% commission.
            </p>
          </div>
          <button
            onClick={() => copy(code)}
            className="bg-accent text-obsidian font-semibold px-6 h-11 min-h-[44px] hover:bg-accent/80 transition-colors flex-shrink-0"
          >
            {copied === code ? "✓ Copied" : "Copy Code"}
          </button>
        </div>
      </div>

      {/* Tracking links */}
      <div className="bg-carbon border border-slate">
        <div className="p-6 border-b border-slate">
          <h2 className="font-sans font-bold text-paper text-xl mb-1">Tracking links</h2>
          <p className="text-bone text-sm">
            Share these on your platforms. 60-day cookie window. Commission is
            attributed to the most recent click.
          </p>
        </div>
        <div>
          {links.map((l) => (
            <div
              key={l.label}
              className="border-b border-slate last:border-b-0 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] text-bone tracking-[0.2em] uppercase mb-2">
                  {l.label}
                </p>
                <p className="font-mono text-sm text-paper truncate">{l.url}</p>
              </div>
              <button
                onClick={() => copy(l.url)}
                className="border border-accent text-accent font-mono text-xs tracking-wider uppercase px-4 h-10 min-h-[44px] hover:bg-accent/10 transition-colors flex-shrink-0"
              >
                {copied === l.url ? "✓ COPIED" : "COPY LINK"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Generator hint */}
      <div className="mt-6 bg-carbon border border-slate p-5">
        <p className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase mb-2">
          — CUSTOM LINK —
        </p>
        <p className="text-bone text-sm">
          Need a tracking link to a specific product? Append{" "}
          <code className="font-mono text-accent">?ref={code}</code> to any URL on
          {" "}awakenbiolabs.com — the link will be tracked automatically.
        </p>
      </div>
    </AffiliateDashboardShell>
  );
}
