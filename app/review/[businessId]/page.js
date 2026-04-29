"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── MOOD CONFIG ──────────────────────────────────────────────────────────────
const MOODS = [
  { id: "relaxed",     label: "Relaxed",      icon: "😊", desc: "Chill visit, no rush" },
  { id: "celebration", label: "Celebrating",  icon: "🎉", desc: "Birthday, anniversary, special occasion" },
  { id: "work",        label: "Work visit",   icon: "💼", desc: "Team lunch, client meeting, work break" },
  { id: "family",      label: "Family time",  icon: "👨‍👩‍👧", desc: "With family or kids" },
  { id: "date",        label: "Date night",   icon: "💑", desc: "Romantic evening out" },
  { id: "friends",     label: "Friends hangout", icon: "👯", desc: "Catching up with friends" },
];

// Mood → aspects mapping (sent to AI as context)
const MOOD_ASPECTS = {
  relaxed:     ["Ambiance", "Food", "Service"],
  celebration: ["Ambiance", "Food", "Service", "Overall experience"],
  work:        ["Service", "Food", "Value for money", "Speed"],
  family:      ["Food", "Service", "Value for money", "Portions"],
  date:        ["Ambiance", "Food", "Service"],
  friends:     ["Food", "Ambiance", "Service", "Vibe"],
};

// Mood → label sent to AI
const MOOD_LABELS = {
  relaxed:     "relaxed solo or casual visit — no special occasion",
  celebration: "celebration visit — birthday, anniversary, or special occasion",
  work:        "work-related visit — team lunch, client meeting, or work break",
  family:      "family visit — came with family members or kids",
  date:        "date night — romantic evening out with partner",
  friends:     "friends hangout — casual outing or catch-up with friends",
};

