import Link from "next/link";

export default function LegalPage() {
  return (
    <div className="min-h-[100dvh] bg-navy px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl space-y-12">

        <header>
          <Link href="/" className="text-sm font-medium text-text-muted hover:text-white">← Home</Link>
          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-widest text-accent">InsightRep</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Terms & Privacy Policy</h1>
            <p className="mt-2 text-sm text-text-muted">Last updated: April 2026 · Operated by Insight Media, Chh. Sambhajinagar</p>
          </div>
        </header>

        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3">Terms of Service</h2>
          <div className="space-y-4 text-sm leading-relaxed text-text-muted">
            <div><h3 classe="font-semibold text-white mb-1">1. Acceptance of Terms</h3><p>By accessing or using InsightRep, you agree to be bound by these Terms. InsightRep is operated by Insight Media, Chh. Sambhajinagar, Maharashtra, India.</p></div>
            <div><h3 className="font-semibold text-white mb-1">2. Description of Service</h3><p>InsightRep is an AI-powered Google review generation system for restaurants, cafes, hotels, and hospitality businesses. It provides QR code-based customer review flows, AI-generated review suggestions, and a business owner dashboard with analytics.</p></div>
            <div><h3 className="font-semibold text-white mb-1">3. Account Registration</h3><p>Business owners must register using a valid phone number or email verified via OTP. You are responsible for all activities under your account.</p></div>
            <div><h3 className="font-semibold text-white mb-1">4. Acceptable Use</h3><p>You agree not to use the Service to generate fake or fraudulent reviews. AI-generated suggestions help customers express genuine experiences — not fabricate them. Misuse results in immediate termination without refund.</p></div>
            <div><h3 className="font-semibold text-white mb-1">5. Google Reviews Policy Compliance</h3><p>Customers read, select, and post review suggestions themselves. This complies with Google's review policies as customers post their own genuine experiences.</p></div>
            <div><h3 className="font-semibold text-white mb-1">6. Subscription & Payments</h3><p>Monthly Plan: ₹1,499/month. Annual Plan: ₹12,990/Monthly plans cancel with 7 days notice. Annual plans are non-refundable after 7 days. Payments processed via Razorpay.</p></div>
            <div><h3 className="font-semibold text-white mb-1">7. Free Plan Limitations</h3><p>Free plan users are limited to 10 AI review generations per month. InsightRep may modify free plan limits with reasonable notice.</p></div>
            <div><h3 className="font-semibold text-white mb-1">8. Intellectual Property</h3><p>All content, branding, and systems within InsightRep are property of Insight Media. You may not copy or distribute any part without written permission.</p></div>
            <div><h3 className="font-semibold text-white mb-1">9. Limitation of Liability</h3><p>InsightRep is provided as-is. Insight Media is not liable for indirect or consequential damages. Maximum liability shall not exceed 3 months of fees paid.</p></div>
            <div><h3 className="font-semibold text-white mb-1">10. Termination</h3><p>InsightRep may terminate accounts for violations. Data may be deleted 30 days after termination.</p></div>
            <div><h3 className="font-semibold text-white mb-1">11. Governing Law</h3><p>Governed by laws of India. Disputes subject to courts in Chh. Sambhajinagar, Maharashtra.</p></div>
            <div><h3 className="font-semibold text-white mb-1">12. Changes to Terms</h3><p>We may update these terms at any time. Continued use constitutes acceptance. Active subscribers will be notified of material changes via email.</p></div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3">Privacy Policy</h2>
          <div className="space-y-4 text-sm leading-relaxed text-text-muted">
            <div><h3 className="font-semibold text-white mb-1">1. Information We Collect</h3><ul className="mt-2 space-y-1 list-disc list-inside"><li>Business owner phone number or email (authentication)</li><li>Business details: name, address, Google review link, keywords, products</li><li>Usage data: QR scan counts, review generation counts</li><li>Device info: user agent, referrer URL (analytics only)</li></ul></div>
            <div><h3 className="font-semibold text-white mb-1">2. Customer Data</h3><p>InsightRep does not collect personal information from customers who scan QR codes. Customers interact anonymously — no names, emails, or phone numbers collected.</p></div>
            <div><h3 className="font-semibold text-white mb-1">3. How We Use Your Information</h3><ul className="mt-2 space-y-1 list-disc list-inside"><li>Authenticate business owners via OTP</li><li>Generate AI review suggestions via OpenAI</li><li>Provide dashboard analytics</li><li>Send weekly performance reports</li><li>Process payments and manage subscriptions</li></ul></div>
            <div><h3 className="font-semibold text-white mb-1">4. Third-Party Services</h3><ul className="mt-2 space-y-1 list-disc list-inside"><li><strong className="text-white">Supabase</strong> — database and authentication<<li><strong className="text-white">OpenAI</strong> — AI review generation</li><li><strong className="text-white">Resend</strong> — email delivery</li><li><strong className="text-white">Razorpay</strong> — payment processing</li><li><strong className="text-white">Vercel</strong> — hosting</li></ul></div>
            <div><h3 className="font-semibold text-white mb-1">5. Data Storage & Security</h3><p>All data stored on secure servers via Supabase with industry-standard encryption. OTPs expire in 10 minutes and are deleted after use.</p></div>
            <div><h3 className="font-semibold text-white mb-1">6. Data Retention</h3><p>Business data retained for account duration. Analytics data retained for 12 months. All data permanently removed within 30 days of account deletion.</p></div>
            <div><h3 className="font-semibold text-white mb-1">7. Your Rights</h3><p>You may access, correct, or delete your data at any time. Contact us via WhatsApp. We respond within 7 business days.</p></div>
       v><h3 className="font-semibold text-white mb-1">8. Cookies</h3><p>InsightRep does not use tracking cookies. Browser localStorage is used solely to maintain your login session. No third-party advertising cookies are used.</p></div>
            <div><h3 className="font-semibold text-white mb-1">9. Contact Us</h3><p>For privacy concerns or data requests, contact Insight Media via WhatsApp at insightmedia.co.in · Chh. Sambhajinagar, Maharashtra, India.</p></div>
          </div>
        </section>

        <footer className="border-t border-white/10 pt-8 text-center">
          <p className="text-xs text-text-muted">© {new Date().getFullYear()} InsightRep · By Insight Media · Chh. Sambhajinagar</p>
          <Link href="/" className="mt-3 inline-block text-xs text-accent hover:underline">← Back to home</Link>
        </footer>

      </div>
    </div>
  );
}
