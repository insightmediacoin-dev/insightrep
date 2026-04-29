"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { toPng } from "html-to-image";
import { BUSINESS_ID_STORAGE_KEY, OWNER_IDENTIFIER_STORAGE_KEY, OWNER_IDENTIFIER_TYPE_STORAGE_KEY, PHONE_STORAGE_KEY } from "@/lib/phone";

function formatCreatedAt(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch { return "—"; }
}

function WelcomeModal({ business, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-accent/30 bg-navy p-8 text-center space-y-5">
        <div className="flex justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-3xl">🎉</span>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">You're live!</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{business.name} is ready</h2>
          <p className="mt-2 text-sm text-text-muted">Your AI-powered Google review system is active. Place your QR code where customers can scan it.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-navy-muted/40 p-4 text-left space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Next steps</p>
          <ol className="space-y-1.5 text-sm text-text-muted list-none">
            <li className="flex items-center gap-2"><span className="text-accent font-bold">1.</span> Download your QR code below</li>
            <li className="flex items-center gap-2"><span className="text-accent font-bold">2.</span> Print and place at your counter</li>
            <li className="flex items-center gap-2"><span className="text-accent font-bold">3.</span> Watch reviews come in</li>
          </ol>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={onClose}
            className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white hover:brightness-110">
            Go to Dashboard
          </button>
          <a href={`https://wa.me/917387609098?text=Hi, I just signed up on InsightRep — ${business.name}`}
            target="_blank" rel="noopener noreferrer"
            className="flex h-12 w-full items-center justify-center rounded-full border border-white/15 text-sm font-medium text-text-muted hover:text-white">
            WhatsApp us for help
          </a>
        </div>
      </div>
    </div>
  );
}

function QRDownloadCard({ reviewUrl, businessName }) {
  return (
    <div style={{ width: 400, background: "#ffffff", borderRadius: 24, padding: "36px 32px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, fontFamily: "Arial, sans-serif" }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#E5322D", textTransform: "uppercase" }}>InsightRep</p>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f1729", textAlign: "center" }}>{businessName}</h2>
      <p style={{ margin: 0, fontSize: 14, color: "#555", textAlign: "center" }}>Scan to review us on Google</p>
      <div style={{ background: "#fff", padding: 16, borderRadius: 16, border: "1px solid #eee" }}>
        {reviewUrl ? <QRCode value={reviewUrl} size={200} level="M" /> : null}
      </div>
      <p style={{ margin: 0, fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 4 }}>InsightRep · By Insight Media</p>
    </div>
  );
}

