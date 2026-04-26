import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import FeedbackWidget from "@/components/FeedbackWidget";
import KeepAlivePinger from "@/components/KeepAlivePinger";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ['300', '400', '500', '600', '700'], variable: '--font-space-grotesk' });

export const viewport: Metadata['viewport'] = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://backport.in'),
  title: 'Backport — Enterprise-Grade API Gateway',
  description: 'Protect and accelerate any backend with enterprise-grade WAF, rate limiting, intelligent caching, idempotency, response transformation, and API mocking. No SDK. No code changes. Free to start.',
  keywords: ['API Gateway', 'Rate Limiting', 'WAF', 'Web Application Firewall', 'Caching', 'API Security', 'Open Source', 'Response Transformation', 'API Mocking', 'Idempotency'],
  authors: [{ name: 'Backport' }],
  openGraph: {
    title: 'Backport – Enterprise-Grade API Gateway',
    description: 'Add rate limiting, caching, idempotency, response transformation, and WAF to any backend. No SDK, no code changes. Free to start.',
    url: 'https://backport.in',
    siteName: 'Backport',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Backport – Enterprise-Grade API Gateway',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Backport – Enterprise-Grade API Gateway',
    description: 'Add rate limiting, caching, idempotency, response transformation, and WAF to any backend in 30 seconds. No code changes required.',
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
    <html lang="en" className="dark overflow-x-hidden">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-zinc-950 text-white min-h-screen min-w-0 overflow-x-hidden selection:bg-[#04e184]/30`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Backport",
              "url": "https://backport.in",
              "applicationCategory": "DeveloperApplication",
              "operatingSystem": "Web",
              "description": "Backport is an API gateway that protects your backend with WAF, rate limiting, caching, response transformation, and API mocking. No SDK or code changes required.",
              "offers": [
                {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD",
                  "name": "Free Plan",
                  "description": "3 months free with 100 requests/min"
                },
                {
                  "@type": "Offer",
                  "price": "5.99",
                  "priceCurrency": "USD",
                  "name": "Plus Plan",
                  "description": "500 requests/min, response transformation, API mocking"
                },
                {
                  "@type": "Offer",
                  "price": "11.99",
                  "priceCurrency": "USD",
                  "name": "Pro Plan",
                  "description": "5000 requests/min, custom WAF rules, webhooks"
                }
              ],
              "programmingLanguage": ["Python", "TypeScript"],
              "isAccessibleForFree": true,
              "license": "https://opensource.org/licenses/MIT"
            })
          }}
        />
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: '#18181b',
            color: '#fff',
            border: '1px solid #27272a',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#18181b',
            },
          },
        }} />
        <ErrorBoundary>
          {children}
          <KeepAlivePinger />
          <FeedbackWidget />
        </ErrorBoundary>
      </body>
    </html>
  );
}
