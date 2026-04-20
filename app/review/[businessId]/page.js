"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const CHIPS = [
  { id: "food", label: "Food" },
  { id: "service", label: "Service" },
  { id: "products", label: "Products" },
  { id: "ambiance", label: "Ambiance" },
];

function RatingStep({ rating, hoverRating, setRating, setHoverRating, onContinue }) {
  const preview = hoverRating ?? rating ?? 0;
  const canContinue = rating !== null && rating >= 3;

  let positiveLabel = "";
  if (rating === 3) positiveLabel = "Good";
  else if (rating === 4) positiveLabel = "Very Good";
  else if (rating === 5) positiveLabel = "Excellent!";

  return (
    <section className="mt-10 space-y-4">
      <h2 className="text-lg font-semibold text-white">How was your experience?</h2>
      <p className="text-sm text-text-muted">
        Tap a star to rate — then continue if you&apos;d like to leave a public review.
      </p>
      <div
        className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"
        onMouseLeave={() => setHoverRating(null)}
        role="radiogroup"
        aria-label="Star rating"
        aria-valuenow={rating ?? undefined}
        aria-valuetext={rating != null ? `${rating} out of 5 stars` : undefined}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = preview >= n;
          return (
            <button
              key={n}
              type="button"
              aria-label={`Rate ${n} out of 5 stars`}
              onMouseEnter={() => setHoverRating(n)}
              onFocus={() => setHoverRating(n)}
              onBlur={() => setHoverRating(null)}
              onClick={() => setRating(n)}
              className={`flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl text-[clamp(2.5rem,11vw,3rem)] leading-none transition-all duration-200 ease-out hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4B400]/60 active:scale-95 sm:min-h-[52px] sm:min-w-[52px] ${
                filled ? "text-[#F4B400] drop-shadow-[0_0_14px_rgba(244,180,0,0.45)]" : "text-white/20"
              }`}
            >
              ★
            </button>
          );
        })}
      </div>

      {rating !== null && rating <= 2 ? (
        <div className="mt-4 rounded-xl border border-red-500/50 bg-red-950/95 p-4 text-center text-sm leading-relaxed text-red-50 shadow-lg" role="status">
          We&apos;re sorry to hear that! Please contact us directly so we can make it right.
        </div>
      ) : null}

      {positiveLabel ? (
        <p className="mt-2 text-center text-xl font-bold tracking-tight text-[#F4B400] drop-shadow-sm">{positiveLabel}</p>
      ) : null}

      <button
        type="button"
        disabled={!canContinue}
        onClick={onContinue}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue
      </button>
    </section>
  );
}

