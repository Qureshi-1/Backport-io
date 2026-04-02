import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import FeedbackWidget from "@/components/FeedbackWidget";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ['300', '400', '500', '600', '700'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  metadataBase: new URL('https://backport-io.vercel.app'),
  title: 'Backport | Open Source API Gateway – Rate Limiting + WAF + Cache',
  description: 'Add rate limiting, intelligent caching, idempotency and WAF to any backend in 30 seconds. No code changes required. Free to start. Open source & self-hostable.',
  keywords: ['API Gateway', 'Rate Limiting', 'WAF', 'Web Application Firewall', 'Caching', 'FastAPI', 'Laravel', 'Node.js', 'Express', 'API Security', 'Open Source'],
  authors: [{ name: 'Backport' }],
  openGraph: {
    title: 'Backport – Shield your backend in 30 seconds',
    description: 'Add rate limiting, caching, idempotency and WAF to any backend. No SDK, no code changes. Free to start.',
    url: 'https://backport-io.vercel.app',
    siteName: 'Backport',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Backport – Open Source API Gateway',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Backport – Open Source API Gateway',
    description: 'Add rate limiting, caching, idempotency and WAF to any backend in 30 seconds. No code changes required.',
    images: ['/og-image.png'],
    creator: '@backportio',
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-zinc-950 text-white min-h-screen selection:bg-emerald-500/30`}
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
