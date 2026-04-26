import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

// Build allowed connect-src domains from env var (comma-separated) + fixed domains
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backport-io.onrender.com";
const additionalConnectDomains = process.env.NEXT_PUBLIC_CSP_CONNECT_DOMAINS || "";
const connectDomains = [
  "'self'",
  apiUrl,
  "https://api.razorpay.com",
];
// Add user-specified extra domains (for self-hosting, append comma-separated URLs)
if (additionalConnectDomains) {
  connectDomains.push(...additionalConnectDomains.split(",").map(d => d.trim()).filter(Boolean));
}
// Add wss:// variants for WebSocket connections
connectDomains.push(...connectDomains.filter(d => d.startsWith("https://")).map(d => d.replace("https://", "wss://")));

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          ...securityHeaders,
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://images.unsplash.com",
              "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://js.stripe.com",
              `connect-src ${connectDomains.join(" ")}`,
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
