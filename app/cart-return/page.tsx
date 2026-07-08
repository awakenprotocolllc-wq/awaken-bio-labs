"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteShell from "@/components/SiteShell";
import { useCart } from "@/lib/cart";

// Landing page for abandoned-cart reminder links.
//
// The URL carries NO cart ID and NO token — only an optional reminder-stage
// marker (?r=1|2|3) for analytics. Flow:
//   authenticated  → restore the customer's own server-side cart snapshot
//                    (session-derived; IDOR impossible) → /checkout
//   unauthenticated → normal login with next=/cart-return, then the same flow.
// A same-device return usually still has the cart in localStorage; the server
// snapshot only fills in when the local cart is empty (cross-device return).
function CartReturnInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { items, replaceCart } = useCart();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const stage = params.get("r") ?? "";
    const src = /^[1-3]$/.test(stage) ? `r${stage}` : "";

    (async () => {
      try {
        const me = await fetch("/api/customer/me").then((r) => r.json()).catch(() => ({ ok: false }));
        if (!me.ok) {
          const next = encodeURIComponent(`/cart-return${src ? `?r=${stage}` : ""}`);
          router.replace(`/account/login?next=${next}`);
          return;
        }

        const res = await fetch(`/api/cart/restore${src ? `?src=${src}` : ""}`)
          .then((r) => r.json())
          .catch(() => ({ ok: false }));

        // Device cart wins; the server snapshot only fills an empty local cart
        if (res.ok && Array.isArray(res.items) && res.items.length > 0 && items.length === 0) {
          replaceCart(res.items);
        }
      } finally {
        router.replace("/checkout");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="bg-obsidian min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="text-center px-4">
        <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4" role="status">
          — RESTORING YOUR CART —
        </p>
        <p className="text-bone text-sm">One moment…</p>
      </div>
    </section>
  );
}

export default function CartReturnPage() {
  return (
    <SiteShell>
      <Suspense fallback={<section className="bg-obsidian min-h-[calc(100vh-200px)]" />}>
        <CartReturnInner />
      </Suspense>
    </SiteShell>
  );
}