// ─── BUSINESS LOADING SKELETON ────────────────────────────────────────────────
function BusinessLoadingSkeleton() {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-0 pt-10 pb-6 px-4">
      <style>{`
        @keyframes ir-shimmer {
          0%,100% { opacity: 0.35; }
          50% { opacity: 0.75; }
        }
        .ir-sk { animation: ir-shimmer 1.5s ease-in-out infinite; background: rgba(255,255,255,0.07); border-radius: 8px; }
        .ir-sk-delay-1 { animation-delay: 0.05s; }
        .ir-sk-delay-2 { animation-delay: 0.1s; }
        .ir-sk-delay-3 { animation-delay: 0.15s; }
        .ir-sk-delay-4 { animation-delay: 0.2s; }
      `}</style>
      <div className="ir-sk" style={{ height: 10, width: 80, borderRadius: 20, marginBottom: 14 }} />
      <div className="ir-sk ir-sk-delay-1" style={{ height: 28, width: 200, borderRadius: 10, marginBottom: 10 }} />
      <div className="ir-sk ir-sk-delay-2" style={{ height: 13, width: 160, borderRadius: 6, marginBottom: 40 }} />
      <div className="ir-sk ir-sk-delay-3" style={{ height: 18, width: 180, borderRadius: 6, marginBottom: 8, alignSelf: 'flex-start' }} />
      <div className="ir-sk" style={{ height: 12, width: 220, borderRadius: 6, marginBottom: 24, alignSelf: 'flex-start' }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} className="ir-sk" style={{ width: 50, height: 50, borderRadius: 12, animationDelay: `${i * 0.06}s` }} />
        ))}
      </div>
      <div className="ir-sk ir-sk-delay-4" style={{ height: 48, width: '100%', borderRadius: 50, marginBottom: 12 }} />
      <div style={{ display: 'flex', gap: 5, marginTop: 20, justifyContent: 'center' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            animation: `ir-shimmer 1.2s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── REVIEW GENERATING SCREEN ─────────────────────────────────────────────────
const GEN_STEPS = [
  { icon: "⭐", msg: "Reading your rating...",    sub: "Calibrating the tone" },
  { icon: "🧠", msg: "AI is thinking...",          sub: "Analyzing your experience" },
  { icon: "✍️", msg: "Writing your review...",    sub: "Crafting 3 unique voices" },
  { icon: "🔍", msg: "Adding SEO magic...",        sub: "Embedding keywords naturally" },
  { icon: "✨", msg: "Almost ready...",            sub: "Final quality check" },
];

const DID_YOU_KNOW = [
  "Businesses with 4.5+ ratings get 27% more walk-ins than those at 4.0",
  "90% of customers read reviews before visiting a restaurant",
  "88% of people trust online reviews as much as personal recommendations",
  "A 1-star rating increase can boost revenue by up to 9%",
  "Responding to reviews is a confirmed Google ranking signal",
];

function ReviewGeneratingScreen() {
  const [stepIdx, setStepIdx]     = useState(0);
  const [progress, setProgress]   = useState(0);
  const [dots, setDots]           = useState(0);
  const [factIdx, setFactIdx]     = useState(0);
  const [iconVisible, setIconVisible] = useState(true);
  const [msgVisible, setMsgVisible]   = useState(true);
  const [factVisible, setFactVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setIconVisible(false); setMsgVisible(false);
      setTimeout(() => {
        setStepIdx(i => Math.min(i + 1, GEN_STEPS.length - 1));
        setIconVisible(true); setMsgVisible(true);
      }, 200);
      setFactVisible(false);
      setTimeout(() => { setFactIdx(i => (i + 1) % DID_YOU_KNOW.length); setFactVisible(true); }, 250);
    }, 1800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setProgress(p => Math.min(p + (Math.random() * 2.5 + 0.8), 91)), 180);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 350);
    return () => clearInterval(t);
  }, []);

  const pct  = Math.round(Math.min(progress, 91));
  const step = GEN_STEPS[stepIdx];

  return (
    <div className="mt-10 flex flex-col items-center gap-0">
      <style>{`
        @keyframes ir-ring-out  { 0%{transform:scale(0.9);opacity:0.7}100%{transform:scale(1.55);opacity:0} }
        @keyframes ir-orb-breathe { 0%,100%{transform:scale(1)}50%{transform:scale(1.07)} }
        @keyframes ir-icon-in   { 0%{transform:scale(0.5);opacity:0}100%{transform:scale(1);opacity:1} }
        @keyframes ir-fade-in   { from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)} }
        .ir-ring { position:absolute;border-radius:50%;border:1px solid rgba(229,50,45,0.2);animation:ir-ring-out 2.4s ease-out infinite; }
        .ir-orb  { animation:ir-orb-breathe 2s ease-in-out infinite; }
        .ir-icon-anim { animation:ir-icon-in 0.2s ease forwards; }
        .ir-msg-anim  { animation:ir-fade-in 0.2s ease forwards; }
        .ir-fact-anim { animation:ir-fade-in 0.25s ease forwards; }
      `}</style>

      <div style={{ position:'relative', width:96, height:96, marginBottom:28, flexShrink:0 }}>
        <div className="ir-ring" style={{ inset:-20, animationDelay:'0s' }} />
        <div className="ir-ring" style={{ inset:-10, animationDelay:'0.45s' }} />
        <div className="ir-ring" style={{ inset:-3,  animationDelay:'0.9s' }} />
        <div className="ir-orb" style={{
          position:'absolute', inset:0, borderRadius:'50%',
          background:'rgba(229,50,45,0.08)', border:'1.5px solid rgba(229,50,45,0.3)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <span key={stepIdx} className="ir-icon-anim" style={{
            fontSize:36, display:'block',
            opacity: iconVisible ? 1 : 0, transition:'opacity 0.15s ease',
          }}>
            {step.icon}
          </span>
        </div>
      </div>

      <div key={`msg-${stepIdx}`} className="ir-msg-anim" style={{
        fontSize:16, fontWeight:600, color:'#ffffff',
        marginBottom:5, letterSpacing:'-0.01em',
        minHeight:24, textAlign:'center',
        opacity: msgVisible ? 1 : 0, transition:'opacity 0.15s ease',
      }}>
        {step.msg}<span style={{ color:'rgba(229,50,45,0.8)' }}>{'.'.repeat(dots)}</span>
      </div>

      <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:28, textAlign:'center' }}>
        {step.sub}
      </div>

      <div style={{ width:'100%', marginBottom:6 }}>
        <div style={{ width:'100%', height:4, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden', marginBottom:6 }}>
          <div style={{ height:'100%', width:`${pct}%`, background:'#E5322D', borderRadius:2, transition:'width 0.3s ease' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(255,255,255,0.25)' }}>
          <span>Generating your reviews</span>
          <span>{pct}%</span>
        </div>
      </div>

      <div style={{ display:'flex', gap:6, justifyContent:'center', margin:'16px 0' }}>
        {GEN_STEPS.map((_, i) => (
          <div key={i} style={{
            height:6, borderRadius:3,
            width: i === stepIdx ? 20 : 6,
            background: i <= stepIdx ? '#E5322D' : 'rgba(255,255,255,0.12)',
            transition:'all 0.4s ease',
          }} />
        ))}
      </div>

      <div style={{
        marginTop:20, padding:'12px 16px',
        background:'rgba(255,255,255,0.03)',
        border:'1px solid rgba(255,255,255,0.06)',
        borderRadius:14, width:'100%', textAlign:'center',
      }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:5 }}>
          Did you know
        </div>
        <div key={`fact-${factIdx}`} className="ir-fact-anim" style={{
          fontSize:12, color:'rgba(255,255,255,0.45)', lineHeight:1.6,
          opacity: factVisible ? 1 : 0, transition:'opacity 0.2s ease',
        }}>
          {DID_YOU_KNOW[factIdx]}
        </div>
      </div>
    </div>
  );
}

// ─── RATING STEP ──────────────────────────────────────────────────────────────
function RatingStep({ rating, hoverRating, setRating, setHoverRating, onContinue }) {
  const preview    = hoverRating ?? rating ?? 0;
  const canContinue = rating !== null && rating >= 3;
  let positiveLabel = "";
  if (rating === 3) positiveLabel = "Good";
  else if (rating === 4) positiveLabel = "Very Good";
  else if (rating === 5) positiveLabel = "Excellent!";

  return (
    <section className="mt-10 space-y-4">
      <h2 className="text-lg font-semibold text-white">How was your experience?</h2>
      <p className="text-sm text-text-muted">Tap a star to rate — then continue to leave a review.</p>
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"
        onMouseLeave={() => setHoverRating(null)} role="radiogroup" aria-label="Star rating">
        {[1,2,3,4,5].map((n) => {
          const filled = preview >= n;
          return (
            <button key={n} type="button" aria-label={`Rate ${n} out of 5 stars`}
              onMouseEnter={() => setHoverRating(n)} onFocus={() => setHoverRating(n)}
              onBlur={() => setHoverRating(null)} onClick={() => setRating(n)}
              className={"flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl text-[clamp(2.5rem,11vw,3rem)] leading-none transition-all duration-200 ease-out hover:scale-110 focus:outline-none active:scale-95 sm:min-h-[52px] sm:min-w-[52px] " + (filled ? "text-[#F4B400] drop-shadow-[0_0_14px_rgba(244,180,0,0.45)]" : "text-white/20")}>
              ★
            </button>
          );
        })}
      </div>

      {rating !== null && rating <= 2 && (
        <div className="mt-4 rounded-xl border border-red-500/50 bg-red-950/95 p-4 text-center text-sm leading-relaxed text-red-50 shadow-lg" role="status">
          We're sorry to hear that! Please contact us directly so we can make it right.
        </div>
      )}

      {positiveLabel && (
        <p className="mt-2 text-center text-xl font-bold tracking-tight text-[#F4B400] drop-shadow-sm">{positiveLabel}</p>
      )}

      <button type="button" disabled={!canContinue} onClick={onContinue}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
        Continue
      </button>
    </section>
  );
}

// ─── MOOD STEP ────────────────────────────────────────────────────────────────
function MoodStep({ mood, setMood, onContinue, onBack, busy, limitReached, genError, customNote, setCustomNote }) {
  return (
    <section className="mt-10 space-y-6">
      <button type="button" onClick={onBack} className="text-sm text-text-muted hover:text-white">← Back</button>

      <div>
        <h2 className="text-lg font-semibold text-white">What brings you here today?</h2>
        <p className="text-sm text-text-muted mt-1">Pick the one that fits best — helps us write a better review.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {MOODS.map((m) => {
          const selected = mood === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMood(m.id)}
              className={"relative flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition-all duration-200 " +
                (selected
                  ? "border-accent bg-accent/10 scale-[1.02]"
                  : "border-white/10 bg-navy-muted/40 hover:border-white/25 hover:bg-white/5")}
            >
              {selected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <span className="text-2xl leading-none">{m.icon}</span>
              <span className={"text-sm font-semibold " + (selected ? "text-white" : "text-white/80")}>{m.label}</span>
              <span className="text-xs text-text-muted leading-snug">{m.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Optional custom note */}
      <div className="space-y-2">
        <label className="text-sm text-text-muted">
          Anything specific to mention? <span className="text-white/30">(Optional)</span>
        </label>
        <textarea
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
          placeholder="e.g. The pasta was amazing, staff was very welcoming…"
          rows={3}
          maxLength={300}
          className="w-full rounded-2xl border border-white/10 bg-navy-muted/40 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-accent focus:outline-none resize-none transition"
        />
        {customNote.length > 0 && (
          <p className="text-right text-xs text-white/20">{customNote.length}/300</p>
        )}
      </div>

      {limitReached && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 text-center space-y-2">
          <p className="text-sm font-semibold text-accent">Monthly limit reached</p>
          <p className="text-xs text-text-muted">This business has used all 10 free AI reviews this month. The owner needs to upgrade to continue.</p>
        </div>
      )}

      {genError && !limitReached && (
        <p className="text-sm text-accent" role="alert">{genError}</p>
      )}

      <button
        type="button"
        disabled={busy || limitReached || !mood}
        onClick={onContinue}
        className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition enabled:hover:brightness-110"
      >
        {busy ? "Generating…" : !mood ? "Pick a mood to continue" : "Generate my review"}
      </button>
    </section>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function CustomerReviewPage() {
  const params     = useParams();
  const router     = useRouter();
  const businessId = params.businessId;

  const [business,     setBusiness]     = useState(null);
  const [loadError,    setLoadError]    = useState("");
  const [rating,       setRating]       = useState(null);
  const [hoverRating,  setHoverRating]  = useState(null);
  const [mood,         setMood]         = useState(null);
  const [customNote,   setCustomNote]   = useState("");
  const [reviews,      setReviews]      = useState([]);
  const [selected,     setSelected]     = useState(0);
  const [step,         setStep]         = useState("loading");
  const [genError,     setGenError]     = useState("");
  const [limitReached, setLimitReached] = useState(false);
  const [busy,         setBusy]         = useState(false);
  const [countdown,    setCountdown]    = useState(5);

  // Pre-fetch state — stores result fetched in background when mood is picked
  const prefetchRef    = useRef(null);   // stores { promise, moodKey }
  const prefetchResult = useRef(null);   // stores resolved { reviews } or { error }

  // Load business
  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    async function load() {
      setLoadError("");
      try {
        const res  = await fetch("/api/business/" + businessId);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) { setLoadError(data.message ?? "Business not found."); setStep("error"); return; }
        setBusiness(data.business);

        // ── Duplicate prevention ──────────────────────────────────────────────
        // Check if this device already reviewed this business in last 30 days
        const storageKey = `ir_reviewed_${data.business.id}`;
        const lastReview = localStorage.getItem(storageKey);
        if (lastReview) {
          const daysSince = (Date.now() - parseInt(lastReview)) / (1000 * 60 * 60 * 24);
          if (daysSince < 30) {
            setStep("already_reviewed");
            setLoading && setLoading(false);
            return;
          }
        }
        setStep("rating");
        fetch("/api/business/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId }),
        }).catch(() => {});
      } catch {
        if (!cancelled) { setLoadError("Could not load this business."); setStep("error"); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [businessId]);

  // Success countdown
  useEffect(() => {
    if (step !== "success") return;
    if (countdown <= 0) { window.location.href = business?.gmb_link ?? "/"; return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [step, countdown, business]);

  // Pre-fetch: start generation as soon as mood is selected
  // By the time customer taps Generate, result is ready or nearly ready
  useEffect(() => {
    if (!mood || !rating || rating < 3 || !businessId) return;

    const moodKey = mood + "_" + rating;

    // Skip if already pre-fetching for this exact mood+rating combo
    if (prefetchRef.current?.moodKey === moodKey) return;

    // Reset previous result
    prefetchResult.current = null;

    const aspects   = MOOD_ASPECTS[mood] ?? ["overall experience"];
    const moodLabel = MOOD_LABELS[mood]  ?? mood;

    const controller = new AbortController();

    const promise = fetch("/api/generate-reviews", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        rating,
        aspects,
        customNote: "",   // no note yet — will re-fetch if note is added
        moodLabel,
      }),
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(data => { prefetchResult.current = data; })
      .catch(() => { prefetchResult.current = null; });

    prefetchRef.current = { moodKey, controller, promise };

    return () => {
      // Cancel only if mood changed — not on unmount during generation
      controller.abort();
      prefetchRef.current  = null;
      prefetchResult.current = null;
    };
  }, [mood, rating, businessId]);

  async function generate() {
    if (!rating || rating < 3 || !mood) return;
    setGenError("");
    setLimitReached(false);
    setBusy(true);
    setStep("generating");

    const aspects   = MOOD_ASPECTS[mood] ?? ["overall experience"];
    const moodLabel = MOOD_LABELS[mood]  ?? mood;
    const hasNote   = customNote.trim().length > 0;

    try {
      let data = null;

      // Use pre-fetched result ONLY if:
      // 1. Pre-fetch completed successfully
      // 2. Customer did NOT add a custom note (note changes the output)
      if (!hasNote && prefetchResult.current?.ok && Array.isArray(prefetchResult.current?.reviews)) {
        // Already done — instant result
        data = prefetchResult.current;
        prefetchResult.current = null;
      } else {
        // Either note was added, pre-fetch failed, or still in progress — make fresh call
        // If pre-fetch is still running, wait for it first (then check again)
        if (!hasNote && prefetchRef.current?.promise) {
          await prefetchRef.current.promise;
          if (prefetchResult.current?.ok && Array.isArray(prefetchResult.current?.reviews)) {
            data = prefetchResult.current;
            prefetchResult.current = null;
          }
        }

        // Still no data — make a fresh API call
        if (!data) {
          const controller = new AbortController();
          const timeout    = setTimeout(() => controller.abort(), 15000);
          try {
            const res = await fetch("/api/generate-reviews", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                businessId,
                rating,
                aspects,
                customNote: customNote.trim(),
                moodLabel,
              }),
              signal: controller.signal,
            });
            data = await res.json();
          } finally {
            clearTimeout(timeout);
          }
        }
      }

      if (!data?.ok) {
        if (data?.limitReached) {
          setLimitReached(true);
          setGenError("This business has reached its free plan limit for this month.");
        } else {
          setGenError(data?.message ?? "Generation failed.");
        }
        setStep("mood");
        return;
      }

      setReviews(data.reviews);
      setSelected(0);
      setStep("pick");
    } catch (err) {
      if (err?.name === "AbortError") {
        setGenError("Taking longer than usual — please try again.");
      } else {
        setGenError("Something went wrong. Please try again.");
      }
      setStep("mood");
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
      setGenError("Could not access clipboard. Copy the text manually.");
      setBusy(false);
      return;
    }
    fetch("/api/business/track-review", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, rating }),
    }).catch(() => {});

    // Mark this device as having reviewed — prevent duplicates for 30 days
    try {
      localStorage.setItem(`ir_reviewed_${businessId}`, Date.now().toString());
    } catch {}

    setCountdown(5);
    setStep("success");
    setBusy(false);
  }

  // ── SCREENS ──────────────────────────────────────────────────────────────────
  if (step === "loading") return (
    <div className="min-h-[100dvh] bg-navy px-4">
      <div className="mx-auto max-w-lg"><BusinessLoadingSkeleton /></div>
    </div>
  );

  if (step === "error") return (
    <div className="min-h-[100dvh] bg-navy px-4 py-16 text-center">
      <p className="text-accent">{loadError}</p>
      <Link href="/" className="mt-6 inline-block text-sm text-white underline">Home</Link>
    </div>
  );

  if (step === "already_reviewed") return (
    <div className="min-h-[100dvh] bg-navy px-4 py-16 flex flex-col items-center justify-center text-center gap-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-5xl">
        ✅
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Thank you!</h2>
        <p className="text-sm text-text-muted max-w-xs mx-auto">
          You already left a review for this place recently. We appreciate your support!
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-5 max-w-xs w-full space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Want to leave another?</p>
        <p className="text-xs text-text-muted leading-relaxed">
          To keep Google reviews authentic, we limit one review per device every 30 days.
        </p>
        <button
          type="button"
          onClick={() => {
            try { localStorage.removeItem(`ir_reviewed_${business?.id}`); } catch {}
            setStep("rating");
          }}
          className="mt-2 text-xs text-accent hover:underline"
        >
          I want to leave another review anyway
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-navy px-4 py-8 pb-16 sm:py-12">
      <div className="mx-auto max-w-lg">

        <p className="text-center text-xs font-medium uppercase tracking-wide text-accent">InsightRep</p>
        <h1 className="mt-2 text-center text-2xl font-bold text-white">{business.name}</h1>
        {business.address && (
          <p className="mt-2 text-center text-sm text-text-muted">{business.address}</p>
        )}

        {step === "rating" && (
          <RatingStep
            rating={rating} hoverRating={hoverRating}
            setRating={setRating} setHoverRating={setHoverRating}
            onContinue={() => setStep("mood")}
          />
        )}

        {step === "mood" && (
          <MoodStep
            mood={mood} setMood={setMood}
            onContinue={generate}
            onBack={() => setStep("rating")}
            busy={busy}
            limitReached={limitReached}
            genError={genError}
            customNote={customNote}
            setCustomNote={setCustomNote}
          />
        )}

        {step === "generating" && <ReviewGeneratingScreen />}

        {step === "pick" && (
          <section className="mt-10 space-y-6">
            <h2 className="text-lg font-semibold text-white">Pick one to copy</h2>
            <div className="space-y-3">
              {reviews.map((text, i) => (
                <button key={i} type="button" onClick={() => setSelected(i)}
                  className={"w-full rounded-2xl border p-4 text-left text-sm leading-relaxed transition " +
                    (selected === i
                      ? "border-accent bg-accent/10 text-white"
                      : "border-white/10 bg-navy-muted/40 text-text-muted hover:border-white/25")}>
                  {text}
                </button>
              ))}
            </div>
            {genError && <p className="text-sm text-accent" role="alert">{genError}</p>}
            <button type="button" disabled={busy} onClick={copyAndOpen}
              className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white disabled:opacity-50">
              {busy ? "Copying…" : "Copy & open Google"}
            </button>
            <button type="button" onClick={() => router.push("/")}
              className="w-full text-center text-sm text-text-muted hover:text-white">
              Cancel
            </button>
          </section>
        )}

        {step === "success" && (
          <section className="mt-10 flex flex-col items-center gap-5 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-5xl animate-bounce">
              ✅
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">Review Copied!</h2>
              <p className="text-sm text-text-muted">Your review is ready — just paste it on Google.</p>
            </div>

            <div className="w-full rounded-2xl border border-accent/30 bg-accent/5 p-4 text-left space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-accent">Your copied review</p>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">Copied</span>
              </div>
              <p className="text-sm text-white leading-relaxed">{reviews[selected]}</p>
            </div>

            <div className="w-full rounded-2xl border border-white/10 bg-navy-muted/40 p-4 text-left space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-text-muted">3 steps to post</p>
              <div className="space-y-2">
                {[
                  "Google will open — tap the star rating you want",
                  "Tap the review text box — long press and Paste",
                  "Hit Post — done in 10 seconds!",
                ].map((txt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="text-sm text-white">{txt}</p>
                  </div>
                ))}
              </div>
            </div>

            <button type="button" onClick={() => { window.location.href = business?.gmb_link; }}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-accent text-sm font-semibold text-white hover:brightness-110 transition">
              Opening Google in {countdown}s — tap to open now
            </button>

            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-1000"
                style={{ width: ((5 - countdown) / 5 * 100) + "%" }} />
            </div>

            <p className="text-xs text-text-muted">
              Review not pasting? Long press inside the Google text box and tap Paste.
            </p>
          </section>
        )}

      </div>
    </div>
  );
}
