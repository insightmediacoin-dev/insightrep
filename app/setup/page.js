"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BUSINESS_ID_STORAGE_KEY,
  PHONE_STORAGE_KEY,
} from "@/lib/phone";

export default function SetupPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [googleReviewLink, setGoogleReviewLink] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const p = localStorage.getItem(PHONE_STORAGE_KEY);
    if (!p) {
      router.replace("/login");
      return;
    }
    setPhone(p);
  }, [router]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!phone) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/business/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_phone: phone,
          name: businessName,
          address,
          gmb_link: googleReviewLink,
          keywords: seoKeywords,
          products: featuredProducts,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Could not save.");
        return;
      }
      localStorage.setItem(BUSINESS_ID_STORAGE_KEY, data.businessId);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  if (!phone) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-text-muted">
        Checking session…
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-navy px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href="/"
          className="text-sm font-medium text-text-muted transition hover:text-white"
        >
          ← Home
        </Link>
        <div className="mt-6 rounded-2xl border border-white/10 bg-navy-muted/40 p-6 sm:p-8">
          <p className="text-sm font-medium text-accent">Business setup</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Tell us about your place</h1>
          <p className="mt-2 text-sm text-text-muted">
            Logged in as <span className="text-white">{phone}</span>
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-medium text-white">
                Business name *
              </label>
              <input
                required
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Spice Route Kitchen"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white">Address</label>
              <textarea
                className="mt-1.5 min-h-[88px] w-full resize-y rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, area, city"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white">
                Google review link *
              </label>
              <input
                required
                type="url"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent"
                value={googleReviewLink}
                onChange={(e) => setGoogleReviewLink(e.target.value)}
                placeholder="https://g.page/.../review or Maps review URL"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white">
                SEO keywords
              </label>
              <input
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent"
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="biryani, rooftop, family restaurant…"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white">
                Featured products
              </label>
              <textarea
                className="mt-1.5 min-h-[88px] w-full resize-y rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent"
                value={featuredProducts}
                onChange={(e) => setFeaturedProducts(e.target.value)}
                placeholder="Signature dishes, bestsellers, room types…"
              />
            </div>

            {error && (
              <p className="text-sm text-accent" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white shadow-lg shadow-accent/25 transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save & go to dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
