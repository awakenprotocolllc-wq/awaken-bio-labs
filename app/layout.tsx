import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AgeGate from "@/components/AgeGate";
import CookieBanner from "@/components/CookieBanner";

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
  title: "Awaken Bio Labs — Peptide Science. Human Potential.",
  description:
    "62 research compounds. Verified purity. Third-party tested. Built for serious researchers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-obsidian text-paper font-sans antialiased">
        {children}
        <AgeGate />
        <CookieBanner />
      </body>
    </html>
  );
}
