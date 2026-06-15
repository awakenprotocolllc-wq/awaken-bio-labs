"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import SuccessTransition from "@/components/SuccessTransition";

function passwordStrength(p: string): { score: number; label: string; color: string } {
  if (p.length === 0) return { score: 0, label: "", color: "" };
  let score = 0;
  if (p.length >= 8)  score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;

  if (score <= 1) return { score, label: "Weak",   color: "bg-red-400" };
  if (score <= 2) return { score, label: "Fair",   color: "bg-yellow-400" };
  if (score <= 3) return { score, label: "Good",   color: "bg-blue-400" };
  return              { score, label: "Strong", color: "bg-green-400" };
}

export default function CustomerSignupPage() {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next") ?? "";
  // Allow only same-origin relative paths; reject absolute URLs and protocol-relative redirects
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [researcherCategory, setResearcherCategory] = useState("");
  const [businessType, setBusinessType]             = useState("");
  const [institution, setInstitution]               = useState("");
  const [certifiedAge, setCertifiedAge]             = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  const strength = passwordStrength(password);
  const handleComplete = useCallback(() => router.push(next), [router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) { setError("All fields are required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!researcherCategory) { setError("Please select your researcher category."); return; }
    if (!businessType) { setError("Please select your business type."); return; }
    if (!certifiedAge) { setError("Please confirm you are 21 or older and agree to the research use terms."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/customer/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, researcherCategory, businessType, institution: institution || undefined, certifiedAge }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Signup failed."); setLoading(false); return; }
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <section className="min-h-[calc(100vh-200px)] bg-obsidian flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">— YOUR ACCOUNT —</p>
          <h1 className="font-sans font-bold text-paper text-3xl mb-2">Create account</h1>
          <p className="font-sans text-bone text-sm mb-8">Required to place an order. Takes 30 seconds.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                className="w-full bg-carbon border border-slate text-paper font-sans text-sm px-4 h-11 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full bg-carbon border border-slate text-paper font-sans text-sm px-4 h-11 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full bg-carbon border border-slate text-paper font-sans text-sm px-4 h-11 focus:outline-none focus:border-accent transition-colors"
              />
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-0.5">
                    {[1,2,3,4].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-200 ${
                          strength.score >= i ? strength.color : "bg-slate"
                        }`}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className="font-mono text-[10px] text-bone/50 tracking-wider">{strength.label}</p>
                  )}
                </div>
              )}
            </div>

            {/* Researcher Category */}
            <div>
              <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-3">Researcher Category *</label>
              <div className="space-y-2">
                {["Analytical Chemistry", "Private Research Organization", "Education Institution", "Hospital/Medical Institution"].map((opt) => (
                  <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 border-2 flex items-center justify-center shrink-0 transition-colors ${researcherCategory === opt ? "border-accent" : "border-slate group-hover:border-accent/50"}`}>
                      {researcherCategory === opt && <div className="w-2 h-2 bg-accent" />}
                    </div>
                    <input type="radio" name="researcherCategory" value={opt} checked={researcherCategory === opt} onChange={(e) => setResearcherCategory(e.target.value)} className="sr-only" />
                    <span className="font-sans text-bone text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Business Type */}
            <div>
              <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-3">Business Type *</label>
              <div className="space-y-2">
                {["Sole Proprietor", "LLC", "S-Corp", "C-Corp"].map((opt) => (
                  <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 border-2 flex items-center justify-center shrink-0 transition-colors ${businessType === opt ? "border-accent" : "border-slate group-hover:border-accent/50"}`}>
                      {businessType === opt && <div className="w-2 h-2 bg-accent" />}
                    </div>
                    <input type="radio" name="businessType" value={opt} checked={businessType === opt} onChange={(e) => setBusinessType(e.target.value)} className="sr-only" />
                    <span className="font-sans text-bone text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Institution Name */}
            <div>
              <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">Institution Name</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                maxLength={200}
                placeholder="Name of educational or hospitality/medical institution"
                className="w-full bg-carbon border border-slate text-paper placeholder-bone/30 font-sans text-sm px-4 h-11 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {/* Certification checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div className={`w-4 h-4 border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${certifiedAge ? "border-accent bg-accent/10" : "border-slate"}`}>
                {certifiedAge && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" className="text-accent" />
                  </svg>
                )}
              </div>
              <input type="checkbox" checked={certifiedAge} onChange={(e) => setCertifiedAge(e.target.checked)} className="sr-only" />
              <span className="font-sans text-bone/70 text-xs leading-relaxed">
                I certify that I am 21 years of age or older and that all products purchased are for research use only, not for diagnostic, clinical, or other regulated applications. I agree to the{" "}
                <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
              </span>
            </label>

            {error && (
              <p className="font-mono text-red-400 text-sm border border-red-400/30 bg-red-400/10 px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-obsidian font-semibold h-12 hover:bg-accent/80 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="font-mono text-bone/50 text-xs text-center mt-6">
            Already have an account?{" "}
            <Link href={`/account/login?next=${encodeURIComponent(next)}`} className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      {success && <SuccessTransition label="Account created" onComplete={handleComplete} />}
    </SiteShell>
  );
}
