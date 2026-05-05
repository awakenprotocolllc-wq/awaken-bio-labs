import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
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

export const metadata: Metadata = {
  title: "Awaken Bio Labs — Research-Grade Peptide Compounds",
  description:
    "Research-grade peptide compounds for in-vitro laboratory use. Third-party tested, US-manufactured. Not for human or veterinary use.",
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
      </body>
    </html>
  );
}
