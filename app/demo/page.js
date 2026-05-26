"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ─── DEMO DATA ────────────────────────────────────────────────────────────────

const DEMO_BUSINESS = {
  name: "Sharma's Cafe",
  address: "Shop 12, Cidco, Chh. Sambhajinagar",
  type: "cafe",
};

const MOODS = [
  { id: "relaxed",     label: "Chill session",    icon: "😊", desc: "Coffee, reading, unwinding" },
  { id: "work",        label: "Work / Study",     icon: "💻", desc: "Work session or studying" },
  { id: "friends",     label: "Friends catchup",  icon: "👯", desc: "Catching up over coffee" },
  { id: "date",        label: "Cafe date",        icon: "💑", desc: "Romantic coffee outing" },
  { id: "family",      label: "Family outing",    icon: "👨‍👩‍👧", desc: "With family or kids" },
  { id: "celebration", label: "Celebrating",      icon: "🎉", desc: "Birthday or special occasion" },
];

const ISSUE_CHIPS = [
  "Coffee quality", "Slow service", "Staff behaviour", "Cleanliness",
  "Wrong order", "Pricing / Value", "Ambience / Noise", "Long wait time",
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
    "Good cafe for a quiet date. Sharma's Cafe in Cidco has the right vibe — calm, not overcrowded, and the food quality is solid. Would come back.",
    "Brought someone special here and it worked out well. The ambiance is warm without being over the top, and the cold coffee was genuinely impressive.",
  ],
  family: [
    "Brought the family here for an afternoon outing and everyone was happy. Kids enjoyed the snacks, adults liked the coffee, and the staff was friendly throughout.",
    "Good family cafe in Cidco. Comfortable seating, decent menu variety, and the staff made sure everyone was taken care of. Will come back.",
    "Came with my parents and it was a pleasant afternoon. The food was good, service attentive, and the overall vibe suited a relaxed family outing.",
  ],
  celebration: [
    "Came here to celebrate a small occasion and Sharma's Cafe made it feel special. The cake was excellent and the staff was warm and attentive throughout.",
    "Good spot for a small celebration in Cidco. The desserts are worth ordering and the atmosphere is pleasant enough for a special occasion.",
    "Celebrated here with a small group and everyone had a great time. Good food, attentive service, and the cold coffee was the highlight of the evening.",
  ],
};

const GEN_STEPS = [
  { icon: "⭐", msg: "Reading your rating...",  sub: "Calibrating the tone" },
  { icon: "🧠", msg: "AI is thinking...",        sub: "Analyzing your experience" },
  { icon: "✍️", msg: "Writing your review...", sub: "Crafting 3 unique voices" },
  { icon: "🔍", msg: "Adding SEO magic...",      sub: "Embedding keywords naturally" },
  { icon: "✨", msg: "Almost ready...",          sub: "Final quality check" },
];

const DID_YOU_KNOW = [
  "Businesses with 4.5+ ratings get 27% more walk-ins than those at 4.0",
  "90% of customers read reviews before visiting a restaurant",
  "88% of people trust online reviews as much as personal recommendations",
  "A 1-star rating increase can boost revenue by up to 9%",
];

