import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Backport",
  description:
    "Simple, honest pricing for Backport API Gateway. Free plan with full features, Plus for growing APIs, Pro for production workloads.",
};

export default function TiersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
