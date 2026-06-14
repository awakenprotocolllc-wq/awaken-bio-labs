/** @type {import('next').NextConfig} */

// Applied to every response the Next.js server sends.
// Vercel handles HTTP→HTTPS at the platform level; these headers add the
// browser-side enforcement layer on top.
const securityHeaders = [
  // Tell browsers to use HTTPS exclusively for 2 years.
  // includeSubDomains covers any sub-domains; preload registers the site
  // in browser preload lists so the first-ever visit is also forced to HTTPS.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },

  // Prevent browsers from guessing a response's content type.
  // Without this a browser might execute a text/plain response as JavaScript.
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },

  // Block this site from being embedded in any <iframe> or <frame>.
  // Prevents clickjacking attacks where an attacker overlays a transparent
  // iframe to steal clicks on the checkout or login forms.
  {
    key: "X-Frame-Options",
    value: "DENY",
  },

  // Send only the origin (https://awakenbiolabs.com) as the Referer header
  // on cross-origin requests, never the full path or query string.
  // Prevents order IDs, affiliate codes, or reset tokens in URLs from
  // leaking to third-party services via the Referer header.
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },

  // Disable browser APIs this site never uses.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },

  // Content Security Policy.
  //
  // 'unsafe-inline' is required for both scripts and styles because:
  //   - Next.js injects inline <script> tags for RSC hydration payloads
  //   - Tailwind CSS generates class-based styles that Next.js renders inline
  //
  // Despite 'unsafe-inline', the policy still meaningfully hardens the app:
  //   - script-src 'self': blocks <script src="https://evil.com/...">
  //   - frame-ancestors 'none': enforced regardless of unsafe-inline
  //   - object-src 'none': blocks Flash/Java plugins entirely
  //   - base-uri 'self': prevents <base href> injection
  //   - form-action 'self': blocks forms from submitting to external sites
  //   - upgrade-insecure-requests: upgrades any accidental http:// subresource
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
