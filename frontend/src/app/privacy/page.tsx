import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Backport",
  description: "Backport Privacy Policy – how we collect, use, and protect your data.",
};

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#080C10] text-[#e2e2e2]">
      <Header />
      <div className="mx-auto max-w-3xl px-6 py-24 pt-32">
        <div className="flex items-center gap-2 text-xs text-[#A2BDDB]/30 mb-10">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="text-[#A2BDDB]/15">/</span>
          <span className="text-white/60">Privacy Policy</span>
        </div>

        <h1 className="text-4xl font-bold text-white mb-3">Privacy Policy</h1>
        <p className="text-[#A2BDDB]/30 mb-10">Last updated: April 2026</p>

        <div className="mb-10 rounded-xl bg-[#04e184]/[0.04] border border-[#04e184]/10 px-5 py-4 text-[#A2BDDB]/60 text-sm leading-relaxed">
          <strong className="text-[#04e184]">Transparency note:</strong> We believe you should know exactly what data we handle. Below is a clear breakdown of what Backport collects, why, and for how long. If something doesn&apos;t make sense, email us at{" "}
          <a href="mailto:support@backport.in" className="text-[#04e184] hover:underline">support@backport.in</a>.
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">1. Data We Collect</h2>
            <p className="leading-relaxed mb-4 text-[#A2BDDB]/60">We collect the following data to operate the service. We aim to be specific about what is stored rather than vague.</p>
            <ul className="list-disc pl-5 space-y-3 text-[#A2BDDB]/50">
              <li><strong className="text-white">Account data:</strong> Your email address and a bcrypt-hashed password. We never store your plaintext password.</li>
              <li><strong className="text-white">API keys:</strong> Generated on signup (format: <code className="text-[#04e184] bg-[#04e184]/[0.08] px-1 py-0.5 font-mono text-xs rounded">bk_...</code>). Keys are stored in our database so they can be displayed to you in the dashboard. They are never logged or exposed in proxy responses.</li>
              <li><strong className="text-white">Gateway configuration:</strong> Your target backend URL and feature toggle settings (WAF on/off, rate limiting on/off, caching on/off, idempotency on/off) as stored in your dashboard settings.</li>
              <li><strong className="text-white">Request metadata (logged for every proxied request):</strong> HTTP method, request path, query parameters, source IP address, response status code, latency in milliseconds, and whether the response was served from cache. This data is displayed in your dashboard analytics.</li>
              <li><strong className="text-white">Request headers (partial):</strong> Request headers are logged with authentication headers, cookies, and the host header stripped out for security.</li>
              <li><strong className="text-white">Request bodies:</strong> Request bodies for proxied requests are logged, truncated to a maximum of 64KB per entry. This is stored in your API logs and visible in your dashboard.</li>
              <li><strong className="text-white">Usage metrics:</strong> Request counts are tracked per user for plan-based quota enforcement and billing.</li>
              <li><strong className="text-white">Payment information:</strong> Payment processing is handled entirely by Razorpay. We do not store your card details, bank account information, or Razorpay payment credentials on our servers. We only store the plan you are subscribed to and the Razorpay order/payment IDs for reference.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">2. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-2 text-[#A2BDDB]/50">
              <li>To authenticate you and manage your account.</li>
              <li>To render live analytics and request logs in your dashboard.</li>
              <li>To enforce plan-based request quotas and rate limits.</li>
              <li>To apply WAF rules and block malicious requests before they reach your backend.</li>
              <li>To process payments via Razorpay and track your subscription plan.</li>
              <li>To send transactional emails via Resend (signup verification, password reset, welcome email).</li>
              <li>We do <strong className="text-white">not</strong> sell, rent, or share your data with any third parties for marketing or advertising purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">3. Data Retention</h2>
            <p className="leading-relaxed text-[#A2BDDB]/50 mb-3">
              API request logs are stored in our database as long as your account is active. There is currently no automatic log expiry or cleanup mechanism. If you need your logs deleted, contact us and we will remove them manually.
            </p>
            <p className="leading-relaxed text-[#A2BDDB]/50 mb-3">
              Account data (email, password hash, API keys, settings) is retained as long as your account exists. You may request full account deletion at any time by emailing us.
            </p>
            <p className="leading-relaxed text-[#A2BDDB]/50">
              We plan to implement automatic log retention policies (e.g., 30-day expiry for free plans, 90-day for paid plans) in a future update.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">4. Cookies &amp; Tracking</h2>
            <p className="leading-relaxed text-[#A2BDDB]/50 mb-3">Backport uses JWT tokens for authentication, which are stored in your browser&apos;s local storage (not cookies). We do not set persistent cookies for tracking purposes.</p>
            <p className="leading-relaxed text-[#A2BDDB]/50">Our frontend is hosted on Vercel, which may collect standard hosting analytics (page views, geographic data, device information). We do not use Google Analytics, Facebook Pixel, or any third-party advertising or tracking scripts on our site.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">5. Security</h2>
            <ul className="list-disc pl-5 space-y-2 text-[#A2BDDB]/50">
              <li>All traffic between your application and our gateway is encrypted via TLS (managed by our hosting provider, Render).</li>
              <li>Passwords are hashed using bcrypt before storage.</li>
              <li>Authentication tokens are JWTs signed with HS256 and expire after 7 days.</li>
              <li>API keys are validated on every proxy request against our database.</li>
              <li>Request headers containing sensitive data (Authorization, Cookie, Host) are stripped before logging.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">6. Your Rights</h2>
            <p className="leading-relaxed text-[#A2BDDB]/50 mb-3">
              You have the right to access, correct, or delete your personal data at any time. You can export your API logs as JSON or CSV from the dashboard. For account deletion or data requests, email{" "}
              <a href="mailto:support@backport.in" className="text-[#04e184] hover:underline">support@backport.in</a>.
            </p>
            <p className="leading-relaxed text-[#A2BDDB]/50">
              If you are in the EU/EEA, these rights are protected under GDPR. If you are in India, your rights are protected under the Digital Personal Data Protection Act, 2023.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">7. Third-Party Services</h2>
            <ul className="list-disc pl-5 space-y-2 text-[#A2BDDB]/50">
              <li><strong className="text-white">Razorpay:</strong> Processes all payments. We do not store card or bank details.</li>
              <li><strong className="text-white">Resend:</strong> Sends transactional emails (verification, password reset, welcome). Your email address is passed to Resend for delivery only.</li>
              <li><strong className="text-white">Render:</strong> Hosts our backend API. May collect infrastructure-level logs.</li>
              <li><strong className="text-white">Vercel:</strong> Hosts our frontend. May collect standard hosting analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">8. Changes to This Policy</h2>
            <p className="leading-relaxed text-[#A2BDDB]/50">We may update this Privacy Policy as the service evolves. Significant changes will be notified via email. The latest version is always available at{" "}
              <Link href="/privacy" className="text-[#04e184] hover:underline">backport.in/privacy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">9. Contact</h2>
            <p className="leading-relaxed text-[#A2BDDB]/50">For privacy-related questions or data requests: <a href="mailto:support@backport.in" className="text-[#04e184] hover:underline">support@backport.in</a></p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
