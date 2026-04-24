import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation | Backport",
  description:
    "Developer documentation for Backport API Gateway. Learn about proxy setup, WAF rules, rate limiting, caching, and dashboard API.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
