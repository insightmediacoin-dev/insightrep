"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const DEMO_BUSINESS = {
  name: "Sharma's Cafe",
  address: "Shop 12, Cidco, Chh. Sambhajinagar",
  type: "cafe",
};

const MOODS = [
  { id: "relaxed",     label: "Chill session",   icon: "😊", desc: "Coffee, reading, unwinding" },
  { id: "work",        label: "Work / Study",    icon: "💻", desc: "Work session or studying" },
  { id: "friends",     label: "Friends catchup", icon: "👯", desc: "Catching up over coffee" },
  { id: "date",        label: "Cafe date",       icon: "💑", desc: "Romantic coffee outing" },
  { id: "family",      label: "Family outing",   icon: "👨‍👩‍👧", desc: "With family or kids" },
  { id: "celebration", label: "Celebrating",     icon: "🎉", desc: "Birthday or special occasion" },
];

const DEMO_REVIEWS = {
  relaxed: [
    "Good spot for a quiet coffee break. Been coming to Sharma's Cafe in Cidco for a while now — the cold coffee is consistent and the seating is comfortable enough to sit for an hour without feeling rushed.",
    "Came here alone for a slow afternoon and it delivered. The croissant was fresh, service left me to enjoy the time. One of those reliable spots you keep returning to.",
    "Solid cafe for a relaxed afternoon. The coffee here is the reason I keep coming back — nothing fancy, just consistently good.",
  ],
  work: [
    "Good work-from-cafe spot in Cidco. Free Wi-Fi works well, staff doesn't bother you, and the cold coffee keeps you going. Been coming here for work sessions regularly.",
    "Sharma's Cafe works well for a focused work session. Quiet enough to concentrate, good coffee, and the seating is comfortable for longer stays.",
    "Come here for morning work sessions before heading to the office. Coffee is reliable and the atmosphere is calm. Does the job well.",
  ],
  friends: [
    "Came here with friends for a catch-up and it was a good call. The cold coffee and sandwiches were solid, service was friendly, and we didn't feel rushed even though we sat for two hours.",
    "Good spot for a friends meet-up in Cidco. Everyone found something they liked on the menu and the vibe was relaxed enough for a long conversation.",
    "Brought a group of friends here and everyone left happy. The pasta was a highlight and the cold coffee is genuinely good. Will bring them back.",
  ],
  date: [
    "Came here with my partner for a casual evening and the atmosphere was just right — not too loud, good lighting, comfortable seating. The coffee and desserts were both excellent.",
    "Good cafe for a quiet date. Sharma's Cafe in Cidco has the right vibe — calm, not overcrowded, and the food quality is solid. Would come back for a date evening.",
    "Brought someone special here and it worked out well. The ambiance is warm without being over the top, and the cold coffee was genuinely impressive.",
  ],
  family: [
    "Brought the family here for an afternoon outing and everyone was happy. Kids enjoyed the snacks, adults liked the coffee, and the staff was friendly throughout.",
    "Good family cafe in Cidco. Comfortable seating, decent menu variety, and the staff made sure everyone was taken care of. Will come back with the family.",
    "Came with my parents and it was a pleasant afternoon. The food was good, service attentive, and the overall vibe suited a relaxed family outing.",
  ],
  celebration: [
    "Came here to celebrate a small occasion and Sharma's Cafe made it feel special. The cake was excellent and the staff was warm and attentive throughout.",
    "Good spot for a small celebration in Cidco. The desserts are worth ordering and the atmosphere is pleasant enough for a special occasion.",
    "Celebrated here with a small group and everyone had a great time. Good food, attentive service, and the cold coffee was the highlight of the evening.",
  ],
};

const GEN_STEPS = [
  { icon: "⭐", msg: "Reading your rating..." },
  { icon: "🧠", msg: "AI is thinking..." },
  { icon: "✍️", msg: "Writing your review..." },
  { icon: "✨", msg: "Almost ready..." },
];

