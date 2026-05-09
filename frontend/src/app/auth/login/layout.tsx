import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In | Backport",
  description: "Log in to your Backport dashboard.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
