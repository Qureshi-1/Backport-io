import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quick Start Guide | Backport",
  description:
    "Get started with Backport API Gateway in 2 minutes. Configure your backend, generate API keys, and start protecting your API.",
};

export default function SetupGuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
