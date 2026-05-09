import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog | Backport",
  description:
    "See what's new in Backport API Gateway. Version history, new features, and bug fixes.",
};

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
