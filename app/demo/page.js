"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

const DEMO_BUSINESS = {
  name: "Sharma's Cafe",
  address: "Shop 12, Cidco, Chh. Sambhajinagar",
  gmb_link: "https://qr.insightmedia.co.in",
};

const DEMO_REVIEWS = [
  "Sharma's Cafe in Cidco is an absolute gem! The Cold Coffee was perfectly brewed and the Croissant was fresh out of the oven. Friendly staff and a cozy ambiance — easily the best cafe near MGM in Sambhajinagar. Highly recommend!",
  "Had a wonderful experience at Sharma's Cafe! The service was warm and attentive, and the Pasta was absolutely delicious. Love how they've created such a relaxing space in Cidco. Will definitely be back with friends!",
  "One of the best cafes in Chh. Sambhajinagar! Sharma's Cafe never disappoints — the Cold Coffee is a must-try and the staff always makes you feel welcome. Perfect spot for a quick bite or a long catch-up session.",
];

const CHIPS = [
  { id: "food", label: "Food" },
  { id: "service", label: "Service" },
  { id: "products", label: "Products" },
  { id: "ambiance", label: "Ambiance" },
];

export default function DemoPage() {
  const [step, setStep] = useState("rating");
  const [rating, setRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(null);
  const [aspects, setAspects] = useState([]);
  const [selected, setSelected] = useState(0);
  const [copied, setCopied] = useState(false);

  const preview = hoverRating ?? rating ?? 0;

  let positiveLabel = "";
  if (rating === 3) positiveLabel = "Good";
  else if (rating === 4) positiveLabel = "Very Good";
  else if (rating === 5) positiveLabel = "Excellent!";

  const toggleAspect = useCallback((id) => {
    setAspects((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  }, []);

  function simulateCopy() {
    setCopied(true);
    setTimeout(() => setStep("success"), 800);
  }

  return (
    <div className="min-h-[100dvh] bg-navy px-4 py-8 pb-16">

      {/* Demo banner */}
      <div className="mx-auto max-w-lg mb-6">
        <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <p className="text-xs font-semibold text-accent">LIVE DEMO — This is how your customers experience InsightRep</p>
          </div>
          <Link href="/login" className="shrink-0 rounded-full bg-accent px-3 py-1 text-[10px] font-bold text-white hover:brightness-110">
            Get started
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-lg">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-accent">InsightRep</p>
        <h1 className="mt-2 text-center text-2xl font-bold text-white">{DEMO_BUSINESS.name}</h1>
        <p className="mt-1 text-center text-sm text-text-muted">{DEMO_BUSINESS.address}</p>

        {/* Rating step */}
        {step === "rating" && (
          <section className="mt-10 space-y-4">
            <h2 className="text-lg font-semibold text-white">How was your experience?</h2>
            <p className="text-sm text-text-muted">Tap a star to rate — then continue to leave a public review.</p>
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2" onMouseLeave={() => setHoverRating(null)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHoverRating(n)}
                  onClick={() => setRating(n)}
                  className={`flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl text-[clamp(2.5rem,11vw,3rem)] leading-none transition-all hover:scale-110 ${
                    preview >= n ? "text-[#F4B400] drop-shadow-[0_0_14px_rgba(244,180,0,0.45)]" : "text-white/20"
                  }`}
                >★</button>
              ))}
            </div>
            {rating !== null && rating <= 2 && (
              <div className="rounded-xl border border-red-500/50 bg-red-950/95 p-4 text-center text-sm text-red-50">
                We&apos;re sorry to hear that! Please contact us directly so we can make it right.
              </div>
            )}
            {positiveLabel && <p className="text-center text-xl font-bold text-[#F4B400]">{positiveLabel}</p>}
            <button
              type="button"
              disabled={!rating || rating < 3}
              onClick={() => setStep("aspects")}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white disabled:opacity-40"
            >
              Continue
            </button>
          </section>
        )}

        {/* Aspects step */}
        {step === "aspects" && (
          <section className="mt-10 space-y-6">
            <button type="button" onClick={() => setStep("rating")} className="text-sm text-text-muted hover:text-white">Back</button>
            <h2 className="text-lg font-semibold text-white">What stood out?</h2>
            <p className="text-sm text-text-muted">Pick any that apply.</p>
            <div className="flex flex-wrap gap-2">
              {CHIPS.map((c) => {
                const on = aspects.includes(c.id);
                return (
                  <button key={c.id} type="button" onClick={() => toggleAspect(c.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${on ? "border-accent bg-accent/15 text-accent" : "border-white/15 text-text-muted hover:border-white/30 hover:text-white"}`}>
                    {c.label}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => setStep("generating")}
              className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
              Generate review options
            </button>
          </section>
        )}

        {/* Generating */}
        {step === "generating" && (
          <div className="mt-16 flex flex-col items-center gap-4 text-text-muted">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-sm">Writing three options for you…</p>
            {setTimeout(() => { if (step === "generating") setStep("pick"); }, 1500) && null}
          </div>
        )}

        {/* Pick step */}
        {step === "pick" && (
          <section className="mt-10 space-y-6">
            <h2 className="text-lg font-semibold text-white">Pick one to copy</h2>
            <div className="space-y-3">
              {DEMO_REVIEWS.map((text, i) => (
                <button key={i} type="button" onClick={() => setSelected(i)}
                  className={`w-full rounded-2xl border p-4 text-left text-sm leading-relaxed transition ${
                    selected === i ? "border-accent bg-accent/10 text-white" : "border-white/10 bg-navy-muted/40 text-text-muted hover:border-white/25"
                  }`}>
                  {text}
                </button>
              ))}
            </div>
            <button type="button" onClick={simulateCopy}
              className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white hover:brightness-110">
              {copied ? "Copied! ✓" : "Copy & open Google"}
            </button>
          </section>
        )}

        {/* Success step */}
        {step === "success" && (
          <section className="mt-16 flex flex-col items-center gap-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-5xl">✅</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Review copied!</h2>
              <p className="text-sm text-text-muted max-w-xs mx-auto">In real flow, customer is now redirected to Google to paste and post their review.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-4 w-full text-left">
              <p className="text-xs text-text-muted mb-2 uppercase tracking-wide font-medium">Review copied</p>
              <p className="text-sm text-white leading-relaxed">{DEMO_REVIEWS[selected]}</p>
            </div>

            {/* CTA */}
            <div className="w-full rounded-2xl border border-accent/30 bg-accent/5 p-6 space-y-3 text-center">
              <p className="text-sm font-semibold text-white">Want this for your restaurant?</p>
              <p className="text-xs text-text-muted">Setup takes 10 minutes. First review same day.</p>
              <Link href="/login"
                className="flex h-11 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white hover:brightness-110">
                Get InsightRep — Rs.1,499/month
              </Link>
              <p className="text-xs text-text-muted">No contract · Cancel anytime with 7 days notice · Free setup call included</p>
              <button type="button" onClick={() => { setStep("rating"); setRating(null); setAspects([]); setCopied(false); }}
                className="text-xs text-text-muted hover:text-white">
                Restart demo
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}