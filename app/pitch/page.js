"use client";
import { useEffect, useRef, useState } from "react";

const SECTIONS = ["hero","problem","solution","howitworks","beforeafter","pricing","stats","cta"];

export default function PitchPage() {
  const [active, setActive]   = useState(0);
  const [counted, setCounted] = useState(false);
  const [counters, setCounters] = useState({ c1:"0s",c2:"0 drafts",c3:"0 scans",c4:"0 clients",c5:"0 Rs/yr",c6:"0 min" });
  const [phoneStep, setPhoneStep] = useState(0);

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

  useEffect(() => {
    const targets = { c1:60, c2:3, c3:32, c4:4, c5:22000, c6:5 };
    const suffixes = { c1:"s", c2:" drafts", c3:" scans", c4:" clients", c5:" Rs/yr", c6:" min" };
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !counted) {
        setCounted(true);
        Object.keys(targets).forEach(key => {
          const target = targets[key];
          let current = 0;
          const step = target / 60;
          const timer = setInterval(() => {
            current = Math.min(current + step, target);
            setCounters(prev => ({ ...prev, [key]: Math.round(current).toLocaleString("en-IN") + suffixes[key] }));
            if (current >= target) clearInterval(timer);
          }, 16);
        });
      }
    }, { threshold: 0.3 });
    const el = document.getElementById("s-stats");
    if (el) io.observe(el);
    return () => io.disconnect();
  }, [counted]);

  useEffect(() => {
    const el = document.getElementById("s-solution");
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        let step = 0;
        const t = setInterval(() => { step++; setPhoneStep(step); if (step >= 4) clearInterval(t); }, 800);
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; scroll-snap-type: y mandatory; }
        body {
          background: #07080f;
          color: #fff;
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        /* ── REVEAL ANIMATIONS ── */
        .ir-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.9s cubic-bezier(.16,1,.3,1), transform 0.9s cubic-bezier(.16,1,.3,1);
        }
        .ir-reveal.ir-visible { opacity: 1; transform: none; }
        .d1 { transition-delay: .08s } .d2 { transition-delay: .18s }
        .d3 { transition-delay: .28s } .d4 { transition-delay: .38s }
        .d5 { transition-delay: .48s } .d6 { transition-delay: .58s }

        /* ── NAV DOTS ── */
        .nav-dots {
          position: fixed; right: 24px; top: 50%;
          transform: translateY(-50%);
          display: flex; flex-direction: column; gap: 10px; z-index: 100;
        }
        .nav-dot {
          width: 5px; height: 5px; border-radius: 3px;
          background: rgba(255,255,255,0.15);
          cursor: pointer; transition: all 0.4s ease;
        }
        .nav-dot.active { height: 28px; background: #E5322D; border-radius: 3px; }

        /* ── SECTION ── */
        .ir-section {
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 100px 32px;
          position: relative; overflow: hidden;
          scroll-snap-align: start;
        }

        /* ── TYPOGRAPHY ── */
        .display {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: clamp(42px, 6.5vw, 80px);
          font-weight: 400;
          line-height: 1.08;
          letter-spacing: -0.01em;
          color: #fff;
        }
        .display em {
          font-style: italic;
          color: #E5322D;
        }
        .display-sm {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: clamp(30px, 4.5vw, 54px);
          font-weight: 400;
          line-height: 1.12;
          letter-spacing: -0.01em;
        }
        .display-sm em { font-style: italic; color: #E5322D; }
        .eyebrow {
          font-size: 10px; font-weight: 600;
          letter-spacing: 4px; text-transform: uppercase;
          color: #E5322D; margin-bottom: 20px;
          display: flex; align-items: center; gap: 10px;
        }
        .eyebrow::before, .eyebrow::after {
          content: ''; flex: 0 0 24px; height: 1px;
          background: rgba(229,50,45,0.4);
        }

        /* ── BACKGROUNDS ── */
        .grid-bg {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 72px 72px;
          pointer-events: none;
        }
        .glow {
          position: absolute; border-radius: 50%;
          filter: blur(120px); pointer-events: none;
        }
        .noise {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; opacity: 0.5;
        }

        /* ── LIVE BADGE ── */
        .live-badge {
          display: inline-flex; align-items: center; gap: 10px;
          background: rgba(229,50,45,0.08);
          border: 1px solid rgba(229,50,45,0.2);
          border-radius: 100px; padding: 8px 20px;
          font-size: 12px; font-weight: 500;
          color: rgba(255,255,255,0.6); margin-bottom: 36px;
          letter-spacing: 0.3px;
        }
        .live-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #E5322D;
          animation: livepulse 2s ease infinite;
          flex-shrink: 0;
        }
        @keyframes livepulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(229,50,45,0.5); }
          50% { box-shadow: 0 0 0 8px rgba(229,50,45,0); }
        }

        /* ── HERO STATS BAR ── */
        .hero-stats {
          display: grid; grid-template-columns: repeat(3,1fr);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; overflow: hidden;
          margin-top: 60px; width: 100%; max-width: 520px;
          background: rgba(255,255,255,0.02);
        }
        .hstat { padding: 22px 20px; text-align: center; position: relative; }
        .hstat + .hstat::before {
          content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 1px; background: rgba(255,255,255,0.06);
        }
        .hstat-n {
          font-family: 'Instrument Serif', serif;
          font-size: 30px; font-weight: 400; color: #E5322D;
        }
        .hstat-l { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 5px; line-height: 1.5; }

        /* ── PROBLEM CARDS ── */
        .prob-grid {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 10px; width: 100%; max-width: 820px; margin-top: 44px;
        }
        .prob-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 20px; padding: 24px 20px;
          transition: all 0.35s; cursor: default;
          position: relative; overflow: hidden;
        }
        .prob-card::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at top left, rgba(229,50,45,0.06), transparent 60%);
          opacity: 0; transition: opacity 0.35s;
        }
        .prob-card:hover { border-color: rgba(229,50,45,0.2); transform: translateY(-3px); }
        .prob-card:hover::before { opacity: 1; }
        .prob-n {
          font-family: 'Instrument Serif', serif;
          font-size: 44px; font-weight: 400;
          color: rgba(229,50,45,0.15);
          line-height: 1; margin-bottom: 14px;
        }
        .prob-title { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 8px; }
        .prob-body { font-size: 12px; color: rgba(255,255,255,0.3); line-height: 1.7; }

        /* ── PHONE DEMO ── */
        .phone-wrap {
          width: 210px;
          background: #0c0c12;
          border-radius: 38px;
          border: 1.5px solid rgba(255,255,255,0.09);
          padding: 22px 16px;
          box-shadow: 0 60px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03);
        }
        .phone-notch {
          width: 56px; height: 5px;
          background: rgba(255,255,255,0.06);
          border-radius: 3px; margin: 0 auto 18px;
        }
        .phone-screen-inner {
          background: #07080f; border-radius: 22px;
          padding: 16px; min-height: 290px;
        }
        .phone-brand {
          font-size: 9px; font-weight: 700;
          letter-spacing: 2.5px; color: #E5322D;
          text-align: center; margin-bottom: 10px;
          text-transform: uppercase;
        }
        .phone-biz {
          font-size: 14px; font-weight: 600;
          color: #fff; text-align: center; margin-bottom: 14px;
        }
        .phone-stars {
          display: flex; gap: 3px;
          justify-content: center; margin-bottom: 14px;
        }
        .phone-star { font-size: 20px; transition: all 0.4s; }
        .review-pill {
          background: rgba(229,50,45,0.08);
          border: 1px solid rgba(229,50,45,0.15);
          border-radius: 12px; padding: 10px 11px;
          font-size: 9px; color: rgba(255,255,255,0.5);
          line-height: 1.6; margin-bottom: 7px; transition: all 0.5s;
        }
        .review-pill.selected {
          background: rgba(229,50,45,0.18);
          border-color: rgba(229,50,45,0.45); color: #fff;
        }
        .phone-cta {
          background: #E5322D; border-radius: 100px;
          padding: 9px 14px; font-size: 9px; font-weight: 700;
          text-align: center; margin-top: 10px; letter-spacing: 0.3px;
        }

        /* ── STEPS ── */
        .steps-row {
          display: flex; align-items: flex-start;
          width: 100%; max-width: 780px; margin-top: 44px;
        }
        .step-item {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; text-align: center; padding: 0 12px;
        }
        .step-circle {
          width: 68px; height: 68px; border-radius: 20px;
          background: rgba(229,50,45,0.06);
          border: 1px solid rgba(229,50,45,0.18);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; margin-bottom: 16px; position: relative;
          transition: all 0.3s;
        }
        .step-circle:hover { background: rgba(229,50,45,0.12); transform: scale(1.06); }
        .step-n {
          position: absolute; top: -9px; right: -9px;
          width: 22px; height: 22px; background: #E5322D;
          border-radius: 50%; font-size: 10px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Inter', sans-serif; border: 2px solid #07080f;
        }
        .step-title { font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #fff; }
        .step-body { font-size: 11px; color: rgba(255,255,255,0.3); line-height: 1.6; max-width: 110px; }
        .step-arrow { font-size: 20px; color: rgba(229,50,45,0.3); margin-top: 24px; flex-shrink: 0; }

        /* ── BEFORE / AFTER ── */
        .ba-grid {
          display: grid; grid-template-columns: 1fr 48px 1fr;
          width: 100%; max-width: 760px; margin-top: 44px; align-items: stretch;
        }
        .ba-col { border-radius: 22px; padding: 28px 24px; }
        .ba-before {
          background: rgba(229,50,45,0.03);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .ba-after {
          background: rgba(34,197,94,0.03);
          border: 1px solid rgba(34,197,94,0.12);
        }
        .ba-head {
          font-size: 10px; font-weight: 600; letter-spacing: 3px;
          text-transform: uppercase; margin-bottom: 20px;
          padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .ba-row {
          display: flex; align-items: flex-start; gap: 12px;
          margin-bottom: 13px; font-size: 13px; color: rgba(255,255,255,0.5);
          line-height: 1.4;
        }
        .dot-r { width: 6px; height: 6px; border-radius: 50%; background: rgba(229,50,45,0.5); flex-shrink:0; margin-top:4px; }
        .dot-g { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; flex-shrink:0; margin-top:4px; }
        .vs-divider { display: flex; align-items: center; justify-content: center; }
        .vs-pill {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 100px; writing-mode: vertical-rl;
          padding: 14px 8px; font-size: 10px; font-weight: 700;
          color: rgba(255,255,255,0.2); letter-spacing: 4px;
        }

        /* ── PRICING ── */
        .price-card {
          width: 100%; max-width: 520px;
          border-radius: 28px; padding: 40px 36px;
          border: 1px solid rgba(229,50,45,0.3);
          background: rgba(229,50,45,0.04);
          position: relative; overflow: hidden;
        }
        .price-card::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at top, rgba(229,50,45,0.1) 0%, transparent 60%);
          pointer-events: none;
        }
        .price-big {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(56px, 9vw, 96px);
          font-weight: 400; color: #fff; line-height: 1;
        }
        .price-compare {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 8px; width: 100%; max-width: 520px; margin-bottom: 28px;
        }
        .pc {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 16px 12px; text-align: center;
        }
        .pc.hi {
          background: rgba(229,50,45,0.06);
          border-color: rgba(229,50,45,0.25);
        }
        .pc-n {
          font-family: 'Instrument Serif', serif;
          font-size: 22px; font-weight: 400; margin-bottom: 5px;
        }
        .pc-l { font-size: 10px; color: rgba(255,255,255,0.3); line-height: 1.5; }
        .roi-box {
          background: rgba(34,197,94,0.04);
          border: 1px solid rgba(34,197,94,0.15);
          border-radius: 20px; padding: 24px 28px;
          width: 100%; max-width: 520px;
        }
        .roi-row {
          display: flex; justify-content: space-between;
          align-items: center; font-size: 13px; margin-bottom: 10px;
        }
        .roi-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 14px 0; }
        .feat-wrap { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 24px; }
        .feat-chip {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 100px; padding: 7px 18px;
          font-size: 11px; color: rgba(255,255,255,0.4);
          transition: all 0.2s;
        }
        .feat-chip:hover { border-color: rgba(229,50,45,0.3); color: rgba(255,255,255,0.7); }

        /* ── STATS ── */
        .stats-grid {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 10px; width: 100%; max-width: 720px; margin-top: 44px;
        }
        .stat-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 22px; padding: 28px 20px;
          text-align: center; transition: all 0.35s; cursor: default;
          position: relative; overflow: hidden;
        }
        .stat-card::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at bottom, rgba(229,50,45,0.07), transparent 60%);
          opacity: 0; transition: opacity 0.35s;
        }
        .stat-card:hover { border-color: rgba(229,50,45,0.2); transform: translateY(-4px); }
        .stat-card:hover::before { opacity: 1; }
        .stat-n {
          font-family: 'Instrument Serif', serif;
          font-size: 44px; font-weight: 400; color: #E5322D;
          line-height: 1; margin-bottom: 12px;
        }
        .stat-l { font-size: 12px; color: rgba(255,255,255,0.35); line-height: 1.6; }

        /* ── CTA ── */
        .cta-wrap {
          background: linear-gradient(160deg, rgba(229,50,45,0.07) 0%, rgba(229,50,45,0.02) 100%);
          border: 1px solid rgba(229,50,45,0.2);
          border-radius: 32px; padding: 64px 52px;
          text-align: center; width: 100%; max-width: 600px;
          position: relative; overflow: hidden;
        }
        .cta-wrap::before {
          content: ''; position: absolute; top: 0; left: 50%;
          transform: translateX(-50%);
          width: 300px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(229,50,45,0.5), transparent);
        }
        .cta-btn {
          display: inline-block; background: #E5322D; color: #fff;
          border: none; border-radius: 100px; padding: 17px 48px;
          font-size: 15px; font-weight: 600; font-family: 'Inter', sans-serif;
          cursor: pointer; text-decoration: none; letter-spacing: 0.2px;
          transition: all 0.25s; position: relative;
          box-shadow: 0 8px 32px rgba(229,50,45,0.3);
        }
        .cta-btn:hover { transform: scale(1.04); box-shadow: 0 16px 48px rgba(229,50,45,0.4); }
        .cta-checks {
          display: flex; gap: 28px; justify-content: center;
          flex-wrap: wrap; margin-top: 28px;
        }
        .cta-check {
          font-size: 12px; color: rgba(255,255,255,0.35);
          display: flex; align-items: center; gap: 8px;
        }
        .cta-check-tick {
          width: 17px; height: 17px; border-radius: 50%;
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; color: #22c55e; flex-shrink: 0;
        }

        /* ── SCROLL HINT ── */
        .scroll-hint {
          position: absolute; bottom: 36px; left: 50%;
          transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          opacity: 0.25; pointer-events: none;
        }
        .scroll-chevron {
          width: 18px; height: 18px;
          border-right: 1.5px solid #E5322D;
          border-bottom: 1.5px solid #E5322D;
          transform: rotate(45deg);
          animation: scrollbounce 1.6s ease infinite;
        }
        @keyframes scrollbounce {
          0%,100% { transform: rotate(45deg) translateY(0); }
          50% { transform: rotate(45deg) translateY(6px); }
        }

        .sep { height: 1px; background: rgba(255,255,255,0.04); scroll-snap-align: none; }

        @media(max-width:640px) {
          .prob-grid { grid-template-columns: 1fr; }
          .steps-row { flex-direction: column; align-items: center; gap: 24px; }
          .step-arrow { transform: rotate(90deg); }
          .ba-grid { grid-template-columns: 1fr; gap: 12px; }
          .vs-divider { display: none; }
          .stats-grid { grid-template-columns: repeat(2,1fr); }
          .price-compare { grid-template-columns: 1fr; }
          .cta-wrap { padding: 40px 28px; }
          .ir-section { padding: 80px 20px; }
        }
      `}</style>

      {/* NAV DOTS */}
      <nav className="nav-dots">
        {SECTIONS.map((s,i) => (
          <div key={s}
            className={`nav-dot${active===i?" active":""}`}
            onClick={() => document.getElementById(`s-${s}`)?.scrollIntoView({behavior:"smooth"})}
            title={s}
          />
        ))}
      </nav>

      {/* ══════════════════════════════════════
          1 — HERO
      ══════════════════════════════════════ */}
      <section className="ir-section" id="s-hero" data-section="hero">
        <div className="grid-bg" />
        <div className="noise" />
        <div className="glow" style={{width:700,height:700,background:"#E5322D",top:-280,right:-200,opacity:0.07}} />
        <div className="glow" style={{width:500,height:500,background:"#3b5bdb",bottom:-200,left:-180,opacity:0.06}} />

        <div className="live-badge ir-reveal">
          <span className="live-dot" />
          Live with real businesses · Chh. Sambhajinagar
        </div>

        <h1 className="display ir-reveal d1" style={{textAlign:"center",maxWidth:820}}>
          Your customers leave.<br /><em>Reviews stay.</em>
        </h1>

        <p className="ir-reveal d2" style={{
          fontSize:17, color:"rgba(255,255,255,0.4)", lineHeight:1.75,
          maxWidth:500, textAlign:"center", marginTop:20, fontWeight:300
        }}>
          Customers scan your QR. AI writes the review. They paste on Google in 60 seconds.
          No staff training. No awkward asking.
        </p>

        <div className="hero-stats ir-reveal d3">
          {[["60s","To post a review"],["3","AI options always"],["Rs.60","Per day only"]].map(([n,l]) => (
            <div className="hstat" key={n}>
              <div className="hstat-n">{n}</div>
              <div className="hstat-l">{l}</div>
            </div>
          ))}
        </div>

        <div className="scroll-hint">
          <span style={{fontSize:9,letterSpacing:3,textTransform:"uppercase",fontWeight:500}}>Scroll</span>
          <div className="scroll-chevron" />
        </div>
      </section>

      <div className="sep" />

      {/* ══════════════════════════════════════
          2 — PROBLEM
      ══════════════════════════════════════ */}
      <section className="ir-section" id="s-problem" data-section="problem">
        <div className="grid-bg" />
        <div className="eyebrow ir-reveal">The Problem</div>
        <h2 className="display-sm ir-reveal d1" style={{textAlign:"center",maxWidth:640}}>
          Why restaurants <em>lose customers</em> every day
        </h2>
        <p className="ir-reveal d2" style={{
          fontSize:14, color:"rgba(255,255,255,0.3)", marginTop:12,
          textAlign:"center", maxWidth:480, lineHeight:1.7
        }}>
          Your food might be better. Your service might be better. But customers choose the business with more reviews — every time.
        </p>

        <div className="prob-grid">
          {[
            ["01","Customers never leave reviews","Even happy customers don't review. 90% forget or don't know what to write. You lose them silently."],
            ["02","Competitor is pulling ahead","Your food is better but they have 500 reviews. People choose the business with more reviews — every time."],
            ["03","Rating stuck below 4.3","Google shows 4.5+ restaurants first. A 4.1 rating makes you invisible to most new customers searching online."],
            ["04","One bad review costs you 10 customers","A single 1-star review pushes away 10 potential walk-ins. More positive reviews is the only counter."],
            ["05","Zomato commission is eating profits","Paying 25–30% commission on every order. Google reviews bring direct customers — zero commission."],
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

      {/* ══════════════════════════════════════
          3 — SOLUTION
      ══════════════════════════════════════ */}
      <section className="ir-section" id="s-solution" data-section="solution">
        <div className="grid-bg" />
        <div className="glow" style={{width:500,height:500,background:"#E5322D",top:"15%",right:"-8%",opacity:0.07}} />

        <div className="eyebrow ir-reveal">How it works</div>
        <h2 className="display-sm ir-reveal d1" style={{textAlign:"center"}}>
          4 steps. <em>60 seconds.</em> Done.
        </h2>

        <div className="ir-reveal d2" style={{margin:"40px 0"}}>
          <div className="phone-wrap">
            <div className="phone-notch" />
            <div className="phone-screen-inner">
              <div className="phone-brand">InsightRep</div>
              <div className="phone-biz">Sharma's Cafe</div>
              <div className="phone-stars">
                {[1,2,3,4,5].map(i => (
                  <span key={i} className="phone-star" style={{
                    opacity: phoneStep >= 1 ? 1 : 0.1,
                    color: phoneStep >= 1 ? "#F4B400" : "rgba(255,255,255,0.15)",
                    transform: phoneStep >= 1 ? "scale(1)" : "scale(0.6)",
                    transitionDelay:`${i*0.08}s`
                  }}>★</span>
                ))}
              </div>
              <div className="review-pill" style={{opacity:phoneStep>=2?1:0,transitionDelay:"0.2s"}}>
                "Been coming here for lunch for months. Food is consistently great and service never makes you wait."
              </div>
              <div className="review-pill" style={{opacity:phoneStep>=2?0.45:0,transitionDelay:"0.4s"}}>
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
            ["📱","1","Scan QR","Table card — no app needed"],
            ["⭐","2","Rate","Tap 3, 4 or 5 stars"],
            ["🤖","3","AI writes","3 review options instantly"],
            ["✅","4","Post","Copy, paste, done"],
          ].map(([icon,n,title,desc],i) => (
            <>
              <div className={`step-item ir-reveal d${i+1}`} key={n}>
                <div className="step-circle">
                  <span style={{fontSize:26}}>{icon}</span>
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
          marginTop:36, background:"rgba(229,50,45,0.04)",
          border:"1px solid rgba(229,50,45,0.12)",
          borderRadius:16, padding:"16px 28px",
          maxWidth:580, textAlign:"center",
          fontSize:13, color:"rgba(255,255,255,0.35)", lineHeight:1.8
        }}>
          <strong style={{color:"rgba(229,50,45,0.8)"}}>Note: </strong>
          Google requires stars to be tapped on their page — Google's policy. The review is already written and copied. Customer just pastes and posts.
        </div>
      </section>

      <div className="sep" />

      {/* ══════════════════════════════════════
          4 — BEFORE / AFTER
      ══════════════════════════════════════ */}
      <section className="ir-section" id="s-beforeafter" data-section="beforeafter">
        <div className="grid-bg" />
        <div className="eyebrow ir-reveal">The transformation</div>
        <h2 className="display-sm ir-reveal d1" style={{textAlign:"center"}}>
          Before vs <em>After</em> InsightRep
        </h2>

        <div className="ba-grid ir-reveal d2">
          <div className="ba-col ba-before">
            <div className="ba-head" style={{color:"rgba(229,50,45,0.5)"}}>Without InsightRep</div>
            {["Customers never write reviews","Staff manually asks — awkward","2–3 reviews per month","Generic reviews, no SEO","Rating stuck at 4.0–4.2","Low Google visibility","Depends on luck"].map(t => (
              <div className="ba-row" key={t}><div className="dot-r"/>{t}</div>
            ))}
          </div>
          <div className="vs-divider">
            <div className="vs-pill">V&nbsp;&nbsp;S</div>
          </div>
          <div className="ba-col ba-after">
            <div className="ba-head" style={{color:"rgba(34,197,94,0.7)"}}>With InsightRep</div>
            {["AI writes review — customer pastes","QR on table — fully automatic","15–20 reviews per week","SEO-rich, keyword-optimized","Rating climbs to 4.5+ in 30 days","Ranks higher on Google Maps","Systematic and scalable"].map(t => (
              <div className="ba-row" key={t}><div className="dot-g"/><span style={{color:"rgba(255,255,255,0.75)"}}>{t}</span></div>
            ))}
          </div>
        </div>

        <div className="ir-reveal d3" style={{
          display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8,
          width:"100%", maxWidth:720, marginTop:20
        }}>
          {[["2–3 → 15+","Reviews/month"],["4.1 → 4.5+","Rating in 30 days"],["Random → Systematic","Process"],["Zomato → Google","Traffic source"]].map(([v,l]) => (
            <div key={l} style={{
              background:"rgba(255,255,255,0.02)",
              border:"1px solid rgba(255,255,255,0.05)",
              borderRadius:14, padding:"14px 10px", textAlign:"center"
            }}>
              <div style={{fontFamily:"'Instrument Serif',serif",fontSize:15,fontWeight:400,color:"#22c55e",marginBottom:5}}>{v}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="sep" />

      {/* ══════════════════════════════════════
          5 — PRICING
      ══════════════════════════════════════ */}
      <section className="ir-section" id="s-pricing" data-section="pricing">
        <div className="grid-bg" />
        <div className="glow" style={{width:600,height:600,background:"#E5322D",bottom:"-25%",left:"50%",transform:"translateX(-50%)",opacity:0.07}} />

        <div className="eyebrow ir-reveal">Pricing</div>
        <h2 className="display-sm ir-reveal d1" style={{textAlign:"center"}}>
          Less than a cup of <em>chai per day</em>
        </h2>

        <div className="price-card ir-reveal d2" style={{margin:"32px 0 28px", textAlign:"center"}}>
          <div style={{fontSize:13,color:"rgba(229,50,45,0.7)",fontWeight:500,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Annual Plan</div>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:10,marginBottom:6}}>
            <span style={{fontFamily:"'Instrument Serif',serif",fontSize:22,color:"rgba(255,255,255,0.25)",textDecoration:"line-through",fontWeight:400}}>Rs.25,000</span>
            <span className="price-big">Rs.22,000</span>
            <span style={{fontSize:16,color:"rgba(255,255,255,0.3)",fontWeight:300}}>/yr</span>
          </div>
          <div style={{fontSize:13,color:"rgba(229,50,45,0.8)",fontWeight:500,marginBottom:4}}>Founding member rate · Save Rs.3,000</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.25)"}}>Rs.60 per day · locked forever at this price</div>
        </div>

        <div className="price-compare ir-reveal d3">
          <div className="pc hi">
            <div className="pc-n" style={{color:"#E5322D"}}>Rs.22,000</div>
            <div className="pc-l">InsightRep<br/>per year</div>
          </div>
          <div className="pc">
            <div className="pc-n" style={{color:"rgba(255,255,255,0.3)"}}>Rs.60,000+</div>
            <div className="pc-l">Zomato Ads<br/>per year</div>
          </div>
          <div className="pc">
            <div className="pc-n" style={{color:"rgba(255,255,255,0.3)"}}>Rs.1,80,000+</div>
            <div className="pc-l">Social Media<br/>Management/yr</div>
          </div>
        </div>

        <div className="roi-box ir-reveal d4">
          <div style={{fontSize:13,fontWeight:600,color:"#22c55e",marginBottom:16}}>Return on Investment — Simple Math</div>
          <div className="roi-row">
            <span style={{color:"rgba(255,255,255,0.4)"}}>2 extra customers/week × avg bill Rs.400</span>
            <span style={{fontWeight:600}}>Rs.3,200/month</span>
          </div>
          <div className="roi-row">
            <span style={{color:"rgba(255,255,255,0.4)"}}>InsightRep annual cost (per month)</span>
            <span style={{color:"#E5322D",fontWeight:600}}>Rs.1,833/month</span>
          </div>
          <div className="roi-divider" />
          <div className="roi-row">
            <span style={{fontWeight:700,color:"#22c55e",fontSize:15}}>Net extra profit every month</span>
            <span style={{fontWeight:700,color:"#22c55e",fontSize:18}}>Rs.1,367</span>
          </div>
          <div style={{marginTop:12,fontSize:11,color:"rgba(255,255,255,0.2)",textAlign:"center"}}>
            And it only gets better as your rating climbs and more customers find you on Google
          </div>
        </div>

        <div className="feat-wrap ir-reveal d5">
          {["Unlimited QR scans","AI review generation","Dashboard analytics","SEO keywords","Priority WhatsApp support","Dedicated onboarding call","Founding rate locked forever"].map(f => (
            <div className="feat-chip" key={f}>{f}</div>
          ))}
        </div>
      </section>

      <div className="sep" />

      {/* ══════════════════════════════════════
          6 — STATS
      ══════════════════════════════════════ */}
      <section className="ir-section" id="s-stats" data-section="stats">
        <div className="grid-bg" />
        <div className="eyebrow ir-reveal">Why it works</div>
        <h2 className="display-sm ir-reveal d1" style={{textAlign:"center"}}>
          Numbers that <em>prove it</em>
        </h2>

        <div className="stats-grid">
          {[
            ["c1","seconds — average time for a customer to post a Google review with InsightRep"],
            ["c2","AI review options generated every scan — customer picks the best one"],
            ["c3","scans already tracked by Cliff All Day Dining & Bar — our live client"],
            ["c4","paying clients live in Chh. Sambhajinagar right now"],
            ["c5","annual plan — founding member rate, locked forever"],
            ["c6","minutes to set up — QR live and ready for your counter"],
          ].map(([id,label],i) => (
            <div className={`stat-card ir-reveal d${(i%3)+1}`} key={id}>
              <div className="stat-n" id={id}>{counters[id] || "0"}</div>
              <div className="stat-l">{label}</div>
            </div>
          ))}
        </div>

        <div className="ir-reveal d4" style={{
          marginTop:28,
          background:"rgba(255,193,7,0.04)",
          border:"1px solid rgba(255,193,7,0.15)",
          borderRadius:16, padding:"18px 28px",
          maxWidth:640, textAlign:"center",
          fontSize:13, color:"rgba(255,255,255,0.4)", lineHeight:1.8
        }}>
          Live in Chh. Sambhajinagar ·{" "}
          <strong style={{color:"#FFC107"}}>Cliff All Day Dining & Bar</strong>{" "}
          got 10 Google reviews in their first month ·{" "}
          <strong style={{color:"#FFC107"}}>Zero staff training</strong> required
        </div>
      </section>

      <div className="sep" />

      {/* ══════════════════════════════════════
          7 — CTA
      ══════════════════════════════════════ */}
      <section className="ir-section" id="s-cta" data-section="cta">
        <div className="grid-bg" />
        <div className="glow" style={{width:700,height:700,background:"#E5322D",top:"50%",left:"50%",transform:"translate(-50%,-50%)",opacity:0.06}} />

        <div className="cta-wrap ir-reveal">
          <div style={{fontSize:52,marginBottom:24}}>🚀</div>
          <h2 className="display-sm" style={{marginBottom:16}}>Ready to get started?</h2>
          <p style={{fontSize:15,color:"rgba(255,255,255,0.4)",marginBottom:36,lineHeight:1.8,fontWeight:300}}>
            Setup takes 5 minutes. QR on your counter today.<br/>First reviews coming in tomorrow.
          </p>
          <a href="https://qr.insightmedia.co.in" className="cta-btn">
            Get started →
          </a>
          <div className="cta-checks">
            {["No credit card","Founding member rate","5 min setup","Priority support"].map(c => (
              <div className="cta-check" key={c}>
                <div className="cta-check-tick">✓</div>{c}
              </div>
            ))}
          </div>
          <div style={{marginTop:32,paddingTop:28,borderTop:"1px solid rgba(255,255,255,0.05)",fontSize:13,color:"rgba(255,255,255,0.2)"}}>
            WhatsApp{" "}
            <span style={{color:"rgba(229,50,45,0.7)",fontWeight:600}}>+91 73876 09098</span>
            {" · "}
            <span style={{color:"rgba(229,50,45,0.7)",fontWeight:600}}>qr.insightmedia.co.in</span>
          </div>
        </div>
      </section>
    </>
  );
}