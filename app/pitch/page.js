"use client";
import { useEffect, useRef, useState } from "react";

const SECTIONS = [
  "hero","problem","solution","howitworks","beforeafter","pricing","stats","cta"
];

export default function PitchPage() {
  const [active, setActive]   = useState(0);
  const [counted, setCounted] = useState(false);
  const [counters, setCounters] = useState({ c1:0,c2:0,c3:0,c4:0,c5:0,c6:0 });
  const [phoneStep, setPhoneStep] = useState(0);
  const refs = useRef({});

  // Intersection observer for nav dots + reveal
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("ir-visible");
          const idx = SECTIONS.indexOf(e.target.dataset.section);
          if (idx !== -1) setActive(idx);
        }
      });
    }, { threshold: 0.3 });
    document.querySelectorAll("[data-section]").forEach(el => io.observe(el));
    document.querySelectorAll(".ir-reveal").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Counter animation
  useEffect(() => {
    const targets = { c1:60,c2:3,c3:32,c4:4,c5:1499,c6:5 };
    const suffixes = { c1:"s",c2:" drafts",c3:" scans",c4:" clients",c5:" Rs/mo",c6:" min" };
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !counted) {
        setCounted(true);
        Object.keys(targets).forEach(key => {
          const target = targets[key];
          let current = 0;
          const step = target / 60;
          const timer = setInterval(() => {
            current = Math.min(current + step, target);
            setCounters(prev => ({ ...prev, [key]: Math.round(current) + suffixes[key] }));
            if (current >= target) clearInterval(timer);
          }, 16);
        });
      }
    }, { threshold: 0.3 });
    const el = document.getElementById("s-stats");
    if (el) io.observe(el);
    return () => io.disconnect();
  }, [counted]);

  // Phone demo animation
  useEffect(() => {
    const el = document.getElementById("s-solution");
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        let step = 0;
        const t = setInterval(() => {
          step++;
          setPhoneStep(step);
          if (step >= 4) clearInterval(t);
        }, 800);
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth;scroll-snap-type:y mandatory}
        body{background:#060608;color:#fff;font-family:'DM Sans',sans-serif;overflow-x:hidden}

        .ir-reveal{opacity:0;transform:translateY(32px);transition:opacity 0.8s cubic-bezier(.22,1,.36,1),transform 0.8s cubic-bezier(.22,1,.36,1)}
        .ir-reveal.ir-visible{opacity:1;transform:none}
        .ir-reveal-l{opacity:0;transform:translateX(-32px);transition:opacity 0.8s cubic-bezier(.22,1,.36,1),transform 0.8s cubic-bezier(.22,1,.36,1)}
        .ir-reveal-l.ir-visible{opacity:1;transform:none}
        .ir-reveal-r{opacity:0;transform:translateX(32px);transition:opacity 0.8s cubic-bezier(.22,1,.36,1),transform 0.8s cubic-bezier(.22,1,.36,1)}
        .ir-reveal-r.ir-visible{opacity:1;transform:none}
        .d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}
        .d4{transition-delay:.4s}.d5{transition-delay:.5s}.d6{transition-delay:.6s}

        /* NAV DOTS */
        .nav-dots{position:fixed;right:20px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:10px;z-index:100}
        .nav-dot{width:6px;height:6px;border-radius:3px;background:rgba(255,255,255,0.2);cursor:pointer;transition:all 0.4s ease}
        .nav-dot.active{height:24px;background:#E5322D}

        /* SECTION BASE */
        .ir-section{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 24px;position:relative;overflow:hidden;scroll-snap-align:start}

        /* TYPOGRAPHY */
        .display{font-family:'Syne',sans-serif;font-size:clamp(36px,6vw,72px);font-weight:800;line-height:1.05;letter-spacing:-0.02em}
        .display-sm{font-family:'Syne',sans-serif;font-size:clamp(28px,4vw,48px);font-weight:700;line-height:1.1;letter-spacing:-0.02em}
        .eyebrow{font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#E5322D;margin-bottom:16px}
        .body-lg{font-size:16px;color:rgba(255,255,255,0.5);line-height:1.7;max-width:520px;text-align:center;margin-top:16px}
        .red{color:#E5322D}

        /* GRID NOISE BG */
        .grid-bg{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px);background-size:60px 60px;pointer-events:none}

        /* GLOW ORBS */
        .glow{position:absolute;border-radius:50%;filter:blur(100px);pointer-events:none;opacity:0.12}

        /* HERO BADGE */
        .live-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(229,50,45,0.1);border:1px solid rgba(229,50,45,0.25);border-radius:100px;padding:8px 18px;font-size:12px;font-weight:500;color:rgba(255,255,255,0.7);margin-bottom:32px}
        .live-dot{width:7px;height:7px;border-radius:50%;background:#E5322D;animation:livepulse 2s ease infinite}
        @keyframes livepulse{0%,100%{box-shadow:0 0 0 0 rgba(229,50,45,0.5)}50%{box-shadow:0 0 0 8px rgba(229,50,45,0)}}

        /* HERO STATS */
        .hero-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,0.06);border-radius:20px;overflow:hidden;margin-top:56px;width:100%;max-width:500px}
        .hstat{background:#060608;padding:20px 16px;text-align:center}
        .hstat-n{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:#E5322D}
        .hstat-l{font-size:11px;color:rgba(255,255,255,0.35);margin-top:4px;line-height:1.4}

        /* PROBLEM CARDS */
        .prob-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;width:100%;max-width:700px;margin-top:40px}
        .prob-card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:22px 20px;transition:all 0.3s;cursor:default}
        .prob-card:hover{background:rgba(229,50,45,0.05);border-color:rgba(229,50,45,0.2);transform:translateY(-2px)}
        .prob-n{font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:rgba(229,50,45,0.3);margin-bottom:10px;line-height:1}
        .prob-title{font-size:14px;font-weight:600;color:#fff;margin-bottom:6px}
        .prob-body{font-size:12px;color:rgba(255,255,255,0.35);line-height:1.6}

        /* PHONE DEMO */
        .phone-wrap{width:200px;background:#0e0e12;border-radius:36px;border:1.5px solid rgba(255,255,255,0.1);padding:20px 14px;position:relative;box-shadow:0 40px 80px rgba(0,0,0,0.5)}
        .phone-notch{width:60px;height:5px;background:rgba(255,255,255,0.08);border-radius:3px;margin:0 auto 16px}
        .phone-screen-inner{background:#060608;border-radius:20px;padding:14px;min-height:280px}
        .phone-brand{font-size:9px;font-weight:700;letter-spacing:2px;color:#E5322D;text-align:center;margin-bottom:10px;text-transform:uppercase}
        .phone-biz{font-size:14px;font-weight:700;color:#fff;text-align:center;margin-bottom:14px}
        .phone-stars{display:flex;gap:3px;justify-content:center;margin-bottom:12px}
        .phone-star{font-size:20px;transition:all 0.3s}
        .review-pill{background:rgba(229,50,45,0.12);border:1px solid rgba(229,50,45,0.2);border-radius:10px;padding:9px 10px;font-size:9px;color:rgba(255,255,255,0.6);line-height:1.5;margin-bottom:6px;transition:all 0.4s}
        .review-pill.selected{background:rgba(229,50,45,0.2);border-color:rgba(229,50,45,0.5);color:#fff}
        .phone-cta{background:#E5322D;border-radius:20px;padding:8px 12px;font-size:9px;font-weight:700;text-align:center;margin-top:8px}

        /* STEPS */
        .steps-row{display:flex;align-items:flex-start;gap:0;width:100%;max-width:720px;margin-top:40px}
        .step-item{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 10px}
        .step-circle{width:64px;height:64px;border-radius:18px;background:rgba(229,50,45,0.08);border:1px solid rgba(229,50,45,0.2);display:flex;align-items:center;justify-content:center;font-size:26px;margin-bottom:14px;position:relative;transition:all 0.3s}
        .step-circle:hover{background:rgba(229,50,45,0.15);transform:scale(1.08)}
        .step-n{position:absolute;top:-8px;right:-8px;width:20px;height:20px;background:#E5322D;border-radius:50%;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif}
        .step-title{font-size:13px;font-weight:600;margin-bottom:5px;color:#fff}
        .step-body{font-size:11px;color:rgba(255,255,255,0.35);line-height:1.5;max-width:100px}
        .step-arrow{font-size:16px;color:rgba(229,50,45,0.35);margin-top:24px;flex-shrink:0}

        /* BEFORE AFTER */
        .ba-grid{display:grid;grid-template-columns:1fr 40px 1fr;gap:0;width:100%;max-width:700px;margin-top:40px;align-items:stretch}
        .ba-col{border-radius:20px;padding:24px;overflow:hidden}
        .ba-before{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06)}
        .ba-after{background:rgba(34,197,94,0.03);border:1px solid rgba(34,197,94,0.15)}
        .ba-head{font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.06)}
        .ba-row{display:flex;align-items:center;gap:10px;margin-bottom:12px;font-size:13px;color:rgba(255,255,255,0.6)}
        .dot-r{width:6px;height:6px;border-radius:50%;background:#E5322D;flex-shrink:0}
        .dot-g{width:6px;height:6px;border-radius:50%;background:#22c55e;flex-shrink:0}
        .vs-divider{display:flex;align-items:center;justify-content:center}
        .vs-pill{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:100px;writing-mode:vertical-rl;padding:12px 6px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.3);letter-spacing:3px}

        /* PRICING */
        .price-num{font-family:'Syne',sans-serif;font-size:80px;font-weight:800;line-height:1;color:#fff}
        .price-compare{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%;max-width:600px;margin-bottom:24px}
        .pc{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px 10px;text-align:center}
        .pc.hi{background:rgba(229,50,45,0.07);border-color:rgba(229,50,45,0.25)}
        .pc-n{font-family:'Syne',sans-serif;font-size:20px;font-weight:700;margin-bottom:4px}
        .pc-l{font-size:10px;color:rgba(255,255,255,0.35);line-height:1.4}
        .roi-box{background:rgba(34,197,94,0.05);border:1px solid rgba(34,197,94,0.18);border-radius:18px;padding:22px 28px;width:100%;max-width:600px}
        .roi-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;margin-bottom:8px}
        .roi-divider{height:1px;background:rgba(255,255,255,0.07);margin:12px 0}
        .feat-wrap{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:20px}
        .feat-chip{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:100px;padding:6px 16px;font-size:11px;color:rgba(255,255,255,0.5)}

        /* STATS */
        .stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;width:100%;max-width:680px;margin-top:40px}
        .stat-card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:24px;text-align:center;transition:all 0.3s;cursor:default}
        .stat-card:hover{border-color:rgba(229,50,45,0.25);transform:translateY(-3px)}
        .stat-n{font-family:'Syne',sans-serif;font-size:42px;font-weight:800;color:#E5322D;line-height:1;margin-bottom:10px}
        .stat-l{font-size:12px;color:rgba(255,255,255,0.4);line-height:1.5}

        /* CTA */
        .cta-wrap{background:linear-gradient(135deg,rgba(229,50,45,0.08) 0%,rgba(229,50,45,0.03) 100%);border:1px solid rgba(229,50,45,0.2);border-radius:28px;padding:56px 48px;text-align:center;width:100%;max-width:580px;position:relative;overflow:hidden}
        .cta-wrap::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at top,rgba(229,50,45,0.12) 0%,transparent 60%);pointer-events:none}
        .cta-btn{display:inline-block;background:#E5322D;color:#fff;border:none;border-radius:100px;padding:16px 44px;font-size:15px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;text-decoration:none;letter-spacing:0.3px;transition:all 0.2s;position:relative}
        .cta-btn:hover{transform:scale(1.04);box-shadow:0 16px 40px rgba(229,50,45,0.35)}
        .cta-checks{display:flex;gap:24px;justify-content:center;flex-wrap:wrap;margin-top:24px}
        .cta-check{font-size:12px;color:rgba(255,255,255,0.4);display:flex;align-items:center;gap:7px}
        .cta-check-tick{width:16px;height:16px;border-radius:50%;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.35);display:flex;align-items:center;justify-content:center;font-size:9px;color:#22c55e;flex-shrink:0}

        /* SCROLL HINT */
        .scroll-hint{position:absolute;bottom:32px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;opacity:0.3}
        .scroll-chevron{width:20px;height:20px;border-right:1.5px solid #E5322D;border-bottom:1.5px solid #E5322D;transform:rotate(45deg);animation:scrollbounce 1.5s ease infinite}
        @keyframes scrollbounce{0%,100%{transform:rotate(45deg) translateY(0)}50%{transform:rotate(45deg) translateY(5px)}}

        /* SEPARATOR */
        .sep{height:1px;background:rgba(255,255,255,0.04);width:100%;scroll-snap-align:none}

        /* MOBILE */
        @media(max-width:640px){
          .prob-grid{grid-template-columns:1fr}
          .steps-row{flex-direction:column;align-items:center;gap:24px}
          .step-arrow{transform:rotate(90deg)}
          .ba-grid{grid-template-columns:1fr;gap:12px}
          .vs-divider{display:none}
          .stats-grid{grid-template-columns:repeat(2,1fr)}
          .price-compare{grid-template-columns:1fr}
          .hero-stats{grid-template-columns:repeat(3,1fr)}
          .cta-wrap{padding:36px 24px}
        }
      `}</style>

      {/* NAV DOTS */}
      <nav className="nav-dots" aria-label="Section navigation">
        {SECTIONS.map((s,i) => (
          <div key={s} className={`nav-dot${active===i?" active":""}`}
            onClick={() => document.getElementById(`s-${s}`)?.scrollIntoView({behavior:"smooth"})}
            title={s} />
        ))}
      </nav>

      {/* ═══════════════════════════════════════════════════
          SECTION 1 — HERO
      ═══════════════════════════════════════════════════ */}
      <section className="ir-section" id="s-hero" data-section="hero">
        <div className="grid-bg" />
        <div className="glow" style={{width:600,height:600,background:"#E5322D",top:-200,right:-200}} />
        <div className="glow" style={{width:400,height:400,background:"#3b5bdb",bottom:-150,left:-150}} />

        <div className="live-badge ir-reveal">
          <span className="live-dot" />
          Live with real businesses in Chh. Sambhajinagar
        </div>

        <h1 className="display ir-reveal d1" style={{textAlign:"center",maxWidth:760}}>
          Your customers leave.<br /><span className="red">Reviews stay.</span>
        </h1>

        <p className="body-lg ir-reveal d2">
          Customers scan your QR. AI writes the review. They paste on Google in 60 seconds. No staff training. No awkward asking.
        </p>

        <div className="hero-stats ir-reveal d3">
          {[["60s","To post a review"],["3","AI options always"],["Rs.49","Per day only"]].map(([n,l]) => (
            <div className="hstat" key={n}>
              <div className="hstat-n">{n}</div>
              <div className="hstat-l">{l}</div>
            </div>
          ))}
        </div>

        <div className="scroll-hint">
          <span style={{fontSize:10,letterSpacing:2,textTransform:"uppercase"}}>Scroll</span>
          <div className="scroll-chevron" />
        </div>
      </section>

      <div className="sep" />

      {/* ═══════════════════════════════════════════════════
          SECTION 2 — PROBLEM
      ═══════════════════════════════════════════════════ */}
      <section className="ir-section" id="s-problem" data-section="problem">
        <div className="grid-bg" />
        <div className="eyebrow ir-reveal">The Problem</div>
        <h2 className="display-sm ir-reveal d1" style={{textAlign:"center",maxWidth:600}}>
          Why restaurants <span className="red">lose customers</span> every day
        </h2>

        <div className="prob-grid">
          {[
            ["01","Customers never leave reviews","Even happy customers don't review. 90% forget or don't know what to write. You lose them silently."],
            ["02","Competitor is pulling ahead","Your food is better but they have 500 reviews. People choose the business with more reviews — every time."],
            ["03","Rating stuck below 4.3","Google shows 4.5+ restaurants first. A 4.1 rating makes you invisible to most new customers searching online."],
            ["04","One bad review costs you 10 customers","A single 1-star review pushes away 10 potential walk-ins. More positive reviews is the only counter."],
            ["05","Zomato commission is eating profits","Paying 25-30% commission on every order. Google reviews bring direct customers — zero commission."],
            ["06","Ad spend wasted without reviews","Customers see your ad, check Google, see 12 reviews — and go to the competitor with 340."],
          ].map(([n,title,desc],i) => (
            <div className={`prob-card ir-reveal d${(i%3)+1}`} key={n}>
              <div className="prob-n">{n}</div>
              <div className="prob-title">{title}</div>
              <div className="prob-body">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="sep" />

      {/* ═══════════════════════════════════════════════════
          SECTION 3 — SOLUTION / HOW IT WORKS
      ═══════════════════════════════════════════════════ */}
      <section className="ir-section" id="s-solution" data-section="solution">
        <div className="grid-bg" />
        <div className="glow" style={{width:400,height:400,background:"#E5322D",top:"20%",right:"-10%"}} />

        <div className="eyebrow ir-reveal">How it works</div>
        <h2 className="display-sm ir-reveal d1" style={{textAlign:"center"}}>
          4 steps. <span className="red">60 seconds.</span> Done.
        </h2>

        {/* Phone mockup */}
        <div className="ir-reveal d2" style={{margin:"36px 0"}}>
          <div className="phone-wrap">
            <div className="phone-notch" />
            <div className="phone-screen-inner">
              <div className="phone-brand">InsightRep</div>
              <div className="phone-biz">Sharma's Cafe</div>
              <div className="phone-stars">
                {[1,2,3,4,5].map(i => (
                  <span key={i} className="phone-star" style={{
                    opacity: phoneStep >= 1 ? 1 : 0.15,
                    color: phoneStep >= 1 ? "#F4B400" : "rgba(255,255,255,0.2)",
                    transform: phoneStep >= 1 ? "scale(1)" : "scale(0.7)",
                    transitionDelay: `${i*0.1}s`
                  }}>★</span>
                ))}
              </div>
              <div className="review-pill" style={{opacity: phoneStep >= 2 ? 1 : 0, transitionDelay:"0.2s"}}>
                "Been coming here for lunch for months now. The food is consistently good and service doesn't make you wait."
              </div>
              <div className="review-pill" style={{opacity: phoneStep >= 2 ? 0.5 : 0, transitionDelay:"0.4s"}}>
                "Solid spot for a weekday dinner — biryani is the highlight..."
              </div>
              {phoneStep >= 3 && (
                <div className="phone-cta">Copy &amp; Open Google →</div>
              )}
            </div>
          </div>
        </div>

        <div className="steps-row">
          {[
            ["📱","1","Scan QR","Table card scan — no app needed"],
            ["⭐","2","Rate","Tap 3, 4 or 5 stars"],
            ["🤖","3","AI writes","3 ready review options instantly"],
            ["✅","4","Post on Google","Copy, paste, done in 10 seconds"],
          ].map(([icon,n,title,desc],i) => (
            <>
              <div className={`step-item ir-reveal d${i+1}`} key={n}>
                <div className="step-circle">
                  <span style={{fontSize:24}}>{icon}</span>
                  <div className="step-n">{n}</div>
                </div>
                <div className="step-title">{title}</div>
                <div className="step-body">{desc}</div>
              </div>
              {i < 3 && <div className="step-arrow ir-reveal">›</div>}
            </>
          ))}
        </div>

        <div className="ir-reveal d5" style={{
          marginTop:32,background:"rgba(229,50,45,0.06)",border:"1px solid rgba(229,50,45,0.15)",
          borderRadius:14,padding:"14px 24px",maxWidth:560,textAlign:"center",fontSize:13,
          color:"rgba(255,255,255,0.5)",lineHeight:1.7
        }}>
          <strong style={{color:"#f87171"}}>Note: </strong>
          Google requires stars to be tapped on their page — this is Google's policy. The review is already written and copied — customer just pastes and posts.
        </div>
      </section>

      <div className="sep" />

      {/* ═══════════════════════════════════════════════════
          SECTION 4 — BEFORE / AFTER
      ═══════════════════════════════════════════════════ */}
      <section className="ir-section" id="s-beforeafter" data-section="beforeafter">
        <div className="grid-bg" />
        <div className="eyebrow ir-reveal">The transformation</div>
        <h2 className="display-sm ir-reveal d1" style={{textAlign:"center"}}>
          Before vs <span className="red">After</span> InsightRep
        </h2>

        <div className="ba-grid ir-reveal d2" style={{marginTop:40}}>
          <div className="ba-col ba-before">
            <div className="ba-head" style={{color:"rgba(229,50,45,0.6)"}}>WITHOUT INSIGHTREP</div>
            {["Customers never write reviews","Staff manually asks — awkward","2-3 reviews per month","Generic reviews, no SEO","Rating stuck at 4.0–4.2","Low Google visibility","Depends on luck"].map(t => (
              <div className="ba-row" key={t}><div className="dot-r"/>{t}</div>
            ))}
          </div>
          <div className="vs-divider">
            <div className="vs-pill">V&nbsp;&nbsp;S</div>
          </div>
          <div className="ba-col ba-after">
            <div className="ba-head" style={{color:"rgba(34,197,94,0.8)"}}>WITH INSIGHTREP</div>
            {["AI writes review — customer pastes","QR on table — fully automatic","15-20 reviews per week","SEO-rich, keyword-optimized","Rating climbs to 4.5+ in 30 days","Ranks higher on Google Maps","Systematic and scalable"].map(t => (
              <div className="ba-row" key={t}><div className="dot-g"/><span style={{color:"rgba(255,255,255,0.8)"}}>{t}</span></div>
            ))}
          </div>
        </div>

        {/* Impact row */}
        <div className="ir-reveal d3" style={{
          display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,
          width:"100%",maxWidth:700,marginTop:20
        }}>
          {[["2-3→15+","Reviews/month"],["4.1→4.5+","Rating"],["Random→Systematic","Process"],["Zomato→Google","Traffic source"]].map(([v,l]) => (
            <div key={l} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 10px",textAlign:"center"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:"#22c55e",marginBottom:4}}>{v}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="sep" />

      {/* ═══════════════════════════════════════════════════
          SECTION 5 — PRICING
      ═══════════════════════════════════════════════════ */}
      <section className="ir-section" id="s-pricing" data-section="pricing">
        <div className="grid-bg" />
        <div className="glow" style={{width:500,height:500,background:"#E5322D",bottom:"-20%",left:"50%",transform:"translateX(-50%)"}} />

        <div className="eyebrow ir-reveal">Pricing</div>
        <h2 className="display-sm ir-reveal d1" style={{textAlign:"center"}}>
          Less than a cup of <span className="red">chai per day</span>
        </h2>

        <div className="ir-reveal d2" style={{textAlign:"center",margin:"24px 0 28px"}}>
          <div className="price-num">Rs.1,499</div>
          <div style={{fontSize:14,color:"rgba(255,255,255,0.35)",marginTop:6}}>per month · Rs.49 per day · cancel anytime</div>
        </div>

        <div className="price-compare ir-reveal d3">
          <div className="pc hi">
            <div className="pc-n" style={{color:"#E5322D"}}>Rs.1,499</div>
            <div className="pc-l">InsightRep<br/>per month</div>
          </div>
          <div className="pc">
            <div className="pc-n" style={{color:"rgba(255,255,255,0.3)"}}>Rs.5,000+</div>
            <div className="pc-l">Zomato Ads<br/>per month</div>
          </div>
          <div className="pc">
            <div className="pc-n" style={{color:"rgba(255,255,255,0.3)"}}>Rs.15,000+</div>
            <div className="pc-l">Social Media<br/>Management</div>
          </div>
        </div>

        <div className="roi-box ir-reveal d4">
          <div style={{fontSize:13,fontWeight:600,color:"#22c55e",marginBottom:14}}>Return on Investment — Simple Math</div>
          <div className="roi-row">
            <span style={{color:"rgba(255,255,255,0.45)"}}>2 extra customers/week × avg bill Rs.400</span>
            <span style={{fontWeight:600}}>Rs.3,200/month</span>
          </div>
          <div className="roi-row">
            <span style={{color:"rgba(255,255,255,0.45)"}}>InsightRep cost</span>
            <span style={{color:"#E5322D",fontWeight:600}}>Rs.1,499/month</span>
          </div>
          <div className="roi-divider" />
          <div className="roi-row">
            <span style={{fontWeight:700,color:"#22c55e",fontSize:15}}>Net extra profit every month</span>
            <span style={{fontWeight:700,color:"#22c55e",fontSize:18}}>Rs.1,701</span>
          </div>
        </div>

        <div className="feat-wrap ir-reveal d5">
          {["Unlimited QR scans","AI review generation","Dashboard analytics","SEO keywords","Cancel anytime","5 min setup"].map(f => (
            <div className="feat-chip" key={f}>{f}</div>
          ))}
        </div>
      </section>

      <div className="sep" />

      {/* ═══════════════════════════════════════════════════
          SECTION 6 — STATS
      ═══════════════════════════════════════════════════ */}
      <section className="ir-section" id="s-stats" data-section="stats">
        <div className="grid-bg" />
        <div className="eyebrow ir-reveal">Why it works</div>
        <h2 className="display-sm ir-reveal d1" style={{textAlign:"center"}}>
          Numbers that <span className="red">prove it</span>
        </h2>

        <div className="stats-grid">
          {[
            ["c1","seconds — average time for customer to post a Google review"],
            ["c2","AI review options generated every time — customer picks best one"],
            ["c3","scans already tracked by Cliff All Day Dining & Bar — our live client"],
            ["c4","paying clients live in Chh. Sambhajinagar right now"],
            ["c5","per month — less than Rs.50 per day, cancel anytime"],
            ["c6","minutes to set up — QR live and ready for your counter"],
          ].map(([id,label],i) => (
            <div className={`stat-card ir-reveal d${(i%3)+1}`} key={id}>
              <div className="stat-n" id={id}>{counters[id] || "0"}</div>
              <div className="stat-l">{label}</div>
            </div>
          ))}
        </div>

        <div className="ir-reveal d4" style={{
          marginTop:24,background:"rgba(255,193,7,0.06)",border:"1px solid rgba(255,193,7,0.2)",
          borderRadius:14,padding:"16px 24px",maxWidth:600,textAlign:"center",
          fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.7
        }}>
          Live in Chh. Sambhajinagar · <strong style={{color:"#FFC107"}}>Cliff All Day Dining & Bar</strong> got 10 Google reviews in their first month ·{" "}
          <strong style={{color:"#FFC107"}}>Zero staff training</strong> required — customers do everything themselves
        </div>
      </section>

      <div className="sep" />

      {/* ═══════════════════════════════════════════════════
          SECTION 7 — CTA
      ═══════════════════════════════════════════════════ */}
      <section className="ir-section" id="s-cta" data-section="cta">
        <div className="grid-bg" />
        <div className="glow" style={{width:600,height:600,background:"#E5322D",top:"50%",left:"50%",transform:"translate(-50%,-50%)",opacity:0.08}} />

        <div className="cta-wrap ir-reveal">
          <div style={{fontSize:48,marginBottom:20}}>🚀</div>
          <h2 className="display-sm" style={{marginBottom:14}}>Ready to get started?</h2>
          <p style={{fontSize:15,color:"rgba(255,255,255,0.45)",marginBottom:32,lineHeight:1.7}}>
            Setup takes 5 minutes. QR on your counter today. First reviews coming in tomorrow.
          </p>
          <a href="https://qr.insightmedia.co.in" className="cta-btn">
            Start free trial →
          </a>
          <div className="cta-checks">
            {["No credit card","Cancel anytime","5 min setup","Free QR card"].map(c => (
              <div className="cta-check" key={c}>
                <div className="cta-check-tick">✓</div>{c}
              </div>
            ))}
          </div>
          <div style={{marginTop:28,fontSize:13,color:"rgba(255,255,255,0.25)"}}>
            WhatsApp: <span style={{color:"rgba(229,50,45,0.8)",fontWeight:600}}>+91 73876 09098</span>
            &nbsp;·&nbsp;
            <span style={{color:"rgba(229,50,45,0.8)",fontWeight:600}}>qr.insightmedia.co.in</span>
          </div>
        </div>
      </section>
    </>
  );
}