export default function CustomerReviewPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId;

  const [business, setBusiness] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [rating, setRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(null);
  const [aspects, setAspects] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selected, setSelected] = useState(0);
  const [step, setStep] = useState("loading");
  const [genError, setGenError] = useState("");
  const [limitReached, setLimitReached] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;

    async function load() {
      setLoadError("");
      try {
        const res = await fetch(`/api/business/${businessId}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(data.message ?? "Business not found.");
          setStep("error");
          return;
        }
        setBusiness(data.business);
        setStep("rating");

        // Track QR scan (silent)
        fetch("/api/business/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId }),
        }).catch(() => {});

      } catch {
        if (!cancelled) {
          setLoadError("Could not load this business.");
          setStep("error");
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [businessId]);

  const toggleAspect = useCallback((id) => {
    setAspects((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  }, []);

  async function generate() {
    if (!rating || rating < 3) return;
    setGenError("");
    setLimitReached(false);
    setBusy(true);
    setStep("generating");
    try {
      const res = await fetch("/api/generate-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, rating, aspects }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.limitReached) {
          setLimitReached(true);
          setGenError("This business has reached its free plan limit for this month. The owner needs to upgrade to continue.");
        } else {
          setGenError(data.message ?? "Generation failed.");
        }
        setStep("aspects");
        return;
      }
      setReviews(data.reviews);
      setSelected(0);
      setStep("pick");
    } finally {
      setBusy(false);
    }
  }

  async function copyAndOpen() {
    if (!business?.gmb_link || !reviews[selected]) return;
    setBusy(true);
    setGenError("");
    try {
      await navigator.clipboard.writeText(reviews[selected]);
    } catch {
      setGenError("Could not access the clipboard. Copy the text manually, then tap below.");
      setBusy(false);
      return;
    }

    // Track review copy (silent)
    fetch("/api/business/track-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, rating }),
    }).catch(() => {});

    window.location.href = business.gmb_link;
  }

  if (step === "loading") {
    return <div className="flex min-h-[50vh] items-center justify-center bg-navy text-text-muted">Loading…</div>;
  }

  if (step === "error") {
    return (
      <div className="min-h-[100dvh] bg-navy px-4 py-16 text-center">
        <p className="text-accent">{loadError}</p>
        <Link href="/" className="mt-6 inline-block text-sm text-white underline">Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-navy px-4 py-8 pb-16 sm:py-12">
      <div className="mx-auto max-w-lg">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-accent">InsightRep</p>
        <h1 className="mt-2 text-center text-2xl font-bold text-white">{business.name}</h1>
        {business.address ? (
          <p className="mt-2 text-center text-sm text-text-muted">{business.address}</p>
        ) : null}

        {step === "rating" && (
          <RatingStep
            rating={rating}
            hoverRating={hoverRating}
            setRating={setRating}
            setHoverRating={setHoverRating}
            onContinue={() => setStep("aspects")}
          />
        )}

        {step === "aspects" && (
          <section className="mt-10 space-y-6">
            <button type="button" onClick={() => setStep("rating")} className="text-sm text-text-muted hover:text-white">← Back</button>
            <h2 className="text-lg font-semibold text-white">What stood out?</h2>
            <p className="text-sm text-text-muted">Pick any that apply.</p>
            <div className="flex flex-wrap gap-2">
              {CHIPS.map((c) => {
                const on = aspects.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleAspect(c.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      on ? "border-accent bg-accent/15 text-accent" : "border-white/15 text-text-muted hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            {limitReached ? (
              <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 text-center space-y-2">
                <p className="text-sm font-semibold text-accent">Monthly limit reached</p>
                <p className="text-xs text-text-muted">This business has used all 10 free AI reviews this month. The owner needs to upgrade to the monthly plan to continue.</p>
              </div>
            ) : null}

            {genError && !limitReached ? <p className="text-sm text-accent" role="alert">{genError}</p> : null}

            <button
              type="button"
              disabled={busy || limitReached}
              onClick={generate}
              className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Generating…" : "Generate review options"}
            </button>
          </section>
        )}

        {step === "generating" && (
          <div className="mt-16 flex flex-col items-center gap-4 text-text-muted">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-sm">Writing three options for you…</p>
          </div>
        )}

        {step === "pick" && (
          <section className="mt-10 space-y-6">
            <h2 className="text-lg font-semibold text-white">Pick one to copy</h2>
            <div className="space-y-3">
              {reviews.map((text, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected(i)}
                  className={`w-full rounded-2xl border p-4 text-left text-sm leading-relaxed transition ${
                    selected === i ? "border-accent bg-accent/10 text-white" : "border-white/10 bg-navy-muted/40 text-text-muted hover:border-white/25"
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>
            {genError ? <p className="text-sm text-accent" role="alert">{genError}</p> : null}
            <button
              type="button"
              disabled={busy}
              onClick={copyAndOpen}
              className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Opening…" : "Copy selected & open Google"}
            </button>
            <button type="button" onClick={() => router.push("/")} className="w-full text-center text-sm text-text-muted hover:text-white">
              Cancel
            </button>
          </section>
        )}
      </div>
    </div>
  );
}