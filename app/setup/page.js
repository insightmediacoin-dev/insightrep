"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BUSINESS_ID_STORAGE_KEY,
  OWNER_IDENTIFIER_STORAGE_KEY,
} from "@/lib/phone";

export default function SetupPage() {
  const router = useRouter();
  const [ownerIdentifier, setOwnerIdentifier] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [googleReviewLink, setGoogleReviewLink] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const identifier = localStorage.getItem(OWNER_IDENTIFIER_STORAGE_KEY);
    if (!identifier) {
      router.replace("/login");
      return;
    }
    setOwnerIdentifier(identifier);
  }, [router]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!ownerIdentifier) return router.replace("/login");
    setLoading(true);
    try {
      const res = await fetch("/api/business/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_phone: ownerIdentifier,
          name: businessName,
          address,
          gmb_link: googleReviewLink,
          keywords: seoKeywords,
          products: featuredProducts,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message ?? "Could not save.");
      localStorage.setItem(BUSINESS_ID_STORAGE_KEY, data.businessId);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  if (!ownerIdentifier) return <div className="flex min-h-[40vh] items-center justify-center text-text-muted">Checking session…</div>;

  return (<div className="min-h-[100dvh] bg-navy px-4 py-10 sm:py-16"><div className="mx-auto w-full max-w-xl"><Link href="/" className="text-sm font-medium text-text-muted transition hover:text-white">← Home</Link><div className="mt-6 rounded-2xl border border-white/10 bg-navy-muted/40 p-6 sm:p-8"><p className="text-sm font-medium text-accent">Business setup</p><h1 className="mt-2 text-2xl font-bold text-white">Tell us about your place</h1><p className="mt-2 text-sm text-text-muted">Logged in as <span className="text-white">{ownerIdentifier}</span></p><form onSubmit={onSubmit} className="mt-8 space-y-5">
<input required className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent" value={businessName} onChange={(e)=>setBusinessName(e.target.value)} placeholder="Business name *"/>
<textarea className="min-h-[88px] w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent" value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="Address"/>
<input required type="url" className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent" value={googleReviewLink} onChange={(e)=>setGoogleReviewLink(e.target.value)} placeholder="Google review link *"/>
<input className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent" value={seoKeywords} onChange={(e)=>setSeoKeywords(e.target.value)} placeholder="SEO keywords"/>
<textarea className="min-h-[88px] w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent" value={featuredProducts} onChange={(e)=>setFeaturedProducts(e.target.value)} placeholder="Featured products"/>
{error ? <p className="text-sm text-accent">{error}</p> : null}
<button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white disabled:opacity-50">{loading?"Saving…":"Save & go to dashboard"}</button>
</form></div></div></div>);
}
