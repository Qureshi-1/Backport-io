import Link from "next/link";
<<<<<<< HEAD

export const metadata = {
=======
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
  title: "Terms of Service | Backport",
  description: "Backport Terms of Service – rules and conditions for using the Backport API Gateway.",
};

export default function Terms() {
  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-zinc-950 text-zinc-300">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <Link href="/" className="text-emerald-400 hover:text-emerald-300 text-sm mb-8 inline-block">← Back to Home</Link>
        <h1 className="text-4xl font-bold text-white mb-3">Terms of Service</h1>
        <p className="text-zinc-500 mb-10">Last updated: March 2026</p>
=======
    <div className="min-h-screen bg-[#080C10] text-[#e2e2e2]">
      <Header />
      <div className="mx-auto max-w-3xl px-6 py-24 pt-32">
        <div className="flex items-center gap-2 text-xs text-[#A2BDDB]/30 mb-10">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="text-[#A2BDDB]/15">/</span>
          <span className="text-white/60">Terms of Service</span>
        </div>

        <h1 className="text-4xl font-bold text-white mb-3">Terms of Service</h1>
        <p className="text-[#A2BDDB]/30 mb-10">Last updated: April 2026</p>
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc

        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
<<<<<<< HEAD
            <p className="leading-relaxed text-zinc-400">By creating an account or using the Backport API Gateway service ("Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">2. Permitted Use</h2>
            <p className="leading-relaxed text-zinc-400 mb-3">You may use the Service to proxy, secure, and monitor HTTP API traffic to your legitimate backend servers. You agree <strong className="text-white">NOT</strong> to:</p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Use the Service to route traffic involving illegal activity.</li>
              <li>Deliberately attempt to bypass rate limits or quotas.</li>
              <li>Use the Service to attack, scan, or probe third-party systems without explicit authorization.</li>
              <li>Reverse engineer or attempt to extract the source code of the hosted cloud service.</li>
              <li>Resell or sublicense the Service without prior written permission.</li>
=======
            <p className="leading-relaxed text-[#A2BDDB]/50">By creating an account or using the Backport API Gateway service (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, do not use the Service. These terms apply to the hosted cloud service available at backport.in.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p className="leading-relaxed text-[#A2BDDB]/50 mb-3">
              Backport is a cloud-hosted API gateway that sits in front of your backend server. It provides:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[#A2BDDB]/50">
              <li>Request proxying — forwards traffic to your configured backend URL.</li>
              <li>WAF (Web Application Firewall) — regex-based threat detection for common attack vectors (SQL injection, XSS, path traversal, command injection, LDAP injection, XXE).</li>
              <li>Rate limiting — sliding-window request throttling per plan.</li>
              <li>LRU caching — in-memory caching for GET requests (when enabled).</li>
              <li>Idempotency — duplicate request prevention for POST/PUT/PATCH (when enabled).</li>
              <li>Dashboard analytics — request logs, traffic charts, latency data, and security alerts.</li>
            </ul>
            <p className="leading-relaxed text-[#A2BDDB]/50 mt-3">
              Backport is production-ready and actively maintained. Features, pricing, and capabilities may be updated as we improve the product.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">3. Permitted Use</h2>
            <p className="leading-relaxed text-[#A2BDDB]/50 mb-3">You may use the Service to proxy, secure, and monitor HTTP API traffic to your own legitimate backend servers. You agree <strong className="text-white">NOT</strong> to:</p>
            <ul className="list-disc pl-5 space-y-2 text-[#A2BDDB]/50">
              <li>Use the Service to route traffic involving illegal activity or content.</li>
              <li>Deliberately attempt to bypass rate limits, quotas, or security mechanisms.</li>
              <li>Use the Service to attack, scan, or probe third-party systems without explicit authorization from the system owner.</li>
              <li>Use the Service as a proxy for scraping, botting, or automated data extraction at scale.</li>
              <li>Resell, sublicense, or redistribute the Service without prior written permission.</li>
              <li>Attempt to reverse engineer, decompile, or extract the source code of the hosted cloud service.</li>
              <li>Share your API key publicly or with unauthorized parties.</li>
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
            </ul>
          </section>

          <section>
<<<<<<< HEAD
            <h2 className="text-2xl font-semibold text-white mb-3">3. Usage Limits & Plans</h2>
            <p className="leading-relaxed text-zinc-400">Each plan has documented request limits. Exceeding your plan limits will result in requests being throttled (HTTP 429) until your next billing cycle. Persistent and intentional circumvention of limits may result in account suspension.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">4. Billing & Payments</h2>
            <p className="leading-relaxed text-zinc-400">Paid plans are billed monthly or annually in advance. All payments are processed securely. Refunds may be issued at our discretion within 7 days of a charge if the Service was materially non-functional. Downgrades take effect at the next billing cycle.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">5. Service Availability</h2>
            <p className="leading-relaxed text-zinc-400">We target 99.9% uptime for paid plans. We do not guarantee uninterrupted service and are not liable for losses arising from downtime, latency, or service interruptions beyond our reasonable control.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">6. Open Source</h2>
            <p className="leading-relaxed text-zinc-400">The core Backport software is MIT licensed and available on GitHub. These Terms govern the hosted cloud service (Backport Cloud), not your use of the open-source code itself.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">7. Termination</h2>
            <p className="leading-relaxed text-zinc-400">We reserve the right to suspend or terminate accounts that violate these Terms. You may cancel your account at any time from the billing settings page.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p className="leading-relaxed text-zinc-400">To the maximum extent permitted by law, Backport is not liable for indirect, incidental, or consequential damages arising from your use of the Service. Our total liability is limited to the amount you paid us in the last 3 months.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">9. Changes to Terms</h2>
            <p className="leading-relaxed text-zinc-400">We may update these Terms from time to time. Significant changes will be notified via email. Continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">10. Contact</h2>
            <p className="leading-relaxed text-zinc-400">For legal inquiries: <a href="mailto:support@backportio.com" className="text-emerald-400 hover:underline">support@backportio.com</a></p>
          </section>
        </div>
      </div>
=======
            <h2 className="text-2xl font-semibold text-white mb-3">4. Account &amp; API Keys</h2>
            <ul className="list-disc pl-5 space-y-2 text-[#A2BDDB]/50">
              <li>You must provide a valid email address and create a password to sign up.</li>
              <li>You are responsible for maintaining the confidentiality of your API keys and JWT tokens.</li>
              <li>If you believe your API key has been compromised, you must delete it immediately from the dashboard and create a new one.</li>
              <li>We are not liable for any damage caused by unauthorized use of your API key due to your failure to secure it.</li>
              <li>Accounts that remain inactive for an extended period may be subject to deletion with prior notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">5. Usage Limits &amp; Plans</h2>
            <p className="leading-relaxed text-[#A2BDDB]/50 mb-3">Each plan has documented request rate limits. Current limits are:</p>
            <ul className="list-disc pl-5 space-y-2 text-[#A2BDDB]/50 mb-3">
              <li><strong className="text-white">Free:</strong> 100 requests/minute, 1 API key (3-month trial).</li>
              <li><strong className="text-white">Plus:</strong> 500 requests/minute, 3 API keys, response transformation, API mocking.</li>
              <li><strong className="text-white">Pro:</strong> 5,000 requests/minute, 10 API keys, custom WAF rules, webhooks.</li>
            </ul>
            <p className="leading-relaxed text-[#A2BDDB]/50">Exceeding your plan limits will result in requests being throttled (HTTP 429) until the rate limit window resets. Persistent and intentional circumvention of limits may result in account suspension. Plan limits are subject to change with notice.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">6. Billing &amp; Payments</h2>
            <ul className="list-disc pl-5 space-y-2 text-[#A2BDDB]/50">
              <li>Paid plans are processed through Razorpay. We do not store your payment card or bank details.</li>
              <li>Prices are listed in INR and may change with 30 days notice.</li>
              <li>Plan upgrades take effect immediately after successful payment verification.</li>
              <li>Refunds are handled on a case-by-case basis. Contact us within 7 days if you believe you were charged in error.</li>
              <li>There is no automatic recurring billing. You must manually purchase or renew your plan each billing period.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">7. Data &amp; Privacy</h2>
            <p className="leading-relaxed text-[#A2BDDB]/50">
              Your use of the Service is also governed by our{" "}
              <Link href="/privacy" className="text-[#04e184] hover:underline">Privacy Policy</Link>, which explains in detail what data we collect, how we use it, and your rights regarding your data. By using the Service, you consent to the data practices described in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">8. Service Availability</h2>
            <p className="leading-relaxed text-[#A2BDDB]/50 mb-3">
              The Service is provided on a best-effort basis. We aim for high availability but do not guarantee uninterrupted service. We are not liable for losses arising from:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[#A2BDDB]/50">
              <li>Server downtime, maintenance, or outages beyond our control.</li>
              <li>Increased latency due to gateway processing.</li>
              <li>Data loss due to server restarts (in-memory cache and rate limit data are not persisted).</li>
              <li>Issues with our hosting providers (Render for backend, Vercel for frontend).</li>
              <li>Third-party service failures (Razorpay for payments, Resend for emails).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">9. Open Source License</h2>
            <p className="leading-relaxed text-[#A2BDDB]/50">Backport is open-source software released under the <strong className="text-white">MIT License</strong>. You are free to use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the software. The full license text is available on <a href="https://github.com/Qureshi-1/Backport-io/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-[#04e184] hover:underline">GitHub</a>. The hosted cloud service at backport.in is provided separately and is governed by these Terms of Service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">10. Termination</h2>
            <ul className="list-disc pl-5 space-y-2 text-[#A2BDDB]/50">
              <li>You may cancel your account at any time by contacting us.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
              <li>Upon termination, your API keys will be invalidated immediately.</li>
              <li>We may retain anonymized, aggregated usage data after account termination.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">11. Limitation of Liability</h2>
            <p className="leading-relaxed text-[#A2BDDB]/50">To the maximum extent permitted by applicable law, Backport and its contributors are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. This includes, but is not limited to, loss of data, loss of revenue, business interruption, or any other commercial damages. Our total liability is limited to the amount you paid us in the 3 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">12. Changes to Terms</h2>
            <p className="leading-relaxed text-[#A2BDDB]/50">We may update these Terms from time to time. Material changes will be notified via email at least 7 days before they take effect. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms. The latest version is always available at{" "}
              <Link href="/terms" className="text-[#04e184] hover:underline">backport.in/terms</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">13. Contact</h2>
            <p className="leading-relaxed text-[#A2BDDB]/50">For questions about these Terms: <a href="mailto:support@backport.in" className="text-[#04e184] hover:underline">support@backport.in</a></p>
          </section>
        </div>
      </div>
      <Footer />
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
    </div>
  );
}
