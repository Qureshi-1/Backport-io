import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Backport vs Kong vs Tyk vs Cloudflare — API Gateway Comparison",
  description:
    "Compare Backport, Kong, Tyk, and Cloudflare side-by-side. Find the right API gateway for your stack — open-source, lightweight, with WAF, rate limiting, caching, and response transformation built in.",
  openGraph: {
    title: "Backport vs Kong vs Tyk vs Cloudflare — API Gateway Comparison",
    description:
      "Compare Backport, Kong, Tyk, and Cloudflare side-by-side. Find the right API gateway for your stack.",
    url: "https://backport.in/compare",
    siteName: "Backport",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Backport vs Kong vs Tyk vs Cloudflare — API Gateway Comparison",
    description:
      "Compare Backport, Kong, Tyk, and Cloudflare side-by-side. Find the right API gateway for your stack.",
  },
  alternates: {
    canonical: "https://backport.in/compare",
  },
};

type CellValue = {
  text: string;
  kind: "yes" | "no" | "partial" | "neutral" | "highlight";
};

const features: { label: string; backport: CellValue; kong: CellValue; tyk: CellValue; cloudflare: CellValue }[] = [
  {
    label: "Open Source / License",
    backport: { text: "MIT", kind: "highlight" },
    kong: { text: "Apache 2.0", kind: "partial" },
    tyk: { text: "MPL 2.0", kind: "partial" },
    cloudflare: { text: "Proprietary", kind: "no" },
  },
  {
    label: "Setup Time",
    backport: { text: "~30 seconds", kind: "highlight" },
    kong: { text: "30 min+", kind: "no" },
    tyk: { text: "15 min+", kind: "no" },
    cloudflare: { text: "~5 min (DNS)", kind: "partial" },
  },
  {
    label: "API Response Transformation",
    backport: { text: "Included", kind: "yes" },
    kong: { text: "Not built-in", kind: "no" },
    tyk: { text: "Not built-in", kind: "no" },
    cloudflare: { text: "Not available", kind: "no" },
  },
  {
    label: "API Mocking",
    backport: { text: "Included", kind: "yes" },
    kong: { text: "Not available", kind: "no" },
    tyk: { text: "Not available", kind: "no" },
    cloudflare: { text: "Not available", kind: "no" },
  },
  {
    label: "Built-in WAF",
    backport: { text: "Included", kind: "yes" },
    kong: { text: "Plugin", kind: "partial" },
    tyk: { text: "Included", kind: "yes" },
    cloudflare: { text: "Pro+ only", kind: "partial" },
  },
  {
    label: "Custom WAF Rules",
    backport: { text: "Included", kind: "yes" },
    kong: { text: "Plugin", kind: "partial" },
    tyk: { text: "Included", kind: "yes" },
    cloudflare: { text: "Pro+ only", kind: "partial" },
  },
  {
    label: "Per-API-Key Rate Limiting",
    backport: { text: "Included", kind: "yes" },
    kong: { text: "Included", kind: "yes" },
    tyk: { text: "Included", kind: "yes" },
    cloudflare: { text: "Not available", kind: "no" },
  },
  {
    label: "LRU Caching",
    backport: { text: "Included", kind: "yes" },
    kong: { text: "Not built-in", kind: "no" },
    tyk: { text: "Yes (Redis)", kind: "partial" },
    cloudflare: { text: "CDN only", kind: "partial" },
  },
  {
    label: "Idempotency Keys",
    backport: { text: "Included", kind: "yes" },
    kong: { text: "Not available", kind: "no" },
    tyk: { text: "Not available", kind: "no" },
    cloudflare: { text: "Not available", kind: "no" },
  },
  {
    label: "Webhook Notifications",
    backport: { text: "Included", kind: "yes" },
    kong: { text: "Plugin", kind: "partial" },
    tyk: { text: "Included", kind: "yes" },
    cloudflare: { text: "Not available", kind: "no" },
  },
  {
    label: "Dashboard Analytics",
    backport: { text: "Included", kind: "yes" },
    kong: { text: "Enterprise", kind: "no" },
    tyk: { text: "Included", kind: "yes" },
    cloudflare: { text: "Included", kind: "yes" },
  },
  {
    label: "Team Management",
    backport: { text: "Included", kind: "yes" },
    kong: { text: "Enterprise", kind: "no" },
    tyk: { text: "Included", kind: "yes" },
    cloudflare: { text: "Enterprise", kind: "no" },
  },
  {
    label: "Starting Price",
    backport: { text: "Free / $5.99 / $11.99", kind: "highlight" },
    kong: { text: "Free / Enterprise $$", kind: "neutral" },
    tyk: { text: "Free (limited)", kind: "neutral" },
    cloudflare: { text: "Free (limited)", kind: "neutral" },
  },
  {
    label: "Self-Host Option",
    backport: { text: "Self-host + Cloud", kind: "highlight" },
    kong: { text: "Self-host + Enterprise", kind: "partial" },
    tyk: { text: "Self-host + Cloud", kind: "partial" },
    cloudflare: { text: "Cloud only", kind: "no" },
  },
];