const STATS = [
  { value: "60s",  label: "Time to post" },
  { value: "3",    label: "AI drafts generated" },
  { value: "5min", label: "Setup time" },
  { value: "100%", label: "Google compatible" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Customer scans QR", desc: "You place the QR at your counter, table, or reception. Customer scans after their visit.", icon: "📱" },
  { step: "02", title: "Picks mood & rating", desc: "They select their star rating and what brought them — date night, work session, family visit.", icon: "⭐" },
  { step: "03", title: "AI writes the review", desc: "GPT-4o generates 3 unique, natural-sounding reviews in seconds — tailored to their mood and your business.", icon: "🤖" },
  { step: "04", title: "Posted on Google", desc: "Customer picks one, copies it, and pastes on Google in 10 seconds. Your rating climbs every week.", icon: "📈" },
];

const FEATURES = [
  { icon: "🎯", title: "Business-type aware", desc: "Reviews for restaurants sound like restaurant reviews. Salon reviews sound like salon reviews. Each category gets its own AI voice." },
  { icon: "🔒", title: "Negative review gate", desc: "1–2 star ratings never reach Google. Private feedback goes directly to you — so you fix issues before they go public." },
  { icon: "📊", title: "Weekly email reports", desc: "Every Monday, get your scan count, review count, and rating trend in your inbox. Know exactly how you're growing." },
  { icon: "📍", title: "Local SEO baked in", desc: "Every AI review embeds your business name and city naturally — the way Google wants to see it for local search ranking." },
  { icon: "📥", title: "Private complaint inbox", desc: "Unhappy customers leave feedback privately. You see it on your dashboard. Google never does." },
  { icon: "🖨️", title: "Branded QR download", desc: "Download a print-ready branded QR in one click. Place it on your counter, table, or standee — done." },
];

// ─── ANIMATED STAT ────────────────────────────────────────────────────────────
function AnimatedStat({ value, label, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div className={`text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <p className="text-3xl font-extrabold text-white">{value}</p>
      <p className="text-xs text-text-muted mt-1 uppercase tracking-wide">{label}</p>
    </div>
  );
}

// ─── NEGATIVE FEEDBACK FORM (DEMO) ───────────────────────────────────────────
function DemoNegativeFeedbackCard() {
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function toggleIssue(issue) {
    setSelectedIssues(prev =>
      prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
    );
  }

  if (submitted) {
    return (
      <div className="mt-4 rounded-2xl border border-green-500/30 bg-green-950/40 p-5 text-center space-y-1">
        <p className="text-green-400 font-semibold text-sm">Thank you for letting us know.</p>
        <p className="text-xs text-text-muted">We'll look into this and make it right.</p>
        <p className="text-xs text-accent mt-2">← In real flow, this goes to the owner's private dashboard</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-950/20 p-5 space-y-5">
      <div className="rounded-xl border border-red-500/20 bg-red-950/30 px-4 py-3 text-center">
        <p className="text-sm font-medium text-red-300">
          We're sorry to hear that! Please contact us directly so we can make it right.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">What went wrong?</p>
        <div className="flex flex-wrap gap-2">
          {ISSUE_CHIPS.map((issue) => {
            const on = selectedIssues.includes(issue);
            return (
              <button key={issue} type="button" onClick={() => toggleIssue(issue)}
                className={"rounded-full border px-3 py-1.5 text-xs font-medium transition " +
                  (on ? "border-red-400/60 bg-red-500/20 text-red-300" : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/70")}>
                {issue}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
          Anything else? <span className="normal-case font-normal text-white/25">(Optional)</span>
        </p>
        <textarea value={comment} onChange={e => setComment(e.target.value)}
          placeholder="Tell us more…" rows={2} maxLength={300}
          className="w-full rounded-xl border border-white/10 bg-navy/60 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-red-400/50 focus:outline-none resize-none transition" />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
          Your contact <span className="normal-case font-normal text-white/25">(Optional)</span>
        </p>
        <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
          placeholder="Your name" autoComplete="name"
          className="w-full rounded-xl border border-white/10 bg-navy/60 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-red-400/50 focus:outline-none transition" />
        <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
          placeholder="Phone number" autoComplete="tel"
          className="w-full rounded-xl border border-white/10 bg-navy/60 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-red-400/50 focus:outline-none transition" />
      </div>

      <button type="button" disabled={!selectedIssues.length && !comment.trim()}
        onClick={() => setSubmitted(true)}
        className="flex h-11 w-full items-center justify-center rounded-full bg-red-600 text-sm font-semibold text-white disabled:opacity-40 hover:brightness-110 transition">
        Send feedback
      </button>

      <p className="text-center text-xs text-white/25">Your feedback goes directly to the owner — not posted publicly.</p>
    </div>
  );
}

// ─── GENERATING SCREEN (FULL ANIMATED) ───────────────────────────────────────
function DemoGeneratingScreen() {
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
      setTimeout(() => { setStepIdx(i => Math.min(i+1, GEN_STEPS.length-1)); setIconVisible(true); setMsgVisible(true); }, 200);
      setFactVisible(false);
      setTimeout(() => { setFactIdx(i => (i+1) % DID_YOU_KNOW.length); setFactVisible(true); }, 250);
    }, 1800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setProgress(p => Math.min(p + (Math.random()*2.5+0.8), 91)), 180);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setDots(d => (d+1)%4), 350);
    return () => clearInterval(t);
  }, []);

  const pct  = Math.round(Math.min(progress, 91));
  const step = GEN_STEPS[stepIdx];

  return (
    <div className="mt-10 flex flex-col items-center gap-0">
      <style>{`
        @keyframes ir-ring-out    { 0%{transform:scale(0.9);opacity:0.7}100%{transform:scale(1.55);opacity:0} }
        @keyframes ir-orb-breathe { 0%,100%{transform:scale(1)}50%{transform:scale(1.07)} }
        @keyframes ir-icon-in     { 0%{transform:scale(0.5);opacity:0}100%{transform:scale(1);opacity:1} }
        @keyframes ir-fade-in     { from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)} }
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
        <div className="ir-orb" style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(229,50,45,0.08)', border:'1.5px solid rgba(229,50,45,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span key={stepIdx} className="ir-icon-anim" style={{ fontSize:36, display:'block', opacity:iconVisible?1:0, transition:'opacity 0.15s ease' }}>
            {step.icon}
          </span>
        </div>
      </div>
      <div key={`msg-${stepIdx}`} className="ir-msg-anim" style={{ fontSize:16, fontWeight:600, color:'#ffffff', marginBottom:5, letterSpacing:'-0.01em', minHeight:24, textAlign:'center', opacity:msgVisible?1:0, transition:'opacity 0.15s ease' }}>
        {step.msg}<span style={{ color:'rgba(229,50,45,0.8)' }}>{'.'.repeat(dots)}</span>
      </div>
      <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:28, textAlign:'center' }}>{step.sub}</div>
      <div style={{ width:'100%', marginBottom:6 }}>
        <div style={{ width:'100%', height:4, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden', marginBottom:6 }}>
          <div style={{ height:'100%', width:`${pct}%`, background:'#E5322D', borderRadius:2, transition:'width 0.3s ease' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(255,255,255,0.25)' }}>
          <span>Generating your reviews</span><span>{pct}%</span>
        </div>
      </div>
      <div style={{ display:'flex', gap:6, justifyContent:'center', margin:'16px 0' }}>
        {GEN_STEPS.map((_, i) => (
          <div key={i} style={{ height:6, borderRadius:3, width:i===stepIdx?20:6, background:i<=stepIdx?'#E5322D':'rgba(255,255,255,0.12)', transition:'all 0.4s ease' }} />
        ))}
      </div>
      <div style={{ marginTop:20, padding:'12px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:5 }}>Did you know</div>
        <div key={`fact-${factIdx}`} className="ir-fact-anim" style={{ fontSize:12, color:'rgba(255,255,255,0.45)', lineHeight:1.6, opacity:factVisible?1:0, transition:'opacity 0.2s ease' }}>
          {DID_YOU_KNOW[factIdx]}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function DemoPage() {
  const [step,        setStep]        = useState("landing");
  const [rating,      setRating]      = useState(null);
  const [hoverRating, setHoverRating] = useState(null);
  const [mood,        setMood]        = useState(null);
  const [selected,    setSelected]    = useState(0);
  const [copied,      setCopied]      = useState(false);

  const preview = hoverRating ?? rating ?? 0;
  const isNegative = rating !== null && rating <= 2;
  const positiveLabel = rating === 3 ? "Good" : rating === 4 ? "Very Good" : rating === 5 ? "Excellent!" : "";
  const reviews = DEMO_REVIEWS[mood] ?? DEMO_REVIEWS.relaxed;

  // Auto-advance from generating after 2.4s
  useEffect(() => {
    if (step !== "generating") return;
    const t = setTimeout(() => { setStep("pick"); setSelected(0); }, 2400);
    return () => clearTimeout(t);
  }, [step]);

  function simulateCopy() {
    setCopied(true);
    setTimeout(() => setStep("success"), 500);
  }

  function restart() {
    setStep("rating"); setRating(null); setMood(null); setCopied(false); setSelected(0);
  }

  // ── LANDING PAGE ────────────────────────────────────────────────────────────
  if (step === "landing") {
    return (
      <div className="min-h-[100dvh] bg-navy">
        <style>{`
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
          @keyframes fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          .fade-up-1 { animation: fade-up 0.6s ease forwards; }
          .fade-up-2 { animation: fade-up 0.6s 0.15s ease both; }
          .fade-up-3 { animation: fade-up 0.6s 0.3s ease both; }
          .fade-up-4 { animation: fade-up 0.6s 0.45s ease both; }
        `}</style>

        <section className="relative px-4 pt-14 pb-16 text-center overflow-hidden">
          <div style={{ position:"absolute", top:-80, left:"50%", transform:"translateX(-50%)", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(229,50,45,0.08) 0%, transparent 70%)", pointerEvents:"none" }} />
          <div className="relative mx-auto max-w-xl">
            <div className="fade-up-1 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-semibold text-accent tracking-wide">LIVE INTERACTIVE DEMO</span>
            </div>
            <h1 className="fade-up-2 text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
              See InsightRep<br /><span className="text-accent">in action</span>
            </h1>
            <p className="fade-up-3 mt-4 text-base text-text-muted leading-relaxed max-w-md mx-auto">
              This is exactly what your customers see when they scan your QR code. Try it yourself — takes 30 seconds.
            </p>
            <div className="fade-up-4 mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => setStep("rating")}
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-bold text-white hover:brightness-110 transition shadow-[0_8px_32px_rgba(229,50,45,0.35)]">
                Try the demo →
              </button>
              <Link href="/login"
                className="flex w-full sm:w-auto items-center justify-center rounded-full border border-white/15 px-8 py-3.5 text-sm font-semibold text-white/70 hover:text-white hover:border-white/30 transition">
                Get started — ₹1,499/mo
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-white/5 bg-white/[0.02] py-8 px-4">
          <div className="mx-auto max-w-xl grid grid-cols-4 gap-4">
            {STATS.map((s, i) => <AnimatedStat key={s.label} value={s.value} label={s.label} delay={i * 100} />)}
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="mx-auto max-w-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-accent text-center mb-2">How it works</p>
            <h2 className="text-2xl font-bold text-white text-center mb-10">4 steps. Zero friction.</h2>
            <div className="space-y-4">
              {HOW_IT_WORKS.map((item, i) => (
                <div key={i} className="flex items-start gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-xl">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-accent/60 tracking-widest">{item.step}</span>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="mx-auto max-w-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-accent text-center mb-2">What's included</p>
            <h2 className="text-2xl font-bold text-white text-center mb-10">Everything your business needs.</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map((f, i) => (
                <div key={i} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 space-y-2">
                  <span className="text-2xl">{f.icon}</span>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-text-muted leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="mx-auto max-w-xl">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-accent">Live clients</p>
              <div className="space-y-3">
                {[
                  { name: "Cliff – All Day Dining & Bar", city: "Chh. Sambhajinagar", plan: "Monthly" },
                  { name: "Mrignayani Restaurant",        city: "Chh. Sambhajinagar", plan: "Monthly" },
                  { name: "Kake di Hatti",                city: "Chh. Sambhajinagar", plan: "Monthly" },
                ].map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-white">{c.name}</p>
                      <p className="text-xs text-text-muted">{c.city}</p>
                    </div>
                    <span className="text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-1 rounded-full">ACTIVE</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted">Maharashtra's fastest growing review automation platform.</p>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="mx-auto max-w-xl rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/10 via-transparent to-transparent p-8 text-center space-y-5">
            <p className="text-2xl font-bold text-white">Ready to grow your Google rating?</p>
            <p className="text-sm text-text-muted">Setup in 5 minutes. QR on your counter today. Reviews from tomorrow.</p>
            <button onClick={() => setStep("rating")}
              className="w-full flex h-12 items-center justify-center rounded-full bg-accent text-sm font-bold text-white hover:brightness-110 transition shadow-[0_8px_32px_rgba(229,50,45,0.3)]">
              Try demo first →
            </button>
            <Link href="/login" className="block text-sm text-accent hover:underline">Or get started — ₹1,499/month</Link>
          </div>
        </section>
      </div>
    );
  }

  // ── REVIEW FLOW ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-navy px-4 py-8 pb-16">
      {/* Demo banner */}
      <div className="mx-auto max-w-lg mb-6">
        <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <p className="text-xs font-semibold text-accent">LIVE DEMO — This is what your customers see</p>
          </div>
          <button onClick={() => setStep("landing")} className="shrink-0 text-xs text-text-muted hover:text-white">← Back</button>
        </div>
      </div>

      <div className="mx-auto max-w-lg">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-accent">InsightRep</p>
        <h1 className="mt-2 text-center text-2xl font-bold text-white">{DEMO_BUSINESS.name}</h1>
        <p className="mt-1 text-center text-sm text-text-muted">{DEMO_BUSINESS.address}</p>

        {/* Progress indicator */}
        {step !== "success" && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {["rating", "mood", "generating", "pick"].map((s, i) => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? "w-8 bg-accent" :
                ["rating","mood","generating","pick"].indexOf(step) > i ? "w-3 bg-accent/40" : "w-3 bg-white/10"
              }`} />
            ))}
          </div>
        )}

        {/* RATING */}
        {step === "rating" && (
          <section className="mt-10 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">How was your experience?</h2>
              <p className="text-sm text-text-muted mt-1">Tap a star to rate — then continue to leave a review.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2" onMouseLeave={() => setHoverRating(null)}>
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button"
                  onMouseEnter={() => setHoverRating(n)}
                  onClick={() => setRating(n)}
                  className={`flex min-h-[52px] min-w-[52px] items-center justify-center rounded-xl text-[clamp(2.5rem,11vw,3rem)] leading-none transition-all hover:scale-110 active:scale-95 ${
                    preview >= n ? "text-[#F4B400] drop-shadow-[0_0_14px_rgba(244,180,0,0.45)]" : "text-white/15"
                  }`}>★</button>
              ))}
            </div>

            {isNegative && <DemoNegativeFeedbackCard />}

            {positiveLabel && (
              <p className="text-center text-2xl font-bold text-[#F4B400] drop-shadow-sm">{positiveLabel}</p>
            )}

            {!isNegative && (
              <button type="button" disabled={!rating || rating < 3} onClick={() => setStep("mood")}
                className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white transition enabled:hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed">
                Continue →
              </button>
            )}
          </section>
        )}

        {/* MOOD */}
        {step === "mood" && (
          <section className="mt-10 space-y-5">
            <button type="button" onClick={() => setStep("rating")} className="text-sm text-text-muted hover:text-white">← Back</button>
            <div>
              <h2 className="text-lg font-semibold text-white">What brings you here today?</h2>
              <p className="text-sm text-text-muted mt-1">Helps us write a more accurate review for you.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MOODS.map(m => {
                const on = mood === m.id;
                return (
                  <button key={m.id} type="button" onClick={() => setMood(m.id)}
                    className={`relative flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition-all ${
                      on ? "border-accent bg-accent/10 scale-[1.02]" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}>
                    {on && (
                      <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    <span className="text-xl leading-none">{m.icon}</span>
                    <span className={`text-sm font-semibold ${on ? "text-white" : "text-white/80"}`}>{m.label}</span>
                    <span className="text-xs text-text-muted leading-snug">{m.desc}</span>
                  </button>
                );
              })}
            </div>
            <button type="button" disabled={!mood} onClick={() => setStep("generating")}
              className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white transition enabled:hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed">
              {mood ? "Generate my review →" : "Pick a mood to continue"}
            </button>
          </section>
        )}

        {/* GENERATING */}
        {step === "generating" && <DemoGeneratingScreen />}

        {/* PICK */}
        {step === "pick" && (
          <section className="mt-10 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Pick one to copy</h2>
              <p className="text-sm text-text-muted mt-1">3 unique AI-written reviews — all based on your visit.</p>
            </div>
            <div className="space-y-3">
              {reviews.map((text, i) => (
                <button key={i} type="button" onClick={() => setSelected(i)}
                  className={`w-full rounded-2xl border p-4 text-left text-sm leading-relaxed transition ${
                    selected === i ? "border-accent bg-accent/10 text-white" : "border-white/10 bg-white/[0.02] text-text-muted hover:border-white/20"
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition ${
                      selected === i ? "border-accent bg-accent" : "border-white/20"
                    }`}>
                      {selected === i && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span>{text}</span>
                  </div>
                </button>
              ))}
            </div>
            <button type="button" onClick={simulateCopy}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-white hover:brightness-110 transition shadow-[0_4px_20px_rgba(229,50,45,0.3)]">
              {copied ? "✓ Copied!" : "Copy & open Google"}
            </button>
            <p className="text-center text-xs text-text-muted">In real flow, Google opens automatically after copy</p>
          </section>
        )}

        {/* SUCCESS */}
        {step === "success" && (
          <section className="mt-10 flex flex-col items-center gap-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 border border-green-500/20 text-4xl animate-bounce">✅</div>
            <div>
              <h2 className="text-2xl font-bold text-white">Review Copied!</h2>
              <p className="text-sm text-text-muted mt-1">In the real flow, Google opens — customer pastes and posts in 10 seconds.</p>
            </div>

            <div className="w-full rounded-2xl border border-accent/25 bg-accent/5 p-4 text-left space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-accent">AI-written review</p>
                <span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-semibold border border-green-500/20">Copied ✓</span>
              </div>
              <p className="text-sm text-white leading-relaxed">{reviews[selected]}</p>
            </div>

            <div className="w-full rounded-2xl border border-white/8 bg-white/[0.02] p-5 text-left space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-text-muted">How customer posts it</p>
              {["Google opens automatically — they tap the star rating", "Tap the review box — long press and Paste", "Hit Post — live on Google in 10 seconds"].map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">{i+1}</span>
                  <p className="text-sm text-white">{t}</p>
                </div>
              ))}
            </div>

            <div className="w-full rounded-2xl border border-white/8 bg-white/[0.02] p-5 text-left space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-text-muted">What you get as the owner</p>
              {[
                { icon: "📊", text: "Scan and review count tracked on your dashboard" },
                { icon: "📧", text: "Weekly email report every Monday morning" },
                { icon: "🔒", text: "1–2 star ratings go to private inbox, never Google" },
                { icon: "📍", text: "Every review boosts your local Google ranking" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  <p className="text-sm text-text-muted">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="w-full rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/10 via-transparent to-transparent p-6 space-y-4">
              <p className="text-lg font-bold text-white">Want this for your business?</p>
              <p className="text-sm text-text-muted">Setup in 5 minutes. QR on your counter today. Reviews from tomorrow.</p>
              <Link href="/login"
                className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-bold text-white hover:brightness-110 transition shadow-[0_8px_24px_rgba(229,50,45,0.3)]">
                Get InsightRep — ₹1,499/month →
              </Link>
              <p className="text-xs text-text-muted">No contract · Cancel anytime · Free setup call included</p>
            </div>

            <button type="button" onClick={restart} className="text-xs text-text-muted hover:text-white transition">
              ↺ Try demo again
            </button>
          </section>
        )}
      </div>
    </div>
  );
}