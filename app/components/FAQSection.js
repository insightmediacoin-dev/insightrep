"use client";

import { useState } from "react";

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-navy-muted/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="text-sm font-semibold text-white pr-4">{question}</span>
        <span className={`shrink-0 text-accent text-lg transition-transform duration-200 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-sm leading-relaxed text-text-muted">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQSection() {
  const faqs = [
    {
      q: "Does the customer need to download any app?",
      a: "No. The customer simply scans the QR code with their phone camera — it opens directly in their browser. Zero downloads required. Works on any smartphone.",
    },
    {
      q: "Will Google flag these as fake reviews?",
      a: "No. InsightRep generates text suggestions — the customer reads, selects, and posts the review themselves. This is fully within Google's review policies. The review comes from the customer's own Google account.",
    },
    {
      q: "What if a customer tries to give 1 or 2 stars?",
      a: "InsightRep blocks 1-2 star selections from reaching Google. The customer sees: 'Had a bad experience? Contact us directly.' You get private feedback. Google sees nothing negative.",
    },
    {
      q: "Can I update my menu items and keywords anytime?",
      a: "Yes, anytime. Log into your dashboard, click Edit Profile, and update your featured dishes, SEO keywords, or Google review link in under 2 minutes.",
    },
    {
      q: "How do I find my Google review link?",
      a: "Search your restaurant on Google Maps, click your listing, click 'Write a review', then copy the URL from your browser. That's your review link. Our team will help you find it on the setup call.",
    },
    {
      q: "Can I cancel if I am not satisfied?",
      a: "Monthly plan: cancel anytime with 7 days notice. No penalty, no questions asked. Annual plan: non-refundable after 7 days. We are confident you will see results and choose to stay.",
    },
    {
      q: "How many reviews can I expect per month?",
      a: "Restaurants typically see 15-25 new reviews per month with consistent QR placement. Results depend on your footfall and how prominently you display the QR code.",
    },
    {
      q: "Is my business data safe?",
      a: "Yes. All data is stored on enterprise-grade secure servers. We never share, sell, or misuse your business information.",
    },
  ];

  return (
    <section className="border-t border-white/5 px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">FAQ</p>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Frequently asked questions</h2>
          <p className="mt-3 text-text-muted text-sm">Everything you need to know before getting started.</p>
        </div>
        <div className="space-y-3">
          {faqs.map((item, i) => (
            <FAQItem key={i} question={item.q} answer={item.a} />
          ))}
        </div>
      </div>
    </section>
  );
}