import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Backport",
  description: "Create your free Backport account. Protect your API in minutes.",
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
