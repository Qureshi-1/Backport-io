import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Backport",
  description: "Simple, transparent pricing for Backport API Gateway. Open-source with a free tier. Self-host or use the cloud.",
};

export default function PricingPage() {
  redirect("/#pricing");
}
