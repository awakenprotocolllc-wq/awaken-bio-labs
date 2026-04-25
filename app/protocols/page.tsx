import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import PageHeader from "@/components/PageHeader";

export const metadata = {
  title: "Protocols · Awaken Bio Labs",
  description:
    "Full peptide protocols, precision meal plans, and elite training programming. Included with every order.",
};

const pillars = [
  {
    title: "Peptide Protocol",
    body:
      "Clinically structured compound cycles built around your goal — recovery, longevity, body composition, or cognition. Dosing windows, stack synergy, on/off cycling, and reconstitution guides.",
    points: [
      "Goal-specific cycle templates",
      "Stack synergy mapping",
      "On/off cycling schedules",
      "Reconstitution & storage guides",
    ],
  },
  {
    title: "Nutrition Plan",
    body:
      "Macros and meal frameworks designed to amplify the protocol you're running. Built by sports nutritionists, calibrated to your bodyweight and training load.",
    points: [
      "Macro split per protocol type",
      "Meal frameworks (not rigid plans)",
      "Pre/intra/post-training fueling",
      "Supplement timing alignment",
    ],
  },
  {
    title: "Training Program",
    body:
      "Elite programming from coaches who actually use the science. Hypertrophy, strength, conditioning, and recovery blocks that complement your peptide cycle.",
    points: [
      "12-week periodized blocks",
      "Hypertrophy + strength tracks",
      "Recovery & deload programming",
      "Optional conditioning add-ons",
    ],
  },
];

const phases = [
  { phase: "01", label: "Place Order", body: "Any product unlocks protocol access." },
  { phase: "02", label: "Get Onboarded", body: "Brief intake on goals, training history, and stack." },
  { phase: "03", label: "Receive Protocol", body: "Custom-fit protocol delivered within 48 hours." },
  { phase: "04", label: "Run & Refine", body: "Check-ins, adjustments, and iterations as you progress." },
];

export default function ProtocolsPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="EXCLUSIVE ACCESS"
        title="The Awaken Protocol."
        subtitle="A complete operating system for serious researchers. Peptide cycles, nutrition, and training — engineered together. Included free with any order."
      />

      <section className="bg-obsidian py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="bg-carbon border-t-4 border-accent border-x border-b border-x-slate border-b-slate p-8 flex flex-col"
            >
              <h2 className="font-sans font-bold text-paper text-2xl mb-3">{p.title}</h2>
              <p className="text-bone leading-relaxed mb-6">{p.body}</p>
              <ul className="space-y-2 mt-auto">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-3 text-paper text-sm">
                    <span className="text-accent mt-0.5">→</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-carbon border-t border-b border-slate py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">
            — HOW IT WORKS —
          </p>
          <h2 className="font-sans font-bold text-paper text-4xl sm:text-5xl mb-12 max-w-2xl leading-[1]">
            Four steps. One protocol. Built for you.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate">
            {phases.map((ph) => (
              <div key={ph.phase} className="bg-carbon p-6 sm:p-8">
                <p className="font-mono text-accent text-3xl mb-4">{ph.phase}</p>
                <h3 className="font-sans font-bold text-paper text-lg mb-2">{ph.label}</h3>
                <p className="text-bone text-sm leading-relaxed">{ph.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-obsidian py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-sans font-bold text-paper text-4xl sm:text-5xl md:text-6xl leading-[1] mb-6 tracking-tight">
            Run with the protocol. Or run blind.
          </h2>
          <p className="text-bone text-lg mb-10 max-w-2xl mx-auto">
            Every order unlocks the full Awaken Protocol library. No upsells, no paywalls.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/shop"
              className="bg-accent text-obsidian font-semibold px-8 h-12 inline-flex items-center hover:bg-accent/80 transition-colors"
            >
              Shop Products
            </Link>
            <Link
              href="/contact"
              className="border border-accent text-accent font-semibold px-8 h-12 inline-flex items-center hover:bg-accent/10 transition-colors"
            >
              Talk To A Specialist
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
