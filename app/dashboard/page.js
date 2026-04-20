"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { BUSINESS_ID_STORAGE_KEY, OWNER_IDENTIFIER_STORAGE_KEY, OWNER_IDENTIFIER_TYPE_STORAGE_KEY, PHONE_STORAGE_KEY } from "@/lib/phone";

function formatCreatedAt(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [business, setBusiness] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ scans: 0, reviews: 0 });

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

        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-accent">Dashboard</p>
            <h1 className="text-2xl font-bold text-white">{business.name}</h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-text-muted transition hover:border-white/30 hover:text-white"
          >
            Logout
          </button>
        </header>

        <section className="rounded-2xl border border-white/10 bg-navy-muted/40 p-5">
          <p className="text-white">{business.address || "—"}</p>
        </section>

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

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white p-6 text-navy">
            <p className="text-xs break-all text-gray-500">{reviewUrl}</p>
            <div className="mt-4 flex justify-center bg-white p-4">
              {reviewUrl ? <QRCode value={reviewUrl} size={200} level="M" /> : null}
            </div>
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

      </div>
    </div>
  );
}