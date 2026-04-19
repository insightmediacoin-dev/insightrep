"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import {
  BUSINESS_ID_STORAGE_KEY,
  PHONE_STORAGE_KEY,
} from "@/lib/phone";

function formatCreatedAt(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
  const [refreshing, setRefreshing] = useState(false);

  const loadBusiness = useCallback(async () => {
    const phone = localStorage.getItem(PHONE_STORAGE_KEY);
    if (!phone) {
      router.replace("/login");
      return;
    }

    let id = localStorage.getItem(BUSINESS_ID_STORAGE_KEY);
    try {
      if (!id) {
        const lr = await fetch(
          `/api/business/lookup?phone=${encodeURIComponent(phone)}`,
        );
        const lj = await lr.json();
        if (lr.ok && lj.business) {
          id = lj.business.id;
          localStorage.setItem(BUSINESS_ID_STORAGE_KEY, id);
        } else {
          setLoadError("No business yet — complete setup first.");
          setBusiness(null);
          setLoading(false);
          return;
        }
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
      setBusiness(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    setOrigin(window.location.origin);
    loadBusiness();
  }, [loadBusiness]);

  const reviewUrl = useMemo(() => {
    if (!origin || !business?.id) return "";
    return `${origin}/review/${business.id}`;
  }, [origin, business]);

  function downloadQr() {
    const host = document.getElementById("qr-host");
    const svg = host?.querySelector("svg");
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `insightrep-qr-${business.id.slice(0, 8)}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function logout() {
    localStorage.removeItem(PHONE_STORAGE_KEY);
    localStorage.removeItem(BUSINESS_ID_STORAGE_KEY);
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-navy text-text-muted">
        Loading dashboard…
      </div>
    );
  }

  if (loadError && !business) {
    return (
      <div className="min-h-[100dvh] bg-navy px-4 py-16 text-center">
        <p className="text-accent">{loadError}</p>
        <Link
          href="/setup"
          className="mt-6 inline-block text-sm font-semibold text-white underline"
        >
          Go to setup
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-navy px-4 py-10 sm:py-14">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-accent">Dashboard</p>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {business.name}
            </h1>
          </div>
          <div className="flex gap-2">
            <Link
              href="/setup"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
            >
              Edit profile
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-text-muted hover:text-white"
            >
              Log out
            </button>
          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-navy-muted/40 p-5 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Address
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-white">
            {business.address || "—"}
          </p>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white p-6 text-navy shadow-xl">
            <h2 className="text-sm font-semibold text-navy/70">Customer QR</h2>
            <p className="mt-1 break-all text-xs text-navy/60">{reviewUrl}</p>
            <div
              id="qr-host"
              className="mt-4 flex justify-center rounded-xl bg-white p-4"
            >
              {reviewUrl ? (
                <QRCode value={reviewUrl} size={200} level="M" />
              ) : null}
            </div>
            <button
              type="button"
              onClick={downloadQr}
              disabled={!reviewUrl}
              className="mt-6 flex h-11 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              Download QR (SVG)
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
                Plan
              </h2>
              <p className="mt-2 text-2xl font-bold capitalize text-white">
                {business.plan ?? "—"}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                Subscription tier from your businesses row.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
                Member since
              </h2>
              <p className="mt-2 text-2xl font-bold text-accent">
                {formatCreatedAt(business.created_at)}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                From <span className="font-mono text-white/80">created_at</span>{" "}
                on your business record.
              </p>
            </div>
            <button
              type="button"
              disabled={refreshing}
              onClick={async () => {
                setRefreshing(true);
                try {
                  await loadBusiness();
                } finally {
                  setRefreshing(false);
                }
              }}
              className="rounded-full border border-white/15 py-2 text-sm font-medium text-white hover:bg-white/5 disabled:opacity-50"
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
