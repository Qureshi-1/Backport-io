import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Account | Backport",
  description: "Verify your Backport account with the OTP code.",
  robots: { index: false, follow: false },
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