function OnboardingChecklist({ stats, onDownloadQR, reviewUrl, business, router }) {
  const steps = [
    { id: 1, label: "Business profile created", done: true, action: null },
    {
      id: 2, label: "Complete your personal profile",
      done: !!(business?.owner_name && business?.owner_designation && business?.owner_city),
      action: () => router.push("/profile"), actionLabel: "Complete now",
      hint: "Add your name, role and city",
    },
    { id: 3, label: "Download your QR code", done: false, action: onDownloadQR, actionLabel: "Download now" },
    { id: 4, label: "Place QR at your counter or table", done: false, action: null, hint: "Print it and stick it where customers can see it" },
    {
      id: 5, label: "Get your first QR scan", done: stats.scans > 0,
      action: reviewUrl ? () => navigator.clipboard.writeText(reviewUrl).catch(() => {}) : null,
      actionLabel: "Copy review link",
      hint: "Share your review link on WhatsApp to get your first scan",
    },
    { id: 6, label: "Get your first Google review", done: stats.reviews > 0, hint: "Once a customer scans and posts, you are live!" },
  ];

  const completedCount = steps.filter(s => s.done).length;
  if (completedCount === steps.length) return null;

  return (
    <section className="rounded-2xl border border-accent/20 bg-accent/5 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Getting started</p>
          <h2 className="text-lg font-bold text-white mt-1">Complete your setup</h2>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-accent">{completedCount}/{steps.length}</p>
          <p className="text-xs text-text-muted">steps done</p>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10">
        <div className="h-1.5 rounded-full bg-accent transition-all duration-500" style={{ width: `${(completedCount / steps.length) * 100}%` }} />
      </div>
      <ul className="space-y-3">
        {steps.map((step) => (
          <li key={step.id} className="flex items-start gap-3">
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${step.done ? "bg-green-500 text-white" : "border border-white/20 text-text-muted"}`}>
              {step.done ? "✓" : step.id}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${step.done ? "text-text-muted line-through" : "text-white"}`}>{step.label}</p>
              {step.hint && !step.done && <p className="text-xs text-text-muted mt-0.5">{step.hint}</p>}
            </div>
            {step.action && !step.done && (
              <button type="button" onClick={step.action}
                className="shrink-0 rounded-full border border-accent/30 px-3 py-1 text-xs font-semibold text-accent hover:bg-accent/10">
                {step.actionLabel}
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-text-muted text-center pt-2">
        Need help? WhatsApp us at{" "}
        <a href="https://wa.me/917387609098" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">+91 73876 09098</a>
      </p>
    </section>
  );
}

// ─── RATING ESTIMATOR ─────────────────────────────────────────────────────────
function RatingEstimator({ stats, business }) {
  const [currentRating, setCurrentRating] = useState("");
  const [currentReviews, setCurrentReviews] = useState("");

  // Reviews per week estimate based on InsightRep usage
  // ~70% of scans convert to review copies, ~60% of copies get posted
  const weeklyReviews = stats.scans > 0
    ? Math.max(1, Math.round((stats.reviews / Math.max(1, Math.ceil((Date.now() - new Date(business?.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000)))) ))
    : 3; // default estimate for new businesses

  function estimateNewRating(currentRating, currentCount, newReviews, newRatingAvg = 4.6) {
    if (!currentRating || !currentCount) return null;
    const cr = parseFloat(currentRating);
    const cc = parseInt(currentCount);
    if (isNaN(cr) || isNaN(cc) || cr < 1 || cr > 5 || cc < 0) return null;
    const totalScore = cr * cc + newRatingAvg * newReviews;
    const totalCount = cc + newReviews;
    return Math.min(5, totalScore / totalCount);
  }

  function weeksToTarget(currentRating, currentCount, target = 4.5, weeklyNew = weeklyReviews) {
    if (!currentRating || !currentCount) return null;
    const cr = parseFloat(currentRating);
    const cc = parseInt(currentCount);
    if (isNaN(cr) || isNaN(cc)) return null;
    if (cr >= target) return 0;
    for (let w = 1; w <= 52; w++) {
      const newRating = estimateNewRating(cr, cc, w * weeklyNew);
      if (newRating >= target) return w;
    }
    return null;
  }

  const hasInput = currentRating && currentReviews;
  const rating1m  = hasInput ? estimateNewRating(currentRating, currentReviews, weeklyReviews * 4) : null;
  const rating3m  = hasInput ? estimateNewRating(currentRating, currentReviews, weeklyReviews * 12) : null;
  const weeksTo45 = hasInput ? weeksToTarget(currentRating, currentReviews, 4.5) : null;
  const weeksTo46 = hasInput ? weeksToTarget(currentRating, currentReviews, 4.6) : null;

  const ratingColor = (r) => {
    if (!r) return "text-white";
    if (r >= 4.5) return "text-green-400";
    if (r >= 4.0) return "text-yellow-400";
    return "text-accent";
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-navy-muted/40 p-6 space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-accent">Rating Estimator</p>
        <h2 className="text-lg font-bold text-white mt-1">Where will your rating go?</h2>
        <p className="text-xs text-text-muted mt-0.5">Enter your current Google rating to see your projected growth</p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Current rating</label>
          <input
            type="number" min="1" max="5" step="0.1"
            value={currentRating}
            onChange={e => setCurrentRating(e.target.value)}
            placeholder="e.g. 4.1"
            className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-2.5 text-white text-sm outline-none focus:border-accent placeholder:text-white/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Total reviews</label>
          <input
            type="number" min="0"
            value={currentReviews}
            onChange={e => setCurrentReviews(e.target.value)}
            placeholder="e.g. 47"
            className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-2.5 text-white text-sm outline-none focus:border-accent placeholder:text-white/20"
          />
        </div>
      </div>

      {/* Weekly pace */}
      <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3">
        <div className="text-xl">📈</div>
        <div>
          <p className="text-xs text-text-muted">Your current InsightRep pace</p>
          <p className="text-sm font-semibold text-white">~{weeklyReviews} new reviews per week</p>
        </div>
      </div>

      {/* Results */}
      {hasInput && rating1m !== null && (
        <div className="space-y-3">
          {/* Projection cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-navy/60 p-4 text-center space-y-1">
              <p className="text-xs text-text-muted">After 1 month</p>
              <p className={`text-2xl font-bold ${ratingColor(rating1m)}`}>
                {rating1m?.toFixed(1)}
              </p>
              <p className="text-xs text-text-muted">
                +{weeklyReviews * 4} reviews
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-navy/60 p-4 text-center space-y-1">
              <p className="text-xs text-text-muted">After 3 months</p>
              <p className={`text-2xl font-bold ${ratingColor(rating3m)}`}>
                {rating3m?.toFixed(1)}
              </p>
              <p className="text-xs text-text-muted">
                +{weeklyReviews * 12} reviews
              </p>
            </div>
          </div>

          {/* Target milestones */}
          <div className="space-y-2">
            {weeksTo45 === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3">
                <span className="text-lg">🏆</span>
                <p className="text-sm text-green-400 font-semibold">Already at 4.5+ — you're in the top tier!</p>
              </div>
            ) : weeksTo45 !== null ? (
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-navy/60 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">⭐</span>
                  <div>
                    <p className="text-sm font-semibold text-white">Reach 4.5 rating</p>
                    <p className="text-xs text-text-muted">Google shows you above competitors</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-accent">{weeksTo45} {weeksTo45 === 1 ? "week" : "weeks"}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-navy/60 px-4 py-3">
                <span className="text-lg">⭐</span>
                <p className="text-sm text-text-muted">Keep generating reviews — 4.5 is achievable</p>
              </div>
            )}

            {weeksTo46 !== null && weeksTo46 > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-navy/60 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🚀</span>
                  <div>
                    <p className="text-sm font-semibold text-white">Reach 4.6 rating</p>
                    <p className="text-xs text-text-muted">Top 10% of restaurants in your city</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-accent">{weeksTo46} {weeksTo46 === 1 ? "week" : "weeks"}</p>
                </div>
              </div>
            )}
          </div>

          {/* Insight */}
          <div className="rounded-xl border border-accent/15 bg-accent/5 px-4 py-3">
            <p className="text-xs text-text-muted leading-relaxed">
              <span className="text-white font-semibold">Why this matters: </span>
              Restaurants with 4.5+ ratings get 27% more walk-ins. Every review InsightRep generates moves you closer to that number.
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasInput && (
        <div className="text-center py-4">
          <p className="text-xs text-text-muted">Enter your current Google rating above to see your growth projection</p>
          <p className="text-xs text-text-muted mt-1">
            Find it on{" "}
            <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google Maps</a>
            {" "}by searching your business name
          </p>
        </div>
      )}
    </section>
  );
}

function PricingSection({ currentPlan }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-white">Plans & Pricing</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`rounded-2xl border p-6 space-y-4 ${currentPlan === 'monthly' ? 'border-accent bg-accent/10' : 'border-white/10 bg-navy-muted/40'}`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Starter</p>
            <p className="mt-1 text-3xl font-extrabold text-white">Rs.1,499<span className="text-base font-medium text-text-muted">/mo</span></p>
            <p className="text-xs text-text-muted mt-1">Rs.49 per day · Cancel anytime</p>
          </div>
          <ul className="space-y-2 text-sm text-text-muted">
            {["Unlimited QR scans", "AI review generation", "3-5 star filter", "Dashboard analytics", "Weekly email report", "PNG QR download"].map(f => (
              <li key={f} className="flex items-center gap-2"><span className="text-accent">✓</span>{f}</li>
            ))}
          </ul>
          <p className="text-center text-xs text-text-muted">No contract · Cancel anytime with 7 days notice</p>
          <button disabled className="w-full rounded-full border border-white/15 py-2.5 text-sm font-semibold text-text-muted cursor-not-allowed opacity-60">
            {currentPlan === 'monthly' ? 'Current Plan' : 'Coming Soon'}
          </button>
        </div>
        <div className={`rounded-2xl border p-6 space-y-4 relative overflow-hidden ${currentPlan === 'annual' ? 'border-accent bg-accent/10' : 'border-accent/40 bg-accent/5'}`}>
          <div className="absolute top-3 right-3 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-full tracking-wide">BEST VALUE</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Annual</p>
            <p className="mt-1 text-3xl font-extrabold text-white">Rs.12,990<span className="text-base font-medium text-text-muted">/yr</span></p>
            <p className="text-xs text-accent mt-1 font-semibold">3 months FREE · Save Rs.4,998</p>
            <p className="text-xs text-text-muted">Rs.35 per day</p>
          </div>
          <ul className="space-y-2 text-sm text-text-muted">
            {["Everything in Starter", "3 extra months free", "Priority WhatsApp support", "Founding member rate locked"].map(f => (
              <li key={f} className="flex items-center gap-2"><span className="text-accent">✓</span>{f}</li>
            ))}
          </ul>
          <p className="text-center text-xs text-text-muted">Save Rs.4,998 · Free setup call included</p>
          <button disabled className="w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white cursor-not-allowed opacity-60">
            {currentPlan === 'annual' ? 'Current Plan' : 'Coming Soon'}
          </button>
        </div>
      </div>
      <p className="text-center text-xs text-text-muted">Payments coming soon via Razorpay · WhatsApp us to activate manually</p>
    </section>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [business, setBusiness] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ scans: 0, reviews: 0 });
  const [downloading, setDownloading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const qrCardRef = useRef(null);

  const loadBusiness = useCallback(async () => {
    const identifier = localStorage.getItem(OWNER_IDENTIFIER_STORAGE_KEY);
    if (!identifier) return router.replace("/login");
    let id = localStorage.getItem(BUSINESS_ID_STORAGE_KEY);
    try {
      if (!id) {
        const lr = await fetch(`/api/business/lookup?identifier=${encodeURIComponent(identifier)}`);
        const lj = await lr.json();
        if (!lr.ok || !lj.business) {
          setLoadError("No business yet — complete setup first.");
          setBusiness(null);
          setLoading(false);
          return;
        }
        id = lj.business.id;
        localStorage.setItem(BUSINESS_ID_STORAGE_KEY, id);
      }
      const [bizRes, statsRes] = await Promise.all([
        fetch(`/api/business/${id}`),
        fetch(`/api/business/stats?businessId=${id}`),
      ]);
      const bizData = await bizRes.json();
      if (!bizRes.ok) {
        setLoadError(bizData.message ?? "Could not load business.");
        setBusiness(null);
        return;
      }
      setBusiness(bizData.business);
      setLoadError("");

      const welcomed = localStorage.getItem("insightrep_welcomed");
      if (!welcomed) {
        setShowWelcome(true);
        localStorage.setItem("insightrep_welcomed", "1");
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({ scans: statsData.scans ?? 0, reviews: statsData.reviews ?? 0 });
      }
    } catch {
      setLoadError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  function logout() {
    localStorage.removeItem(OWNER_IDENTIFIER_STORAGE_KEY);
    localStorage.removeItem(OWNER_IDENTIFIER_TYPE_STORAGE_KEY);
    localStorage.removeItem(PHONE_STORAGE_KEY);
    localStorage.removeItem(BUSINESS_ID_STORAGE_KEY);
    localStorage.removeItem("insightrep_welcomed");
    router.replace("/login");
  }

  async function downloadQR() {
    if (!qrCardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(qrCardRef.current, { cacheBust: true, pixelRatio: 3 });
      const link = document.createElement("a");
      link.download = `${business.name.replace(/\s+/g, "_")}_QR.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => { setOrigin(window.location.origin); loadBusiness(); }, [loadBusiness]);
  const reviewUrl = useMemo(() => (!origin || !business?.id ? "" : `${origin}/review/${business.id}`), [origin, business]);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center bg-navy text-text-muted">Loading dashboard…</div>;
  if (loadError && !business) return (
    <div className="min-h-[100dvh] bg-navy px-4 py-16 text-center">
      <p className="text-accent">{loadError}</p>
      <Link href="/setup" className="mt-6 inline-block text-sm font-semibold text-white underline">Go to setup</Link>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-navy px-4 py-10 sm:py-14">
      {showWelcome && business && (
        <WelcomeModal business={business} onClose={() => setShowWelcome(false)} />
      )}

      <div className="mx-auto flex max-w-3xl flex-col gap-8">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-accent">Dashboard</p>
            <h1 className="text-2xl font-bold text-white">{business.name}</h1>
            {business.owner_name && (
              <p className="text-xs text-text-muted mt-0.5">{business.owner_name} · {business.owner_designation}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/setup" className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-text-muted transition hover:border-white/30 hover:text-white">
              Edit Profile
            </Link>
            <button type="button" onClick={logout}
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-text-muted transition hover:border-white/30 hover:text-white">
              Logout
            </button>
          </div>
        </header>

        {/* Onboarding Checklist */}
        {(stats.scans === 0 || stats.reviews === 0 || !(business?.owner_name && business?.owner_designation && business?.owner_city)) && (
          <OnboardingChecklist
            stats={stats} onDownloadQR={downloadQR}
            reviewUrl={reviewUrl} business={business} router={router}
          />
        )}

        {/* Address */}
        <section className="rounded-2xl border border-white/10 bg-navy-muted/40 p-5">
          <p className="text-white">{business.address || "—"}</p>
        </section>

        {/* Analytics */}
        <section className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-6 text-center">
            <p className="text-3xl font-bold text-white">{stats.scans}</p>
            <p className="mt-1 text-xs font-medium text-text-muted uppercase tracking-wide">QR Scans</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-6 text-center">
            <p className="text-3xl font-bold text-accent">{stats.reviews}</p>
            <p className="mt-1 text-xs font-medium text-text-muted uppercase tracking-wide">Reviews Generated</p>
          </div>
        </section>

        {/* ── RATING ESTIMATOR ── */}
        <RatingEstimator stats={stats} business={business} />

        {/* QR */}
        <section className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div style={{ position: "absolute", left: -9999, top: -9999 }}>
              <div ref={qrCardRef}>
                <QRDownloadCard reviewUrl={reviewUrl} businessName={business.name} />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white p-6">
              <p className="text-xs break-all text-gray-500">{reviewUrl}</p>
              <div className="mt-4 flex justify-center bg-white p-4">
                {reviewUrl ? <QRCode value={reviewUrl} size={200} level="M" /> : null}
              </div>
            </div>
            <button type="button" onClick={downloadQR} disabled={downloading}
              className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50">
              {downloading ? "Generating…" : "Download QR (PNG)"}
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-6">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Plan</p>
              <p className="text-white capitalize font-semibold">{business.plan ?? "—"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-6">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Member since</p>
              <p className="text-accent font-semibold">{formatCreatedAt(business.created_at)}</p>
            </div>
            {business.owner_city && (
              <div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-6">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">City</p>
                <p className="text-white font-semibold">{business.owner_city}</p>
              </div>
            )}
          </div>
        </section>

        {/* Pricing */}
        <PricingSection currentPlan={business.plan} />

      </div>
    </div>
  );
}
