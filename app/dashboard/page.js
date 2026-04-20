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

function PricingSection({ currentPlan }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-white">Plans & Pricing</h2>
      <div className="grid gap-4 sm:grid-cols-2">

        {/* Monthly */}
        <div className={`rounded-2xl border p-6 space-y-4 ${currentPlan === 'monthly' ? 'border-accent bg-accent/10' : 'border-white/10 bg-navy-muted/40'}`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Starter</p>
            <p className="mt-1 text-3xl font-extrabold text-white">₹1,499<span className="text-base font-medium text-text-muted">/mo</span></p>
            <p className="text-xs text-text-muted mt-1">₹49 per day · Cancel anytime</p>
          </div>
          <ul className="space-y-2 text-sm text-text-muted">
            {["Unlimited QR scans", "AI review generation", "3–5 star filter", "Dashboard analytics", "Weekly email report", "PNG QR download"].map(f => (
              <li key={f} className="flex items-center gap-2"><span className="text-accent">✓</span>{f}</li>
            ))}
          </ul>
          <button disabled className="w-full rounded-full border border-white/15 py-2.5 text-sm font-semibold text-text-muted cursor-not-allowed opacity-60">
            {currentPlan === 'monthly' ? 'Current Plan' : 'Coming Soon'}
          </button>
        </div>

        {/* Annual */}
        <div className={`rounded-2xl border p-6 space-y-4 relative overflow-hidden ${currentPlan === 'annual' ? 'border-accent bg-accent/10' : 'border-accent/40 bg-accent/5'}`}>
          <div className="absolute top-3 right-3 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-full tracking-wide">BEST VALUE</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Annual</p>
            <p className="mt-1 text-3xl font-extrabold text-white">₹12,990<span className="text-base font-medium text-text-muted">/yr</span></p>
            <p className="text-xs text-accent mt-1 font-semibold">3 months FREE · Save ₹4,998</p>
            <p className="text-xs text-text-muted">₹35 per day</p>
          </div>
          <ul className="space-y-2 text-sm text-text-muted">
            {["Everything in Starter", "3 extra months free", "Priority WhatsApp support", "Founding member rate locked"].map(f => (
              <li key={f} className="flex items-center gap-2"><span className="text-accent">✓</span>{f}</li>
            ))}
          </ul>
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
      <div className="mx-auto flex max-w-3xl flex-col gap-8">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-accent">Dashboard</p>
            <h1 className="text-2xl font-bold text-white">{business.name}</h1>
          </div>
          <Link href="/setup" className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-text-muted transition hover:border-white/30 hover:text-white">Edit Profile</Link>
          <button type="button" onClick={logout}
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-text-muted transition hover:border-white/30 hover:text-white">
            Logout
          </button>
        </header>

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
            <p className="mt-1 text-xs font-medium text-text-muted uppercase tracking-wide">Reviews Posted</p>
          </div>
        </section>

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
              {downloading ? "Generating…" : "⬇ Download QR (PNG)"}
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
          </div>
        </section>

        {/* Pricing */}
        <PricingSection currentPlan={business.plan} />

      </div>
    </div>
  );
}