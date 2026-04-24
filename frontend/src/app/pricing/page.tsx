import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Backport",
  description: "Simple, transparent pricing for Backport API Gateway. Free tier available with enterprise-grade protection.",
};

export default function PricingPage() {
  redirect("/#pricing");
}
