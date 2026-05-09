import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Backport — API Security & Performance Insights",
  description:
    "Technical articles about API security, performance optimization, WAF protection, and gateway architecture from the Backport team.",
  openGraph: {
    title: "Blog | Backport",
    description: "Technical articles about API security, performance, and gateway architecture.",
    url: "https://backport.in/blog",
    siteName: "Backport",
    type: "website",
    images: [{ url: "https://backport.in/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | Backport",
    description: "API security & performance insights from the Backport team.",
    images: ["https://backport.in/og-image.png"],
  },
  alternates: {
    canonical: "https://backport.in/blog",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
