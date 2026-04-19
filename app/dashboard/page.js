"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { BUSINESS_ID_STORAGE_KEY, OWNER_IDENTIFIER_STORAGE_KEY } from "@/lib/phone";

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
      const res = await fetch(`/api/business/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.message ?? "Could not load business.");
        setBusiness(null);
        return;
      }
      setBusiness(data.business);
      setLoadError("");
    } catch {
      setLoadError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { setOrigin(window.location.origin); loadBusiness(); }, [loadBusiness]);
  const reviewUrl = useMemo(() => (!origin || !business?.id ? "" : `${origin}/review/${business.id}`), [origin, business]);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center bg-navy text-text-muted">Loading dashboard…</div>;
  if (loadError && !business) return <div className="min-h-[100dvh] bg-navy px-4 py-16 text-center"><p className="text-accent">{loadError}</p><Link href="/setup" className="mt-6 inline-block text-sm font-semibold text-white underline">Go to setup</Link></div>;

  return (<div className="min-h-[100dvh] bg-navy px-4 py-10 sm:py-14"><div className="mx-auto flex max-w-3xl flex-col gap-8"><header className="flex items-center justify-between"><div><p className="text-sm font-medium text-accent">Dashboard</p><h1 className="text-2xl font-bold text-white">{business.name}</h1></div></header><section className="rounded-2xl border border-white/10 bg-navy-muted/40 p-5"><p className="text-white">{business.address || "—"}</p></section><section className="grid gap-8 lg:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-white p-6 text-navy"><p className="text-xs break-all">{reviewUrl}</p><div className="mt-4 flex justify-center bg-white p-4">{reviewUrl ? <QRCode value={reviewUrl} size={200} level="M" /> : null}</div></div><div className="space-y-4"><div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-6"><p className="text-white capitalize">{business.plan ?? "—"}</p></div><div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-6"><p className="text-accent">{formatCreatedAt(business.created_at)}</p></div></div></section></div></div>);
}
