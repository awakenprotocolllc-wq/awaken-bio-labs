import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import AgeGate from "@/components/AgeGate";
import CookieBanner from "@/components/CookieBanner";
import ResearchDisclaimer from "@/components/ResearchDisclaimer";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const OG_DESCRIPTION =
  "Made in the USA · Third-Party Tested · 99%+ Purity · Research Use Only";

export const metadata: Metadata = {
  title: "Awaken Bio Labs — Research-Grade Peptide Compounds",
  description:
    "Research-grade peptide compounds for in-vitro laboratory use. Third-party tested, US-manufactured. In-vitro research use only.",
  openGraph: {
    title: "Awaken Bio Labs — Research-Grade Peptide Compounds",
    description: OG_DESCRIPTION,
    siteName: "Awaken Bio Labs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Awaken Bio Labs — Research-Grade Peptide Compounds",
    description: OG_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-obsidian text-paper font-sans antialiased">
        <ResearchDisclaimer variant="banner" />
        {children}
        <AgeGate />
        <CookieBanner />
        <Analytics />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MGV01ZQ646"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-MGV01ZQ646');
          `}
        </Script>
      </body>
    </html>
  );
}