function CellBadge({ value }: { value: CellValue }) {
  const styles: Record<string, string> = {
    yes: "text-[#04e184] bg-[#04e184]/[0.08]",
    no: "text-[#A2BDDB]/30 bg-white/[0.02]",
    partial: "text-[#6BA9FF] bg-[#6BA9FF]/[0.06]",
    neutral: "text-[#A2BDDB]/50 bg-white/[0.02]",
    highlight: "text-[#04e184] bg-[#04e184]/[0.08] font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center justify-center text-xs px-2.5 py-1 rounded-lg whitespace-nowrap ${styles[value.kind]}`}
    >
      {value.text}
    </span>
  );
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-[#080C10] text-[#e2e2e2]">
      <Header />

      <div className="mx-auto max-w-6xl px-6 py-24 pt-32">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#A2BDDB]/30 mb-10">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span className="text-[#A2BDDB]/15">/</span>
          <span className="text-white/60">Compare</span>
        </div>

        {/* Hero */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Backport vs Kong vs Tyk vs Cloudflare
          </h1>
          <p className="text-lg text-[#A2BDDB]/50 max-w-2xl mx-auto leading-relaxed">
            Find the right API gateway for your stack. Compare features, pricing,
            and deployment options side by side.
          </p>
        </div>

        {/* Comparison Table */}
        <section className="mb-24">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-5 gap-px bg-white/[0.06]">
              <div className="bg-[#080C10] p-4 md:p-5">
                <span className="text-xs uppercase tracking-wider text-[#A2BDDB]/30 font-semibold">
                  Feature
                </span>
              </div>
              {/* Backport — highlighted */}
              <div className="bg-[#04e184]/[0.06] border-x border-[#04e184]/10 p-4 md:p-5 text-center">
                <span className="text-sm font-bold text-[#04e184]">Backport</span>
              </div>
              <div className="bg-[#080C10] p-4 md:p-5 text-center">
                <span className="text-sm font-semibold text-white/70">Kong</span>
              </div>
              <div className="bg-[#080C10] p-4 md:p-5 text-center">
                <span className="text-sm font-semibold text-white/70">Tyk</span>
              </div>
              <div className="bg-[#080C10] p-4 md:p-5 text-center">
                <span className="text-sm font-semibold text-white/70">
                  Cloudflare
                </span>
              </div>
            </div>

            {/* Table Rows */}
            {features.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-5 gap-px bg-white/[0.04] ${
                  i % 2 === 0 ? "" : "bg-transparent"
                }`}
              >
                <div className="bg-[#080C10] p-4 md:p-5 flex items-center">
                  <span className="text-sm text-[#A2BDDB]/70 font-medium">
                    {row.label}
                  </span>
                </div>
                {/* Backport cell — green highlight */}
                <div className="bg-[#04e184]/[0.03] border-x border-[#04e184]/[0.06] p-4 md:p-5 flex items-center justify-center">
                  <CellBadge value={row.backport} />
                </div>
                <div className="bg-[#080C10] p-4 md:p-5 flex items-center justify-center">
                  <CellBadge value={row.kong} />
                </div>
                <div className="bg-[#080C10] p-4 md:p-5 flex items-center justify-center">
                  <CellBadge value={row.tyk} />
                </div>
                <div className="bg-[#080C10] p-4 md:p-5 flex items-center justify-center">
                  <CellBadge value={row.cloudflare} />
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-[#A2BDDB]/40">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#04e184]/40" />
              Included / Best
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#6BA9FF]/40" />
              Plugin / Partial
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-white/[0.06]" />
              Not available / Enterprise
            </span>
          </div>
        </section>

        {/* Verdict Section */}
        <section className="mb-24">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight text-center">
            When to choose <span className="text-[#04e184]">Backport</span>
          </h2>
          <p className="text-[#A2BDDB]/50 text-center mb-12 max-w-2xl mx-auto leading-relaxed">
            Backport is purpose-built for API-first developers who need
            production-grade protection without the enterprise complexity.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                title: "Purpose-built for APIs",
                desc: "Unlike Cloudflare (a generic CDN) or Kong (a general service mesh), Backport is designed specifically as an API gateway — with response transformation, API mocking, and idempotency keys built in.",
                accent: true,
              },
              {
                title: "Lightweight — no Kubernetes needed",
                desc: "No DevOps team required. Backport is a single Python/FastAPI process. Deploy it anywhere — a VPS, a container, or use the managed cloud. No complex orchestration.",
                accent: false,
              },
              {
                title: "MIT licensed — free forever",
                desc: "Self-host with unlimited requests. No feature gating, no enterprise paywalls for core functionality. The full source code is available on GitHub.",
                accent: true,
              },
              {
                title: "30-second setup",
                desc: "Sign up, set your backend URL, start proxying. No DNS changes, no infrastructure provisioning, no YAML configs. Just your API key and a target URL.",
                accent: false,
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`p-6 rounded-xl border transition-all ${
                  item.accent
                    ? "bg-[#04e184]/[0.04] border-[#04e184]/10"
                    : "bg-white/[0.02] border-white/[0.06]"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      item.accent ? "bg-[#04e184]" : "bg-[#6BA9FF]"
                    }`}
                  />
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                </div>
                <p className="text-sm text-[#A2BDDB]/50 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-[#04e184]/[0.04] border border-[#04e184]/10 rounded-2xl p-10 md:p-16 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
              Get Started in{" "}
              <span className="text-[#04e184]">30 Seconds</span>
            </h2>
            <p className="text-[#A2BDDB]/50 mb-8 max-w-md mx-auto leading-relaxed">
              Free plan available. No credit card required. Self-host or use the
              cloud — your choice.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 bg-[#04e184] text-black px-8 py-4 rounded-xl font-bold hover:bg-white transition-colors"
              >
                Create Free Account
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
              <a
                href="https://github.com/Qureshi-1/Backport-io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-white/[0.08] text-[#A2BDDB]/60 px-8 py-4 rounded-xl font-bold hover:bg-white/[0.04] hover:text-white transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