export default function DemoPage() {
  const [step,       setStep]       = useState("rating");
  const [rating,     setRating]     = useState(null);
  const [hoverRating,setHoverRating]= useState(null);
  const [mood,       setMood]       = useState(null);
  const [selected,   setSelected]   = useState(0);
  const [copied,     setCopied]     = useState(false);
  const [genStep,    setGenStep]    = useState(0);
  const [progress,   setProgress]   = useState(0);

  const preview = hoverRating ?? rating ?? 0;
  let positiveLabel = rating === 3 ? "Good" : rating === 4 ? "Very Good" : rating === 5 ? "Excellent!" : "";

  // Generating animation
  useEffect(() => {
    if (step !== "generating") return;
    setGenStep(0); setProgress(0);
    const stepTimer = setInterval(() => setGenStep(s => Math.min(s+1, GEN_STEPS.length-1)), 500);
    const progTimer = setInterval(() => setProgress(p => {
      if (p >= 95) { clearInterval(progTimer); return p; }
      return p + 3;
    }), 80);
    const doneTimer = setTimeout(() => { setStep("pick"); setSelected(0); }, 2200);
    return () => { clearInterval(stepTimer); clearInterval(progTimer); clearTimeout(doneTimer); };
  }, [step]);

  const reviews = DEMO_REVIEWS[mood] ?? DEMO_REVIEWS.relaxed;

  function simulateCopy() {
    setCopied(true);
    setTimeout(() => setStep("success"), 600);
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

        {/* STEP 1 — Rating */}
        {step === "rating" && (
          <section className="mt-10 space-y-4">
            <h2 className="text-lg font-semibold text-white">How was your experience?</h2>
            <p className="text-sm text-text-muted">Tap a star to rate — then continue to leave a review.</p>
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2" onMouseLeave={() => setHoverRating(null)}>
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onMouseEnter={() => setHoverRating(n)} onClick={() => setRating(n)}
                  className={`flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl text-[clamp(2.5rem,11vw,3rem)] leading-none transition-all hover:scale-110 ${
                    preview >= n ? "text-[#F4B400] drop-shadow-[0_0_14px_rgba(244,180,0,0.45)]" : "text-white/20"
                  }`}>★</button>
              ))}
            </div>
            {rating !== null && rating <= 2 && (
              <div className="rounded-xl border border-red-500/50 bg-red-950/95 p-4 text-center text-sm text-red-50">
                We're sorry to hear that! Please contact us directly.
              </div>
            )}
            {positiveLabel && <p className="text-center text-xl font-bold text-[#F4B400]">{positiveLabel}</p>}
            <button type="button" disabled={!rating || rating < 3} onClick={() => setStep("mood")}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white disabled:opacity-40">
              Continue
            </button>
          </section>
        )}

        {/* STEP 2 — Mood selector */}
        {step === "mood" && (
          <section className="mt-10 space-y-6">
            <button type="button" onClick={() => setStep("rating")} className="text-sm text-text-muted hover:text-white">← Back</button>
            <div>
              <h2 className="text-lg font-semibold text-white">What brings you here today?</h2>
              <p className="text-sm text-text-muted mt-1">Pick the one that fits best — helps us write a better review.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MOODS.map(m => {
                const on = mood === m.id;
                return (
                  <button key={m.id} type="button" onClick={() => setMood(m.id)}
                    className={"relative flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition-all " +
                      (on ? "border-accent bg-accent/10 scale-[1.02]" : "border-white/10 bg-navy-muted/40 hover:border-white/25")}>
                    {on && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                    <span className="text-2xl leading-none">{m.icon}</span>
                    <span className={"text-sm font-semibold " + (on ? "text-white" : "text-white/80")}>{m.label}</span>
                    <span className="text-xs text-text-muted leading-snug">{m.desc}</span>
                  </button>
                );
              })}
            </div>
            <button type="button" disabled={!mood} onClick={() => setStep("generating")}
              className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition enabled:hover:brightness-110">
              {mood ? "Generate my review" : "Pick a mood to continue"}
            </button>
          </section>
        )}

        {/* STEP 3 — Generating */}
        {step === "generating" && (
          <div className="mt-16 flex flex-col items-center gap-5">
            <style>{`
              @keyframes ir-orb { 0%,100%{transform:scale(1)}50%{transform:scale(1.08)} }
              @keyframes ir-ring { 0%{transform:scale(0.9);opacity:0.7}100%{transform:scale(1.6);opacity:0} }
              .demo-orb { animation: ir-orb 2s ease-in-out infinite; }
              .demo-ring { position:absolute;border-radius:50%;border:1px solid rgba(229,50,45,0.2);animation:ir-ring 2.4s ease-out infinite; }
            `}</style>
            <div style={{position:"relative",width:80,height:80}}>
              <div className="demo-ring" style={{inset:-18,animationDelay:"0s"}} />
              <div className="demo-ring" style={{inset:-8,animationDelay:"0.4s"}} />
              <div className="demo-orb" style={{
                position:"absolute",inset:0,borderRadius:"50%",
                background:"rgba(229,50,45,0.08)",border:"1.5px solid rgba(229,50,45,0.3)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:28
              }}>
                {GEN_STEPS[genStep]?.icon}
              </div>
            </div>
            <p className="text-sm font-semibold text-white">{GEN_STEPS[genStep]?.msg}</p>
            <div style={{width:"100%",maxWidth:280}}>
              <div style={{height:4,background:"rgba(255,255,255,0.07)",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${progress}%`,background:"#E5322D",borderRadius:2,transition:"width 0.15s ease"}} />
              </div>
              <p className="text-xs text-text-muted text-right mt-1">{Math.round(progress)}%</p>
            </div>
          </div>
        )}

        {/* STEP 4 — Pick review */}
        {step === "pick" && (
          <section className="mt-10 space-y-6">
            <h2 className="text-lg font-semibold text-white">Pick one to copy</h2>
            <div className="space-y-3">
              {reviews.map((text, i) => (
                <button key={i} type="button" onClick={() => setSelected(i)}
                  className={"w-full rounded-2xl border p-4 text-left text-sm leading-relaxed transition " +
                    (selected === i ? "border-accent bg-accent/10 text-white" : "border-white/10 bg-navy-muted/40 text-text-muted hover:border-white/25")}>
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

        {/* STEP 5 — Success */}
        {step === "success" && (
          <section className="mt-10 flex flex-col items-center gap-5 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-5xl animate-bounce">✅</div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">Review Copied!</h2>
              <p className="text-sm text-text-muted">In the real flow, Google opens automatically — customer pastes and posts.</p>
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
              {["Google opens — tap the star rating you want","Tap the review box — long press and Paste","Hit Post — done in 10 seconds!"].map((t,i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">{i+1}</span>
                  <p className="text-sm text-white">{t}</p>
                </div>
              ))}
            </div>

            <div className="w-full rounded-2xl border border-accent/30 bg-accent/5 p-6 space-y-3 text-center">
              <p className="text-base font-semibold text-white">Want this for your business?</p>
              <p className="text-xs text-text-muted">Setup in 5 minutes. QR on your counter today. Reviews from tomorrow.</p>
              <Link href="/login" className="flex h-11 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white hover:brightness-110">
                Get InsightRep — Rs.1,499/month
              </Link>
              <p className="text-xs text-text-muted">No contract · Cancel anytime · Free setup call</p>
              <button type="button" onClick={() => { setStep("rating"); setRating(null); setMood(null); setCopied(false); }}
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
