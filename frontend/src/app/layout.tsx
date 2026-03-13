import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import FeedbackWidget from "@/components/FeedbackWidget";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Backport | Open Source API Gateway – Rate Limiting + WAF + Cache',
  description: 'Add rate limiting, intelligent caching, idempotency and WAF to any backend in 30 seconds. No code changes required. Free to start.',
  openGraph: {
    title: 'Backport – Shield your backend in 30 seconds',
    description: 'Add rate limiting, caching, idempotency and WAF to any backend. No SDK, no code changes.',
    url: 'https://backport-io.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Backport – Open Source API Gateway',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-zinc-950 text-white min-h-screen selection:bg-emerald-500/30`}
      >
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: '#18181b', // zinc-900
            color: '#fff',
            border: '1px solid #27272a', // zinc-800
          },
          success: {
            iconTheme: {
              primary: '#10b981', // emerald-500
              secondary: '#18181b',
            },
          },
        }} />
        <ErrorBoundary>
          {children}
          <FeedbackWidget />
        </ErrorBoundary>
      </body>
    </html>
  );
}
